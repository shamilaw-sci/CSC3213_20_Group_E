-- Isolated-only schema CANDIDATE. Not a migration and not authorized for live application.
-- A separately approved disposable runner must own BEGIN/ROLLBACK and verify restoration.
-- Required prerequisite: reviewed backend-only application ACL hardening.
DO $guard$
BEGIN
    IF current_user <> 'postgres'
       OR current_setting('thirasara.phase7_appointment_test', true) IS DISTINCT FROM 'rollback-only'
       OR current_setting('server_version_num')::integer / 10000 <> 17
       OR NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname='phase4_isolated_test_guard'
                      AND pg_get_userbyid(nspowner)='postgres') THEN
        RAISE EXCEPTION 'Separately approved isolated appointment runner required';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid='public.leads'::regclass
                   AND relkind='r' AND relrowsecurity AND pg_get_userbyid(relowner)='postgres')
       OR NOT EXISTS (SELECT 1 FROM pg_class WHERE oid='public.users'::regclass
                      AND relkind='r' AND pg_get_userbyid(relowner)='postgres') THEN
        RAISE EXCEPTION 'Unexpected application table identity';
    END IF;
    IF has_any_column_privilege('anon','public.leads','INSERT,UPDATE')
       OR has_any_column_privilege('authenticated','public.leads','INSERT,UPDATE') THEN
        RAISE EXCEPTION 'Backend-only lead writes required before ownership schema';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.leads'::regclass
               AND attname='buyer_id' AND NOT attisdropped)
       OR to_regclass('public.leads_buyer_id_idx') IS NOT NULL THEN
        RAISE EXCEPTION 'Appointment owner schema already exists; review target drift';
    END IF;
END;
$guard$;

ALTER TABLE public.leads ADD COLUMN buyer_id uuid
    CONSTRAINT leads_buyer_id_fkey REFERENCES public.users(id) ON DELETE SET NULL;
CREATE INDEX leads_buyer_id_idx ON public.leads(buyer_id);
-- No UPDATE/backfill. Existing guest/historical records intentionally remain NULL.
