-- Local test catalog comparison only. No application row reads.
BEGIN TRANSACTION READ ONLY;
SET LOCAL search_path = pg_catalog, public, extensions;
SET LOCAL statement_timeout = '30s';
SELECT jsonb_build_object(
    'columns', (SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (
        SELECT c.relname AS table_name,a.attnum,a.attname AS column_name,
               pg_catalog.format_type(a.atttypid,a.atttypmod) AS type,
               a.attnotnull,a.attidentity,a.attgenerated,(d.oid IS NOT NULL) AS has_default,
               md5(pg_catalog.pg_get_expr(d.adbin,d.adrelid)) AS default_fingerprint
        FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid=a.attrelid
        JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
        LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
        WHERE n.nspname='public' AND c.relkind IN ('r','p') AND a.attnum>0 AND NOT a.attisdropped
        ORDER BY c.relname,a.attnum
    ) q),
    'constraints', (SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (
        SELECT co.conrelid::regclass::text AS table_name,co.conname,co.contype,co.convalidated,
               pg_catalog.pg_get_constraintdef(co.oid,true) AS definition
        FROM pg_catalog.pg_constraint co JOIN pg_catalog.pg_namespace n ON n.oid=co.connamespace
        WHERE n.nspname='public' ORDER BY table_name,co.conname
    ) q),
    'indexes', (SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (
        SELECT c.relname AS table_name,i.relname AS index_name,x.indisvalid,x.indisready,
               pg_catalog.pg_get_indexdef(x.indexrelid) AS definition
        FROM pg_catalog.pg_index x JOIN pg_catalog.pg_class c ON c.oid=x.indrelid
        JOIN pg_catalog.pg_class i ON i.oid=x.indexrelid
        JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' ORDER BY c.relname,i.relname
    ) q),
    'enums', (SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (
        SELECT t.typname AS type,e.enumlabel AS label,e.enumsortorder AS "order"
        FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace
        JOIN pg_catalog.pg_enum e ON e.enumtypid=t.oid
        WHERE n.nspname='public' ORDER BY t.typname,e.enumsortorder
    ) q),
    'policies', (SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (
        SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
        FROM pg_catalog.pg_policies WHERE schemaname IN ('public','storage')
        ORDER BY schemaname,tablename,policyname
    ) q),
    'tables', (SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (
        SELECT c.relname AS name,c.relkind AS kind,c.relrowsecurity AS rls,c.relforcerowsecurity AS force_rls
        FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m') ORDER BY c.relname
    ) q),
    'tableAcl', (SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (
        SELECT c.relname,c.relacl::text AS acl,pg_catalog.pg_get_userbyid(c.relowner) AS owner
        FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relkind IN ('r','p','S') ORDER BY c.relname
    ) q),
    'storage', (SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (
        SELECT id,name,public,file_size_limit,allowed_mime_types FROM storage.buckets ORDER BY id
    ) q),
    'functions', (SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (
        SELECT p.proname AS name,pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments,
               md5(replace(pg_catalog.pg_get_functiondef(p.oid),E'\r\n',E'\n')) AS fingerprint,
               p.prosecdef AS definer,p.proacl::text AS acl
        FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
        WHERE n.nspname='public' AND p.prokind IN ('f','p') AND p.proname<>'rls_auto_enable'
          AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_depend d
                          WHERE d.classid='pg_catalog.pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e')
        ORDER BY p.proname
    ) q)
);
COMMIT;
