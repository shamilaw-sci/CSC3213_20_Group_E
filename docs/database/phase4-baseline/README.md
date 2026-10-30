# Phase 4 schema reference and verification assets

Status: validated in isolated PostgreSQL 17.11 / PostGIS 3.3.7 environments on 2026-10-30. Canonical CLI-generated migration files are in supabase/migrations; use ../setup.md for the guarded workflow. baseline.draft.sql is the reviewed source/reference outside automatic migrations, not a second migration chain or a live upgrade script.

## Assets

- baseline.draft.sql: five enum types, 19 tables/182 columns, 65 constraints, 16 standalone indexes plus 25 constraint indexes, five application functions, explicit table/function permissions, 19 public policies, four buckets and six storage policies.
- manifest.json: observed metadata, source hashes, desired policy differences and function fingerprints. Original Windows CRLF and LF-normalized fingerprints are kept separately.
- verify-draft.ps1: offline source coverage and safety checks; it does not execute SQL.
- Invoke-IsolatedSql.ps1: Docker project/container/network/loopback/owner guard; accepts only test stacks a/b/c. No caller database URL or psql meta commands.
- environment-snapshot.sql: version/extensions/empty-public-schema readiness checks.
- mark-isolated.sql: creates the empty private marker schema only after the runner verifies an empty local target. No privilege expansion or persistent custom GUC.
- prepare-isolated.sql: guarded PostGIS prerequisite, also represented by the first canonical migration.
- permissions.test.sql: dummy native-role ownership/private-access checks, rolled back; no payment RPC, email or gateway operation.
- schema-snapshot.sql and compare-snapshot.cjs: resulting schema, explicit table/function ACLs, bucket configuration and desired-policy comparison. Visible column order is compared instead of physical dropped-column slots.
- ledger.test.sql: exact two applied versions and no persisted dummy users/searches/payment fixtures.
- draft-checksums.json: review-file hashes, not applied migration history.

## Explicit target differences

The source database's unrestricted saved_searches ALL policy is recorded as observed metadata but is not copied into the desired target. Owner INSERT/DELETE plus existing owner SELECT are used in the isolated target, without native UPDATE permission. The live policy has not changed.

Environment rls_auto_enable/ensure_rls and platform event triggers are excluded from app migrations; all application tables explicitly enable RLS. Broad existing grants and other policies are retained. Account-specific default/schema ACLs are not rewritten. Four storage bucket configurations are setup configuration, not cloned storage objects. Types/nullability/defaults, text sender IDs, legacy receipt semantics and checkout function source are preserved.

## Runtime evidence and limits

Two independent fresh environments applied the exact canonical two-migration chain with standard Supabase history tracking. Both matched 19 tables, 182 columns, 65 constraints, 41 indexes, 25 enum labels, 25 public/storage policies, 19 table ACL/owner entries, four buckets and five function fingerprints/EXECUTE ACLs. Native-role rollback tests passed. A second migration up applied no files; each ledger contains exactly the expected versions.

Earlier draft runs in two isolated databases also passed; the first permission test's ambiguous table_name reference was corrected before the successful runs. Independent review found missing table ACL/storage checks and overly broad negative-test acceptance; those were corrected and re-reviewed. Negative tests require psql exit 3, P0001 and the intended error message. Four offline corruption cases were rejected. Canonical SQL is pinned to LF; archives preserve original working-tree bytes.

The private marker is an accidental-run guard, not proof of isolation. Never set it on a live connection. SQL/runtime checks do not establish frontend/API E2E, real PayHere behavior, email delivery, concurrent settlement correctness or blanket security hardening. Security advisors returned three existing WARN findings (two mutable function search_paths and unrestricted leads INSERT), with no ERROR finding. These remain documented follow-ups rather than silently changed behavior.

No current/live DB change, history repair, real-data clone, deployment, commit or push occurred. Existing installations must pass the drift/adoption procedure in ../setup.md before any separately authorized live action. Keep docs/evidence/ untracked; the owner performs the phase commit/push.
