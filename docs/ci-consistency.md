# CI consistency: first increment

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

Go follows the module's minimum version (currently 1.26.0); local baseline used 1.26.2. The existing Go Docker image uses a floating tag and remains future reproducibility work.

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
