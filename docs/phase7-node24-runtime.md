# Phase7 Node24 alignment and verification

Owner approved the runtime/build design2026-11-03; execution resumed2026-11-04
after a limit pause. This work prepares local code/configuration and evidence;
it does not execute a GitHub workflow or deploy services.

Both Docker Node stages and all four Node CI jobs select24. Root .nvmrc and both
package manifests/root lock metadata declare major24. No resolved dependency,
version or integrity entry changed; normalized lockfile graph hashes match the
private pre-change baseline. Node engine declarations are advisory with npm's
default settings; Docker/CI selection supplies the actual configured major.

Both Docker contexts exclude .env* except .env.example and exclude .npmrc.
Build verification uses additional root allowlists and recursive private-file,
dependency-directory and symbolic-link refusals. No actual .env/.npmrc contents
are read, printed or copied by the verification tool.

Build-time ARGs bound Node heap to512MiB/semi-space4MiB and frontend Rust workers
to1. They do not set the running service's heap. Docker major tags remain mutable;
the verifier records actual base/built image IDs, digests when available and Node
versions so evidence describes the artifacts tested rather than a future tag.

## Verification procedure

1. Run backend full Jest and frontend full Vitest/lint/build sequentially under
   local24 with the established memory/worker limits.
2. Run `node --test tools/runtime/node24-context.test.cjs` (Windows junction test
   requires permissions to create a temporary junction).
3. With Docker Desktop running, run `node tools/runtime/verify-node24.cjs` from
   the repository root. Only the two exact local Desktop named-pipe endpoints
   are accepted; remote named pipes, TCP and SSH endpoints are refused.
4. The tool inventories pre-existing containers/images/networks/volumes, checks
   dependency graph preservation and builds fresh uniquely tagged/labeled images
   from filtered contexts. Official missing base images, existing APK and locked
   npm dependencies may be downloaded into Docker layers/cache, as approved.
5. Smoke containers use network none, no published ports or host mounts, a
   read-only root and ephemeral tmpfs. Backend smoke verifies Node24, UID1000,
   unchanged dumb-init, production imports and its own loopback /health with
   dummy configuration/NODE_ENV=test; unexpected socket attempts fail the smoke.
   Frontend smoke checks Nginx config, loopback health/index/static assets and
   the builder's actual Node major. Temporary containers are checked by exact
   IDs, run label and image before stopping/removal. New images/cache remain.
6. Final inventory must preserve all prior container identities/states, networks,
   volumes and image IDs. Private per-run contexts/receipts/logs stay untracked
   under docs/evidence/phase7-node24-runtime; no existing acceptance receipt is
   overwritten and no application/database stack is started.

## Verified evidence — 2026-11-04

Backend1135/1135 passed on local24.14.1 after alignment. Context/endpoint guards
pass8/8. Initial context tests were red3/3; a missing nested-destination fixture
was corrected without weakening its refusal check. Independent pre-build review
identified a remote named-pipe acceptance gap; two regression cases failed then
passed after exact local allowlisting. Follow-up review cleared the P2 finding.
Frontend301/301 across48 files passed (198.25s), and lint/production build passed.
The build retains known large-chunk and Lottie direct-eval warnings; no warning
suppression or package change was made. Static checks confirmed both Docker Node
paths/four CI jobs and engine metadata.

All three Linux/amd64 images built successfully using the local desktop-linux
instance with the Docker driver. Actual backend and frontend-builder runtime
was24.22.2 (local full tests used24.14.1). Backend smoke verified UID1000,
dumb-init, production imports, /health200 and zero unexpected socket attempts.
Frontend smoke verified Nginx config, /health200, index and11 static asset paths.
All smoke containers had network none, no host mounts and no published ports.

Only those new containers were removed after exact identity checks. Final
inventory preserved every pre-existing container identity/state, network, volume
and image ID. Base images, three new verification images and build cache remain.
No database/application stack was started. Independent pre-build and final
source/evidence reviews found no remaining actionable P1/P2 findings.

Private run receipt and logs:
`docs/evidence/phase7-node24-runtime/e068dcf0-c752-4787-b498-2da61e5e9f33/`.
The receipt records full context hashes, actual artifact identities and smoke/
preservation results. Verification artifacts were not deployed or pushed.

| Artifact | Verified image ID / base digest |
| --- | --- |
| node:24-alpine | sha256:8a32c8cf649a49915a66e81e7a609223c708d0adabf288ee3f4077d765542f85 |
| nginx:1.27-alpine | sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10 |
| Backend | sha256:cab775dc6b57abdd5a06c3ddcf5a2dbee562e71cad99ad71c3b46197ce9b4887 |
| Frontend builder | sha256:9455cdf6103fb0d1bbac5f0526e1805e8eda1f99ba3d2bd9a3d2cf5f9add20c0 |
| Frontend Nginx | sha256:cf3b33370fc928590eda2fd36cc11a028a5fcc4a32ee84f70513a74840780d1f |

No claim of production/database/provider/browser acceptance, image CVE clearance,
secret rotation, private Storage cutover or whole-phase completion. Other Phase7
release gates remain in the remaining-work tracker. Existing Nginx base, action
pinning policy and dependency versions are outside this change.
