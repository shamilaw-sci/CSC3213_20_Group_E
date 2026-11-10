# Node24 runtime alignment implementation plan

Owner approved2026-11-03. Execute inline; independent scoped review before image
execution and on results. Owner retains Git; no stage/commit/push/deploy.

## Scope and files

Approved spec: ../specs/2026-11-03-node24-runtime-alignment-design.md.
Change both Dockerfiles, three workflows/four Node jobs, both package.json and
only root engines metadata in both lockfiles, both .dockerignore files and root
.nvmrc. No dependency version/resolution/integrity change or host installation.
Official base images, existing dumb-init APK and locked npm packages may be
downloaded into Docker cache/layers for uniquely labeled verification builds.

## Execution

- [x] Record dependency graph hashes with root engine metadata removed before
  edits. Align node:24-alpine and CI24; set package/root-lock engines>=24 <25 and
  .nvmrc24. Exclude .env* except .env.example and .npmrc from both build contexts.
- [x] Verify exact metadata/config changes and dependency graph preservation.
  No tests that merely mirror these low-impact config edits.
- [x] Add a guarded context-copy/build/smoke verifier under tools/runtime with
  unit tests for actual secret-file/symlink/path filtering. Tests RED then GREEN.
  Context roots and destinations are fixed workspace/evidence paths, copying
  only explicit app root entries and regular recursively filtered source files.
- [x] Independent source review of config and verifier; address actionable issues.
- [x] Run backend full tests, frontend full tests/lint/build sequentially using
  heap512MiB/semi-space4MiB and one frontend worker/RAYON_NUM_THREADS=1.
- [x] Verifier inventories pre-existing resources, creates separate private
  context/receipts/logs, builds backend/frontend-builder/frontend images with
  fresh labels/tags and no real env/registry/build secrets. Records image IDs/
  digests and actual Node versions; keeps new images/cache.
- [x] Run only new labeled, no-host-mount/no-published-port/network-none smoke
  containers. Backend uses non-root/dumb-init, dummy configuration/NODE_ENV=test,
  internal health/import test and blocked unexpected socket attempts. Frontend
  validates Nginx config, health/index/assets on its own loopback. Remove only
  these freshly created containers; verify all pre-existing identities/states,
  networks/volumes/images remain present. No application/DB service startup.
- [x] Final source/evidence review, whitespace/index checks; update README/spec/
  tracker with actual evidence and limits. Local image smoke is not production,
  database/provider/browser acceptance, CVE clearance or release approval.

New tooling: tools/runtime/node24-context.cjs, tools/runtime/node24-context.test.cjs,
tools/runtime/verify-node24.cjs. Private snapshots/contexts/logs under
docs/evidence/phase7-node24-runtime. No existing evidence receipt is overwritten.

## Result — 2026-11-04

Completed approved local alignment. Dependency graph hashes unchanged; backend1135/1135 (21.233s), frontend301/301 across48 files (198.25s), lint/build and8 context/endpoint tests passed. Pre-review remote-npipe P2 reproduced by2 failed cases, fixed using exact local pipe names and cleared. All3 local Docker builds and actual Linux/amd64 Node24.22.2 backend/builder + Nginx smoke passed. UID1000/imports/health/zero unexpected sockets, frontend health/index/11 static assets verified offline. Only new smoke containers removed; prior containers/states/networks/volumes/imageIDs preserved. Base/new images and cache retained. Final independent review no remaining actionable P1/P2. Evidence: docs/phase7-node24-runtime.md. No deployment, CI execution, real provider/database calls, host dependency upgrade, staging/commit/push or vulnerability-clearance claim.
