# Go map database compatibility

2026-11-03. Source findings and a read-only diagnostic; deployed identity is not yet verified. Do not run the Go application's existing opt-in database integration test against an unknown target: it loads the local .env when opted in. This review does not read or change that file.

## Actual requirements

`go-map-service/main.go` builds a pgx connection pool from DATABASE_URL. Normal runtime uses only pool Ping for readiness and the SELECT built by `repository/search_query.go`. The search reads properties with an approved-status predicate, applies parameterized spatial/optional filters, orders by id and limits results to100. It returns an explicit property projection. It does not invoke search_properties or increment_property_views RPCs, read users/leads, or perform database writes. Maintenance executables under scripts can change schema, but are not called by normal startup and must not run as compatibility checks.

The map needs database connection permission, resolution of its unqualified properties table to public.properties, schema/type/PostGIS function access, SELECT on the required property columns and an RLS context that permits intended approved listings. SELECT alone is insufficient when RLS silently filters all rows. Readiness Ping alone is insufficient to establish search permissions or visibility.

The candidate revokes only PUBLIC/anon/authenticated grants on the application allowlist. It does not change other roles' direct grants, ownership or RLS. If the Go identity relies on one of the revoked grants (including through inheritance), search may fail or return no rows. An owner/bypass identity may remain compatible but has broader privileges than a dedicated map reader; role redesign/credential changes are separate scope. Do not claim production compatibility from a local service_role check.

## Owner read-only diagnostic

Use [map-role SQL](database/phase7-map-role-readonly.sql) through the Go deployment's existing secure connection mechanism, under the same database role and search_path. Do not paste DATABASE_URL, passwords or keys into chat, shell history or evidence. This file contains only catalog/privilege queries and EXPLAIN without ANALYZE, inside a bounded read-only transaction. If a SQL client stops on error, close/rollback its transaction explicitly.

Interpretation:

- expected_relation must be true and required column permissions true. Verify the expected16 columns are represented; an absent column is a failure, not an implicit pass.
- PostGIS query planning must succeed. An EXPLAIN success proves planning/permissions, not that approved listings are visible.
- If rls_applies is true, review applicable policies and use separately authorized synthetic approved/unapproved fixtures in a hardened disposable environment to verify visibility.
- If inherits_anon/authenticated is true, inspect the actual privilege source before rollout. Membership alone does not prove dependence, and false membership does not rule out dependence on PUBLIC.
- Compare checks before/after committed hardening in the approved test environment, using its equivalent Go identity. Do not create a production role or add broad grants to make a test pass.

The owner's Admin Dashboard and Gemini chat clarification was verified in source: both use the Node backend and server-side SUPABASE_KEY. No separate direct Supabase consumer was identified from their report, but the owner expressed uncertainty; this is not a complete external integration inventory.

## Remaining gate

The owner confirmed Go runs on localhost. Its local configuration identifies
ThirasaraDB and the postgres role. Hosted catalog metadata showed that
postgres owns public.properties, has BYPASSRLS and can read all 16 required
map columns. The candidate removes grants from PUBLIC, anon and authenticated,
so it does not remove those ownership privileges. The catalog query did not
open the Go connection. The configured postgres role remains broader than
a dedicated map reader.

After the owner started the localhost Go service, its readiness endpoint
returned HTTP 200 and reported the database connected. The spatial search
returned HTTP 200 with 12 results. Only the count was recorded. This is
the pre-change runtime baseline for the post-rollout comparison.

Local diagnostic validation passed on2026-11-03 using the existing isolated container/workdir/checksum/marker/ledger guard and service_role. All16 required columns were readable, unqualified relation resolution matched public.properties, and PostGIS EXPLAIN succeeded. No application rows were returned or written. Database marker/ledger rechecked unchanged. Only DB/REST started and stopped; Storage/Auth/volumes unchanged. This is diagnostic SQL validation against existing grants, not a test of committed hardened grants or the deployed Go role.

The retained local stack has a fixed two-migration identity. Hardened HTTP acceptance requires a separately approved disposable target and guard, with committed candidate ACLs, synthetic data and no real provider/email/payment delivery. Do not commit candidate ACLs on the retained stack or weaken its ledger guard. The SQL candidate is not an owner-ready live migration: its isolated-only guard is intentional.
