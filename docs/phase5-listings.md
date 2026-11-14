# Phase 5 checkpoint: Listings 2A

Date: 2026-10-30 (Asia/Colombo). Baseline: version-3.0 at 8625cbbbc2c109956cbe7485e6e88ca0bc130da3, with the preceding uncommitted Login/roles batch retained.

## Outcome and scope

Listings 2A is implemented and locally verified, including aggregate regressions, lint/build and code review. This batch verifies the core listing lifecycle, ownership and frontend submission/management boundaries. It does not complete the entire listings flow or Phase 5.

Production code, dependency manifests/locks, migration SQL, CI workflows and application .env are unchanged. No commit, push or staging is performed. The owner retains the one-commit-after-full-phase preference; never stage docs/evidence/.

## Coverage

- Real API integration: 32 cases covering SELLER/AGENT multipart text-only creation, server-owned seller/status/payment fields, actual PostGIS geometry and numeric zeros, anonymous/wrong-role/banned denial, invalid input/MIME failures, own listings, foreign-owner privacy/edit/delete denial, public list/search/detail visibility, rejected/pending owner edits, approved edit refusal, Paid admin approve/retry/reject/correction and exact owner deletion.
- Frontend integration: 15 cases using the actual usePropertyForm hook and MyProperties with real auth provider/router. API and payment boundaries are controlled. Tests check missing images/boundary points, multipart fields/files/zeros/WKT, returned draft ID, failed create with no payment, retry without duplicate create, list loading/empty/error, effective Draft/Paid status tabs and cancel/success/failed deletion.
- Shared test launcher: existing Login/roles command is now a fixed-profile wrapper around run-local.cjs; listings has its own command/config. Neither suite is discovered by ordinary npm test. Existing identity/network guards remain active.
- New state tooling: 10 pure tests cover allowlisted deterministic snapshots, full-row drift detection without exposing contents and refusal to recover cleanup IDs from a foreign owner.

Listings email and saved-search coordination are boundary spies, with call arguments/counts asserted. This is not verification of email delivery or saved-search matching. Receipt delivery remains forbidden; no PayHere endpoint/SDK/webhook executes.

## Verification evidence

Commands use existing dependencies. Local runtime remains Node 24.14.1/npm 11.11.0; CI remains Node 20 and has not run for these uncommitted changes.

| Check | Result |
| --- | --- |
| Existing backend listing-focused baseline | 3 suites, 16/16 pass |
| Existing frontend PropertyDetails baseline | 1 file, 4/4 pass |
| npm test -- --runInBand tests/integrationState.test.js | 10/10 pass |
| node integration/run-listings.cjs --preflight | Read-only container/DB/API/marker/checksum/ledger and five-table snapshot pass |
| node integration/run-listings.cjs, fresh run 1 | 32/32 pass; 16.052s Jest total |
| Same explicit command, fresh run 2 | 32/32 pass; 4.814s Jest total |
| Both listings runs | Exact fixture cleanup, all five full table snapshots and two-entry ledger preserved |
| node integration/run-login-roles.cjs after launcher extraction | 32/32 pass; 4.595s Jest total; complete starting users snapshot/ledger preserved |
| Backend npm test -- --runInBand | 30 suites, 296/296 pass |
| New frontend focused integration suites, twice | 15/15 pass each; 38.80s and 6.17s |
| Focused frontend ESLint | Exit 0 |
| Frontend npm test -- --maxWorkers=1 | 22 files, 87/87 pass |
| Frontend npm run lint | Exit 0, no errors/warnings |
| Frontend npm run build | Exit 0; chunk-size and Lottie direct-eval warnings remain visible |
| Direct Jest listings config without launcher | Expected exit 1 before tests/writes: Verified integration launcher required |

The snapshot helper test first failed because the helper did not exist, then passed after implementation. Existing behavior assertions were allowed to pass immediately; no artificial production changes were made to obtain a red test.

Early frontend attempts failed before assertions due to Windows memory pressure (Rust allocation failure/worker exit). Read-only diagnostics showed approximately 305 MB available virtual memory. The owner closed apps; the standard focused command then passed twice without test assertion changes. No user process, page-file setting or system configuration was changed by the agent. Resource-heavy verification runs sequentially.

Backend/frontend task reviews approved the code against the design. The initial backend package used partial property-row snapshots; the implemented query was strengthened to p.* before the real DB runs so denied-mutation checks cover all stored columns.

## Fixture and environment safety

Only the retained stack-c DB/REST containers were restarted, after checking exact project/image/configured loopback bindings. Existing DB remains 127.0.0.1:58322 and direct PostgREST 127.0.0.1:58321. The approved REST original backup and all volumes/configuration are preserved. No Storage, auth, mail, worker or other app was opened/started for this batch. After verification both test containers were stopped successfully; docker ps showed no running containers. Restart instructions remain in the integration README.

The launcher reuses exact container/workdir/network/marker/canonical-file/ledger checks and a read-only API-versus-SQL users cross-check before writes. It passes only an allowlisted child environment, local generated credentials and a dummy application JWT secret. Dotenv is disabled. Numeric 127.0.0.1 socket destinations are restricted to verified DB/REST ports and the explicitly bound ephemeral test app listener; port 5000 stays blocked.

Each run creates eight UUID/example.test users and its own synthetic properties. Only authenticated SELLER/AGENT requests create new properties. Paid moderation fixtures are seeded directly, independently of checkout. IDs are allocated before seed inserts; API IDs are recorded and partial-response inserts can be recovered only under the exact run-owned seller IDs. Cleanup deletes only those properties before deleting fixture users, and reports failure if any remain.

The shared launcher snapshots complete users, properties, transactions, payment_orders and payment_receipt_outbox rows in deterministic primary-key order. It checks equality and canonical ledger after both child success and failure, without printing row contents. Normal setup/assertion failures run afterAll cleanup; abrupt process termination can prevent hooks, so preserve the environment for investigation rather than resetting or broadly deleting records.

## Remaining boundaries and next checkpoint

Listings 2A uses the existing API capability to create without files. Frontend tests use synthetic File objects and stop at controlled HTTP/payment boundaries. Therefore successful Storage upload, removal/rollback/orphan cleanup, full image-required AddProperty wizard and browser maps remain for a separately designed listings 2B batch. This is integration coverage, not full browser E2E or an RLS/security audit.

Public listing visibility is tested using the current approved-status rule. Admin moderation uses Paid fixtures only. The code-inspected gap remains: admin listing filters prefer Paid rows, but approval itself has no payment-status condition. Unpaid approval enforcement has not been runtime-tested or changed; resolving that rule requires a separate authorization/payment decision.

Payment-order foreign-key deletion behavior, concurrent mutations, payment settlement, real receipts/delivery and hosted deployment remain outside 2A. PayHere sandbox permission from the owner persists for the later checkout batch, subject to isolated backend/database and webhook identity checks. PayHere/ngrok were not needed or opened here.

The next checkpoint is listings 2B Storage/image-flow scope before implementation, then the original saved searches -> CRM -> receipts -> checkout order. Preserve gradual flow-by-flow review and owner commit/push control.
