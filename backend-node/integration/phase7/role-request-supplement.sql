-- Separately approved TEMPORARY function-only supplement for the fresh Phase7 target.
-- Not a production migration; the rollback-only candidate remains intact and is run separately.
DO $amendment$
BEGIN
    IF current_user <> 'postgres'
       OR current_setting('server_version_num')::integer / 10000 <> 17
       OR current_setting('thirasara.phase7_role_request_test',true) IS DISTINCT FROM 'temporary-committed-amendment'
       OR NOT EXISTS (SELECT 1 FROM phase7_acceptance_guard.environment
           WHERE id='thirasara-phase7-acceptance' AND stage='ready'
             AND nonce::text=current_setting('thirasara.phase7_nonce',true))
       OR to_regprocedure('public.resolve_seller_role_request(uuid,text)') IS NOT NULL
       OR to_regprocedure('public.phase7_role_request_fail()') IS NOT NULL
       OR EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.role_requests'::regclass
                    AND tgname='phase7_role_request_failure') THEN
        RAISE EXCEPTION 'Verified fresh Phase7 temporary amendment required';
    END IF;
    IF has_any_column_privilege('anon','public.users','INSERT,UPDATE')
       OR has_any_column_privilege('authenticated','public.users','INSERT,UPDATE')
       OR has_any_column_privilege('anon','public.role_requests','INSERT,UPDATE')
       OR has_any_column_privilege('authenticated','public.role_requests','INSERT,UPDATE') THEN
        RAISE EXCEPTION 'Backend-only role-request tables required';
    END IF;
END;
$amendment$;

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
