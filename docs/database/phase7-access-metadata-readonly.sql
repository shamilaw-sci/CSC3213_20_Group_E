-- Catalog metadata only. Does not establish API reachability or change access.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '2s';

SELECT n.nspname AS schema_name, c.relname AS relation_name,
       c.relkind, c.relrowsecurity, c.relforcerowsecurity,
       r.role_name, p.privilege,
       has_table_privilege(r.role_name, c.oid, p.privilege) AS effective_grant
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) r(role_name)
CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
                   ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) p(privilege)
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
ORDER BY c.relname, r.role_name, p.privilege;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

SELECT n.nspname AS schema_name, p.oid::regprocedure::text AS function_signature,
       pg_get_userbyid(p.proowner) AS owner_name, p.prosecdef AS security_definer,
       p.proconfig, r.role_name,
       has_function_privilege(r.role_name, p.oid, 'EXECUTE') AS effective_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) r(role_name)
WHERE n.nspname = 'public'
ORDER BY function_signature, r.role_name;

SELECT pg_get_userbyid(d.defaclrole) AS owner_name, n.nspname AS schema_name,
       d.defaclobjtype, d.defaclacl
FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
ORDER BY owner_name, schema_name, d.defaclobjtype;
ROLLBACK;
