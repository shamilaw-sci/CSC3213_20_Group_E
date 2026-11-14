-- Reviewed additive upgrade for the existing hosted database.
-- Apply before restarting the updated Node and Go services.
-- Retains listing rows, media references, financial history, conversations and bookings.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS properties_active_owner_created_idx
 ON public.properties(seller_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS properties_active_status_created_idx
 ON public.properties(status, created_at DESC) WHERE deleted_at IS NULL;

-- Restrictive policies combine with existing permissive ownership/public policies.
DROP POLICY IF EXISTS properties_active_read ON public.properties;
CREATE POLICY properties_active_read ON public.properties AS RESTRICTIVE
 FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
DROP POLICY IF EXISTS properties_active_update ON public.properties;
CREATE POLICY properties_active_update ON public.properties AS RESTRICTIVE
 FOR UPDATE TO anon, authenticated USING (deleted_at IS NULL) WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS properties_preserve_history ON public.properties;
CREATE POLICY properties_preserve_history ON public.properties AS RESTRICTIVE
 FOR DELETE TO anon, authenticated USING (false);

-- Serialize new property-linked activity with archival. Historical rows remain untouched.
CREATE OR REPLACE FUNCTION public.require_active_property_reference()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE listing_id uuid;
BEGIN
 IF TG_OP = 'UPDATE' AND NEW.property_id IS NOT DISTINCT FROM OLD.property_id THEN RETURN NEW; END IF;
 IF NEW.property_id IS NULL THEN RETURN NEW; END IF;
 SELECT id INTO listing_id FROM public.properties
 WHERE id = NEW.property_id AND deleted_at IS NULL AND status = 'approved' FOR UPDATE;
 IF NOT FOUND THEN
  RAISE EXCEPTION USING ERRCODE = 'PZ001', MESSAGE = 'Property is no longer available';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.require_active_property_reference() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS leads_active_property_insert ON public.leads;
CREATE TRIGGER leads_active_property_insert BEFORE INSERT OR UPDATE OF property_id ON public.leads
 FOR EACH ROW EXECUTE FUNCTION public.require_active_property_reference();
DROP TRIGGER IF EXISTS conversations_active_property_insert ON public.conversations;
CREATE TRIGGER conversations_active_property_insert BEFORE INSERT OR UPDATE OF property_id ON public.conversations
 FOR EACH ROW EXECUTE FUNCTION public.require_active_property_reference();
DROP TRIGGER IF EXISTS favorites_active_property_insert ON public.favorites;
CREATE TRIGGER favorites_active_property_insert BEFORE INSERT OR UPDATE OF property_id ON public.favorites
 FOR EACH ROW EXECUTE FUNCTION public.require_active_property_reference();

-- Preserve existing signature and ACLs. Late settlement uses the existing settlement RPC.
CREATE OR REPLACE FUNCTION public.create_listing_checkout(p_property_id uuid, p_owner_id uuid,
 p_amount numeric, p_currency text, p_mode text, p_merchant_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE listing public.properties%ROWTYPE; checkout public.payment_orders%ROWTYPE;
BEGIN
 SELECT * INTO listing FROM public.properties WHERE id=p_property_id FOR UPDATE;
 IF NOT FOUND OR listing.deleted_at IS NOT NULL THEN RAISE EXCEPTION USING ERRCODE='PZ001', MESSAGE='Property is no longer available'; END IF;
 IF listing.seller_id IS DISTINCT FROM p_owner_id THEN RAISE EXCEPTION 'Checkout owner mismatch'; END IF;
 IF listing.payment_status='Paid' THEN RAISE EXCEPTION 'Property already paid'; END IF;
 SELECT * INTO checkout FROM public.payment_orders WHERE property_id=p_property_id AND status='pending';
 IF FOUND AND checkout.expires_at > now() AND checkout.owner_id=p_owner_id
   AND checkout.mode=p_mode AND checkout.merchant_id=p_merchant_id THEN RETURN to_jsonb(checkout); END IF;
 UPDATE public.payment_orders SET status='expired' WHERE property_id=p_property_id AND status='pending';
 INSERT INTO public.payment_orders(property_id,owner_id,amount,currency,mode,merchant_id)
 VALUES(p_property_id,p_owner_id,p_amount,p_currency,p_mode,p_merchant_id) RETURNING * INTO checkout;
 RETURN to_jsonb(checkout);
END $$;

CREATE OR REPLACE FUNCTION public.increment_property_views(property_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE new_views integer;
BEGIN
 UPDATE public.properties SET views_count=coalesce(views_count,0)+1
 WHERE id=property_id AND deleted_at IS NULL RETURNING views_count INTO new_views;
 RETURN new_views;
END $$;

CREATE OR REPLACE FUNCTION public.search_properties(search_polygon text)
RETURNS SETOF public.properties LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public, extensions, pg_temp AS $$
BEGIN
 RETURN QUERY SELECT p.* FROM public.properties p
 WHERE p.deleted_at IS NULL AND p.status='approved'
 AND ST_Intersects(p.boundary::geometry, ST_GeomFromText(search_polygon,4326));
END $$;
NOTIFY pgrst, 'reload schema';
COMMIT;

-- Expected output: deleted_at_type timestamp with time zone, active_read_policy true,
-- new_activity_guards 3. No listing is archived by this script.
SELECT data_type AS deleted_at_type FROM information_schema.columns
 WHERE table_schema='public' AND table_name='properties' AND column_name='deleted_at';
SELECT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='properties'
 AND policyname='properties_active_read' AND permissive='RESTRICTIVE') AS active_read_policy;
SELECT count(*) AS new_activity_guards FROM pg_trigger
 WHERE tgname IN ('leads_active_property_insert','conversations_active_property_insert','favorites_active_property_insert')
 AND NOT tgisinternal;

