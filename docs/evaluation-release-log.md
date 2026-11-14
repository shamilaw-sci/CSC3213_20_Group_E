# Evaluation release preparation

## 2026-11-14 status

Current preparation branch: `version-3.0`. No merge, commit or push performed in this preparation session. Accepted feature flows are recorded in `manual-e2e-run-log.md` and role-specific retest documents; do not repeat accepted flows without a new reason.

### Confirmed in this session

- Owner supplied hosted metadata: appointment owner/slot columns, constraints/indexes; restricted seller-resolution RPC; private chat bucket and restrictive policy.
- Owner supplied table metadata: reported application tables have RLS enabled, anon/authenticated INSERT/UPDATE privileges absent; backend privileges available, with audit events limited to read/insert.
- Owner supplied Node readiness response: ready/database connected.
- Local inspection: frontend saved map URL uses 9090; a listener was present on 9090. Go code fallback is 9090; no go-map-service/.env was present. Root Docker configuration is separate and uses 8080.
- README, frontend README and environment examples updated for independent local setup using map port 9090. Existing private runtime configuration was not edited.
- Private handoff template supplied. User reports filling initial details; private credential contents are not copied into this log or independently certified.

### Deferred by user: evaluation profiles and fixtures

- [ ] Create dedicated Buyer evaluation account; privately record login and confirm role.
- [ ] Create dedicated Seller evaluation account; complete normal approval and confirm access.
- [ ] Create dedicated Agent evaluation account; complete approval and confirm public profile/access.
- [ ] Provision authorized Admin evaluation access through the established admin process; document MFA handling if enabled.
- [ ] Record all four credentials only in ignored `evaluation-access.private.md`.
- [ ] Create Seller-owned disposable edit/delete listing.
- [ ] Create separate disposable complaint/archive listing.
- [ ] Record approved Agent profile URL and fixture titles/IDs privately.

### Remaining release work

Local setup preflight found Node 24.14.1, npm.cmd 11.11.0 and Go 1.26.2. The Go module requests 1.26.10; verify a compatible installed or automatically selected toolchain during clean setup. Bare npm is blocked by this PowerShell execution policy; use npm.cmd on this machine without changing security policy. No dependency install or application test was performed for these version checks.

- [x] User verified separate local clone startup with private configuration; scope and remaining main-clone check below.
- [ ] Confirm final integration availability: sandbox callback, SMTP, AI quota and each social provider.
- [ ] Rotate credentials exposed in the earlier environment screenshot; update affected private configurations and verify connectivity. Do not reproduce exposed values in logs.
- [ ] Review final source/docs changes and exclude private files/runtime evidence logs from commits.
- [ ] Confirm final automated/CI status against the release revision; prior acceptance does not certify later changes.
- [ ] Merge reviewed release to main, push and confirm GitHub default branch/version.
- [ ] Record final commit SHA and deliver private access package through the evaluation submission channel.

No claim of exhaustive feature coverage, a working Docker startup, fresh-database provisioning or complete evaluation readiness is made by this log.

## Separate-checkout verification — user reported, 2026-11-14

Target: `D:\Thirasara-Evaluation-Check`, cloned locally from committed `version-3.0` with `--no-hardlinks`. Updated root README and three environment examples were copied separately because they were not yet committed. Private environment values were filled locally. This is not a GitHub/main clone verification.

- Backend `npm.cmd ci`: installed 428 packages; full audit reported 19 issues (3 low, 16 moderate). `npm.cmd audit --omit=dev`: zero reported vulnerabilities. Development dependency audit review remains open; no automatic fixes applied.
- Frontend `npm.cmd ci`: installed 551 packages; full audit reported 6 issues (2 low, 4 moderate), plus ESLint support warning. Production-only audit: zero reported vulnerabilities. Development dependency audit review remains open.
- `go version` inside module selected Go 1.26.10; `go mod download` completed without reported errors. Earlier repository-root version 1.26.2 is not the effective module toolchain.
- Initial Node startup failed with EADDRINUSE on 5000. Identified existing node/server.js listener PID 28028; user stopped it and started the checkout backend.
- Checkout Node readiness: ready/database connected, latency 408 ms, timestamp 2026-11-14T14:35:59.403Z (user-supplied response).
- User supplied Go readiness: database connected, service go-map-service, ready, on 9090. Response establishes availability; process working-directory identity was not independently inspected.
- User confirmed frontend Home loads and Buy/Search map results plus property navigation work following guided startup.

Accepted scope: owner-operated separate-checkout dependency installation, configured startup and basic cross-service smoke check. No new automated tests, builds, payment/provider tests or exhaustive feature rerun were performed. Final remote main clone/version/CI verification is still required after release integration.

Subsequent frontend production build: user supplied full `npm.cmd run build` output from the separate checkout. Vite 8.3.3 transformed 3477 modules and completed in 2.44 seconds. Warnings remain for chunks over 500 kB (district geometry approximately 1121 kB and react-labelled vendor chunk approximately 2335 kB, before gzip) and direct eval in the third-party Lottie player. This verifies bundle generation, not production browser behavior or the absence of security/performance risks. Automated tests and lint have not yet been rerun in this preparation session.

### Subsequent automated checks — user-supplied output

- Frontend `npm.cmd run lint`: returned to prompt with no reported errors.
- Frontend `npm.cmd test`: 76 files / 500 tests passed, 52.48 seconds.
- Backend `npm.cmd test -- --runInBand`: 109 suites / 1468 tests passed, 28.971 seconds.
- Go `go test ./...`: handlers, middleware, models, repository and routes passed; remaining listed packages reported no test files. No failures reported.

These later checks supersede the earlier not-yet-rerun status for this separate checkout. They do not establish remote CI/main status. Build warnings and development-dependency audit findings remain recorded above.

