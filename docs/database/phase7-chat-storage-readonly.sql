-- Run in the intended hosted project's SQL Editor. Returns metadata only.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '2s';

SELECT jsonb_build_object(
    'chat_bucket', (
        SELECT jsonb_build_object('id', id, 'public', public)
        FROM storage.buckets WHERE id = 'chat-attachments'
    ),
    'object_rls', (
        SELECT jsonb_build_object('enabled', c.relrowsecurity, 'forced', c.relforcerowsecurity)
        FROM pg_class c WHERE c.oid = 'storage.objects'::regclass
    ),
    'object_policies', COALESCE((
        SELECT jsonb_agg(to_jsonb(p) ORDER BY p.policyname)
        FROM pg_policies p WHERE p.schemaname = 'storage' AND p.tablename = 'objects'
    ), '[]'::jsonb),
    'object_grants', (
        SELECT jsonb_object_agg(role_name, jsonb_build_object(
            'bypass_rls', rolbypassrls,
            'schema_usage', has_schema_privilege(role_name, 'storage', 'USAGE'),
            'select', has_table_privilege(role_name, 'storage.objects', 'SELECT'),
            'insert', has_table_privilege(role_name, 'storage.objects', 'INSERT'),
            'update', has_table_privilege(role_name, 'storage.objects', 'UPDATE'),
            'delete', has_table_privilege(role_name, 'storage.objects', 'DELETE')
        ))
        FROM (VALUES ('anon'), ('authenticated'), ('service_role')) AS roles(role_name)
        JOIN pg_roles ON rolname = role_name
    )
) AS chat_storage_preflight;

ROLLBACK;
