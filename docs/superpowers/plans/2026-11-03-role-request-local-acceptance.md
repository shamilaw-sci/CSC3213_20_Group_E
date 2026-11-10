# Role-request local acceptance plan

Owner approved the concrete amendment2026-11-03 in response to the rollout
proposal. Execute inline; independent reviewer checks runner before execution
and results afterward. Owner retains all Git operations.

## Scope

Only existing fresh Phase7 DB/REST59322/59321, nonce-labelled volume and loopback
bridge. Temporary committed function, synthetic users/requests, fixture-scoped
failure trigger/helper, checked removal and restoration are approved. No live or
retained application database, baseline migration/target/ready-receipt change,
image/dependency download, external service, real account, email or payment.

## Steps

- [x] Write RED unit tests for separate amendment artifact/fixture ownership
  guards. Implement small pure module and rerun GREEN.
- [x] Prepare full purpose/nonce-guarded supplement SQL with function body/ACL
  identical to the candidate; never execute a stripped rollback candidate.
- [x] Prepare dedicated runner: full stopped/running identity before start;
  ready/provenance/original completion/catalog/empty19-table checks; socket
  guard; exact candidate inside rollback-only transaction and SQL scenarios;
  rollback/full restoration; separately receipted temporary supplement;
  committed synthetic fixtures and scoped trigger; inert guarded Jest child.
- [x] Child acceptance exercises actual middleware/router/RPC/PG, denied direct
  roles, valid approval/rejection, invalid eligibility/role/history, forced
  second-write failure, request errors, both ban lock orderings, competing
  approve/reject and duplicate approvals. Observe pg_blocking_pids with bounded
  waits, not timing-only guesses. Parent owns cleanup even child assertions fail.
- [x] Before removal, verify exact owned function/trigger metadata and fixture
  identities; refuse drift. Remove only own IDs/objects without CASCADE. Compare
  all19 full snapshots/catalog/ledger plus trigger metadata and original receipts.
  Stop only the verified test pair, preserve volumes/networks/retained state.
- [x] Independent pre-execution review, execute approved runner, diagnose any
  failure without weakening assertions, post-evidence review and update docs.
- [x] Run focused guard/runtime tests and full backend as needed by changes;
  whitespace/index verification. Record actual counts and remaining release gates.

## New files

- backend-node/integration/phase7/role-request-guards.cjs: pure source/ownership checks.
- backend-node/tests/roleRequestAcceptanceGuards.test.js: negative drift cases.
- backend-node/integration/phase7/role-request-supplement.sql: independent guarded SQL.
- backend-node/integration/phase7/role-request.integration.cjs: real acceptance scenarios.
- backend-node/integration/phase7/run-role-request.cjs: isolated lifecycle/receipts/restoration.

Private per-run receipt/log/snapshots remain untracked under docs/evidence.
No staging/commit. Candidate execution is rollback-only; supplement commits only
temporarily in the approved fresh database and is removed after evidence.

## Result

Completed locally2026-11-03: exact candidate rollback SQL passed; real committed-supplement acceptance23/23 passed; guard26/26; full backend1135/1135 across74 suites (25.686s). Pre-execution and post-evidence independent reviews found no remaining actionable P1/P2. Exact fixture/object cleanup and complete19-table/catalog/ledger/public-trigger/original-receipt restoration passed. Fresh pair stopped, retained identities/states and volume/networks preserved. Initial Docker refusals, OID serialization correction and unsuitable OPTIONS discovery attempts remain documented; final readiness used service-role read-only OpenAPI discovery. No production adoption, runtime/dependency change, staging/commit or deployment.
