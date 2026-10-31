# Listing deletion image cleanup — Option A plan

**Goal:** Fix the reproduced seller/admin deletion orphans within the owner-approved bounded design. No durable outbox, schema, auth, payment, dependency, deployment or live-data changes. Owner retains all commit/push actions and evidence stays untracked.

**Completed:** 2026-10-30. Real Storage15/15 twice;Login/roles32/32;Listings2A32/32;backend396/396;frontend95/95;lint/build pass. Reviews approved,47 non-evidence files clean,index empty,three services stopped. Accepted crash/manual-recovery limits remain documented in the design and checkpoint report.

## 1. Test-first helper and repository changes

- [x] Add path tests before new helper code; observe missing helper failure. Actual real Storage delete assertions already fail on the existing production code.
- [x] Implement `utils/propertyImageCleanup.js`: trusted configured origin/properties prefix/deleted owner path; deduplicate images/tour URLs; reject malformed/traversal/foreign paths and log skipped-reference counts without raw untrusted URLs.
- [x] Scan remaining property image/tour references in deterministic complete pages before removal. Preserve still-referenced paths. A failed reference lookup must not remove files; surface recovery paths and fail instead of silently treating the lookup as empty.
- [x] Seller/admin repositories perform DB DELETE with returned id/seller_id/images/virtual_tours, retaining seller owner predicate and existing missing-row contracts; await shared helper afterward. DB failure must never touch files.
- [x] Test photos/tours, dedup, empty/malformed/unmanaged fields, shared references across pages, lookup failure, Storage failure with structured recovery paths, DB failure, absent rows and both repository integrations. No credential/signed URL logging.

## 2. Real isolated Storage proof

- [x] Inspect/restart only retained DB/REST/Storage after exact loopback/image/project checks; never open other apps without owner request.
- [x] Strengthen deletion scenarios to include photos+tours, public URL no longer returning bytes, physical files absent, and a remaining fixture reference protecting a shared image until the last reference is deleted.
- [x] Add actual DB foreign-key delete-failure scenario: preserve row/files when payment_orders restricts deletion, using synthetic local records only and exact cleanup. Do not invoke checkout/payment/worker.
- [x] Run Storage profile twice; require green assertions and complete native/app/schema/ledger/file preservation. Keep fault-injection rollback evidence intact.

## 3. Review and regression

- [x] Review production/test diff for safety, path/reference guards and recovery limits; resolve actionable findings.
- [x] Run Login/roles and Listings2A integration, backend full Jest, frontend full Vitest, frontend lint/build sequentially. Update affected mock expectations rather than weakening real behavior assertions.
- [x] Update 2B report/README/design status with fresh results and persistent DB/Storage crash-window/manual-recovery limitation; do not claim full atomicity or fix live orphans.
- [x] Scan credentials/whitespace including tracked edits; confirm index empty; stop only the test services and preserve all resources; finish review. No commit/push.
