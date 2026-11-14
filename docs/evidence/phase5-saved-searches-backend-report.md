# Phase 5 saved-search backend task report

Status: implementation and focused checks complete; real profile runs await the parent agent's sequential heavy-check slot.

## Files

- Modified `backend-node/integration/database-state.cjs`: added only the fixed `saved_searches: id` snapshot entry.
- Modified `backend-node/integration/run-local.cjs`: fixed saved-searches profile with all six complete app-table snapshots.
- Modified `backend-node/tests/integrationState.test.js`: complete saved-search row and deterministic ordering guard.
- Added `backend-node/integration/run-saved-searches.cjs`, `saved-searches.jest.config.cjs`, `saved-searches.setup.cjs`, `saved-searches.integration.cjs`.

The suite retains actual authenticated Express, PostgREST, repositories, joined users, matcher and admin approval. It uses delivery-only mocks and call-through coordinator observation: saved-search and seller-status email exports are inert spies, while the coordinator spy invokes the actual implementation. Fixture recovery and cleanup use exact synthetic owner IDs, then property ownership, then individual UUID/email users. Parent launcher checks six complete snapshots and the canonical ledger after child success or failure.

## Commands and observed output

From `backend-node`:

- `npm test -- --runInBand tests/integrationState.test.js` before allowlist change: exit 1, intended `Unsupported snapshot table.`, 1 failed / 10 passed.
- Same command after minimal allowlist change: exit 0, 11 passed / 11 total.
- `node --check integration/saved-searches.integration.cjs`: exit 0.
- P2 review correction syntax checks: `node --check integration/saved-searches.setup.cjs` and `node --check integration/saved-searches.integration.cjs`, each exit 0. Heavy profile checks were not run during this correction; the parent retains the sequential execution slot.
- `node node_modules/jest/bin/jest.js --config integration/saved-searches.jest.config.cjs --runInBand --no-cache` without launcher: exit 1, `Verified integration launcher required.`, 0 tests; no fixture setup ran.

## Self-review and remaining checks

P2 review correction: install the default call-through `checkSavedSearchMatches` spy after email mocking and before app/admin imports. The approval case clears invocation history, asserts one coordinator invocation, and awaits that invocation's real returned promise with a five-second bound whose timer is cleared in `finally`. After repeat approval it asserts the invocation count remains one and saved-search/seller email counts remain unchanged. Direct matcher cases continue through the same real implementation. Removed the independent fake-property matcher request because a separate PostgREST round trip cannot establish completion of detached approval coordination. Network guards and fixture cleanup are unchanged.

Reviewed against the backend brief: persistence/default/legacy/full/zero/type derivation, ownership spoofing, isolated order/duplicates, malformed criteria/IDs/bodies, anonymous/banned rejection, toggle and deletion, actual full/legacy/location/criterion matching, disabled/deleted/toggled alerts, exact recipients, detached admin approval/repeat and one rejected delivery promise are asserted. Counts use run-tagged search titles. Cleanup revalidates DB identity and recovers API inserts through exact owner IDs even when response assertions fail.

No production, dependency, environment, schema, worker or delivery changes. No staging, commits, pushes or deployment. Existing unrelated repository changes were retained. No product defect identified by executed checks; real DB/profile evidence is still pending. Parent will run read-only preflight, profile twice and default regressions sequentially and record results in the final phase evidence.

## Parent acceptance after P2 correction
Real preflight passed. Strengthened real runs both passed5/5 (8.468s and5.249s), with six complete app snapshots and canonical ledger preserved after each exact fixture cleanup. Task reviewer returned spec pass and quality pass after checking the call-through completion correction. No production defect found. Full regression results are recorded in the checkpoint report.

