# Phase 5, batch 1: Login and roles

Status: scope and written design approved by owner on 2026-10-30. Execution is tracked in the matching implementation plan and batch report.

## Objective

Add repeatable happy-path and failure-path integration coverage of password login, session identity and role access. This is the first batch of Phase 5, not completion of the phase. Remaining flow order: listings, saved searches, CRM, receipts, checkout.

## Inventory and decisions

Baseline: version-3.0 at 8625cbbbc2c109956cbe7485e6e88ca0bc130da3. Existing backend has 27 Jest test files; frontend has 18 Vitest files. Existing auth API tests mock Supabase, middleware tests use a small Express harness, and Login UI tests cover Google SDK lifecycle. They do not establish a real database login/session/role chain.

Use existing Jest, Supertest, bcrypt, JWT, Supabase client and Vitest/Testing Library. No new dependency, service, migration, application auth behavior change or runtime upgrade is part of this batch. Mock-only coverage is insufficient for repository integration; a new browser E2E framework is unnecessary for this batch and would need permission. Frontend integration is explicitly not browser E2E or proof of browser cookie/CORS behavior.

Local inventory: Node 24.14.1, npm 11.11.0; CI uses Node 20. Both application node_modules directories exist. Docker engine was unavailable during inventory. No listener on 5000 or 4040 was returned by the local listener check. These observations do not prove the user's ngrok process has stopped elsewhere.

No AGENTS.md was found in the repository inventory. docs/evidence/ remains untracked and must never be staged. Owner alone performs commit/push, once the full phase is ready.

## API architecture and data safety

Run an explicit opt-in database integration suite outside the default unit-test discovery. Import the real Express app under NODE_ENV=test, preserving validators, controllers, repositories, JWT verification and database role lookups. Use a Supertest cookie agent for the login/session/logout chain. Do not mock the users repository or Supabase in this suite. Mock external email and delivery boundaries before importing the app; refuse unexpected outbound application requests. Do not call payment endpoints in batch 1.

A dedicated runner must validate the retained Phase 4 isolated project/container identity, database marker, canonical migration state and all published loopback bindings before allowing test data writes. Reuse the established identity guards; do not repurpose their SQL-only guarantees as proof that an API target is safe. Also verify that the local API/PostgREST endpoint belongs to the checked stack. Reject remote URLs, linked projects, missing credentials and unexpected endpoints. Explicitly configure a dummy test JWT secret before app import and prevent dotenv from selecting hosted credentials. Never print credentials or raw private Compose/status output.

Inspect retained resources before restarting them. Preserve all volumes and existing records; do not use reset, native CLI start or migration replay to prepare a proved stack. No installation/download is authorized by this design.

Fixtures: run-specific UUIDs and example.test emails for BUYER, SELLER, AGENT, ADMIN, BANNED, PENDING_AGENT and REJECTED_AGENT. Seed bcrypt hashes using direct local fixture setup rather than public registration so no welcome email is triggered. Read back fixtures before assertions. Record inserted IDs in memory and clean up only those IDs in finally/afterAll, including partial setup failures. Never bulk-delete by role/email prefix. Report cleanup failures as test failures. No hosted users or keys are copied.

## API assertion matrix

| Scenario | Expected observable result |
| --- | --- |
| BUYER, SELLER, AGENT password login | 200, HttpOnly token cookie; cookie agent GET /api/auth/me returns matching fixture ID/current role |
| ADMIN dedicated login | POST /api/admin/login returns 200; cookie and returned bearer credential independently pass /api/admin/verify |
| Wrong password or unknown public email | 400; no session cookie or authenticated identity |
| Malformed public login input | 400 validation response; no cookie |
| BANNED public login | 403; no cookie |
| ADMIN at public login | 403 with admin portal indication; no cookie |
| Consumer credentials at admin login | 401; no admin session |
| Anonymous protected identity/admin request | 401 |
| Consumer role at /api/admin/verify | 403 for BUYER, SELLER, AGENT, PENDING_AGENT and REJECTED_AGENT |
| Expired, tampered or password-reset-purpose token | 401 on protected routes, for cookie and bearer transports |
| Existing ADMIN session after local DB demotion | /api/admin/verify becomes 403 despite stale JWT ADMIN claim |
| Existing session after local ban | protected identity request becomes 403 |
| Logout through cookie agent | clear-cookie attributes asserted; next agent /api/auth/me is 401 |

Inspect public identity payloads to ensure password_hash is absent. Logout clears the browser cookie; it does not promise revocation of a copied JWT. Do not assert or introduce token revocation behavior.

Keep admin login tests below the real 10-attempt limit; use fresh app instances/test processes for repeat runs rather than disabling production rate limiting. Failure cases must not accidentally authenticate using cookies retained from another scenario.

## Frontend integration

Use actual UserAuthProvider, AdminAuthProvider, Login, ProtectedRoute and AdminProtectedRoute with MemoryRouter and controlled API-boundary responses. Avoid importing the entire dashboard tree: use observable route destination probes. Isolate Google SDK/animation boundaries without making provider or route authorization mocks.

Cover password submit success and invalid-credentials feedback, SELLER and AGENT dashboard navigation, default BUYER navigation, explicit return destination, session restoration success/401, anonymous redirect to /login, wrong-role redirect to /, approved agent-family dashboard access and prevention of privileged listing access for pending/rejected agents. Preserve the exact allowedRoles matrix in App.jsx, including its existing buyer-dashboard allowances; do not redesign permissions.

For admin UI, cover missing credential, forged admin_data with failed server verification, valid verification and failed verification redirects. Preserve existing logout success/failure tests. Cover consumer logout clearing local state as current behavior, without silently changing its network-failure behavior. Such changes require a separate auth behavior decision.

## Acceptance and execution order

1. Review this written design; write the implementation plan against its exact scope.
2. Establish focused existing auth test baseline with no external calls; record actual results.
3. Implement and negative-test the local runner guards before fixture writes. A guard refusal must fail the explicit integration command rather than produce a misleading green skip.
4. Add API integration and frontend integration assertions. Existing behavior may pass immediately; do not change production code merely to force a red test. Any discovered auth behavior defect is reported separately before a fix.
5. Run new suites twice with fresh test state; prove fixture cleanup. Run relevant backend/frontend regression suites and frontend lint/build after changes. CI runtime results remain distinct from local Node 24 results.
6. Record commands, counts, failures, cleanup and limitations in a batch report. Phase 5 remains incomplete until each later flow is similarly validated.

If Docker/local endpoint readiness prevents database execution, frontend work and safe runner guard tests can proceed, but mark real DB scenarios unverified. Do not substitute mocks and claim the DB batch passed.

## PayHere sandbox authorization and later checkout scope

Owner explicitly authorized PayHere sandbox payments using official sandbox Visa/Mastercard test details and the existing ngrok webhook. Browser read-only inspection confirmed https://sandbox.payhere.lk/merchant/payments displays Sandbox Mode. No payment was submitted.

Reported tunnel: https://strep-reenact-rocket.ngrok-free.dev forwards to localhost:5000. Recheck tunnel reachability and its actual backend identity before use. Backend .env currently has a non-loopback Supabase URL; do not run sandbox checkout against that configuration. PayHere sandbox mode does not isolate database writes or receipt delivery.

Checkout batch must first prove sandbox mode in the actual frontend/backend request, route the webhook to a checked isolated local backend/database, suppress email/delivery workers and use synthetic fixture orders. The user-authorized sandbox transaction scope permits sandbox submission after these checks; it does not authorize live payments, live DB writes, new dependencies/services or changing auth/payment behavior. Verify actual webhook acceptance and stored payment state, including duplicate/cancel/failure handling, in the later dedicated design. No deployment, real card details, messages or receipt delivery are authorized.
