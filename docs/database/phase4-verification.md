# Phase 4 verification and handoff

Date: 2026-10-30. Result: repository implementation and isolated repeatable migration verification complete; owner review/manual commit remains. No live rollout/adoption is included. Runbook: setup.md.

## Delivered

- Read-only inventory of 20 original SQL files and actual Supabase catalog/configuration evidence, with historical application records distinguished from current schema checks.
- Five enum types, 19 application tables/182 columns, 65 constraints, 41 indexes, five application functions, explicit table/function grants, RLS, desired policies and bucket configuration represented by the new canonical chain.
- Two CLI-generated ordered migrations (20261030045356 and 20261030045416), standard applied-version ledger and SHA256 content manifest. Canonical LF checkout policy prevents Windows checksum drift.
- Fourteen original migration fragments preserved with exact working-tree byte hashes and original-path source map in legacy-sql/. P2 review/transactional payment SQL is outside the chain. No legacy contents were discarded.
- Pinned standalone CLI tooling, guarded local SQL/migration runners, offline checks, rollback-only dummy permissions, normalized resulting-state comparison and existing-installation adoption/rollback instructions.
- Missing seed.sql configuration disabled. No application runtime code, auth/payment integration or application dependency files changed.

## Runtime checks

All operations below targeted explicitly verified local containers with loopback-only database ports, postgres owner/database and independent empty application states. The captured hosted server was PostgreSQL 17.6; local verification used PostgreSQL 17.11 with matching PostGIS 3.3.7. Managed Auth/Storage/native roles came from official Supabase images; no real-data clone was used.

| Check | Result |
| --- | --- |
| Initial draft setup a and independent fresh b | Full baseline and dummy permission tests passed |
| Canonical CLI chain on fresh stack c | Both migrations applied; resulting-state and permissions passed |
| Exact same canonical chain on independently fresh stack b ledger-proof volumes | Both migrations applied; resulting-state and permissions passed |
| Independent canonical snapshots | Exact JSON results matched between c and b |
| Second canonical apply in c and b | Applied file list empty; no schema replay |
| Applied ledger in c and b | Exactly versions 20261030045356 and 20261030045416 |
| Missing explicit marker | Latest guard rejected with psql exit 3, P0001 and expected marker message |
| Manual baseline replay on existing test schema | Latest guard rejected with psql exit 3, P0001 and expected existing-relations message |
| Dummy fixture persistence | Ledger test confirmed users/searches/orders/outbox remained empty after rollback-only tests |
| Offline draft/source checks | Passed; four deliberately corrupted cases rejected |
| Canonical file/version/hash checks | Passed; unique ordered timestamps and SHA256 match |
| Archive preservation | All fourteen archive hashes match source map |
| Review | Independent review blockers fixed and re-reviewed without another code blocker |

The resulting-state comparator matched 19 tables/RLS flags, 182 columns/defaults/types/visible order, 65 constraints, 41 valid indexes, 25 enum labels/order, 25 desired public/storage policies, 19 explicit table ACL/owner records, four bucket configurations and five LF-normalized application function definitions/EXECUTE ACLs. Historical dropped-column slots are not reproduced in fresh tables.

Permission checks cover ownership-scoped saved-search SELECT/INSERT/DELETE, cross-user and anonymous denial, absence of direct native UPDATE, native core-user row denial, backend-only inquiry/receipt/order/outbox table access and checkout RPC EXECUTE grants, plus the current receipt insert default. They do not invoke payment/business RPCs or create external accounts. These are native database-role checks, not frontend/API/custom-JWT E2E tests.

## Issues resolved during local verification

- Docker Desktop did not honor the custom bridge's default host binding. The initially empty services were stopped before application SQL; equivalent local service configurations were recreated with explicit 127.0.0.1 bindings and existing originals/data retained. The SQL runner rejects unsafe bindings.
- The first permission test had a PL/pgSQL variable/column ambiguity; qualified metadata aliases fixed it, and complete tests passed afterward.
- Review exposed missing table ACL/bucket comparison and overly broad negative-test acceptance. The comparator now covers both; negative tests require exact SQL-error status/state/message. Synthetic review cases reject missing grants/buckets and reordered visible columns.
- The tested CLI's implicit local migration connector failed. An explicit, identity-checked loopback endpoint worked; no remote URL is accepted by the wrapper and local generated credentials stay in memory/private logs.
- The migration connector did not forward the session marker. An attempted database-wide marker was denied and rolled back. The final workflow uses an explicit postgres-owned empty private marker schema created only after guarded local/empty-state checks. No database privilege was expanded and no persistent GUC change was made.
- Source function line endings and a dropped-column ordinal gap required comparison normalization. Original source evidence is retained; normalized definitions and visible order still compare strictly.

## Known follow-ups and limits

The isolated baseline intentionally differs from the observed live saved_searches unrestricted ALL policy. Live SQL was not changed. Existing installations must fail adoption comparison until that policy and other drift/environment decisions are separately reviewed and authorized. No migration history was repaired or initialized on the current database.

Local security advisors completed with no ERROR finding and three WARN findings preserved from existing behavior: mutable search_path on search_properties and increment_property_views, and unrestricted leads INSERT. This is not a blanket security-hardening or clean-audit claim. Environment helper/event-trigger provenance remains documented outside application migrations; explicit RLS does not depend on it.

Real PayHere E2E, settlement concurrency, email/receipt delivery, deployed cron activation, frontend/API E2E, load tests and broader app regression suites were not run for this schema-only phase. Existing application tests were not unnecessarily rerun. No deployment, PR, commit or push occurred.

## Evidence and next step

Raw CSVs, private generated Compose/credential configuration, startup logs, exact runtime outputs and earlier negative fixtures remain in untracked docs/evidence/. Relevant final logs include stack-c-canonical-up, stack-c-repeat-migration-up, stack-c-ledger, stack-b-canonical-up, stack-b-canonical-repeat, stack-b-canonical-ledger, both canonical schema snapshots, latest-missing-marker and latest-replay-refusal. They are local evidence, not files to stage.

Test containers are stopped at handoff to free resources; cached official images, volumes and stopped originals are preserved. No data/image/volume cleanup was performed. Inspect actual status before a later restart. The next owner action is reviewing the change set and making the one agreed manual phase commit; do not stage docs/evidence/. Live policy repair/adoption remains a separate explicit-permission task.
