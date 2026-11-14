# Phase 5 checkpoint: Login/roles automation

Date: 2026-10-30 (Asia/Colombo). Baseline: version-3.0, 8625cbbbc2c109956cbe7485e6e88ca0bc130da3.

## Outcome

The first approved Login/roles batch is implemented and locally verified. Production code, dependencies, application .env, migration SQL and CI workflows are unchanged. All changes are uncommitted/unstaged; the owner performs commit/push after the full phase. Do not stage docs/evidence/.

Phase 5 is still in progress. The remaining original flow order is listings -> saved searches -> CRM -> receipts -> checkout. This report does not claim full frontend/API browser E2E, payment E2E, a security audit or Phase 5 completion.

## Coverage

- Real Express API -> controller -> repository -> Supabase JS -> local PostgREST -> PostgreSQL integration: 32 cases. Covers cookie login/current identity for BUYER/SELLER/AGENT, dedicated ADMIN cookie/bearer login, malformed/invalid/banned/wrong-portal failure responses, consumer-family admin denial, invalid-token transport matrix, fresh DB demotion/ban enforcement and cookie-agent logout.
- Frontend integration: 27 new cases, using actual auth providers, Login and route guards with MemoryRouter and controlled API responses. Covers password navigation, explicit return route, anonymous failed login, session restoration/loading, existing role matrix, consumer logout current semantics, forged admin storage and server verification. Existing admin logout tests remain intact.
- Pure safety guards: 54 cases (29 container/workdir/DB identity and 25 outbound policy cases). These run in ordinary Jest without Docker/network.

The real DB suite is explicitly opt-in and excluded from default test discovery. It fails when prerequisites are unavailable rather than reporting a skipped success. See ../backend-node/integration/README.md for commands and boundaries.

## Verification evidence

Commands were run from the named package directories using existing dependencies, local Node 24.14.1 and npm 11.11.0. CI remains Node 20 and was not run for these uncommitted changes.

| Check | Final result |
| --- | --- |
| backend-node: npm test -- --runInBand | 29 suites, 286/286 tests pass |
| backend-node: node integration/run-login-roles.cjs --preflight | Read-only container/DB/API/marker/checksum/ledger cross-check passes |
| backend-node: node integration/run-login-roles.cjs, final run 1 | 32/32 pass; 6.183s Jest total |
| Same explicit command, fresh final run 2 | 32/32 pass; 7.362s Jest total |
| Both final DB runs | Seven own fixture users removed; starting users set and canonical two-entry ledger preserved |
| frontend-react: npm test -- --maxWorkers=1 | 20 files, 72/72 tests pass |
| New frontend focused suites | 27/27 pass repeatedly, including after review fixes |
| frontend-react: npm run lint | Exit 0, no errors/warnings |
| frontend-react: npm run build | Exit 0; chunk-size, Lottie direct-eval and plugin-timing warnings remain visible |
| Direct Jest invocation bypassing the integration launcher | Expected exit 1: Verified integration launcher required, zero tests/fixture writes |

Focused existing auth baseline before adding tests passed 30/30 backend and 4/4 frontend tests. The first sandboxed backend attempt failed with local socket EACCES; the approved rerun passed. No application change was made to address that sandbox restriction.

Parallel full verification initially exceeded Windows paging/commit memory (process creation failure, Vitest EPIPE and Vite allocation failures; ESLint also failed during this resource pressure). Sequential reruns of the full backend/frontend tests, lint and build passed. No memory settings, dependencies or system processes were changed.

Early harness failures were investigated before changing test tooling: the retained PostgREST secret is a JWKS containing an oct key, and Node HTTP passes normalized socket options as an array. Guards now recognize those actual local formats. Failed API attempts still ran fixture cleanup. No production auth defect was found or fixed.

Task reviews identified and resolved three coverage/safety gaps: observe real provider identity outside Routes for failed login; restrict TCP to verified endpoints/registered listener; assert validation/admin-portal payload semantics. Frontend and backend task reviews subsequently approved spec compliance and code quality.

## Local environment and data isolation

The owner approved publishing the existing stack-c PostgREST service on 127.0.0.1:58321. DB remains 127.0.0.1:58322. The original stopped REST container was retained as supabase_rest_thirasara-phase4-c-before-phase5-port. Existing private configuration and DB volumes were preserved. Only DB and REST were started; auth, storage, mail and delivery workers were not started. After verification both test services were stopped successfully, preserving containers/volumes/configuration; docker ps then showed no running containers.

The runner checks exact container names/project labels/images/network, configured and actual bindings, unlinked CLI workdir, isolated approval namespace, PostgreSQL major, canonical migration checksums and exact ledger. It cross-checks a read-only users lookup through local PostgREST against SQL before any fixture writes. Local credentials are derived in memory and never printed. The child receives an allowlisted environment and dummy application JWT secret, with dotenv loading disabled.

Each run seeds seven run-specific UUID/example.test accounts with bcrypt hashes. Setup failures and assertion failures trigger exact UUID/email cleanup in afterAll; cleanup failures fail the run. The launcher separately compares the starting and ending users set and ledger. Abrupt process termination can prevent hooks; investigate preserved local data rather than resetting or deleting broadly.

The direct-PostgREST test transport strips only the Kong path prefix. This verifies the actual auth/repository/DB chain but does not verify Kong, a deployed reverse proxy, browser cookies/CORS or an external identity provider. Logout proves cookie clearing, not copied-JWT revocation.

## PayHere sandbox follow-up

The owner authorized sandbox Visa/Mastercard payments using official PayHere test details and the running ngrok webhook for the later checkout batch. Read-only browser inspection confirmed sandbox.payhere.lk/merchant/payments displays Sandbox Mode. No payment was submitted, webhook invoked, receipt sent or live DB changed.

The existing backend .env points to a non-loopback Supabase target. Payment sandbox mode alone does not make application DB writes isolated. Before checkout execution, verify the actual sandbox request mode, official current test card details, ngrok forwarding/backend identity, isolated order/receipt data and suppressed external delivery. The existing live/application/ngrok configuration was not repointed by this batch.

## Next checkpoint

Inventory and propose the listings batch before implementing it. Keep registration/social sign-in, password reset delivery, runtime migration and auth behavior changes outside this approved batch. Preserve owner commit/push control and the one-commit-after-full-phase preference.
