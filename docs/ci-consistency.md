# CI consistency: first increment

Status: **Phase 2 complete for the agreed first increment**, reviewed 2026-10-28 at commit `25ad25d`. Historical checkpoints below describe the work as it happened; the acceptance review at the end is the current status.

## Purpose

Keep version-3.0 improvements checked before their eventual PR to developer. Preserve the existing workflows and security/build checks; consolidation is a separate future decision.

## Changes

- General CI now includes version-3.0 pushes and PR targets, alongside main/master/developer.
- Backend/frontend workflows retain developer/dgpiumal_dev and add version-3.0; changing the workflow file itself also triggers its service workflow.
- All three workflows explicitly request read-only repository contents permission.
- Service installs use npm ci, which checks the committed lockfile rather than updating it.
- General CI now runs backend Jest and frontend Vitest tests. Backend uses one process; frontend uses one worker to limit memory pressure.
- Go setup reads go-map-service/go.mod. Vet and uncached race tests include all packages, including repository query tests.
- Backend syntax validation checks each JavaScript file separately, including utils. The runner's default Bash fail-fast/pipefail behavior propagates syntax failures from the loop.

## Runtime policy for this increment

Node 20 remains the existing CI/Docker runtime major; no production runtime upgrade is included. Local baseline used Node 24.14.1, so local results alone do not prove Node 20 compatibility. setup-node resolves the current Node 20 release, not an exact patch. A supported-runtime migration and exact pinning need separate review across CI, Docker and hosting.

Go follows the module's minimum version, now 1.26.10; the Docker builder is pinned to `golang:1.26.10-alpine`. The original local baseline used 1.26.2.

## Verification performed locally

- Parsed the three changed workflow YAML files with installed js-yaml.
- Asserted version-3.0/developer event branches, absence of npm install commands, module-based Go version and test commands in general CI.
- Backend and frontend npm ci --dry-run --ignore-scripts --offline both exited successfully. This verifies lockfile/install planning, not a fresh install or execution of package lifecycle scripts.
- Baseline service tests/build are recorded in quality-baseline.md. Application code and dependencies were not changed here.

## After the owner commits and pushes

1. Open GitHub Actions for the exact pushed commit and confirm the general pipeline starts for version-3.0. The two service workflows start when their service/workflow paths changed.
2. Confirm Node installation, npm ci, backend tests, frontend tests/build, Go vet/race/build, audits and Docker/security scan outcomes. Do not mark remote CI verified until these logs are available.
3. If a check fails, distinguish dependency/runtime/network failures from application assertions. Preserve failing checks and diagnose the cause.

Full lint remains known debt (51 errors, 10 warnings), not a passing CI gate. Existing audits can fail on newly disclosed vulnerabilities. Duplicate service/general checks remain deliberately in place for this small increment.

Required merge checks are repository branch-protection/ruleset settings; this change does not enable them, open a PR, push, deploy or apply SQL.

## First remote run: backend test isolation correction

The owner supplied the backend CI log for commit 8358ee4: three suites failed during module initialization (`supabaseUrl is required`), with 24 suites and 214 tests passing. Local baseline had not exposed this because local environment configuration was available.

Reproduced locally by overriding SUPABASE_URL with an invalid test URL and SUPABASE_KEY with a test-only value: inquiries, authorization and propertyNumericValidation failed to initialize; the other 24 suites/214 tests passed. No real credentials were needed for this diagnosis.

Added explicit client mocks only to those three test files. Authorization repository auto-mocks still evaluate imported modules; numeric validation imports a controller with a client dependency; the inquiry app imports unrelated controllers that construct separate SDK clients. Those clients are outside the behavior exercised by these tests.

With the same invalid configuration, all 27 suites/232 tests now pass. Application code, workflow secrets and database configuration are unchanged. A new GitHub run after the owner pushes is still needed to verify the remote result; the separate frontend failure has not yet been diagnosed.

## Frontend lockfile compatibility correction

The owner confirmed Backend CI passed for 251fcbe. General CI showed Go passing, backend npm audit failing, and frontend npm ci rejecting AJV dependency placements. The runner used Node 20.20.2/npm 10.8.2; local baseline used Node 24.14.1/npm 11.11.0.

Reproduced the exact frontend EUSAGE/AJV errors using npm 10.8.2 locally, so the package-manager difference is sufficient to reproduce the failure even on local Node 24. Repaired the lockfile using npm 10.8.2 package-lock-only resolution, then retained only AJV/ajv-formats/json-schema-traverse placement corrections. Preserved all unrelated entries and platform metadata. Assertions confirmed the package/version set and root requirements are identical to the committed lockfile; package.json and installed node_modules were not changed.

Final npm 10.8.2 ci --dry-run --ignore-scripts --no-audit --no-fund exited 0. This is install-plan validation, not an actual clean Linux install or a Node 20 test/build run; GitHub must verify those after push. Backend audit findings remain separate unresolved work. The CI audit gate remains enabled.

## Remote checkpoint and pending frontend classification (2026-10-28)

The owner supplied the summary screenshot for [general CI run 40739262146](https://github.com/shamilaw-sci/CSC3213_20_Group_E/actions/runs/40739262146), commit `2f5b8fc` on `version-3.0`: Success. All four jobs passed: Go tests/build, backend verification/tests, frontend tests/build, and Docker Compose build verification. The screenshot also shows 14 frontend test files and 40 tests passing. This records the supplied run summary, not an independent review of every step log or branch-protection settings.

Commit `2f5b8fc` raises the module minimum to Go 1.26.10 and pins the Docker builder to `golang:1.26.10-alpine`. This supersedes the earlier Go-version/floating-builder notes above. Local uncached Go tests, vet and build passed with Go 1.26.10 outside the sandbox; sandbox test/vet attempts encountered dependency-cache access restrictions.

The pending frontend change moves shadcn 4.23.0 from dependencies to devDependencies without changing its version. The application imports `shadcn/tailwind.css` at build time; both CI and the Docker builder install devDependencies before compiling the static bundle. A build environment that omits devDependencies would not support this build (Vite also requires them).

Local verification of the pending change:

- Compared the lockfile against HEAD: package paths, versions, integrity values and dependency metadata are unchanged; 221 package entries change dependency-classification flags.
- npm 10.8.2 `ci --dry-run --ignore-scripts --no-audit --no-fund` passed outside the sandbox. This validates the install plan, not a fresh installation. The sandbox attempt failed with registry DNS resolution errors.
- Frontend tests passed: 14 files, 40 tests. The sandbox attempt failed before test execution with temporary-file rename EPERM errors; the outside-sandbox rerun passed.
- Production build passed with RAYON_NUM_THREADS=1. Existing large-chunk and third-party Lottie direct-eval warnings remain.

At this checkpoint Phase 2 was open pending commit/push, remote CI and acceptance review. These items are resolved by the review below. Node CI still uses major 20 while local verification uses Node 24.14.1; exact Node/npm pinning and a supported-runtime migration remain separately reviewed work. Repository-wide lint cleanup is Phase 3 and has not been completed.

## Phase 2 acceptance review (2026-10-28)

The owner committed and pushed `25ad25d`. Their GitHub Actions screenshot shows Frontend CI #41 and Thirasara CI Pipeline #54 both successful for that exact commit on version-3.0. Backend CI is path-filtered and was not expected for this frontend/docs change; the general pipeline includes backend verification. This evidence is the owner's supplied run summary rather than a new independent step-log review.

| Criterion | Evidence and result |
| --- | --- |
| Relevant branch coverage | Fresh YAML assertions passed for version-3.0 pushes and developer-target PRs in all three workflows. Service path filters remain explicit; general CI has no service path filter. PR event execution itself was not exercised by opening a PR. |
| Lockfile installs and service checks | Fresh assertions passed for npm ci, backend/frontend test commands, high-severity audit gates, module-derived Go version, uncached Go race tests and Docker dependencies on all three service jobs. Latest general and frontend remote runs are green. |
| Runtime policy | All Node CI workflows use major 20, matching the existing Node Docker builder major. Go minimum and Docker builder use 1.26.10. Local Node 24 differs; Linux CI supplies the Node 20 execution evidence. Exact Node/npm and image-digest reproducibility are outside this increment. |
| Failures propagate | Earlier remote backend test initialization failures at 8358ee4 failed Backend CI; after test isolation corrections, the owner confirmed Backend CI passed at 251fcbe. This demonstrates a real test-run failure propagating, though no deliberate assertion-failure experiment was added. Fresh YAML review found no job/step continue-on-error flags or shell failure-suppression fallbacks in these workflows. Docker depends on successful service jobs. |
| Known debt remains visible | Full lint is still recorded as 51 errors and 10 warnings at the original baseline; it is not advertised as a clean gate. Existing bundle and Lottie warnings remain. |

No application changes, dependency upgrades, live database writes, deployment, PR creation or branch-protection changes were needed for this closeout. Mandatory merge blocking depends on repository rulesets/branch protection and has not been verified or enabled. A runtime migration, exact Node/npm pinning, Docker image digest pinning and removal of duplicate workflow runs remain explicit follow-ups rather than completed claims.

Next roadmap phase: **Phase 3 — lint cleanup**. Re-measure full lint first, preserve the same comparison scope, and address small file groups with behavior checks when hook/lifecycle changes are involved. Rollback of the Phase 2 implementation is through separately reviewed reverts of its commits; retain failing quality gates and do not apply a blanket branch reset. The closeout documentation can be reverted independently.
