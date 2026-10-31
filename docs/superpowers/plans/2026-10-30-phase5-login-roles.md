# Phase 5 Login/roles Implementation Plan

> Execute inline against the owner-approved design, with safety checks before fixture writes and a batch report before moving to listings. Owner retains all commit/push actions.

**Goal:** Repeatable real-database API and provider/router UI integration coverage for password login, sessions and role access.

**Architecture:** Keep production auth code unchanged. Use Jest/Supertest against the real app and a verified retained local Supabase stack. Use Vitest/Testing Library with real providers/routes and controlled API-boundary responses. A dedicated launcher owns local identity, credentials and outbound network restrictions.

**Tech Stack:** Existing Node, Jest, Supertest, pg, Supabase JS, Vitest, Testing Library and PowerShell/Docker tooling. No new dependencies.

## Global constraints

- Only synthetic data in checked loopback isolated containers; no hosted writes, reset, volume removal, payment execution or delivery.
- Retain docs/evidence/ untracked; never print credentials. No application .env edits or credential copies.
- No auth/payment behavior fixes without owner permission. Regression tests may pass immediately for existing behavior.
- Existing version-3.0 checkout is the owner-designated workspace; no branch/commit/push/PR actions.
- Current local Node 24 and CI Node 20 are recorded separately.

## Task 1: Baseline and environment readiness

- [x] Run `npm test -- --runInBand tests/auth.test.js tests/authMiddleware.test.js tests/authorization.test.js` in backend-node and focused Login/AdminAuthContext Vitest tests in frontend-react.
- [x] Inspect retained Docker resource identity before starting only the needed existing containers. Validate private Compose metadata in memory without displaying its values. If engine readiness remains unavailable, continue frontend/guard work and mark DB scenarios unverified.

## Task 2: Guarded API launcher

Files: `backend-node/integration/local-stack.cjs`, `backend-node/integration/run-login-roles.cjs`, `backend-node/tests/localStackGuard.test.js`, `backend-node/integration/jest.config.cjs`, `backend-node/integration/setup.cjs`.

- [x] First write guard tests: reject non-loopback ports, unexpected container/project/network/image, linked workdir, missing marker/ledger and API/DB stack mismatch. Assert refusal before writes or app imports.
- [x] Run focused guard tests; observe missing-module failure before implementing the test tooling.
- [x] Implement exact stack-c identity discovery from Docker inspect, canonical manifest verification and read-only SQL identity checks. Derive local API port/credentials only from verified running containers. Use only existing tooling and no caller-provided URLs.
- [x] Verify API identity using a read-only users lookup cross-checked with SQL, service role JWT provenance and PostgREST target configuration. Reject redirects/unexpected outbound destinations. Avoid fallback to application .env.
- [x] Launch a fresh explicit Jest process with an allowlisted environment, NODE_ENV=test, dummy JWT secret and verified local credentials. Exclude integration suite from default discovery by using `.integration.cjs` with explicit separate config.
- [x] Mock dotenv/email/receipt queue before real app import, block outbound network except checked local PostgREST and Supertest loopback traffic. Unexpected email/worker calls fail.
- [x] Verify all guard failures with no live connections and run explicit launcher preflight. Missing prerequisites must fail, not skip.

## Task 3: Real API flows

File: `backend-node/integration/login-roles.integration.cjs`.

- [x] Seed seven run-specific roles with UUIDs, example.test emails and bcrypt hashes via verified local pg connection. Keep inserted IDs before attempting writes; read back all fixtures.
- [x] Assert BUYER/SELLER/AGENT login cookie -> /auth/me ID, role and absence of password_hash.
- [x] Assert ADMIN login -> /admin/verify through cookie and bearer independently. Assert wrong/unknown/malformed/BANNED/public ADMIN/consumer-admin failures and absence of issued cookies.
- [x] Assert anonymous 401, consumer-family admin 403, invalid token matrix (expired/tampered/reset-purpose x cookie/bearer), current DB demotion/ban behavior and cookie-agent logout -> 401.
- [x] In afterAll delete only seeded IDs, verify none remain and surface cleanup failures. Run the explicit launcher twice in separate processes; verify no fixture growth and migration ledger unchanged.

## Task 4: Real frontend provider/router flows

Files: `frontend-react/src/pages/Login.integration.test.jsx`, `frontend-react/src/pages/admin/context/AdminAuth.integration.test.jsx`.

- [x] Use real UserAuthProvider/Login/ProtectedRoute with MemoryRouter destination probes; mock only API and Google/animation boundaries.
- [x] Assert BUYER/SELLER/AGENT navigation, explicit return location, failed password feedback with no authenticated state, restoring valid/missing sessions, anonymous/wrong-role redirects, allowed agent-family dashboard roles and blocked pending/rejected listing access.
- [x] Assert consumer logout current success/failure semantics through the real provider.
- [x] Use real AdminAuthProvider/AdminProtectedRoute with controlled admin API responses: missing token, forged localStorage with rejected verification, valid session, rejected/invalid verification and loading state.
- [x] Run focused suites twice; if any production defect appears, report it without changing behavior.

## Task 5: Validation and report

- [x] Run backend `npm test -- --runInBand` and frontend `npm test -- --maxWorkers=1`, `npm run lint`, `npm run build`.
- [x] Check diff for secrets, unintended application changes and whitespace; retain private artifacts untracked.
- [x] Write `docs/phase5-login-roles.md` with commands/counts, fixture lifecycle, isolation proof, failures and unverified boundaries. No Phase 5 completion claim until later flows pass.
