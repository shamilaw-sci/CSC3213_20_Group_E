-- Run AFTER payment-orders.sql. No gateway, email or committed payment is created.
-- User authorized temporary use of an existing Paid listing on 2026-10-27.
-- All test writes are rolled back. Prefer unpaid; otherwise temporarily reset one Paid listing.
-- Run this ENTIRE script, including the final ROLLBACK. Do not substitute COMMIT.
BEGIN;
DO $$
DECLARE listing public.properties%ROWTYPE; first_order jsonb; repeated_order jsonb;
    settled jsonb; test_payment text := 'TEST-' || gen_random_uuid()::text;
    checkout_id uuid; original_status text; tx_count integer; failed boolean;
BEGIN
    SELECT * INTO listing FROM public.properties WHERE seller_id IS NOT NULL
        ORDER BY (payment_status IS DISTINCT FROM 'Paid') DESC, id LIMIT 1 FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Verification requires an existing listing with an owner'; END IF;
    original_status := listing.status::text;
    -- This reset is uncommitted and will be undone along with all test writes.
    IF listing.payment_status='Paid' THEN
        UPDATE public.properties SET payment_status='Unpaid' WHERE id=listing.id;
    END IF;
    -- Expire pending orders inside this rollback-only transaction for isolation.
    UPDATE public.payment_orders SET status='expired' WHERE property_id=listing.id AND status='pending';
    first_order := public.create_listing_checkout(listing.id,listing.seller_id,500,'LKR','sandbox','TEST-MERCHANT');
    checkout_id := (first_order->>'id')::uuid;
    repeated_order := public.create_listing_checkout(listing.id,listing.seller_id,750,'LKR','sandbox','TEST-MERCHANT');
    IF first_order->>'id' IS DISTINCT FROM repeated_order->>'id' OR (repeated_order->>'amount')::numeric<>500 THEN
        RAISE EXCEPTION 'FAIL: fee lock/reuse';
    END IF;
    failed := false;
    BEGIN
        PERFORM public.settle_listing_checkout(checkout_id,test_payment,750,'LKR','sandbox','TEST-MERCHANT');
    EXCEPTION WHEN raise_exception THEN failed := true;
    END;
    IF NOT failed THEN RAISE EXCEPTION 'FAIL: accepted changed fee'; END IF;
    failed := false;
    BEGIN
        PERFORM public.settle_listing_checkout(checkout_id,test_payment,500,'LKR','live','TEST-MERCHANT');
    EXCEPTION WHEN raise_exception THEN failed := true;
    END;
    IF NOT failed THEN RAISE EXCEPTION 'FAIL: accepted wrong mode'; END IF;
    failed := false;
    BEGIN
        PERFORM public.create_listing_checkout(listing.id,gen_random_uuid(),500,'LKR','sandbox','TEST-MERCHANT');
    EXCEPTION WHEN raise_exception THEN failed := true;
    END;
    IF NOT failed THEN RAISE EXCEPTION 'FAIL: accepted another owner'; END IF;
    settled := public.settle_listing_checkout(checkout_id,test_payment,500,'LKR','sandbox','TEST-MERCHANT');
    IF settled->'property'->>'status' IS DISTINCT FROM original_status OR
        settled->'property'->>'payment_status' IS DISTINCT FROM 'Paid' THEN
        RAISE EXCEPTION 'FAIL: moderation/payment status';
    END IF;
    settled := public.settle_listing_checkout(checkout_id,test_payment,500,'LKR','sandbox','TEST-MERCHANT');
    IF settled->>'already_paid' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'FAIL: retry not idempotent'; END IF;
    SELECT count(*) INTO tx_count FROM public.transactions WHERE payment_order_id=checkout_id;
    IF tx_count<>1 THEN RAISE EXCEPTION 'FAIL: transaction count %',tx_count; END IF;
    failed := false;
    BEGIN
        PERFORM public.settle_listing_checkout(checkout_id,test_payment||'-other',500,'LKR','sandbox','TEST-MERCHANT');
    EXCEPTION WHEN raise_exception THEN failed := true;
    END;
    IF NOT failed THEN RAISE EXCEPTION 'FAIL: accepted conflicting payment'; END IF;
    RAISE NOTICE 'PASS: fee lock, owner, mode, moderation, settlement and retry checks. Rolling back all test writes.';
END $$;
ROLLBACK;
SELECT 'PASS: checkout checks completed; all test writes rolled back.' AS verification_result;
