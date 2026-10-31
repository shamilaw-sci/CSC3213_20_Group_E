# Phase 5 Listings 2B Implementation Plan

**Goal:** Verify real image/Storage success and cleanup failure paths, plus the rendered AddProperty wizard, without live data or checkout.

**Architecture:** Extend fixed-profile local test tooling only for verified Storage container/port. Use existing real Express/Supabase/Storage/Postgres code, synthetic image bytes and exact-prefix cleanup. The wizard uses real component/hook/provider with controlled HTTP/payment/browser boundaries.

**Constraints:** No production fixes, dependencies, image downloads, migrations, reset, volume removal, hosted writes, payment/webhook/delivery or git actions. Keep private config/evidence untracked. Preserve existing narrow Login/2A guards. Run heavy checks sequentially. If defects are reproduced, stop before a production fix and present a concrete proposal; 2B stays in progress until required behavior passes.

## 1. Safe Storage readiness

- [x] Inspect retained Storage image/DB URI/key provenance/volume/file backend in memory; no credential output.
- [x] Start checked DB/REST only. Capture read-only storage schema, migrations ledger, bucket/object/prefix state before Storage startup.
- [x] Inspect pinned cached Storage migration-freeze implementation and compare known migration set to DB ledger. Select a freeze value only if its exact semantics are verified; do not allow automatic schema upgrades.
- [x] Retain original stopped Storage container/private config, publish its existing file volume only through 127.0.0.1:58323 using the same cached image, start it and compare schema/ledger to pre-start snapshot. Stop on mismatch before app fixtures.

## 2. Profile-specific guards and real transport

Files: `backend-node/integration/storage-local.cjs`, `storage-state.cjs`, `storage-network.cjs`, `storage.setup.cjs`, `storage.jest.config.cjs`, `run-storage.cjs`, shared runner/setup/network policy only as required, pure tests in backend-node/tests.

- [x] Add tests before helper implementation for wrong Storage identity/network/port/volume/backend/DB/key/freeze and unverified Storage transport rejection.
- [x] Implement exact Storage preflight and read-only schema/state/file snapshots. Verify no redirects/external destinations or host port5000; allow58323 only in checked Storage profile.
- [x] Map /storage/v1 requests to direct checked Storage without changing production Supabase client/repositories; keep Login/2A transport restrictions unchanged. Use existing generated local signing provenance and keys only in memory.
- [x] Add fixed storage runner profile and compare five app tables, bucket/object/prefix rows, persisted-file manifest and schema/ledger before/after; check preservation even after test failures.

## 3. Real Storage scenarios

File: `backend-node/integration/storage.integration.cjs`, small deterministic valid image fixture(s) in test tooling.

- [x] Seed run-owned UUID/example.test users, real login and bound loopback app; capture every run-owned property/object path, including partial responses via exact owner-prefix recovery.
- [x] SELLER/AGENT real multipart image creation: DB URL/path/metadata and downloaded SHA256/size/MIME match real bytes, pending/Unpaid preserved. Cover multiple photos and tour room association.
- [x] Invalid MIME/size/field/combined count: existing error contract, no listing/object/file residue. No new private-object rule for a public bucket.
- [x] DB insert failure after successful upload: no row and bounded eventual rollback removal through actual Storage API. Partial upload controlled fault after first success: real rollback removes first object.
- [x] Seller/admin delete with image: assert desired object cleanup. If current code leaves an orphan, preserve the failing assertion, capture exact observed counts and clean the test-owned orphan via Storage API in afterAll. Do not implement production cleanup yet.
- [x] Wrong-role/anonymous/foreign-owner requests preserve other owned objects.
- [x] Cleanup files through Storage API and verify metadata/owned persisted bytes absent before deleting own rows/users; never delete native storage rows/files directly or an entire bucket/volume.

## 4. Rendered wizard integration

File: `frontend-react/src/pages/AddProperty.integration.test.jsx`.

- [x] Real component/usePropertyForm/auth provider/router; mock API/usePayhere, maps/compression/geolocation/object URLs/layout/animation only.
- [x] Step validation/navigation, File preview/removal/oversize/processing failure, tour room metadata, final FormData/returned-ID payment-boundary handoff, failed create no payment and draft retry no duplicate create.
- [x] Run focused wizard suite twice and ESLint sequentially. Report actual-behavior gaps without production fixes.

## 5. Review, validation and decision checkpoint

- [x] Review test tooling/coverage, resolve essential test-only issues and rerun affected checks.
- [x] Run Storage scenarios twice once desired behavior passes; if blocked by reproduced product defect, document failed case and independently verified cleanup instead of claiming completion.
- [x] Verify Login/2A after shared tooling changes, pure guards, full backend/frontend suites and frontend lint/build as far as independent work permits; record limits.
- [x] Update README and `docs/phase5-listings-storage.md`, scan non-evidence changes for secrets/whitespace, confirm no staging, stop only started local services with originals/volumes retained.
- [x] If fixes require owner approval, present exact failing command, evidence and minimal proposed production change with compatibility/error-handling implications; do not mark 2B or Phase5 complete.
