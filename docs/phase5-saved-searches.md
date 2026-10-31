# Phase 5 checkpoint: Saved searches

Date:2026-10-30,Asia/Colombo. Baseline version-3.0,8625cbb; preceding uncommitted Login/roles and Listings work retained. Owner controls commit/push.

## Status

Complete within the agreed scope: backend/renderer acceptance,regressions,review,hygiene and shutdown passed. No production changes in this increment. A review-discovered asynchronous repeat-approval assertion gap was corrected without replacing matching behavior; the strengthened profile passed twice with all six complete app snapshots and canonical ledger preserved. Saved searches closes the third of six agreed Phase5 flows; CRM,receipts and checkout remain for separate batches.

## Actual API and test boundaries

POST/GET `/api/saved-searches`, DELETE `/:id`, PATCH `/:id/alerts` are supported. There is no criteria-edit endpoint. Update checks cover alert preferences; repeated saves create separate records. Missing/foreign DELETE currently returns200 without deleting the other owner's row, while missing/foreign toggle returns404. Tests assert persistence as well as responses.

Full version1 criteria, legacy fields, zero rooms, polygon, default title, derived property type, isolated newest-first lists and owner spoof protection are covered. Invalid filter versions/ranges/types, malformed IDs/alert payloads and anonymous/banned operations must preserve rows. Matching checks use actual joined users and actual matcher/controller/repositories: full/legacy matches, criterion/location nonmatches, disabled/deleted searches, persisted toggle effects and exact synthetic recipients. Admin approval must tolerate rejected email promises and avoid duplicate coordination on retry.

Only delivery is mocked with inert emailService spies; no email/worker/cron activation. A call-through coordinator observation may record actual approval work without substituting matching results. Fixture addresses are unique UUID/example.test values. All matching delivery remains captured locally, including any baseline search matches; assertions filter run-specific titles.

## Evidence so far

| Check | Observed result |
| --- | --- |
| Snapshot allowlist test before change | Intended unsupported-table red;1 failed,10 passed |
| Snapshot tests after minimal change | 11/11 pass |
| Direct config without launcher | Expected refusal before tests/writes;0 tests |
| Read-only local preflight | Pass;fixed DB/REST identity/API/marker/checksums/ledger |
| Initial real run before async assertion refinement | 5/5 pass;7.325s;all six snapshots/ledger preserved |
| Strengthened real run1 | 5/5 pass;8.468s;all six snapshots/ledger preserved |
| Strengthened real run2 | 5/5 pass;5.249s;all six snapshots/ledger preserved |
| Backend task review | Spec pass,quality pass;no remaining actionable findings |
| Login/roles regression | 32/32 pass;5.396s;users/ledger preserved |
| Listings2A regression | 32/32 pass;5.868s;five complete snapshots/ledger preserved |
| Full backend regression | 35 suites,397/397 pass;7.594s |
| Rendered focused acceptance | 3 files,19/19 twice;11.99s and10.26s;13 new interaction cases plus6 existing map-hook tests |
| Focused frontend lint | Exit0 |
| Frontend task review | Spec pass,quality pass;no actionable findings |
| Full frontend regression | 25 files,108/108 pass;80.65s |
| Full frontend lint/build | Both exit0;existing large-chunk/Lottie direct-eval warnings remain |
| Final bounded aggregate review | PASS;no actionable correctness,safety or spec findings;no tests rerun by reviewer |
| Final hygiene/shutdown | 57 changed/new non-evidence files credential/whitespace clean;git diff --check clean;index empty;DB/REST/Storage each confirmed exited;resources retained |

The corrected test installs a default call-through spy before admin/app imports, bounds and awaits the actual first approval coordinator promise, then checks repeat approval made no second invocation. An independent REST round trip is no longer used as a completion barrier. Controlled delivery rejection remains visible in logs and does not prevent other captured alerts or approval success.

## Isolation and preservation

The fixed launcher derives credentials only from exact retained stack-c DB/REST containers, checks numeric loopback58322/58321 bindings and DB/API identity, disables dotenv and prevents external sockets. Port5000 and Storage58323 remain unavailable to this profile. No app .env, dependencies, schema or migration changes. Storage/PayHere/ngrok are unused.

Each run creates five UUID/example.test users and an image-free synthetic property. Searches are recovered by exact run-owned user IDs, ownership-checked and removed before owned properties and exact UUID/email users. Parent snapshots include complete users/properties/saved_searches/transactions/payment_orders/payment_receipt_outbox and canonical migration ledger after success or failure. Existing baseline rows remain untouched. Abrupt process termination can prevent hooks; investigate exact fixtures without reset/bulk cleanup.

## Limits

Rendered UI/API integration is not deployed browser E2E or a full RLS audit. No new criteria editor, save deduplication, durable email delivery/retry, historical geometry repair or live-data cleanup is included. Existing mocked unit tests retain schema-unavailable handling; no local schema alteration is used to simulate it.

Installed package/pinned local code and actual DB queries determine compatibility. Official references checked: [select and referenced tables](https://supabase.com/docs/reference/javascript/select), [changelog](https://supabase.com/changelog); no SDK/service upgrade performed.

Remote CI and a manual browser demo were not run; reported evidence is local explicit integration and rendered tests. Ordinary backend Jest excludes explicit integration profiles. Local Node24/npm11 differs from CI Node20, as recorded in the preceding listings checkpoint. No staging,commit,push or deployment; previous approved listing cleanup changes remain uncommitted and untouched by this batch.

## Next-session checkpoint

Use `docs/phase5-checkpoint.md` first rather than rereading chats or all earlier code. Run one clear batch per session; use suitable lower-usage models for routine work and stronger models for complex diagnosis/review. Repeat full suites only when new changes/failures justify them. When debugging is needed, retain the exact command and relevant error output. Each batch records scope,results,limits and its next action. Owner keeps commit/push.
