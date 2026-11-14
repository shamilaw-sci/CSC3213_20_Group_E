# Version 3.0 quality baseline

Recorded: 2026-10-27. Baseline commit: `08f2b57`.
Working branch: `version-3.0`. Final integration target: `developer` through a PR after the gradual improvement phases are complete.

## Working agreement

- Improve one concern at a time; explain the problem, the change and verification.
- Preserve current user behavior unless a behavior change is explicitly agreed.
- Obtain approval for major changes. Database SQL remains manually applied by the owner.
- Keep credentials and local account screenshots out of commits.
- The owner currently performs commits and pushes manually.

## Environment and results

Windows PowerShell; Node v24.14.1; npm 11.11.0; Go 1.26.2.
These checks use the existing installed dependencies, not a fresh `npm ci` installation.

| Scope | Command (inside service directory) | Result |
| --- | --- | --- |
| Node backend | `npm test -- --runInBand --silent` | 27 suites, 232 tests passed |
| React frontend | `npm test -- --maxWorkers=1` | 14 suites, 40 tests passed |
| Go service | `$env:GOMAXPROCS='2'; go test -p 1 -count=1 ./...` | Passed across all packages; test cache bypassed; opt-in PostGIS test skipped |
| React static analysis | `npm run lint` | Failed: 51 errors, 10 warnings |
| React production build | `$env:RAYON_NUM_THREADS='1'; npm run build` | Passed, with large-chunk and third-party Lottie direct-eval warnings |

Full lint includes `fix-imports.js` (2 errors); the earlier source-only assessment reported 49 errors and 10 warnings. Use the same scope when comparing results.

Go was rerun outside the resource-limited sandbox. `MAP_VERIFY_DATABASE` was not enabled, so the opt-in PostGIS integration test was skipped. This run does not establish real database integration or race-detector coverage.

Build sizes: MapSearch chunk 1,161.37 kB (404.63 kB gzip); react-named vendor chunk 2,231.19 kB (608.71 kB gzip). These are emitted chunk sizes, not measured page load times.

Initial concurrent checks encountered memory/resource failures. Sandboxed backend tests could not access localhost sockets; sandboxed frontend tests could not rename temporary transform files. Backend tests, frontend tests and build passed when rerun outside the sandbox; frontend used one worker. Full lint subsequently ran inside the sandbox and reported actual code findings. Keep environment failures distinct from assertion failures.

## Critical flow checklist for later automation

Each flow needs permitted behavior, forbidden behavior, failure handling and an explicit test-data cleanup policy.

1. Authentication: login/logout, reset link single use, banned sessions and role access.
2. Listings: owner-only changes, numeric validation, moderation and public visibility.
3. Map and saved searches: full filter persistence/replay, polygon matching and empty/error results.
4. Inquiries: submit once, admin visibility, anonymous read blocked.
5. CRM: direct and conversation lead stage persistence, including Offer.
6. Messaging: participant access, recipient-specific unread/read isolation and repeated reads.
7. Checkout: owner access, server-locked terms, signed callback settlement, duplicate callback idempotency, receipt retry.

This baseline does not rerun live account workflows, send messages/emails, charge payments or write to the live database. Unit/API test counts do not establish full E2E coverage, coverage percentage, load capacity or production readiness.

## Next improvement: CI consistency

Current service workflows use `npm install`, Node 20, and push branches `developer`/`dgpiumal_dev`. They do not run for pushes to `version-3.0`. The general pipeline also excludes that push branch and does not run backend/frontend tests. PRs targeting `developer` can trigger the existing workflows, subject to their path filters.

The general Go workflow specifies Go 1.23 while `go.mod` specifies 1.26.0. Local Node 24 also differs from CI Node 20. Resolve runtime policy deliberately rather than assuming local results establish CI compatibility.

Phase 2 acceptance criteria: relevant version-3.0 pushes and developer-target PRs run the agreed service checks; lockfile installs are reproducible; runtime versions align with the agreed project policy; failures propagate to workflow status. Making checks mandatory for merge additionally requires repository branch-protection settings. Existing lint debt must remain visible rather than being hidden or falsely described as clean.
