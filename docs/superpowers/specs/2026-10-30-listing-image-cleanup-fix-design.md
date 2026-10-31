# Bounded fix: image cleanup after listing deletion

Status: owner approved Option A on 2026-10-30; implemented and real Storage checks passed15/15 twice. Final aggregate verification is recorded in the matching plan/report. Option B remains unapproved. The original defect was reproduced before production changes.

## Historical reproduction and root cause (before Option A)

Before the fix, `node integration/run-storage.cjs` reproduced SELLER and ADMIN deletion cases returning200 and removing the property row while retaining one Storage object and physical file each. Public GET still returned200. Independent fixture cleanup removed those exact synthetic objects through the real Storage API and full app/Storage state checks passed. Current fixed runs instead pass all15 cases, with deleted managed files absent.

Before the fix, both delete repositories called only properties DELETE, without collecting images/virtual_tours or calling Storage removal. Upload/database-failure rollback was a separate path and was not the cause of this deletion defect.

## Option A: bounded delete-path cleanup (recommended first increment)

Scope: new shared testable helper `backend-node/utils/propertyImageCleanup.js`, and the delete methods in `backend-node/repositories/propertyRepository.js` and `backend-node/repositories/adminRepository.js`. Keep controllers, roles, checkout, migration schema and dependencies unchanged.

1. Perform the authorized DB deletion and select the deleted row's id, seller_id, images and virtual_tours in the same database operation. The seller DELETE retains both id and seller_id predicates. Return the existing false/not-found result when appropriate; preserve the current admin missing-row contract.
2. Only after a successful DB deletion, pass returned row metadata to the shared helper. Do not remove files first: a foreign-key/database deletion failure must preserve both the property and its images.
3. Extract and deduplicate managed properties-bucket paths from images and virtual_tours[].url. Require configured Supabase origin, exact public properties URL prefix and deleted seller's UUID prefix; reject traversal, malformed encodings and credentials. Never send external URLs or another user's paths to Storage removal. Clearly record skipped/unmanaged legacy references for review; do not broaden ownership assumptions to clean them.
4. Await the real Storage API removal of the validated exact paths. An empty images/tours set remains a no-op, preserving the existing image-free 2A API behavior. This uses the same removal boundary already exercised by rollback/fixture cleanup; no direct storage.objects deletion or filesystem deletion.
5. Emit HTTP 200 only after managed-file removal succeeds. If Storage fails after DB deletion, throw through the existing error handler (500), and log a structured internal recovery event with listing ID, seller ID and exact managed paths, without credentials or signed URLs. Preserve that distinction in tests and documentation rather than claiming atomic deletion.

Tests: existing two real deletion failures must turn green, including public URL no longer returning bytes and physical files absent. Add pure path-validation cases (foreign host/user, malformed/traversal, duplicate URLs, photos+tours, empty arrays), seller/admin repository deletion cases and a Storage removal failure case. Prove DB delete failure never calls file removal, and Storage failure never reports clean success. Repeat real 2B twice, Login/2A regressions and existing full checks after the fix.

Compatibility limits: legacy external/unmanaged URLs are not deleted. The current API creates unique uploaded paths; legacy shared references require caution and must not be removed while another remaining listing references them. Establish the reference-safety rule/test before applying path removal rather than assume historical uniqueness.

This option has no durable retry reference after the row is gone. If the process crashes between DB deletion and Storage cleanup, or Storage is unavailable, an orphan can still remain and requires operational recovery from the recorded paths. Logs are not a transactional outbox. A failed client request may find the property already removed on retry. These are explicit limits of the small increment, not solved guarantees.

## Option B: durable cleanup jobs

Record validated cleanup paths in a database outbox in the same transaction as listing deletion, then remove files idempotently with retries and completion/error state. This retains recovery information across crashes and service outages. It requires a schema migration, transactional deletion boundary, worker activation/recovery policy and API/UI behavior decisions, so it is a separate architectural scope requiring explicit approval.

## Approval boundary

Owner approval permits only the bounded Option A files/behavior/tests described above, with its explicit failure/recovery limitations and reference-safety guard. It does not authorize a live deployment, live data cleanup, worker/outbox/schema changes or a commit/push. Existing orphan cleanup in a live environment remains a separate action.

Any later Option B work must design its transaction/retry/API contract before implementation. Required Option A cleanup assertions now pass; broader Phase 5 remains in progress after the listings checkpoint.
