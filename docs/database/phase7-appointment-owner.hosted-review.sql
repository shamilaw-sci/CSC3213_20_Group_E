-- Owner-reviewed hosted adoption for ThirasaraDB. Not the isolated test candidate.
-- Confirm the selected project in Supabase before running the whole script.
-- Existing appointments remain unbound; there is intentionally no email backfill.
-- User deletion retains the lead and clears its account association.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';

DO $preflight$
BEGIN
    IF current_user <> 'postgres' OR current_database() <> 'postgres' THEN
        RAISE EXCEPTION 'Expected the postgres dashboard connection';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_class
        WHERE oid = 'public.leads'::regclass AND relkind = 'r'
          AND relrowsecurity AND pg_get_userbyid(relowner) = 'postgres'
    ) OR NOT EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid = 'public.users'::regclass AND attname = 'id'
          AND atttypid = 'uuid'::regtype AND NOT attisdropped
    ) THEN
        RAISE EXCEPTION 'Unexpected leads/users table definition';
    END IF;
    IF has_any_column_privilege('anon', 'public.leads', 'INSERT,UPDATE')
       OR has_any_column_privilege('authenticated', 'public.leads', 'INSERT,UPDATE') THEN
        RAISE EXCEPTION 'Backend-only lead writes required; review existing grants first';
    END IF;
    IF NOT has_table_privilege('service_role', 'public.leads', 'SELECT')
       OR NOT has_table_privilege('service_role', 'public.leads', 'INSERT')
       OR NOT has_table_privilege('service_role', 'public.leads', 'UPDATE')
       OR NOT has_table_privilege('service_role', 'public.leads', 'DELETE') THEN
        RAISE EXCEPTION 'Expected backend service_role lead privileges';
    END IF;
    IF EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid = 'public.leads'::regclass AND attname = 'buyer_id'
          AND NOT attisdropped
    ) OR to_regclass('public.leads_buyer_id_idx') IS NOT NULL THEN
        RAISE EXCEPTION 'Ownership schema already exists; inspect instead of reapplying';
    END IF;
END;
$preflight$;

ALTER TABLE public.leads ADD COLUMN buyer_id uuid
    CONSTRAINT leads_buyer_id_fkey REFERENCES public.users(id) ON DELETE SET NULL;
CREATE INDEX leads_buyer_id_idx ON public.leads(buyer_id);
NOTIFY pgrst, 'reload schema';
COMMIT;

-- Metadata-only verification; expect one nullable uuid column.
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'buyer_id';
