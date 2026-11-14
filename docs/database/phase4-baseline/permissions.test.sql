-- Isolated test ONLY. Dummy application rows are rolled back. No payment RPC/mail.
-- Execute only through a verified local test container, never via a live URL.
BEGIN;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '3s';
DO $test_guard$
BEGIN
    IF current_setting('thirasara.phase4_isolated', true) IS DISTINCT FROM 'approved-empty-test'
       OR current_user <> 'postgres' THEN
        RAISE EXCEPTION 'Verified isolated session required';
    END IF;
END;
$test_guard$;

-- Metadata checks cover private table/RPC denial without calling business RPCs.
DO $private_permissions$
DECLARE
    table_name text;
    role_name text;
    function_signature text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY['contact_inquiries','message_receipts','payment_orders','payment_receipt_outbox'] LOOP
        FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
            IF has_table_privilege(role_name, 'public.' || table_name, 'SELECT,INSERT,UPDATE,DELETE') THEN
                RAISE EXCEPTION 'Private table privilege unexpectedly granted';
            END IF;
        END LOOP;
        IF NOT has_table_privilege('service_role', 'public.' || table_name, 'SELECT')
           OR NOT has_table_privilege('service_role', 'public.' || table_name, 'INSERT') THEN
            RAISE EXCEPTION 'Backend private table privilege missing';
        END IF;
    END LOOP;
    FOREACH function_signature IN ARRAY ARRAY[
        'public.create_listing_checkout(uuid,uuid,numeric,text,text,text)',
        'public.settle_listing_checkout(uuid,text,numeric,text,text,text)',
        'public.claim_payment_receipts(uuid)'
    ] LOOP
        IF has_function_privilege('anon', function_signature, 'EXECUTE')
           OR has_function_privilege('authenticated', function_signature, 'EXECUTE')
           OR NOT has_function_privilege('service_role', function_signature, 'EXECUTE') THEN
            RAISE EXCEPTION 'Backend RPC permission mismatch';
        END IF;
    END LOOP;
    IF (SELECT c.column_default FROM information_schema.columns c
        WHERE c.table_schema='public' AND c.table_name='messages' AND c.column_name='recipient_receipts')
       IS DISTINCT FROM 'true' THEN
        RAISE EXCEPTION 'Current receipt insert default is not true';
    END IF;
END;
$private_permissions$;

SET LOCAL ROLE service_role;
INSERT INTO public.users(id,name,email) VALUES
('00000000-0000-4000-8000-000000000001','Phase 4 Dummy A','phase4-a@example.invalid'),
('00000000-0000-4000-8000-000000000002','Phase 4 Dummy B','phase4-b@example.invalid');
INSERT INTO public.saved_searches(id,user_id,title) VALUES
('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000001','Phase 4 Search A'),
('00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000002','Phase 4 Search B');
RESET ROLE;

SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE authenticated;
DO $ownership$
DECLARE affected integer;
BEGIN
    IF auth.uid() IS DISTINCT FROM '00000000-0000-4000-8000-000000000001'::uuid THEN
        RAISE EXCEPTION 'Dummy identity configuration failed';
    END IF;
    IF (SELECT count(*) FROM public.saved_searches) <> 1 THEN
        RAISE EXCEPTION 'Cross-user saved-search SELECT isolation failed';
    END IF;
    IF (SELECT count(*) FROM public.users) <> 0 THEN
        RAISE EXCEPTION 'Core user rows exposed to native authenticated role';
    END IF;
    INSERT INTO public.saved_searches(id,user_id,title)
    VALUES('00000000-0000-4000-8000-000000000013',auth.uid(),'Phase 4 Own Insert');
    BEGIN
        INSERT INTO public.saved_searches(user_id,title)
        VALUES('00000000-0000-4000-8000-000000000002','Forbidden foreign insert');
        RAISE EXCEPTION 'Cross-user INSERT unexpectedly succeeded';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    UPDATE public.saved_searches SET user_id='00000000-0000-4000-8000-000000000002'
    WHERE id='00000000-0000-4000-8000-000000000011';
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 0 THEN RAISE EXCEPTION 'Unexpected native UPDATE permission'; END IF;
    DELETE FROM public.saved_searches WHERE id='00000000-0000-4000-8000-000000000012';
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 0 THEN RAISE EXCEPTION 'Cross-user DELETE unexpectedly succeeded'; END IF;
    DELETE FROM public.saved_searches WHERE id='00000000-0000-4000-8000-000000000013';
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 1 THEN RAISE EXCEPTION 'Own DELETE denied'; END IF;
END;
$ownership$;
RESET ROLE;

SELECT set_config('request.jwt.claims','{"role":"anon"}',true);
SELECT set_config('request.jwt.claim.sub','',true);
SET LOCAL ROLE anon;
DO $anonymous$
BEGIN
    IF (SELECT count(*) FROM public.saved_searches) <> 0 THEN
        RAISE EXCEPTION 'Saved searches exposed to anonymous role';
    END IF;
    IF (SELECT count(*) FROM public.users) <> 0 THEN
        RAISE EXCEPTION 'Core user rows exposed to anonymous role';
    END IF;
    BEGIN
        INSERT INTO public.saved_searches(user_id,title)
        VALUES('00000000-0000-4000-8000-000000000001','Forbidden anonymous insert');
        RAISE EXCEPTION 'Anonymous INSERT unexpectedly succeeded';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        PERFORM id FROM public.contact_inquiries LIMIT 1;
        RAISE EXCEPTION 'Private table SELECT unexpectedly permitted';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END;
$anonymous$;
RESET ROLE;
ROLLBACK;

-- psql must stop on errors. This result appears only after successful rollback.
SELECT 'PASS: isolated native-role permissions and ownership; dummy writes rolled back' AS result;
