-- Review draft. Apply only after approval and verifying the ThirasaraDB project in the dashboard.
-- Scope: 19 public application tables and five named functions.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';
DO $candidate$
DECLARE
    object_name text;
    object_id oid;
    app_tables constant text[] := ARRAY[
        'agent_profiles','agent_reviews','contact_inquiries','conversations','favorites',
        'feasibility_history','inquiries','leads','message_receipts','messages','payment_orders',
        'payment_receipt_outbox','platform_settings','properties','property_sales_history',
        'role_requests','saved_searches','transactions','users'
    ];
    app_functions constant text[] := ARRAY[
        'claim_payment_receipts(uuid)',
        'create_listing_checkout(uuid,uuid,numeric,text,text,text)',
        'increment_property_views(uuid)',
        'search_properties(text)',
        'settle_listing_checkout(uuid,text,numeric,text,text,text)'
    ];
BEGIN
    IF current_user <> 'postgres' OR current_database() <> 'postgres' THEN
        RAISE EXCEPTION 'Expected the postgres dashboard connection';
    END IF;

    -- Preflight all objects before changing any ACL. Refuse drift rather than widening scope.
    FOREACH object_name IN ARRAY app_tables LOOP
        object_id := to_regclass(format('public.%I', object_name));
        IF object_id IS NULL OR NOT EXISTS (
            SELECT 1 FROM pg_class WHERE oid=object_id AND relkind='r'
            AND pg_get_userbyid(relowner)='postgres' AND relrowsecurity
        ) OR NOT has_table_privilege('service_role', object_id, 'SELECT')
          OR NOT has_table_privilege('service_role', object_id, 'INSERT')
          OR NOT has_table_privilege('service_role', object_id, 'UPDATE')
          OR NOT has_table_privilege('service_role', object_id, 'DELETE') THEN
            RAISE EXCEPTION 'Application table identity or backend privileges differ';
        END IF;
    END LOOP;
    FOREACH object_name IN ARRAY app_functions LOOP
        object_id := to_regprocedure('public.' || object_name);
        IF object_id IS NULL OR NOT EXISTS (
            SELECT 1 FROM pg_proc WHERE oid=object_id AND NOT prosecdef
            AND pg_get_userbyid(proowner)='postgres'
        ) OR NOT has_function_privilege('service_role', object_id, 'EXECUTE') THEN
            RAISE EXCEPTION 'Application function identity or backend privileges differ';
        END IF;
    END LOOP;

    FOREACH object_name IN ARRAY app_tables LOOP
        EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated RESTRICT', object_name);
    END LOOP;
    FOREACH object_name IN ARRAY app_functions LOOP
        -- Names/signatures are fixed literals above, never external input.
        EXECUTE 'REVOKE ALL PRIVILEGES ON FUNCTION public.' || object_name
            || ' FROM PUBLIC, anon, authenticated RESTRICT';
    END LOOP;
END;
$candidate$;
COMMIT;
