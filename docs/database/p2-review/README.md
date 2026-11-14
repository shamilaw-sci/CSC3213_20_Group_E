# P2 database changes for review

Status: `inquiries.sql` was applied manually by the user on 2026-10-27 and its flow was verified. The user also applied saved-search-filters.sql on 2026-10-27; its column was verified by a zero-row API read. The remaining three SQL files are un-applied drafts.
These files are deliberately outside `supabase/migrations` so a deployment cannot apply them accidentally.
The Supabase CLI is not installed in this workspace. Once approved, use `supabase migration new` to create the tracked migration files and copy the reviewed statements into them.

## Deployment order and limits

1. Take a schema-only dump and verify existing column types, foreign keys and grants in a staging database. The repository does not contain the complete baseline database schema.
2. Apply each SQL file in a separate transaction in staging. Run its acceptance checks below. Review locks and query plans before production.
3. Apply only explicitly approved files in production. No schema changes are authorized by the current code-fix request.
4. Deploy dependent application changes after schema verification. Do not enable payment orders or change read-receipt behavior until their application integration has been reviewed and tested.

## Inquiries

`inquiries.sql` creates a separate `contact_inquiries` table for the new Home form and `/admin/inquiries` section. A read-only zero-row schema check found an existing `inquiries` table without `first_name`; that legacy table is not used or altered by this change. Name, email and message are unverified contact details, never a registered-user identity. API validation limits lengths and allows five submissions per IP per 15 minutes. Admin list requests return 20 records with stable ordering. There are no public read/update/delete endpoints. Database writes must use the backend service role; the app uses custom JWTs, so `auth.uid()` policies would not authorize these sessions.

The user manually applied this table SQL on 2026-10-27. One authorized test submission was persisted and displayed on the authenticated Admin Inquiries page; anonymous API reads returned 401. See `docs/P2-fix-status.md` for the test record and evidence. No automatic email is sent. Before the table exists in another environment, submission/list endpoints return 503 and the frontend shows an error; submissions are never falsely acknowledged.

## Saved-search filters

`saved-search-filters.sql` adds nullable `filters` JSONB. Existing rows remain unchanged. New version-1 payload includes `version: 1`, `searchTerm`, `listingType`, `minPrice`, `maxPrice`, `beds`, `baths`, `exactMatch`, `has360Tour`, `propTypes`. Polygon and legacy beds/baths/type columns remain for old clients. API validation whitelists and bounds every JSON field; legacy columns are derived from the validated full criteria. New clients replay `filters` when present and otherwise use legacy columns. Full persistence, replay and filter-aware email matching are implemented and regression-tested together; SQL was applied manually by the user and the column verified; live save/replay verification awaits a test search saved through Chrome/Edge because the in-app browser does not support prompt(). A new full-filter save fails honestly with 503 when the column is missing; there is no broader legacy fallback. Old clients omitting `filters` continue to work. Legacy missing filters cannot be reconstructed.

Acceptance: old rows replay unchanged; save/reload every filter; emails honor listing type, price range, exact beds/baths, selected types and tour requirements; rollback app code without dropping stored filters.

## CRM Offer

`crm-offer.sql` adds `Offer` to `lead_lifecycle` without rewriting rows. Read/write mapping is now implemented in agentRepository.js: CRM Offer maps to lifecycle Offer; Active remains Showing. Existing Active rows cannot be classified retrospectively as Showing versus Offer. User applied crm-offer.sql manually on 2026-10-27. Direct-lead Offer persistence was verified through the Agent UI, exact database read and browser reload; the authorized dummy lead was restored to New. Enum additions are additive but cannot be simply removed; application rollback must tolerate Offer values.

Acceptance: move a direct lead to Offer, reload, verify Offer remains; repeat for every existing stage; enforce assigned-agent ownership; verify conversation leads still use their existing stages.

## Recipient-specific read receipts

`message-receipts.sql` derives identifier types from existing tables. It adds a separate per-message/per-user receipt table accessible only through the backend. Every read/write must enforce existing conversation membership/admin-support access. A message is unread for a viewer when no receipt exists for that viewer and they are not its sender. An Admin receipt must never change another participant's receipt. Sender delivery/read indicators should consult the intended recipient, not an arbitrary Admin.

User approved preserving historical read state on 2026-10-27. Migration marks existing messages recipient_receipts=false, then changes the insert default to true. Existing read_at is a frozen baseline only for legacy messages; all new reads write per-viewer receipts and never update shared read_at. No receipt backfill is performed. Conversation counts, total unread, read endpoint and named-recipient sender indicator are integrated. User manually applied SQL on 2026-10-27; schema zero-row checks passed and backend restarted afterward. Live repository/database verification confirmed independent Admin/Buyer reads, idempotency and frozen legacy field; authenticated sender UI displayed Read for the authorized test message.

Acceptance: buyer/seller/Admin read independently; Admin support visit does not clear buyer unread; repeated reads are idempotent; one user cannot write receipts for another; test deletion cascades. Rollback application reads to the legacy field while retaining the new table.

## Checkout fee lock

`payment-orders.sql` prepares immutable checkout attempts with server-generated order IDs and a locked amount/currency/mode. It does not alter existing transactions. Implemented code creates/reuses a server-owned order at hash generation, returns locked checkout terms, and uses the stored owner. The webhook verifies its signature and compares the locked amount, currency and merchant mode before a single atomic order/transaction/listing transition. Provider payment IDs need an idempotency constraint and receipts need an outbox/retry policy; do not bolt this onto the existing separate transaction writes without that review.

Legacy in-flight property-ID orders need an explicit expiry/grace decision and reconciliation; never backfill their amount using today's fee. Paid webhook retries should ACK without comparing a changed current fee. Implementation was approved on 2026-10-27; SQL was applied manually by the user; rollback-only database verification passed, followed by local backend activation on 2026-10-27.

Acceptance: generate at fee A, change configured fee to B, verify A webhook succeeds; tampered amount/currency fails; simultaneous retries create one transaction; approved/rejected listing state remains unchanged; another owner cannot use the order; sandbox cannot be treated as live. Rollback new checkout creation first while keeping webhook handling for in-flight orders.


### Checkout activation and verification

1. Apply payment-orders.sql manually, once. It adds payment_orders, a nullable unique
   transactions.payment_order_id link, receipt outbox, backend-only invoker RPCs and grants.
   No historical payment rows are rewritten. Backend SUPABASE_KEY must be service_role.
2. Run payment-orders-verify.sql separately. It temporarily uses one unpaid listing
   and rolls back all writes; no committed payment or mail is created. Verify the PASS
   notice before backend restart. User executed this in Supabase and reported PASS; subsequent reads confirmed no test orders, linked transactions or outbox records remained.
3. Restart backend only after both scripts succeed. Browser completion only queries
   status, even in sandbox; a signed gateway webhook is required to become Paid.
4. Persistent Node retries due receipts every minute (failed leases wait five minutes).
   Vercel config contains a daily retry cron, 10 receipts per invocation, requiring a
   host-configured CRON_SECRET. No real environment file or deployment was changed.
   Configure a suitably frequent authorized scheduler for higher recovery volume.
5. Strict SMTP failures retain the durable receipt. SMTP acknowledgement ambiguity
   can cause duplicate email after lease expiry; payment transactions remain idempotent.
6. Existing unpaid property-ID callbacks return reconciliation-required. Already-paid
   legacy retries are acknowledged after signature/merchant validation. Preserve both
   handler and tables during rollback until all in-flight orders are reconciled.

Protocol references: https://support.payhere.lk/api-%26-mobile-sdk/checkout-api
and https://vercel.com/docs/cron-jobs/manage-cron-jobs.