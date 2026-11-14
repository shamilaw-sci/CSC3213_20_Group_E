-- Phase 4: catalog-only inventory; no application rows or function bodies.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='3s';
SELECT 'server' AS section, jsonb_build_object('version',current_setting('server_version'),'read_only',current_setting('transaction_read_only'))::text AS metadata
UNION ALL SELECT 'extensions',coalesce(jsonb_agg(jsonb_build_object('name',e.extname,'version',e.extversion,'schema',n.nspname) ORDER BY e.extname),'[]')::text FROM pg_catalog.pg_extension e JOIN pg_catalog.pg_namespace n ON n.oid=e.extnamespace
UNION ALL SELECT 'tables',coalesce(jsonb_agg(jsonb_build_object('name',c.relname,'kind',c.relkind,'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity) ORDER BY c.relname),'[]')::text FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m')
UNION ALL SELECT 'enums',coalesce(jsonb_agg(jsonb_build_object('type',t.typname,'label',e.enumlabel,'order',e.enumsortorder) ORDER BY t.typname,e.enumsortorder),'[]')::text FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace JOIN pg_catalog.pg_enum e ON e.enumtypid=t.oid WHERE n.nspname='public'
UNION ALL SELECT 'app_functions',coalesce(jsonb_agg(jsonb_build_object('name',p.proname,'arguments',pg_catalog.pg_get_function_identity_arguments(p.oid),'result',pg_catalog.pg_get_function_result(p.oid),'definer',p.prosecdef,'acl',p.proacl::text,'fingerprint',md5(pg_catalog.pg_get_functiondef(p.oid))) ORDER BY p.proname),'[]')::text FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind IN ('f','p') AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_depend d WHERE d.classid='pg_catalog.pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e')
UNION ALL SELECT 'history',jsonb_build_object('exists',pg_catalog.to_regclass('supabase_migrations.schema_migrations') IS NOT NULL)::text
UNION ALL SELECT 'p2_columns',coalesce(jsonb_agg(jsonb_build_object('table',c.table_name,'column',c.column_name,'type',c.data_type,'nullable',c.is_nullable,'default',c.column_default) ORDER BY c.table_name,c.column_name),'[]')::text FROM information_schema.columns c WHERE c.table_schema='public' AND ((c.table_name='saved_searches' AND c.column_name='filters') OR (c.table_name='messages' AND c.column_name='recipient_receipts') OR (c.table_name='transactions' AND c.column_name='payment_order_id'))
ORDER BY section;
COMMIT;
