-- Run ONLY through the identity/binding-checked local container runner.
-- This empty private schema is an explicit local-test marker for CLI connections
-- that do not forward custom PGOPTIONS. It contains no application records.
BEGIN;
DO $isolated_marker$
BEGIN
    IF current_setting('thirasara.phase4_isolated',true) IS DISTINCT FROM 'approved-empty-test'
       OR current_user <> 'postgres' OR current_database() <> 'postgres' THEN
        RAISE EXCEPTION 'Verified isolated session required';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
               WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S','f')) THEN
        RAISE EXCEPTION 'Empty isolated database required before explicit test marking';
    END IF;
END;
$isolated_marker$;
CREATE SCHEMA IF NOT EXISTS phase4_isolated_test_guard AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA phase4_isolated_test_guard FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
