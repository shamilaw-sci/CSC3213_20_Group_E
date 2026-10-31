# Phase 5 checkpoint: Listings 2B — real Storage and deletion cleanup

Date: 2026-10-30 (Asia/Colombo). Baseline: version-3.0, 8625cbbbc2c109956cbe7485e6e88ca0bc130da3, with preceding uncommitted Phase5 test batches retained.

## Status

The original diagnostic checkpoint reproduced a defect: SELLER and ADMIN listing deletion each returned HTTP200 and removed the property row, but retained its image object/physical file and public GET200. The owner subsequently approved the bounded Option A production fix. The original failing assertions were preserved, extended to photos/tours, and now pass in two fresh real Storage runs. Accepted crash/recovery/concurrency limits remain explicit below; overall Phase5 is not complete.

Only the two delete repositories and new shared propertyImageCleanup helper changed in production, after separate owner approval. Dependencies, application .env, schema migrations, workers, live data and payments are unchanged. No commit/push/staging. The approved bounded design is `superpowers/specs/2026-10-30-listing-image-cleanup-fix-design.md`.

## Approved fix and green real runs

Seller DELETE retains both listing and seller predicates and returns deleted metadata in that same DB operation. Admin DELETE also returns metadata, retaining its missing-row contract. Both await the shared helper after DB success. The helper validates configured-origin properties-bucket paths owned by the deleted seller, deduplicates photos/tours, scans all remaining-reference pages until empty and preserves still-referenced files. Unmanaged URLs are skipped/count-logged; lookup/nonarray or Storage errors fail closed, log validated recovery paths and throw rather than report clean success. DB errors never initiate file cleanup.

New focused tests first went red on the missing helper/old repository behavior, then 37/37 passed after implementation. Task review approved the production/helper/reference/path/error-handling changes. Real acceptance adds a legacy same-owner shared-reference case and seller/admin synthetic payment_order FK-restriction cases; those local DB records do not invoke any payment endpoint.

| Option A real verification | Result |
| --- | --- |
| Fresh green run1 | 15/15 pass;17.057s Jest total |
| Fresh green run2 | 15/15 pass;17.024s Jest total |
| Seller/admin photos+tours deletion, each | Target objects0/files0;all three public image/tour URLs return400 (no bytes) |
| Shared reference | Files/public bytes preserved after first row deletion;removed only after last same-owner reference deletion |
| DB foreign-key refusal, seller/admin | Existing500 error;row/images/tours/object names/physical bytes unchanged |
| Both green runs | Full native Storage schema/metadata/file manifest,five app tables and canonical ledger preserved |
| Focused helper/repository tests | 2 suites,37/37 pass after observed red tests |
| Login/roles after production fix | 32/32 pass;4.688s;users/ledger preserved |
| Listings2A after production fix | 32/32 pass;4.924s;five app tables/ledger preserved |
| Full backend after production fix | 35 suites,396/396 pass |
| Full frontend after production fix | 23 files,95/95 pass;73.37s |
| Frontend lint/build after production fix | Both exit0;existing chunk-size/Lottie direct-eval warnings remain |
| Final review/hygiene/shutdown | Task and final review approved;47 changed/new non-evidence files credential/whitespace clean;index empty;all three test services stopped and docker ps empty |

Storage removal/reference lookup can still fail after the DB row is committed, and a crash in that gap can retain an orphan. Structured recovery logs are not a durable outbox; client retry may find the row already removed. The paginated shared-reference scan is not a transactional concurrency guarantee. No live historical orphans were cleaned. These are accepted limits of Option A, not solved resilience claims.

## Evidence

Run from backend-node: `node integration/run-storage.cjs`. The historical diagnostic results below preceded the owner-approved production fix. Three diagnostic runs reproduced the same failures; the final diagnostic run includes strengthened rollback proof and physical/public-file evidence. The green results above supersede the two failing cases without erasing that red evidence.

| Check | Result |
| --- | --- |
| Storage readiness/preflight | Exact local identity and read-only bucket/schema/metadata/file state pass |
| Initial real Storage run | 10 pass,2 deletion failures;18.448s Jest total |
| Repeat with physical/public-byte observations | 10 pass,2 same failures;18.704s |
| Final run with strengthened rollback proof | 10 pass,2 same failures;20.102s |
| Seller/admin deletion observation, each | DB row absent;target object1,physical file1,public GET200 |
| Each run's independent fixture cleanup | Actual Storage API removed exact owned objects/files; app and Storage full-state preservation pass |
| Pure new Storage guard/state/transport tests | 63 pass (44 identity,6 state,13 transport), also included in full backend run |
| Rendered AddProperty wizard | 8/8 twice;5.54s,4.44s;focused ESLint0 |
| Login/roles after shared setup change | 32/32 pass;4.670s;users/ledger preserved |
| Listings2A after shared setup change | 32/32 pass;5.169s;five app tables/ledger preserved |
| Full default backend | 33 suites,359/359 pass |
| Full frontend | 23 files,95/95 pass |
| Frontend lint/build | Both exit0;build chunk-size/Lottie direct-eval warnings remain visible |
| Direct Storage Jest config without launcher | Expected exit1 before tests/writes: Verified integration launcher required |

Default backend tests intentionally exclude explicit `.integration.cjs` suites; default359/359 is not a green result for Storage2B. No CI was run for these uncommitted changes. Local runtime remains Node24.14.1/npm11.11.0; CI remains Node20.

Ten passing real cases cover SELLER/AGENT upload with persisted URLs, PNG MIME/size/downloaded SHA256 and actual volume bytes; multiple photos/tour label mapping; invalid MIME/oversize/unexpected-field/combined-count rejection without residues; actual PostgreSQL insert failure after upload; controlled second-transfer failure after completed first upload; anonymous/wrong-role/foreign-owner preservation.

The real suite deliberately observes numeric/transfer500 failures and, after Option A, FK-refusal500 failures, keeping corresponding logs visible. Known synthetic validation errors are narrowly filtered. Unknown errors are not suppressed.

## Review and rollback proof

Frontend task review approved coverage and code quality. Backend review identified a false-positive risk in the first rollback assertions: any upload failure could satisfy generic500/no-residue. The tests were strengthened before the final diagnostic run:

- A run-owner-scoped observer waits for a real successful transfer, then proves its exact SQL metadata and physical PNG SHA before returning to the controller.
- The insert-failure case requires one proven upload and the actual `invalid-numeric-fixture` PostgreSQL numeric error.
- The partial-upload case requires two targeted attempts, proven first success and exactly one distinct injected second-path rejection. A non2xx/throw/failed observer cannot qualify as that scenario.

The final run passed both strengthened rollback cases. The reviewed P2 assertion gap is resolved. General late-upload concurrency races remain unverified and are not claimed fixed.

## Local environment and preserved state

Only the retained DB/REST/Storage services were used. Storage was republished, with owner approval, at127.0.0.1:58323 using its existing file volume and cached image public.ecr.aws/supabase/storage-api:v1.84.19. DB/REST remain127.0.0.1:58322/58321. Originals, volumes and private configurations are retained; no downloads or native CLI start.

The original Storage freeze value was empty. The cached image's own loader/migration code was inspected without running it. All74 tenant migration hashes (SHA1 of filename+SQL, matching that loader) matched the existing native ledger; its additional id0 row is the native migration-table bootstrap. Freeze was set only in the private corrected local container configuration to the existing latest name unlock-object-versioning. Full pre/post startup pg_dump schema including owners/ACLs and all10 native table contents matched. No platform/app migration was applied. The initial physical-file manifest was empty.

The Storage guard validates exact name/image/project/network/volume/file backend/DB routing/local key provenance/freeze and configured+actual loopback port. The child revalidates Storage; only its explicit profile permits port58323. Earlier profiles still reject Storage requests and port5000 remains forbidden. Dotenv remains disabled and only generated isolated credentials are held in memory.

At the diagnostic decision checkpoint all three test services were stopped. They were inspected/restarted for the approved fix verification and all three were stopped again afterward. Originals, volumes and private configurations remain available. Any future restart must inspect recorded loopback bindings and run preflight.

Each run uses five UUID/example.test users and their unique object prefixes. Cleanup discovers only exact owned-prefix paths, removes them through the real Storage API, proves metadata and physical bytes absent, then removes owned property/user rows. The parent verifies full app tables, complete native Storage schema/table rows, file manifest and canonical two-entry app ledger even when assertions fail. All three diagnostic runs preserved their starting state. Native Storage SQL rows or volume files were never directly deleted.

## Root cause and approved decision

Before the fix, both repositories deleted only public.properties and never removed images/virtual_tours objects. The defect was independent of upload rollback, which passed with actual transfer proof. The separately approved Option A now shares validated managed-path cleanup after successful DB DELETE, with awaited Storage removal and explicit failure/recovery paths. It preserves images when a DB deletion fails. A crash-safe durable cleanup outbox remains a larger, unapproved alternative.

Do not clean live orphan files, activate workers or deploy this local patch under the testing authorization. Desired deletion assertions were not weakened. Fresh regressions and final review passed: Listings2A/2B close the agreed listing automation scope. Phase5 still has saved searches,CRM,receipts and checkout remaining.

## Sources and limits

Implementation facts were verified against the installed client/pinned cached service code and actual local tests. Current official references consulted: [Storage removal API](https://supabase.com/docs/reference/javascript/storage-from-remove), [self-hosted Storage configuration](https://supabase.com/docs/guides/self-hosting/storage/config), [Supabase changelog](https://supabase.com/changelog). No SDK/service upgrade was performed.

This is direct local integration rather than a deployed gateway/browser E2E or complete RLS audit. The bucket is public by existing design. UI photo/tour versus backend combined-file limits remain unchanged. Stepper-skip behavior and tour-preview URL lifecycle are inspection-only follow-ups, not verified safe/fixed behavior. PayHere/ngrok/real maps/location/delivery were not used.
