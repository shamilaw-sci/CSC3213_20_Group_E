-- Run manually before restarting the new checkout backend. No historical amounts change.
BEGIN;
CREATE TABLE public.payment_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    amount numeric(12,2) NOT NULL CHECK (amount > 0),
    currency text NOT NULL DEFAULT 'LKR' CHECK (currency = 'LKR'),
    mode text NOT NULL CHECK (mode IN ('sandbox', 'live')),
    merchant_id text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'expired')),
    provider_payment_id text UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
    paid_at timestamptz,
    CHECK (expires_at > created_at),
    CHECK ((status = 'paid') = (paid_at IS NOT NULL))
);
CREATE INDEX payment_orders_property_idx ON public.payment_orders (property_id, created_at DESC);
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_orders FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payment_orders TO service_role;
CREATE UNIQUE INDEX payment_orders_one_pending_idx ON public.payment_orders(property_id) WHERE status='pending';
ALTER TABLE public.transactions ADD COLUMN payment_order_id uuid UNIQUE REFERENCES public.payment_orders(id);
CREATE TABLE public.payment_receipt_outbox (
    order_id uuid PRIMARY KEY REFERENCES public.payment_orders(id),
    recipient text NOT NULL,
    property_title text NOT NULL,
    amount numeric(12,2) NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent')),
    attempts integer NOT NULL DEFAULT 0,
    available_at timestamptz NOT NULL DEFAULT now(),
    lease_id uuid,
    sent_at timestamptz
);
CREATE INDEX payment_receipt_due_idx ON public.payment_receipt_outbox(available_at) WHERE status <> 'sent';
ALTER TABLE public.payment_receipt_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_receipt_outbox FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payment_receipt_outbox TO service_role;

CREATE FUNCTION public.create_listing_checkout(p_property_id uuid, p_owner_id uuid,
    p_amount numeric, p_currency text, p_mode text, p_merchant_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE listing public.properties%ROWTYPE; checkout public.payment_orders%ROWTYPE;
BEGIN
    SELECT * INTO listing FROM public.properties WHERE id=p_property_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Property not found'; END IF;
    IF listing.seller_id IS DISTINCT FROM p_owner_id THEN RAISE EXCEPTION 'Checkout owner mismatch'; END IF;
    IF listing.payment_status='Paid' THEN RAISE EXCEPTION 'Property already paid'; END IF;
    SELECT * INTO checkout FROM public.payment_orders WHERE property_id=p_property_id AND status='pending';
    IF FOUND AND checkout.expires_at > now() AND checkout.owner_id=p_owner_id
        AND checkout.mode=p_mode AND checkout.merchant_id=p_merchant_id THEN
        RETURN to_jsonb(checkout);
    END IF;
    UPDATE public.payment_orders SET status='expired' WHERE property_id=p_property_id AND status='pending';
    INSERT INTO public.payment_orders(property_id,owner_id,amount,currency,mode,merchant_id)
        VALUES(p_property_id,p_owner_id,p_amount,p_currency,p_mode,p_merchant_id) RETURNING * INTO checkout;
    RETURN to_jsonb(checkout);
END $$;

CREATE FUNCTION public.settle_listing_checkout(p_order_id uuid, p_payment_id text,
    p_amount numeric, p_currency text, p_mode text, p_merchant_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE checkout public.payment_orders%ROWTYPE; listing public.properties%ROWTYPE; receipt_email text;
BEGIN
    -- Property-before-order locking matches checkout creation and avoids deadlocks.
    SELECT * INTO checkout FROM public.payment_orders WHERE id=p_order_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Checkout not found'; END IF;
    SELECT * INTO listing FROM public.properties WHERE id=checkout.property_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Property not found'; END IF;
    SELECT * INTO checkout FROM public.payment_orders WHERE id=p_order_id FOR UPDATE;
    IF checkout.amount IS DISTINCT FROM p_amount OR checkout.currency IS DISTINCT FROM p_currency
        OR checkout.mode IS DISTINCT FROM p_mode OR checkout.merchant_id IS DISTINCT FROM p_merchant_id
        OR p_payment_id IS NULL OR btrim(p_payment_id)='' THEN RAISE EXCEPTION 'Checkout terms mismatch'; END IF;
    IF checkout.status='paid' THEN
        IF checkout.provider_payment_id IS DISTINCT FROM p_payment_id THEN
            RAISE EXCEPTION 'Different payment requires reconciliation';
        END IF;
        RETURN jsonb_build_object('order',to_jsonb(checkout),'property',to_jsonb(listing),'already_paid',true);
    END IF;
    IF listing.seller_id IS DISTINCT FROM checkout.owner_id THEN RAISE EXCEPTION 'Checkout owner changed'; END IF;
    IF listing.payment_status='Paid' OR checkout.status='cancelled' THEN
        RAISE EXCEPTION 'Conflicting payment requires reconciliation';
    END IF;
    -- Honor signed late success if no other checkout paid this listing.
    INSERT INTO public.transactions(property_id,amount,currency,payment_method,status,transaction_id,payment_order_id)
        VALUES(checkout.property_id,checkout.amount,checkout.currency,'PayHere','SUCCESS',p_payment_id,checkout.id);
    UPDATE public.properties SET payment_status='Paid' WHERE id=checkout.property_id RETURNING * INTO listing;
    UPDATE public.payment_orders SET status='paid',provider_payment_id=p_payment_id,paid_at=now()
        WHERE id=checkout.id RETURNING * INTO checkout;
    UPDATE public.payment_orders SET status='cancelled' WHERE property_id=checkout.property_id AND status='pending';
    SELECT email INTO receipt_email FROM public.users WHERE id=checkout.owner_id;
    IF receipt_email IS NOT NULL AND receipt_email<>'' THEN
        INSERT INTO public.payment_receipt_outbox(order_id,recipient,property_title,amount)
            VALUES(checkout.id,receipt_email,coalesce(listing.title,'Your Property'),checkout.amount);
    END IF;
    RETURN jsonb_build_object('order',to_jsonb(checkout),'property',to_jsonb(listing),'already_paid',false);
END $$;

CREATE FUNCTION public.claim_payment_receipts(p_order_id uuid DEFAULT NULL)
RETURNS SETOF public.payment_receipt_outbox LANGUAGE sql SECURITY INVOKER SET search_path = public, pg_temp AS $$
    UPDATE public.payment_receipt_outbox o SET status='sending',attempts=o.attempts+1,
        lease_id=gen_random_uuid(),available_at=now()+interval '5 minutes'
    WHERE o.order_id IN (
        SELECT q.order_id FROM public.payment_receipt_outbox q
        WHERE q.status<>'sent' AND q.available_at<=now() AND (p_order_id IS NULL OR q.order_id=p_order_id)
        ORDER BY q.available_at LIMIT 10 FOR UPDATE SKIP LOCKED
    ) RETURNING o.*;
$$;
REVOKE ALL ON FUNCTION public.create_listing_checkout(uuid,uuid,numeric,text,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.settle_listing_checkout(uuid,text,numeric,text,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.claim_payment_receipts(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_listing_checkout(uuid,uuid,numeric,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_listing_checkout(uuid,text,numeric,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_payment_receipts(uuid) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
