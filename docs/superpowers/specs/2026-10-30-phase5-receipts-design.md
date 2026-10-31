# Phase5 payment receipts batch

Status: owner approved the next Receipts test/fix flow on2026-10-30. One receipt batch only;owner keeps staging/commit/push. Payment receipt emails are the scope previously described;message read receipts and PayHere/browser checkout are excluded.

## Approach

Use retained isolated DB/REST for actual settlement-to-outbox creation,claims/leases and sent acknowledgements. Execute real paymentReceiptQueue.drain with real emailService rendering but a mocked nodemailer transport: capture envelopes only,no SMTP/network delivery. Do not start the interval worker or call a real unscoped drain. A mock-only approach misses locking/lease/DB behavior;actual gateway/email/browser delivery would exceed this batch. No frontend receipt screen exists,so no artificial frontend work is needed.

## Scope and invariants

Seed synthetic sandbox orders/properties/users;call only owned-order settlement RPC as the receipt-generation prerequisite. No PayHere hash/webhook/browser/card/ngrok interaction. Verify correct recipient/property/decimal amount,outbox creation once after repeated settlement,real captured email subject/body and sent/attempts/timestamp state. A sent row must not resend;concurrent same-order claims should deliver once. SMTP failure/missing dummy credentials leave a lease for retry;future available_at prevents premature retry;expire only an exact owned fixture lease to test successful retry. Stale acknowledgements must not overwrite a newer lease. Delivery followed by uncertain acknowledgement may repeat;the system is at-least-once,not SMTP exactly-once.

All manual queue calls require an exact registered run-owned order UUID. Test-only RPC transport must reject missing/null/foreign order scope before forwarding;allow only claim_payment_receipts/settle_listing_checkout for registered IDs. Captured transport permits only registered synthetic recipients. Base dotenv/network/DB identity guards remain. Replace only receipt email rendering boundary as needed;all other email exports and worker.start remain forbidden. Dummy sender/password/client URL are test-owned values,never app .env. Existing profiles retain delivery prohibitions and settings.

Retry endpoint authorization is tested with a mocked drain:missing CRON_SECRET503,missing/wrong/session authorization401,exact dummy bearer200 and downstream error propagation. A valid unscoped sweep must never run against retained DB. Existing generated-email code is exercised by the actual scoped queue calls,not a fake email-service result.

## Preservation

Reuse all ten CRM app-table snapshots and canonical ledger. Create UUID/example.test users and uniquely titled image-free properties;seed pending sandbox orders and register exact order/recipient IDs. Cleanup owned outbox then transactions/orders before properties/UUID-email users,including partial-setup recovery. Check ownership before deleting and compare complete baseline after child success/failure. No resets,broad deletes,migrations,dependencies,application.env,Storage or live changes. Inspect/start/stop exact retained DB/REST;Storage stays stopped.

## Acceptance and usage

Write meaningful scope-guard tests before helper implementation and verify red/green. Run real receipt suite twice with full preservation;retry authorization/queue focused tests and default backend once after final changes. Frontend unchanged:do not repeat its full suite/lint/build without a related change. One bounded test/harness review;fix only reproduced problems,document any remaining limits. Direct config must refuse before writes without verified launcher. Save exact errors and fresh results in docs/phase5-receipts.md;update concise resume checkpoint for checkout only. No remote CI/manual demo claim without executing it.
