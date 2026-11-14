-- Phase 4 metadata inventory draft. NOT EXECUTED by Codex.
-- Review before running through an explicitly authorized connection.
-- No application rows, secrets, function bodies or history statements are selected.
-- Expressions/object names may still contain sensitive literals: review exports privately.
-- Run as a whole script, not inside an existing transaction. On error, ROLLBACK.
-- Results depend on the inspecting role; missing visibility is UNKNOWN, not absence.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '3s';

-- 1. Server and visibility context (no connection strings or account identifiers).
SELECT current_setting('server_version') AS server_version,
       current_setting('transaction_read_only') AS transaction_read_only,
       r.rolsuper AS inspector_superuser, r.rolbypassrls AS inspector_bypassrls
FROM pg_catalog.pg_roles r WHERE r.rolname = current_user;

-- 2. Extensions and non-system schemas. Extension versions matter for restore.
SELECT e.extname, e.extversion, n.nspname AS extension_schema
FROM pg_catalog.pg_extension e
JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace ORDER BY e.extname;
SELECT n.nspname, pg_catalog.pg_get_userbyid(n.nspowner) AS owner, n.nspacl::text AS acl
FROM pg_catalog.pg_namespace n
WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema'
ORDER BY n.nspname;

-- 3. Public relations, owners, RLS and explicit ACL (NULL means default ACL).
SELECT c.relname, c.relkind, pg_catalog.pg_get_userbyid(c.relowner) AS owner,
       c.relrowsecurity, c.relforcerowsecurity, c.relacl::text AS acl, c.reloptions
FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m','S','f')
ORDER BY c.relname;

-- 4. Columns, including precise types/defaults, identity and generated attributes.
SELECT c.relname, a.attnum, a.attname,
       pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
       a.attnotnull, a.attidentity, a.attgenerated,
       pg_catalog.pg_get_expr(d.adbin, d.adrelid) AS default_expression,
       a.attacl::text AS column_acl
FROM pg_catalog.pg_attribute a
JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m','f')
  AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY c.relname, a.attnum;

-- 5. Enum labels/order and domain definitions.
SELECT n.nspname, t.typname, e.enumsortorder, e.enumlabel
FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
JOIN pg_catalog.pg_enum e ON e.enumtypid = t.oid
WHERE n.nspname IN ('public','extensions') ORDER BY n.nspname, t.typname, e.enumsortorder;
SELECT n.nspname, t.typname, pg_catalog.format_type(t.typbasetype,t.typtypmod) AS base_type,
       t.typnotnull, t.typdefault
FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public' AND t.typtype = 'd' ORDER BY t.typname;

-- 6. Table/domain constraints, validation and indexes.
SELECT co.conname, co.contype, co.conrelid::regclass::text AS relation,
       co.contypid::regtype::text AS domain_type, co.convalidated,
       pg_catalog.pg_get_constraintdef(co.oid, true) AS definition
FROM pg_catalog.pg_constraint co JOIN pg_catalog.pg_namespace n ON n.oid = co.connamespace
WHERE n.nspname = 'public' ORDER BY relation, co.conname;
SELECT c.relname AS relation, i.relname AS index_name, x.indisvalid, x.indisready,
       pg_catalog.pg_get_indexdef(x.indexrelid) AS definition
FROM pg_catalog.pg_index x JOIN pg_catalog.pg_class c ON c.oid = x.indrelid
JOIN pg_catalog.pg_class i ON i.oid = x.indexrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' ORDER BY c.relname, i.relname;

-- 7. Policies include storage schema, but never storage object rows.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_catalog.pg_policies WHERE schemaname IN ('public','storage')
ORDER BY schemaname, tablename, policyname;

-- 8. Non-extension public functions: signatures, security and comparison fingerprint.
-- Fingerprints detect differences only; they are not reconstructable definitions.
-- proconfig values and bodies are deliberately withheld pending private review.
SELECT p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments,
       pg_catalog.pg_get_function_result(p.oid) AS result,
       l.lanname AS language, pg_catalog.pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef AS security_definer, p.provolatile, p.proacl::text AS acl,
       (p.proconfig IS NOT NULL) AS has_function_settings,
       md5(pg_catalog.pg_get_functiondef(p.oid)) AS definition_fingerprint
FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
JOIN pg_catalog.pg_language l ON l.oid = p.prolang
WHERE n.nspname = 'public' AND p.prokind IN ('f','p')
  AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_depend d
                  WHERE d.classid = 'pg_catalog.pg_proc'::regclass
                    AND d.objid = p.oid AND d.deptype = 'e')
ORDER BY p.proname, arguments;

-- 9. Triggers/views use fingerprints to avoid outputting embedded literals/bodies.
SELECT c.relname, t.tgname, t.tgenabled, t.tgfoid::regprocedure::text AS function_signature,
       md5(pg_catalog.pg_get_triggerdef(t.oid, true)) AS definition_fingerprint
FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND NOT t.tgisinternal ORDER BY c.relname, t.tgname;
SELECT c.relname, c.relkind, c.reloptions,
       md5(pg_catalog.pg_get_viewdef(c.oid, true)) AS definition_fingerprint
FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('v','m') ORDER BY c.relname;

-- 10. Default privileges and role attributes/memberships. No passwords selected.
SELECT pg_catalog.pg_get_userbyid(d.defaclrole) AS owner,
       CASE WHEN d.defaclnamespace = 0 THEN '(global)' ELSE n.nspname END AS schema_name,
       d.defaclobjtype, d.defaclacl::text AS acl
FROM pg_catalog.pg_default_acl d LEFT JOIN pg_catalog.pg_namespace n ON n.oid = d.defaclnamespace
WHERE d.defaclnamespace = 0 OR n.nspname IN ('public','storage','extensions')
ORDER BY owner, schema_name, d.defaclobjtype;
SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin, rolbypassrls
FROM pg_catalog.pg_roles WHERE rolname !~ '^pg_' ORDER BY rolname;
SELECT granted.rolname AS granted_role, member.rolname AS member_role, m.admin_option
FROM pg_catalog.pg_auth_members m
JOIN pg_catalog.pg_roles granted ON granted.oid = m.roleid
JOIN pg_catalog.pg_roles member ON member.oid = m.member
WHERE granted.rolname !~ '^pg_' OR member.rolname !~ '^pg_'
ORDER BY granted.rolname, member.rolname;

-- 11. Publication membership is metadata, not row content.
SELECT pubname, puballtables, pubinsert, pubupdate, pubdelete, pubtruncate
FROM pg_catalog.pg_publication ORDER BY pubname;
SELECT pubname, schemaname, tablename FROM pg_catalog.pg_publication_tables
WHERE schemaname = 'public' ORDER BY pubname, tablename;

-- 12. Check history availability without failing if absent or reading statements.
SELECT pg_catalog.to_regclass('supabase_migrations.schema_migrations') IS NOT NULL
       AS migration_history_relation_exists;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations'
ORDER BY ordinal_position;

COMMIT;

-- OPTIONAL SEPARATE READ: only after confirming history relation and SELECT access.
-- Keep the read-only transaction wrapper; absence/denial means unknown history.
-- BEGIN TRANSACTION READ ONLY;
-- SET LOCAL statement_timeout = '30s';
-- SELECT to_jsonb(h)->>'version' AS version, to_jsonb(h)->>'name' AS name
-- FROM supabase_migrations.schema_migrations h ORDER BY version;
-- COMMIT;
-- Do not select history statements, application rows, auth.users or vault contents.
