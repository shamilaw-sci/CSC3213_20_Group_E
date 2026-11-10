# Node24 runtime alignment

Status: owner approved2026-11-03; implementation and verification resumed2026-11-04.
Docker/CI/runtime metadata and private-file build exclusions are implemented;
dependency graph hashes are unchanged. Local tests/builds and actual Alpine
image acceptance passed2026-11-04. Owner Git/CI/release adoption remains open.

## Observed mismatch

Both application Dockerfiles use node:20-alpine. Backend CI and frontend CI
each select20; the combined CI workflow selects20 for both Node jobs. Installed
and locked supabase-js2.117.2 requires Node>=22. The frontend Vite8.3.3 lock entry
requires ^20.19.0 or >=22.12.0; passing that minimum does not extend Node20's
support lifetime. Official Node release data identifies20 as EOL and24 as LTS.

Local Node is24.14.1. A read-only semver check of every declared Node engine in
both lockfiles found none incompatible with24.14.1. This is a declaration check,
not proof of Linux/Alpine runtime compatibility. Latest backend1135/1135 passed
on local Node24; prior frontend301/301 is historical and must be rerun.

## Options

- Recommended: align both Docker build paths, all Node CI jobs and developer
  metadata on major24. It matches the already tested local major and supports
  the current dependency requirements. Verify actual Alpine images separately.
- Node22: meets the Supabase minimum, but adds another runtime relative to the
  local24 evidence and has a shorter remaining support window than24.
- Node26: supported LTS, but introduces a newer major without current local test
  evidence. No product requirement currently justifies that extra migration.

## Proposed changes

1. backend-node/Dockerfile and frontend-react/Dockerfile builder use
   node:24-alpine. Keep existing Alpine/dumb-init/non-root backend behavior,
   frontend Nginx stage, ports, entrypoints and app interfaces.
2. All four Node jobs in .github/workflows/backend-ci.yml, frontend-ci.yml and
   ci.yml select24; adjust step labels. Preserve triggers, job dependencies,
   actions versions, audits, Go configuration and release behavior.
3. Add root .nvmrc containing24. Both package.json files declare engines.node
   ">=24 <25" and their lockfiles' root package metadata matches. Engine metadata
   documents the selected major; npm's default advisory engine checks alone do
   not enforce it. Do not alter dependency versions, integrity hashes, resolved
   entries or lock resolution; no host npm install or toolchain installation.
4. Both .dockerignore files exclude .env* except .env.example and exclude .npmrc,
   so a local variant or private registry config is not copied by COPY . . .
   Build verification additionally uses an isolated, filtered context and checks
   file names only; never read/print actual .env or .npmrc values.
5. README and Phase7 tracker document selected runtime, exact image verification
   results and remaining release gates. This does not deploy or change any live
   service or environment.

## Verification and authorized network boundary

Approval of this proposal covers isolated Docker builds that may download the
official node:24-alpine base, the existing Nginx base if absent, existing dumb-init
APK package and exact locked npm packages into Docker build layers/cache. It does
not authorize package upgrades, host dependency/toolchain installation, provider
calls, real credentials, Compose up, database starts, deployment or Git actions.

Before builds, record existing container/image/network/volume identities and
states. Build only new uniquely tagged/labeled verification images using fresh
filtered contexts under private docs/evidence. Never pass a real env file,
registry secret, build secret, Docker socket or host data mount into the images.
Retain verification images/cache; no prune/reset or removal of existing resources.

Run backend full Jest and frontend full Vitest/lint/build sequentially under
local24 with existing memory/worker limits. Check the configuration selects24
everywhere in scope and root lock metadata is the only dependency-file change.
Record resolved image IDs/digests and actual node versions from the built images.
Mutable major tags receive patch updates; this proposal does not claim immutable
image reproducibility or pin a fabricated/unverified digest.

Use only new temporary labeled containers with --network none, no published
ports, no host mounts and dummy test configuration. Remove only those new
containers after verification (--rm); preserve all pre-existing resources.
Backend smoke uses its existing non-root user/dumb-init and an internal loopback
health request with NODE_ENV=test so workers/provider delivery do not start.
Check production imports, selected engine and absence of private env/npmrc files.
Frontend smoke validates Nginx configuration and built health/static assets on
container loopback, using ephemeral tmpfs where required. No database readiness,
real OAuth, Storage, provider, browser or production acceptance is implied.

If a pull/build/test fails, retain private diagnostics and investigate without
upgrading packages or weakening assertions. Independent scoped review precedes
completion. Owner retains staging/commit/push and coordinated release.

## Remaining boundaries

Production SQL prerequisites, credential containment, Storage privacy, replay,
durable recovery, Go toolchain/advisory checks and whole-phase acceptance remain
open. Image/action digest pinning, Nginx version upgrades and wider supply-chain
remediation are outside this runtime alignment; no security-clean claim.

## Primary references checked2026-11-03

- [Node release status](https://nodejs.org/en/about/previous-releases):24 LTS,
  20 EOL; production should use supported LTS.
- [Official Node Docker image](https://github.com/nodejs/docker-node/blob/main/README.md):
  supported major images and Alpine's musl differences.
- [Supabase Node20 notice](https://supabase.com/changelog/45715-deprecation-notice-dropping-support-for-node-js-20):
  upgrade to a supported22+ runtime. Local locked package engines independently
  establish the installed dependency minimum.

## Implementation evidence — 2026-11-04

Both Node Docker stages/all four CI jobs/manifest and root lock engines/.nvmrc
are aligned. Build-time memory/worker ARGs apply the existing verification limits
without setting the service's runtime heap. No dependency graph/version/hash
resolution changed. Private-file Docker exclusions and filtered source context
verification are implemented.

Backend1135/1135 and frontend301/301 across48 files passed on local24.14.1;
frontend lint/build passed with existing large-chunk/Lottie warnings retained.
Context/endpoint guards8/8 passed. Initial copy tests were red3/3; a nested-target
fixture was completed. Review caught a remote-npipe guard gap:2 red regression
cases then8/8 green after exact local pipe allowlisting. Follow-up review cleared
the finding; final source/evidence review found no remaining actionable P1/P2.

Actual Linux/amd64 backend/builder Node24.22.2 images passed non-root backend
imports/health/no unexpected socket checks and offline frontend Nginx health/
index/11 asset checks. New containers removed; all pre-existing resources/image
IDs preserved. Only approved base/APK/locked-package downloads occurred in Docker;
new images/cache retained. See [runtime runbook](../../phase7-node24-runtime.md)
for artifact IDs and private receipt location. No live configuration/DB/provider,
host dependency install, Git staging/commit/push/deployment or CI execution.
