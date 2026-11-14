# Phase7 committed local acceptance — 2026-11-03

Owner approved a separate fresh DB/REST environment, then explicitly approved the loopback-bridge amendment. This is local test acceptance, not production migration/deployment or whole-phase closure.

Later approved [role-request temporary amendment](phase7-role-request-rollout.md)
passed23/23 additional SQL/HTTP/ACL/rollback/locking scenarios, then restored the
original full19-table/catalog/ledger/trigger state and original receipts. The
temporary function is absent after cleanup. This separate result does not imply
a fresh combined rerun of the earlier58 cases below. Latest full backend1135/1135
across74 suites passed; both the original acceptance and new amendment remain
scoped to their recorded versions. Fresh pair stopped; retained resources preserved.

## Verified results

| Profile | Cases passed |
| --- | --- |
| New committed-schema/security acceptance | 7/7 grouped scenarios |
| CRM | 10/10 |
| Listings | 32/32 |
| Saved searches | 5/5 |
| Checkout | 4/4 |
| Total real-local cases | 58/58 |

Every profile compared all19 complete starting/ending application table snapshots, catalog metadata and canonical ledger after exact synthetic fixture cleanup. Final verification found zero rows across all19 application tables. The ready/replay path validated current nonce/database identity/ledger/patch hash/catalog and performed no schema replay. Full backend1009/1009 across69 suites passed (19.534s), including26 dedicated environment/network guard cases. Independent read-only reviews found and resolved replay/prestart-validation/privilege-coverage gaps; final tooling and finish reviews found no new actionable issues.

The seven new scenarios exercised actual Node/PostgREST/PostgreSQL behavior: all19 tables deny anon/authenticated reads with service-role positive controls; agent moderation text stays hidden; direct lead INSERT/PATCH denied; all five application RPCs deny client roles with42501 privilege errors; registration refuses self-assigned ADMIN; signed-in/guest booking owner binding and body spoof resistance; same-contact-email outsider read/cancel denial; account email changes retain appointment ownership; assigned-agent embedding resolves with the new FK; FK rejects unknown owner and account deletion preserves/unbinds agent lead; real favorites inner/status filtering and withdrawn removal. These are grouped tests, not a claim of exhaustive endpoint coverage.

Before fixtures, independent catalog checks verified eight table/four column privileges for client roles, preserved service access, exact RPC ownership/invoker execution restrictions, nullable UUID owner column, ON DELETE SET NULL FK and supporting index. Parent also cross-checked DB/API user IDs without exposing content.

## Environment and lifecycle

- New containers: `supabase_db_thirasara-phase7-acceptance`, `supabase_rest_thirasara-phase7-acceptance`.
- Cached PostgreSQL17.11.0.006/PostgRESTv16.5 images; actual published bindings verified127.0.0.1:59322/59321.
- New nonce-labelled fresh volume; generated credentials/private state never printed or staged.
- Approved active bridge: `thirasara-phase7-acceptance-loopback`, separate from retained/app networks, explicit default loopback binding. Container-level outbound blocking is absent on this bridge; child Node sockets/fetch remain restricted and provider/email/payment boundaries inert.
- Initial unused internal network `thirasara-phase7-acceptance-local` preserved empty. On this Docker engine its requested host publication produced no actual binding, so guards refused rather than accepting configuration intent. The owner approved the distinct bridge; no resource was deleted to work around it. General port-publication reference: [Docker documentation](https://docs.docker.com/engine/network/port-publishing/).
- Final finish tool verified retained container identities/states and volume/network lists against the pre-provision inventory, stopped only the new pair, then verified stopped configuration/preservation again. New volume/both networks/containers retained for review. Retained stacks were not started or changed.

No image/dependency/tool installation, real account/provider/email/payment, production credential/data copy, application .env change, canonical migration edit, stage/Git commit/push/deploy occurred.

## Bootstrap and failures retained as evidence

Static cached image bootstrap supplies native roles/auth helpers. Minimum official Storage SQL0002/0008 plus0013/0014 supplies only baseline-required table/bucket columns. The supported install_roles=false setting skips a legacy circular role grant; fresh-target bootstrap assigns its three minimum Storage tables to postgres. This is not Storage service/Auth API acceptance. No Storage/Auth/SMTP service was started.

Unchanged canonical files were applied through cached CLI2.122.0 and their exact two-entry ledger/checksums verified. The first canonical attempt applied prerequisites but baseline rolled back because bucket limit columns were absent; the reviewed official column migrations resolved that prerequisite and CLI resumed pending baseline without replay/reset. Separate reviewed `target.sql` committed hardening/appointment DDL only in this new target under a distinct purpose/nonce guard; rollback-only candidates were not stripped or executed as committed migrations.

Other recorded setup failures: internal-only host publishing refusal; stopped endpoint lacked runtime NetworkID until start (fixed requested-vs-runtime checks without relaxing running checks); legacy Storage role cycle rolled back; first HTTP suite failed beforeAll because synthetic property price was missing, with complete all19 cleanup preserved. Corrected fixture only; final58 cases passed. No failed attempt is counted as passing evidence.

Private logs, bootstrap source hashes, baseline/target provenance and completion receipt (including both candidate hashes) are under `docs/evidence/phase7-acceptance/`; keep the entire evidence directory untracked. No credential values belong in review output.

## Reuse and limits

Dedicated commands from backend-node, using retained private state and cached prerequisites:

```powershell
node integration/phase7/continue-loopback.cjs
node integration/phase7/initialize.cjs
node integration/phase7/run.cjs acceptance
node integration/phase7/run.cjs regressions
node integration/phase7/finish.cjs
```

These guards accept no caller URL and do not target stack-c. The original CRM launcher still refuses old ownership schema; do not change its marker/ledger to redirect it. New test-target SQL is not a packaged release migration. Read failures and inspect exact identities instead of resetting or deleting resources.

Production consumer/Go-role compatibility, credential containment, owner migration packaging/application, retention decision, private chat Storage cutover, real OAuth/browser behavior, Go toolchain/advisory checks, remaining source findings and owner CI/release decision remain open. No frontend/Go suite was rerun in this infrastructure-only batch; latest frontend301/301 is older evidence.
