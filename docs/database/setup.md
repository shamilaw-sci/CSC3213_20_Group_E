# Repeatable database setup — Phase 4

This repository now has a canonical two-file migration chain for a **separate empty isolated Supabase test environment**. It is not a live-database upgrade script. Existing installations must use the adoption procedure below; never replay the baseline on them, reset them or clone their user data for tests.

## Canonical sources and history

| Version | Purpose |
| --- | --- |
| 20261030045356 | Verify explicit isolated marker/empty public schema and prepare PostGIS 3.3.7 |
| 20261030045416 | Current application schema, constraints/indexes, functions, explicit permissions and bucket configuration |

The filenames were created by Supabase CLI 2.122.0. The previous fourteen partial scripts are preserved in legacy-sql/ with original paths and verified Windows working-tree byte hashes. They are outside automatic migrations. P2 review scripts, particularly the rollback-only payment verification, are not migration inputs.

`supabase/migrations.manifest.json` records SHA256 content checksums. `supabase_migrations.schema_migrations` records applied versions in each test database. Both checks matter: a matching timestamp does not prove matching SQL content. `.gitattributes` pins canonical SQL to LF and preserves archive bytes across checkout platforms. Do not edit an applied migration; add a new CLI-generated migration and update the reviewed checksum manifest.

Run the offline content check from the repository root:

```powershell
node tools/database/verify-migrations.cjs
```

## Environment prerequisites

Use the pinned CLI dependency in tools/database/package.json/package-lock.json. Install it only when package downloads are authorized:

```powershell
npm ci --prefix tools/database --no-audit --no-fund
```

Provision a distinct Supabase environment without application schema/data. The tested engine is PostgreSQL 17.11; the captured source was 17.6. Both are major 17, with PostGIS 3.3.7 in extensions and uuid-ossp 1.1. Native Supabase roles, auth functions and storage schema must already exist. These managed prerequisites are not recreated from the live database. Do not copy .env files, hosted keys, user records, storage objects or platform-setting values.

For this workspace, existing unlinked test configurations live under docs/evidence/phase4-local/stack-a, stack-b and stack-c. Project IDs are thirasara-phase4-a/b/c; database ports are 56322/57322/58322. SQL tools refuse other project/container identities. A fresh test database must use a genuinely new empty data volume, not a snapshot of application data. Existing test volumes need not be deleted to create another fresh setup.

Every published port must be inspected and bound to 127.0.0.1. The official CLI's custom bridge-network default did not enforce that on the tested Docker Desktop 29.9.2 engine. The initial empty services were stopped before any application SQL and recreated with explicit Compose host_ip settings, using the same images/configuration and preserving originals. Private generated configuration contains local credentials and must stay untracked in docs/evidence/. Do not rerun native CLI start against those corrected containers: it may recreate broad bindings. On another machine, provision explicit loopback bindings before schema work; the runner rejects an unsafe binding instead of continuing.

Local provisioning reference: https://supabase.com/docs/guides/local-development . The network option in that guide still requires inspection of actual Docker Desktop bindings.

## Verify identity, mark and apply

The commands below operate on an **already provisioned, separately verified empty local test stack**; they do not start/download containers. Use stack c only when its expected container/project/local port really exists. Each script verifies Docker identity before SQL and stops on mismatch. CLI workdirs must be unlinked; no remote project-ref file is allowed.

First capture the empty environment:

```powershell
& ./docs/database/phase4-baseline/Invoke-IsolatedSql.ps1 -Stack c `
  -SqlPath docs/database/phase4-baseline/environment-snapshot.sql `
  -LogPath docs/evidence/phase4-local/stack-c-environment.log
```

Inspect that private result: correct project/container, postgres database/owner, major 17, empty public relations and managed Auth/Storage readiness. Then explicitly mark that **empty isolated database**:

```powershell
& ./docs/database/phase4-baseline/Invoke-IsolatedSql.ps1 -Stack c `
  -SqlPath docs/database/phase4-baseline/mark-isolated.sql `
  -LogPath docs/evidence/phase4-local/stack-c-marker.log
```

The runner supplies a session marker after its identity/binding checks. mark-isolated.sql creates a postgres-owned, empty private phase4_isolated_test_guard schema and revokes public-role access. The schema is configuration for local CLI connections, not application data. This fallback is needed because the tested migration connector did not forward custom PGOPTIONS, and persisting the custom GUC through ALTER DATABASE was denied. No user privilege was expanded and no database-wide GUC was retained. The marker is an accidental-run guard, not cryptographic proof of isolation; never create it on the current/live database.

Apply canonical migrations using the checked wrapper:

```powershell
& ./tools/database/Invoke-VerifiedMigrations.ps1 -Stack c `
  -LogPath docs/evidence/phase4-local/stack-c-migration-up.log
```

The wrapper verifies checksums, an unlinked exact workdir, container/project/network identity, loopback binding and pinned CLI version. It copies only the canonical files into the isolated workdir and refuses conflicting files. It never accepts a connection URL from the caller. The localhost URL is constructed in memory from the verified container; credentials are not printed. Explicit local SSL-off matches the tested local server setting and is never a production TLS recommendation. The CLI's implicit --local migration connector failed on the custom setup, so this wrapper uses the verified explicit loopback endpoint.

Re-running the wrapper must report no new applied migrations; it must not replay the schema. A manual baseline replay is separately rejected by the existing-public-relations guard. No reset, down, history repair or linked/remote command belongs in this setup flow.

## Permission and resulting-state verification

Run each against the same verified isolated stack:

```powershell
& ./docs/database/phase4-baseline/Invoke-IsolatedSql.ps1 -Stack c `
  -SqlPath docs/database/phase4-baseline/permissions.test.sql `
  -LogPath docs/evidence/phase4-local/stack-c-permissions.log

& ./docs/database/phase4-baseline/Invoke-IsolatedSql.ps1 -Stack c `
  -SqlPath docs/database/phase4-baseline/schema-snapshot.sql `
  -LogPath docs/evidence/phase4-local/stack-c-schema.json.log

node docs/database/phase4-baseline/compare-snapshot.cjs `
  docs/evidence/phase4-local/stack-c-schema.json.log

& ./docs/database/phase4-baseline/Invoke-IsolatedSql.ps1 -Stack c `
  -SqlPath docs/database/phase4-baseline/ledger.test.sql `
  -LogPath docs/evidence/phase4-local/stack-c-ledger.log
```

Permission tests create two dummy application users/searches inside a rolled-back transaction. They check native authenticated ownership SELECT/INSERT/DELETE, cross-user/anonymous denial, backend-only table/RPC privileges, core-user default row denial and the current receipt insert default. They do not create Supabase accounts, call checkout/settlement/receipt RPCs, exercise PayHere, start workers or send email. Source and HTTP/custom-app-JWT behavior are distinct; SQL role tests are not full E2E proof.

The comparator checks visible column order/types/defaults/nullability, enums, constraints, all indexes, RLS, desired policies, explicit table owners/ACLs, buckets and application function bodies/EXECUTE ACLs. Physical dropped-column slots are normalized; no fake dropped columns are recreated. Repeat from an independent empty test environment and compare again. Negative tests must require psql SQL-error status 3, P0001 and the precise intended guard message, not merely any failure.

## Target differences and known security follow-ups

- The isolated target replaces the observed saved_searches unrestricted PUBLIC ALL policy with owner-scoped INSERT/DELETE plus existing owner SELECT. No direct native UPDATE policy is introduced. The live policy has **not** been changed.
- Environment rls_auto_enable/ensure_rls and six platform-owned event triggers are not application migrations; all 19 app tables explicitly enable RLS. Their provenance remains a platform-configuration decision for future adoption, not an app schema dependency.
- Broad observed table grants and other existing policies are preserved, not silently hardened. Local security advisors reported three WARN findings: mutable search_path on search_properties and increment_property_views, and unrestricted leads INSERT. These are recorded follow-ups; no ERROR findings were reported by that check. This is not a clean security-audit claim.
- No realtime publication members, real records or fabricated settings are seeded. Missing seed.sql configuration was disabled.

## Existing-installation adoption — no live action authorized

1. Keep the current database unchanged. Preserve the historical schema evidence and obtain a fresh, explicitly authorized read-only capture before a future adoption decision.
2. Compare complete actual state with the canonical target, including grants/default ACLs, policies, extension versions, environment helpers and function definitions. Captured 2026-10-29 evidence is not proof of later state.
3. Stop on drift. In particular, the saved-search policy differs materially; the current installation cannot be declared equivalent to this target yet. Prepare any desired live correction separately, preserving the custom backend JWT authorization model and providing an independently reviewed rollback/compatibility plan. Do not reconstruct historical receipt states or reprice payment orders.
4. Only after equivalence is established, obtain explicit permission for migration-ledger adoption. Any repair/history write is itself a live write. No repair SQL or automatic marking is performed by these tools. Never pretend old partial files were applied based on filenames alone.
5. Future schema changes use new ordered migrations, isolated verification and explicit live rollout permission. Rollback must retain receipt/order/outbox state and in-flight settlement compatibility; do not drop schema or remove enum labels.

Recorded checks and limitations are in phase4-verification.md. Keep docs/evidence/ untracked. The owner performs every commit/push; no deployment, PR or live change is included.
