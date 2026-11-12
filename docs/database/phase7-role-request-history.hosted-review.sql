-- Owner-reviewed adoption: preserve all request history; allow one pending request per user.
-- Run the entire file in the intended Supabase project's SQL Editor as postgres.
-- Does not resolve any request, change roles, delete history, or change permissions/RLS.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';

DO $preflight$
BEGIN
    IF current_user <> 'postgres' OR current_database() <> 'postgres' THEN
        RAISE EXCEPTION 'Expected postgres dashboard connection';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_class
        WHERE oid = to_regclass('public.role_requests')
          AND relkind = 'r' AND relrowsecurity
          AND pg_get_userbyid(relowner) = 'postgres'
    ) THEN
        RAISE EXCEPTION 'Expected postgres-owned role_requests table with RLS';
    END IF;
END;
$preflight$;

LOCK TABLE public.role_requests IN SHARE ROW EXCLUSIVE MODE;

DO $guard$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.role_requests'::regclass
          AND conname = 'role_requests_user_id_status_key'
          AND contype = 'u'
          AND pg_get_constraintdef(oid) = 'UNIQUE (user_id, status)'
    ) THEN
        RAISE EXCEPTION 'Expected historical-status constraint absent or changed; inspect before proceeding';
    END IF;
    IF to_regclass('public.role_requests_one_pending_per_user_idx') IS NOT NULL THEN
        RAISE EXCEPTION 'Pending index already exists; inspect before proceeding';
    END IF;
    IF EXISTS (
        SELECT 1 FROM public.role_requests WHERE status = 'pending'
        GROUP BY user_id HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate pending requests found; no automatic data cleanup';
    END IF;
END;
$guard$;

-- Install pending protection before removing the overly broad history restriction.
CREATE UNIQUE INDEX role_requests_one_pending_per_user_idx
    ON public.role_requests (user_id) WHERE status = 'pending';
ALTER TABLE public.role_requests
    DROP CONSTRAINT role_requests_user_id_status_key RESTRICT;

COMMIT;

-- Read-only verification: expect the unique partial index and no old constraint.
SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'role_requests'
  AND indexname = 'role_requests_one_pending_per_user_idx';
SELECT count(*) AS old_constraint_count FROM pg_constraint
WHERE conrelid = 'public.role_requests'::regclass
  AND conname = 'role_requests_user_id_status_key';
