# Checkout fee lock — approved implementation

User approved server-created locked orders and atomic settlement on 2026-10-27.
Sandbox remains the default; no real payments or changes to environment files.

1. Add backend-only payment orders and receipt outbox. Lock the property row when
   issuing or settling an order. Reuse an unexpired pending order for 30 minutes;
   its fee remains fixed even when settings change. Signed late successes may
   settle expired orders when the property is still unpaid. Conflicting payments
   require reconciliation rather than another automatic listing transition.
2. Hash endpoint verifies ownership and creates/reuses the order using the server
   fee, merchant and mode. Frontend uses only this response's checkout parameters.
3. Webhook verifies signature, merchant, locked amount, currency and mode. One RPC
   records the transaction, marks the order/property paid and queues a receipt.
   Listing moderation status is never changed. Unique provider ID and order
   transaction link prevent duplicates. Receipt queue uses leases and retries;
   SMTP cannot promise exactly-once delivery after an ambiguous network failure.
4. Client completion only reads server state; it cannot manufacture payment
   success, including sandbox. Paid legacy property-ID retries are acknowledged
   after signature validation; unpaid legacy callbacks require reconciliation.
5. Regression tests cover fee drift, retries, invalid data, ownership, legacy
   behavior and frontend contract. User applies SQL manually before backend
   restart. Verify schema and transactional invariants without real payments.

Rollback: stop issuing new orders first, retain the settlement endpoint and tables
for in-flight callbacks. Never drop paid orders or rewrite historical amounts.
