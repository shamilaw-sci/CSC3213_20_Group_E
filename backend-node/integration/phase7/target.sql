-- Committed changes ONLY for a separately verified fresh Phase7 acceptance database.
-- Not a live migration; never strip this purpose/marker guard.
DO $phase7$
DECLARE
    name text;
    object_id oid;
    tables constant text[] := ARRAY['agent_profiles','agent_reviews','contact_inquiries','conversations',
        'favorites','feasibility_history','inquiries','leads','message_receipts','messages','payment_orders',
        'payment_receipt_outbox','platform_settings','properties','property_sales_history','role_requests',
        'saved_searches','transactions','users'];
    functions constant text[] := ARRAY['claim_payment_receipts(uuid)',
        'create_listing_checkout(uuid,uuid,numeric,text,text,text)','increment_property_views(uuid)',
        'search_properties(text)','settle_listing_checkout(uuid,text,numeric,text,text,text)'];
    populated boolean;
BEGIN
    IF current_user <> 'postgres'
       OR current_setting('thirasara.phase7_acceptance',true) IS DISTINCT FROM 'committed-disposable'
       OR current_setting('server_version_num')::int/10000 <> 17
       OR NOT EXISTS (SELECT 1 FROM phase7_acceptance_guard.environment
           WHERE id='thirasara-phase7-acceptance' AND stage='baseline'
             AND nonce::text=current_setting('thirasara.phase7_nonce',true)) THEN
        RAISE EXCEPTION 'Verified fresh committed-disposable Phase7 target required';
    END IF;
    FOREACH name IN ARRAY tables LOOP
        object_id := to_regclass(format('public.%I',name));
        IF object_id IS NULL OR NOT EXISTS (SELECT 1 FROM pg_class WHERE oid=object_id
            AND relkind='r' AND relrowsecurity AND pg_get_userbyid(relowner)='postgres')
           OR NOT has_table_privilege('service_role',object_id,'SELECT')
           OR NOT has_table_privilege('service_role',object_id,'INSERT')
           OR NOT has_table_privilege('service_role',object_id,'UPDATE')
           OR NOT has_table_privilege('service_role',object_id,'DELETE') THEN
            RAISE EXCEPTION 'Application table/backend identity mismatch';
        END IF;
        EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I)',name) INTO populated;
        IF populated THEN RAISE EXCEPTION 'Fresh target must contain no application rows'; END IF;
    END LOOP;
    FOREACH name IN ARRAY functions LOOP
        object_id := to_regprocedure('public.'||name);
        IF object_id IS NULL OR NOT EXISTS (SELECT 1 FROM pg_proc WHERE oid=object_id
            AND NOT prosecdef AND pg_get_userbyid(proowner)='postgres')
            OR NOT has_function_privilege('service_role',object_id,'EXECUTE') THEN
            RAISE EXCEPTION 'Application function/backend identity mismatch';
        END IF;
    END LOOP;
    FOREACH name IN ARRAY tables LOOP
        EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC,anon,authenticated RESTRICT',name);
    END LOOP;
    FOREACH name IN ARRAY functions LOOP
        EXECUTE 'REVOKE ALL PRIVILEGES ON FUNCTION public.'||name||' FROM PUBLIC,anon,authenticated RESTRICT';
    END LOOP;
END;
$phase7$;
ALTER TABLE public.leads ADD COLUMN buyer_id uuid
    CONSTRAINT leads_buyer_id_fkey REFERENCES public.users(id) ON DELETE SET NULL;
CREATE INDEX leads_buyer_id_idx ON public.leads(buyer_id);
