# Phase 5 Listings 2A Implementation Plan

**Goal:** Verify listing lifecycle/ownership through the real isolated database and frontend form/management boundaries.

**Architecture:** Reuse existing stack-c safety/network guards. Extract only the shared launcher needed by explicit Login/roles and listings commands; keep setup specialization test-only. Use actual controllers/repositories and frontend hook/provider/components, with controlled email/saved-search/payment boundaries.

**Tech stack:** Existing Jest, Supertest, pg, Supabase JS, Vitest, Testing Library, PowerShell and Docker. No new dependencies/services.

## Global constraints

- Owner alone commits/pushes, after full phase. No staging, branch creation or production behavior changes.
- No live data, checkout, delivery, migrations, volume reset/removal or application .env edits.
- Only checked stack-c DB/REST on 127.0.0.1:58322/58321; deny port 5000. Keep docs/evidence/ untracked.
- Successful real Storage operations and full browser wizard are separate listings 2B; do not claim complete listings/Phase 5.
- Run resource-heavy checks sequentially because of the observed Windows paging limit.

## Task 1: Baseline

- [x] backend-node: `npm test -- --runInBand tests/propertyPrivacy.test.js tests/propertyNumericValidation.test.js tests/listingApprovalAlerts.test.js`.
- [x] frontend-react: `npm test -- --maxWorkers=1 src/pages/PropertyDetails.test.jsx`.
- [x] Inspect exact retained DB/REST configured bindings/project/image, then restart only those two containers and run the existing read-only preflight. Preserve originals/volumes.

## Task 2: Shared guarded launcher and state checks

Files: `backend-node/integration/run-local.cjs`, existing `run-login-roles.cjs`, new `run-listings.cjs`, `listings.jest.config.cjs`, `listings.setup.cjs`, test-only `database-state.cjs`, guard tests in `backend-node/tests/integrationState.test.js`.

- [x] Write tests for deterministic complete-table snapshots, unchanged-state assertion and mutation refusal for pre-existing records; observe missing helper before implementing.
- [x] Extract existing container/credential/preflight/child environment steps into shared runLocal(profileName), using fixed 'login-roles'/'listings' profiles with internal config paths/table allowlists; wrappers never accept caller URLs/config.
- [x] Snapshot full contents of users, properties, transactions, payment_orders and payment_receipt_outbox before/after listings, using deterministic SQL JSON aggregation. Check state after child failure as well as success; fail if different.
- [x] Keep Login/roles command behavior and allowlisted child environment unchanged. Listings setup reuses generic security setup and overrides only listing-status email and saved-search coordination with explicit boundary spies.
- [x] Verify pure guard tests and launcher-bypass refusal. The inherited security setup executes before every fixture-write path.

## Task 3: Real API listing lifecycle

File: `backend-node/integration/listings.integration.cjs`.

- [x] Allocate run-owned UUID users and seeded Paid moderation rows before writes; use bcrypt + real login for seller/agent/admin. Record API-generated IDs, recover partial inserts only under run-owned seller IDs. Cleanup exact run-owned properties before users in finally/afterAll.
- [x] Assert create defaults/server-owned fields and real PostGIS/numeric persistence; API no-file multipart creation deliberately excludes successful upload.
- [x] Assert anonymous writes401, disallowed roles403, banned sessions403, invalid input400 and disallowed MIME400 without additional properties.
- [x] Assert ownership/visibility/edit/delete matrix and SQL unchanged rows after denied operations; include missing detail404, approved edit400, zeros and rejected->pending correction.
- [x] Assert Paid admin moderation lifecycle, rejection reason and public visibility/search changes. Assert repeated approval has no duplicate boundary calls. Non-admin mutations403 leave data unchanged. Never approve unpaid fixtures.
- [x] Run new DB suite twice with fresh fixtures. Verify starting state for all five tables + canonical ledger after each run. Run Login/roles once after shared harness extraction.

## Task 4: Frontend form and management integration

Files: `frontend-react/src/hooks/usePropertyForm.integration.test.jsx`, `frontend-react/src/pages/MyProperties.integration.test.jsx`.

- [x] Hook tests use actual hook with synthetic File, mock HTTP/usePayhere only: missing image and boundary failure, exact FormData contract, correct returned ID passed to payment boundary, create failure no payment, retry no duplicate create.
- [x] Page tests use actual MyProperties/auth provider/router with controlled HTTP/payment boundaries. Assert loading/empty/load-failure, unpaid Draft versus Paid status filters and deletion cancel/success/failure preserving expected row state.
- [x] Run focused frontend suites twice and focused ESLint. No production fixes if tests expose unexpected current behavior; report to owner.

## Task 5: Validation, review and handoff

- [x] Review API/frontend task diffs and resolve actionable safety/coverage findings without widening production scope.
- [x] Run backend full Jest, frontend full Vitest, frontend lint/build sequentially, plus appropriate syntax and pure tooling checks.
- [x] Document counts, repeatability, cleanup, initial failures and boundaries in `docs/phase5-listings.md`; update integration README with explicit command/prerequisites.
- [x] Check all new/modified non-evidence files for leaked credentials/whitespace, confirm index empty, stop only this batch's DB/REST services preserving all resources, and finish review. No commit/push.
