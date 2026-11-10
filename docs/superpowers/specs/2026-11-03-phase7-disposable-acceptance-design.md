# Separate Phase7 committed-schema acceptance environment

Status: owner approved and executed2026-11-03; loopback-bridge amendment separately approved. Local committed-schema acceptance58/58 and full backend1009/1009 passed. New pair stopped; all retained resource identities/states preserved. [Execution evidence and limits](../../phase7-local-acceptance.md).

## Why this is needed

Retained stack-c must keep its original identity, data and two-migration ledger. Database ACL assertions were rollback-only; appointment schema candidate has not been executed. Other PostgREST connections cannot see uncommitted ACL/schema changes. Current CRM intentionally refuses old ownership schema. Continuing to rerun original profiles cannot establish the missing committed-schema acceptance.

## Options

1. Recommended: fresh local DB/REST acceptance pair and new data volume, with independent guards and synthetic-only data. Test committed hardening without touching retained stacks.
2. Keep prepared changes blocked and let the owner validate elsewhere. No infrastructure work, but the HTTP/schema gate stays open.
3. Apply changes temporarily on stack-c and restore them. Rejected: avoid altering retained state/ledger or relying on compensating restore for a security acceptance run.

## Exact proposed local resources

| Resource | Proposed identity |
| --- | --- |
| PostgreSQL container | supabase_db_thirasara-phase7-acceptance |
| PostgREST container | supabase_rest_thirasara-phase7-acceptance |
| PostgreSQL image | cached public.ecr.aws/supabase/postgres:17.11.0.006 |
| PostgREST image | cached public.ecr.aws/supabase/postgrest:v16.5 |
| PostgreSQL host binding | 127.0.0.1:59322 →5432 |
| PostgREST host binding | 127.0.0.1:59321 →3000 |
| Network | approved amendment: thirasara-phase7-acceptance-loopback bridge, separate from retained/app networks; original internal thirasara-phase7-acceptance-local preserved unused |
| Data volume | new uniquely labelled thirasara-phase7-acceptance volume, never an existing volume |
| Private generated config/evidence | docs/evidence/phase7-acceptance/; never staged |

Inventory on2026-11-03 found the two images cached; no matching containers existed and no listeners were reported on the proposed ports. Revalidate immediately before creation, including Docker resource/port collisions. Do not reuse or delete colliding resources. Existing retained services are stopped and must remain untouched unless a separately authorized read-only platform-metadata prerequisite requires an explicit bounded start/stop.

No extra Auth/Storage/SMTP/gateway/browser service is included. Platform roles/auth helper functions/storage schema required by the canonical baseline must come from verified cached platform bootstrap resources, with no application rows or credentials copied. Review bootstrap provenance before executing it. If required bootstrap resources are unavailable offline, stop and report that specific limitation rather than downloading/installing or inventing platform behavior. Native CLI start with unsafe default bindings is not allowed.

## Guard and initialization design

New dedicated launcher/config/network policy, not a relaxed stack-c guard. Refuse caller URLs, application .env, remote links, unknown names/images/labels/networks, non-loopback bindings, reused data, mismatched database identity or schema provenance. Generate distinct local credentials in memory/private files and suppress them in output. Allow child sockets only to the new DB/REST ports and its exact ephemeral loopback test listener; no existing port5000, SMTP, Gemini, OAuth or gateway. Mock dotenv/email/workers/provider boundaries as in existing guarded integration setup.

Initialize a genuinely empty database and managed prerequisites; create a unique Phase7 marker only after verifying that emptiness/identity. Apply unchanged checked canonical baseline files to this new target and verify their two ledger entries. Then use separately reviewed Phase7 test-target SQL to COMMIT the application hardening and appointment owner addition. This is test-volume persistence, not a Git commit or live migration. Do not run the existing rollback-only candidates under a misleading flag and COMMIT them, strip guards by string replacement, alter baseline files/checksums, or pretend test patches are already release migrations.

Record exact baseline/candidate/test-target SQL hashes privately and verify actual catalog state independently: application table/column/RPC ACLs, no anon/auth direct lead writes, nullable UUID buyer_id/FK ON DELETE SET NULL/index, RLS/ownership/function bodies unchanged outside intended scope. Test-target SQL needs its own committed-disposable marker/purpose and exact object allowlists. Packaging a deployable migration/manifest change remains a later owner-reviewed step.

## Acceptance scope

First, prove anonymous and Supabase authenticated clients cannot read agent moderation fields, insert/update leads directly, access application tables or invoke the five application RPCs. Distinguish normal403/404 privilege denial from network/schema failure; verify service_role positive controls.

Then exercise actual Node HTTP flows against committed test schema: register/login/session auth, authenticated booking with a different contact email, guest booking with NULL owner, body buyer_id spoof rejection/ignore, own-ID appointment list/cancel, same-email foreign account denial, changed account/contact email retaining ownership, NULL guest/historical exclusion and FK/account-deletion behavior using synthetic rows. Verify explicit assigned-agent joins still resolve after the new FK.

Also exercise approved/unpublished favorites through real nested PostgREST query filtering, withdrawn favorite removal, and representative CRM/listings/saved searches/checkout regressions with no external delivery. Adapt/reuse scenario logic through a dedicated target guard; never broaden existing setup to arbitrary caller ports/URLs. Snapshot all19 application tables before/after each profile and verify exact fixture cleanup/catalog/ledger preservation. Failure is not a skip. Do not label copied test code as current acceptance until it runs successfully.

This does not close private Storage cutover, real provider/browser behavior, Go deployed-role compatibility, production secret containment, Go toolchain/advisory gaps or owner CI/deployment. Actual Storage is excluded from this environment proposal.

## Lifecycle and approval boundary

Approval authorizes preparing guarded tooling, creating only these fresh local resources, committing schema/ACL changes only inside the fresh test database, running synthetic acceptance, and stopping the new containers afterward. Keep the new volume/containers for review; no recursive deletion, Docker prune/reset/down-volume or retained-resource cleanup. Any later removal needs separately verified exact targets/authorization. No hosted connection, production data copy, dependency/image download, live migration, application config change, stage/Git commit/push/deploy is included.

Before infrastructure actions, write/review the executable plan and test guard refusal with synthetic metadata. Independent review of guard/bootstrap/test-target SQL is required before resource provisioning/committed test changes. Progress and any prerequisite limitation must be reported accurately.

## Approved amendment and completion

The initial internal-only network suppressed actual host publication on this Docker engine. Owner explicitly approved a separate standard bridge with actual loopback verification, preserving unused network/volume and retaining strict child transport/inert delivery boundaries; container-level egress firewall protection is absent and not claimed. Prestart/runtime guards distinguish requested stopped configuration from real running publication. Cached official Storage SQL used install_roles=false to avoid a legacy role cycle, plus minimum owner/column prerequisites; no Storage API simulation/clearance. Independently reviewed before execution.

Actual58 real-local cases and1009 backend tests passed. Complete all19 table/catalog/ledger preservation after every profile, final zero application rows, ready replay/no schema replay, and retained resource identity/state/list preservation verified. New pair stopped, no deletion/reset. This completes this bounded local acceptance objective, not live migration, browser/Storage/provider acceptance or remaining Phase7 release gates.
