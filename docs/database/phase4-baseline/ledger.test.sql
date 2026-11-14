-- Verified isolated container only. Never export history statements.
BEGIN TRANSACTION READ ONLY;
DO $ledger_check$
BEGIN
    IF (SELECT count(*) FROM supabase_migrations.schema_migrations) <> 2
       OR NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261030045356')
       OR NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261030045416') THEN
        RAISE EXCEPTION 'Applied migration ledger differs from canonical two-version chain';
    END IF;
    IF EXISTS (SELECT 1 FROM public.users)
       OR EXISTS (SELECT 1 FROM public.saved_searches)
       OR EXISTS (SELECT 1 FROM public.payment_orders)
       OR EXISTS (SELECT 1 FROM public.payment_receipt_outbox) THEN
        RAISE EXCEPTION 'Isolated permission fixtures or payment state unexpectedly persisted';
    END IF;
END;
$ledger_check$;
SELECT version,name FROM supabase_migrations.schema_migrations ORDER BY version;
COMMIT;
