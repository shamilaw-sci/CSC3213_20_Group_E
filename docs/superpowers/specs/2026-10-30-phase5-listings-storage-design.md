# Phase 5 listings 2B: real image/Storage flow

Status: design and local Storage exposure approved by owner on 2026-10-30. Execution is tracked in the matching plan/report; production fixes remain a separate approval.

## Objective and inventory

Close the successful file-transfer and failure-cleanup gaps left by listings 2A, while exercising the actual AddProperty wizard through controlled frontend boundaries. This remains integration testing, not browser/network E2E or checkout.

Retained supabase_storage_thirasara-phase4-c exists, stopped, image public.ecr.aws/supabase/storage-api:v1.84.19, project label thirasara-phase4-c, network thirasara-phase4-local, persistent volume mounted at /mnt. It has no published host port. Retained DB/REST are stopped with configured loopback ports 58322/58321. Docker metadata was accessible; no app needed opening during inventory. No credentials were printed.

Canonical migrations define properties as a public bucket, with no bucket-level MIME/size restrictions. Backend uses its service client and stores files under the authenticated application user ID. Middleware permits declared JPEG/PNG/WebP MIME types, at most 5 MiB per file and ten total files. Route field maxima are ten photos and five virtual tours, still subject to the combined ten-file limit. UI separately permits eight photos and five tours. MIME filtering is not proof of file-signature inspection.

Existing 2A tests cover invalid MIME before transfer, synthetic frontend File mapping and core API lifecycle. They do not prove real upload/download/removal/rollback or the rendered AddProperty wizard.

## Options

1. Recommended: reuse the retained local Storage service and existing Jest/Supertest/Vitest tooling. Publish only 127.0.0.1:58323 for direct Storage, preserve its original container/config/volume, and extend exact local guards/transport only for this profile. No downloads or new dependencies.
2. Mock Storage success/failure. This avoids service work but cannot close the real object/bytes/cleanup gap and is insufficient for 2B.
3. Add a full browser E2E framework and local gateway. This broadens dependencies/services/network scope and needs separate permission; defer it.

## Explicit environment permission requested with this design

Allow the existing stopped stack-c Storage service to be recreated with only 127.0.0.1:58323 published, retaining its stopped original and original private configuration, and reusing the same persistent volume. Permit starting only the checked local DB/REST/Storage containers for these tests, and stopping them afterward. No native CLI start, new image download, volume reset/removal, auth/mail/worker startup, production SQL, hosted credentials or ngrok/backend repointing.

Before Storage startup, capture read-only local storage schema/bucket/object state. Check image/configuration/migration-freeze compatibility against the retained setup; do not silently allow an automatic platform migration. Compare actual schema after startup; if it differs, stop before application fixture writes and report it for a separate decision. Do not repair or migrate schemas to make tests pass.

Validate exact Storage project/name/image/network, persisted volume identity, DB routing/credential provenance, signing-key provenance, file backend configuration and configured/actual loopback binding before any fixture uploads. Extend the outbound policy only for this checked Storage origin/port in the Storage profile; Login/roles and 2A must keep their existing narrower permissions. Refuse redirects/unexpected hosts and port 5000.

## Real API and object matrix

- Real SELLER and AGENT login -> multipart create with a small deterministic valid image -> pending/Unpaid property. Assert actual object metadata, owner-prefix path, MIME, byte length and downloaded-byte SHA256, plus persisted images URL and seller ownership. Use synthetic image fixtures, never personal files.
- Multiple photos plus a virtual-tour image/room label: verify image/tour URL associations, actual bytes and stored JSON metadata. Do not invoke PayHere.
- Verify the public object URL through the checked local transport. The bucket is public: do not invent a private-object rule for pending listings. This does not prove a deployed gateway/browser URL works.
- Invalid declared MIME, greater-than-5-MiB upload, unexpected field and combined count over ten return the existing upload error contract, with no listing or residual object. Check both object metadata and owned file namespace. Document UI/backend limit mismatch rather than changing either silently.
- Force a deterministic property insert failure after a real successful upload using invalid unvalidated numeric data such as houseSize. Assert no property row and poll boundedly for actual rollback object removal, since rollback is currently fire-and-forget. Preserve the observed error contract; do not silently add production validation.
- Controlled partial-upload failure after the first real upload has completed: narrowly inject failure only at the second run-owned transport request; assert actual rollback of the first file and no property/residual object. Do not mock repository/controller/Storage success. General late-upload concurrency races remain a separate resilience scenario.
- Characterize seller/admin listing deletion with uploaded files: verify DB row removal and inspect remaining Storage objects/bytes. Current delete methods have no explicit object-removal call. Treat reproducible orphan retention as a defect/gap, not a passing cleanup guarantee. Report it before proposing any production fix.
- Wrong-role/anonymous/foreign-owner requests must not create/delete another fixture's objects. Tests exercise backend authorization/service-client behavior, not a full RLS audit.

## Frontend wizard matrix

Render actual AddProperty with the real usePropertyForm and auth provider/router. Control API and usePayhere only at their boundaries. Stub geolocation, map rendering, image compression, object URL APIs, layout/animation and external imagery as needed for jsdom; do not request actual location or open real maps.

Cover step validation/navigation, required fields and image requirement, small File selection/preview/removal, upload-processing failure, oversize rejection, optional tour room metadata, final FormData submission, returned draft ID handed to isolated payment boundary and retry retaining the saved draft. Confirm errors remain visible and no payment boundary call happens before a successful save. Existing hook tests remain regression coverage; the new tests must exercise rendered wizard controls rather than duplicate hook implementation.

Compression stubs do not verify browser canvas/compression fidelity. Real backend/Storage byte tests independently verify transfer/persistence. These two layers must not be described as a single full browser-to-Storage E2E chain.

## Data lifecycle and isolation

Snapshot complete app tables as in 2A, storage bucket/object metadata and existing persisted-file manifest before fixture writes. Identify any relevant version-specific storage namespace/prefix metadata during preflight and include it in preservation checks. Do not print private contents/credentials.

Use run-owned UUID users and their unique object prefixes. Capture API-created property IDs, recover incomplete inserts only under those exact users and discover cleanup objects only under those exact prefixes. Cleanup files through the real Storage API first, verify object metadata and physical owned-file namespace absent, then delete exact fixture properties/users. Never delete storage rows directly or recursively delete an entire volume/bucket. Preserve all pre-existing metadata/files and canonical ledger/schema.

Even a deletion-orphan characterization must explicitly clean its own retained files afterward, so a discovered product defect does not leave test pollution. Failure/cleanup drift fails the command. Normal hooks handle partial setup; abrupt process termination remains an investigation/recovery case without broad reset.

## Defect handling and acceptance

No production behavior changes are authorized by this test design. If real tests confirm delete or rollback defects, stop before a fix and present the smallest concrete change, compatibility implications and regression test for owner approval. Do not weaken desired cleanup assertions to claim green completion. A characterization report alone does not complete the intended cleanup coverage.

Run new real Storage scenarios twice with fresh fixtures once required behavior is passing; verify complete state preservation. Run rendered wizard integration twice, existing Login/2A integration regressions after shared tooling changes, pure guard tests, full backend/frontend tests and lint/build sequentially. Review code/evidence and record gaps. A confirmed blocking defect leaves 2B in progress until the owner decides and the resulting checks pass.

Owner retains all commit/push actions and one commit after the full phase. Keep docs/evidence and generated private local configuration untracked/unstaged. No live/sandbox payment, webhook, external message, deployment or live data write belongs to 2B. After listings completion, resume saved searches -> CRM -> receipts -> checkout.
