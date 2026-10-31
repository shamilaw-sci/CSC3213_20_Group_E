# Phase 5 listings: batch 2A

Status: design approved by owner on 2026-10-30; implementation and evidence tracked in the matching plan/report.

## Objective and inventory

Verify the core listing lifecycle and ownership through the real local database, plus frontend submission/management integration with controlled HTTP/payment boundaries. Login/roles is the preceding completed local batch; the overall phase remains incomplete.

Existing propertyPrivacy and propertyNumericValidation tests use mocked database/repository boundaries. listingApprovalAlerts tests mock adminRepository, saved-search coordination and email. PropertyDetails frontend tests cover loading/favorites/navigation with mocked authentication. No tests were found for usePropertyForm, MyProperties or admin ListingsPage.

POST /api/properties permits SELLER/AGENT and creates pending/Unpaid rows using authenticated seller identity. Owner mutation routes use /my-listings/:id. Approved listings cannot be edited through the owner route. Public list/search filter status=approved; detail permits owner/admin access to non-approved rows. Admin moderation calls email and saved-search coordination. The frontend usePropertyForm requires an image and immediately calls triggerPayment after saving, retaining draftPropertyId for retry.

## Approaches

1. Recommended: reuse the existing guarded Jest/Supertest local DB harness and Vitest/Testing Library. First test core lifecycle without successful storage transfers or real payment; cover frontend boundaries with controlled responses. This requires no new dependencies/services.
2. Include real Storage and complete AddProperty wizard in the first batch. This broadens local service/network/cleanup scope; establish a separate upload design and obtain any required environment permission first.
3. Mock-only API tests. These are cheap but leave the repository/DB gap open, so they are insufficient for this roadmap batch.

## Real API matrix

- Authenticate synthetic SELLER and AGENT through real login; submit text fields/multipart without files. Assert persisted id, authenticated seller_id, numeric values including zeros, pending and Unpaid. Spoofed seller_id/status/payment_status must not override server-owned fields.
- Assert anonymous writes are 401; BUYER, PENDING_AGENT, REJECTED_AGENT and ADMIN cannot create/edit/delete through consumer seller routes (403 with valid payloads); BANNED sessions remain rejected.
- Invalid title/description/price/coordinates/numeric counts return validation 400 and create no rows. Disallowed MIME upload rejects before storage and creates no rows/objects.
- Owner /my-listings includes own fixtures only; another seller/agent cannot see private detail or edit/delete those rows (404), and SQL snapshots confirm unchanged data after denied mutations.
- Public list/search excludes pending/rejected fixtures; approved fixtures are public. Owner/admin can inspect private fixtures. Missing detail returns 404. Assert identities/fixture sets rather than ordering-only checks.
- Owner updates pending/rejected fixture and returns it to pending; approved-owner edit returns 400 with unchanged data. Preserve payment status and seller identity; do not introduce permission rules.
- Use directly seeded Paid fixtures to exercise admin moderation independently of checkout. ADMIN approve -> public visibility; repeated approval -> unchanged state/no duplicate notification coordination; reject -> stored reason/private public visibility; owner correction -> pending. Non-admin moderation requests return 403 without DB changes.
- Owner deletes own disposable fixture; row absent and subsequent detail unavailable. Foreign-owner delete leaves the row intact. No payment_orders/receipts are attached to deletion fixtures.

The text-only API fixture deliberately follows the existing API capability; it is not proof that the full image-required browser submission works. Valid WKT may be included to exercise actual PostGIS persistence; malformed geometry error semantics are outside the initial validation contract.

## Frontend matrix

Use the real usePropertyForm hook with synthetic File and controlled API responses; isolate usePayhere. Verify missing-image/boundary validation, multipart field mapping, returned draft ID handed to the payment boundary, create failure with no payment attempt and retry reusing the existing draft instead of creating a duplicate. No PayHere SDK/card/webhook executes.

Use real MyProperties with real auth provider/router as practical and controlled HTTP. Verify loading/empty/error states, Unpaid displayed as Draft, Paid pending/approved/rejected tabs, delete cancellation, successful deletion and failed deletion retaining the row. Payment control is isolated. Map/photo sphere, layout/animation and external assets are not integration targets in 2A.

## Isolation and changes

Reuse exact stack-c guards, loopback ports, canonical checksums/ledger and approved retained DB/REST setup. Add a separate explicit listings command/config; keep the Login/roles command passing. Any shared test-tooling extraction must be small and regression-verified. No production behavior, dependencies, migrations or application .env changes.

Only users/properties created for the run may be mutated or cleaned. Allocate UUIDs for seed rows before writes; for API-generated property IDs, record returned IDs and use the run-owned seller IDs to recover partially completed inserts if a response fails. Snapshot pre-existing users/properties and payment/order/outbox state. Cleanup exact run-owned properties first, then fixture users; verify restored starting state/ledger even after normal setup/assertion failure. Never reset volumes or broadly delete data.

External delivery remains disabled: listing-status email and saved-search coordination are controlled boundary spies, with invocation assertions where relevant. This does not verify email delivery or saved-search matching, which belongs to the later flow. Existing receipt worker refusal, dotenv isolation and strict outbound port guard remain active. No real or sandbox checkout occurs in 2A.

## Discovered rule question, kept outside behavior changes

The admin list defaults/pending filter select Paid rows, but approveListingOnce does not itself check payment_status. Code inspection therefore suggests a direct admin request can approve an unpaid row; this has not been runtime-tested in this inventory. Do not silently turn a desired payment invariant into a production change or characterize it as a verified safe rule. Batch 2A moderation uses Paid synthetic fixtures; deciding/testing enforcement of unpaid approval belongs in a separately approved payment/authorization decision.

Deletion with payment-order foreign keys, real Storage upload/removal and orphan rollback, full AddProperty wizard, browser maps, concurrent mutations and actual checkout remain unverified by 2A. A later listings 2B design must cover image upload success/failure and storage cleanup before declaring the whole listings flow complete.

## Acceptance

Run existing focused listing tests before edits. Run the new real DB suite twice with new fixtures and prove cleanup/state preservation. Run frontend focused integration twice, backend/frontend regressions, frontend lint/build sequentially to avoid the recorded Windows paging limit. Review changes for safety and spec compliance; record counts, failures and exclusions in a listings batch report. Keep all evidence/config/credentials untracked and unstaged. Owner alone performs git commit/push after the full phase.
