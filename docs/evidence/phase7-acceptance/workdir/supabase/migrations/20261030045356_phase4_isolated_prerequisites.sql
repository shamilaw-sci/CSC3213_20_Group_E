-- Only through Invoke-IsolatedSql.ps1 after container identity verification.
BEGIN;
DO $isolated_prerequisites$
BEGIN
    IF (current_setting('thirasara.phase4_isolated',true) IS DISTINCT FROM 'approved-empty-test'
        AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n
                        WHERE n.nspname='phase4_isolated_test_guard'
                          AND pg_catalog.pg_get_userbyid(n.nspowner)='postgres'))
       OR current_user <> 'postgres' THEN
        RAISE EXCEPTION 'Verified isolated session required';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_class c
               JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
               WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S','f')) THEN
        RAISE EXCEPTION 'Application schema must be empty before isolated preparation';
    END IF;
END;
$isolated_prerequisites$;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions VERSION '3.3.7';
COMMIT;
