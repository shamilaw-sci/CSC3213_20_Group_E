-- Verified isolated-container runner only; metadata, not application rows.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';
SELECT jsonb_build_object(
    'server_version',current_setting('server_version'),
    'database',current_database(),
    'role',current_user,
    'public_relations',(SELECT coalesce(jsonb_agg(c.relname ORDER BY c.relname),'[]')
                        FROM pg_catalog.pg_class c
                        JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
                        WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S','f')),
    'extensions',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',e.extname,'version',e.extversion,'schema',n.nspname) ORDER BY e.extname),'[]')
                  FROM pg_catalog.pg_extension e JOIN pg_catalog.pg_namespace n ON n.oid=e.extnamespace),
    'postgis_available',(SELECT coalesce(jsonb_agg(jsonb_build_object('version',version,'installed',installed) ORDER BY version),'[]')
                         FROM pg_catalog.pg_available_extension_versions WHERE name='postgis'),
    'storage_ready',pg_catalog.to_regclass('storage.buckets') IS NOT NULL,
    'auth_ready',pg_catalog.to_regprocedure('auth.uid()') IS NOT NULL
);
COMMIT;
