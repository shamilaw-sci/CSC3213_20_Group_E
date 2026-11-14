-- APPROVED DESIGN, UNEXECUTED ISOLATED-ONLY CANDIDATE. Not a deployment migration.
-- A separately approved runner owns BEGIN, SET LOCAL, ROLLBACK and restoration.
-- Never strip this guard or run against live/retained application databases.
DO $guard$
DECLARE
    table_name text;
    object_id oid;
BEGIN
    IF current_user <> 'postgres'
       OR current_setting('thirasara.phase7_role_request_test', true) IS DISTINCT FROM 'rollback-only'
       OR current_setting('server_version_num')::integer / 10000 <> 17
       OR NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname='phase4_isolated_test_guard'
                      AND pg_get_userbyid(nspowner)='postgres') THEN
        RAISE EXCEPTION 'Separately approved rollback-only role-request runner required';
    END IF;
    FOREACH table_name IN ARRAY ARRAY['users', 'role_requests'] LOOP
        object_id := to_regclass('public.' || table_name);
        IF object_id IS NULL OR NOT EXISTS (
            SELECT 1 FROM pg_class WHERE oid=object_id AND relkind='r'
            AND relrowsecurity AND pg_get_userbyid(relowner)='postgres'
        ) OR NOT has_table_privilege('service_role',object_id,'SELECT')
          OR NOT has_table_privilege('service_role',object_id,'UPDATE')
          OR has_any_column_privilege('anon',object_id,'INSERT,UPDATE')
          OR has_any_column_privilege('authenticated',object_id,'INSERT,UPDATE') THEN
            RAISE EXCEPTION 'Expected backend-only application table identity required';
        END IF;
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.users'::regclass
                   AND attname='id' AND atttypid='uuid'::regtype AND attnotnull AND NOT attisdropped)
       OR NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.role_requests'::regclass
                      AND attname='id' AND atttypid='uuid'::regtype AND attnotnull AND NOT attisdropped)
       OR NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.role_requests'::regclass
                      AND attname='user_id' AND atttypid='uuid'::regtype AND attnotnull AND NOT attisdropped)
       OR to_regprocedure('public.resolve_seller_role_request(uuid,text)') IS NOT NULL THEN
        RAISE EXCEPTION 'Role-request schema differs or proposed function already exists';
    END IF;
END;
$guard$;

CREATE FUNCTION public.resolve_seller_role_request(p_request_id uuid, p_decision text)
RETURNS TABLE(request_id uuid, decision text, user_id uuid)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
    v_request public.role_requests%ROWTYPE;
    v_current_role text;
    v_changed bigint;
BEGIN
    IF p_request_id IS NULL OR p_decision IS NULL OR p_decision NOT IN ('approved','rejected') THEN
        RAISE EXCEPTION USING ERRCODE='P7005', MESSAGE='Invalid role request resolution';
    END IF;

    SELECT r.* INTO v_request FROM public.role_requests AS r
        WHERE r.id=p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE='P7001', MESSAGE='Role request not found';
    END IF;
    IF v_request.status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION USING ERRCODE='P7002', MESSAGE='Request already resolved';
    END IF;

    IF p_decision='approved' THEN
        IF v_request.requested_role IS DISTINCT FROM 'SELLER' THEN
            RAISE EXCEPTION USING ERRCODE='P7003', MESSAGE='Unsupported requested role';
        END IF;
        SELECT u.role INTO v_current_role FROM public.users AS u
            WHERE u.id=v_request.user_id FOR UPDATE;
        IF NOT FOUND OR v_current_role IS DISTINCT FROM 'BUYER' THEN
            RAISE EXCEPTION USING ERRCODE='P7004', MESSAGE='User is not eligible for seller approval';
        END IF;
        UPDATE public.users AS u SET role='SELLER'
            WHERE u.id=v_request.user_id AND u.role='BUYER';
        GET DIAGNOSTICS v_changed = ROW_COUNT;
        IF v_changed <> 1 THEN
            RAISE EXCEPTION USING ERRCODE='P7006', MESSAGE='Role update not confirmed';
        END IF;
    END IF;

    -- Let any error (including historical-status uniqueness) abort both writes.
    UPDATE public.role_requests AS r SET status=p_decision, updated_at=pg_catalog.now()
        WHERE r.id=v_request.id AND r.status='pending';
    GET DIAGNOSTICS v_changed = ROW_COUNT;
    IF v_changed <> 1 THEN
        RAISE EXCEPTION USING ERRCODE='P7006', MESSAGE='Request update not confirmed';
    END IF;
    RETURN QUERY SELECT v_request.id, p_decision, v_request.user_id;
END;
$function$;

REVOKE ALL PRIVILEGES ON FUNCTION public.resolve_seller_role_request(uuid,text)
    FROM PUBLIC, anon, authenticated RESTRICT;
GRANT EXECUTE ON FUNCTION public.resolve_seller_role_request(uuid,text) TO service_role;
