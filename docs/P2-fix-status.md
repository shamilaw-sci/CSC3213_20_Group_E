# P2 fix status

Updated: 2026-10-27. Changes are local and uncommitted. No deployment, live payment, database migration or inquiry submission has been performed.

## Implemented code

| Area | Change | Regression coverage |
| --- | --- | --- |
| Favorites | Fetch on first mount; identify favorites by property ID; keep valid property details when favorite lookup fails; reset detail/gallery/tour state on navigation | `useFetch.test.jsx`, `PropertyDetails.test.jsx` |
| Search | Restore Home query, show map failures and clear stale results; send optional filters before server limit; exact geometry intersection and cache filter isolation | `useMapSearch.test.jsx`, Go repository tests |
| Navigation | Saved searches replay through Map state with full version-1 filters or legacy fields and display their title; Feasibility route opens existing calculator | Map hook replay tests and source review |
| Saved-search full filters | Validated version-1 JSON saves/replays text, Sale/Rent/Sold, price, rooms, exact matching, multiple types and tours; matching alerts use the same criteria; effective feasibility cap saved without private inputs | Save API, matcher, MapTopBar and hook tests; SQL applied by user; live save/replay pending |
| Validation | Forward parsed numbers/defaults while preserving fields outside existing schemas; preserve valid zero and optional blank listing values | `validate.test.js`, `propertyNumericValidation.test.js`, feasibility suite |
| Password reset | Minimal existing-style page, password-bound reset token, atomic compare-and-set password update, write errors propagated | `passwordReset.test.js`, `ResetPassword.test.jsx` |
| Analytics | Remove fabricated valuation; label sample history; use comparable asking-price statistics with correct perch conversion; exclude other listing/property types | Engine and dashboard tests |
| Messaging | Select conversation peer by participant ID, including seller/agent initiators | `conversationParticipant.test.js` |
| Admin | Explicit Bearer credential precedes ambient cookie; dashboard isolates failed requests; Sale listings hide rental period | Auth middleware and dashboard tests; display source review |
| Payments | Report confirmed only after server property payment status says Paid; otherwise show awaiting-confirmation feedback | `usePayhere.test.jsx` |
| Alerts | Trigger saved-search matching on the atomic transition to approved; repeated approval does not resend | `listingApprovalAlerts.test.js` |
| Home inquiries | Validated, rate-limited guest POST; separate admin-only paginated Inquiries page; retain form text on failure; no registered identity linking | API and frontend inquiry tests |

The user manually created `contact_inquiries` on 2026-10-27. Its columns were verified by a zero-row API read. One explicitly authorized test inquiry was submitted through the actual Home form, persisted once, and displayed in the authenticated Admin Inquiries page. An existing, differently shaped `inquiries` table remains untouched.

## Approval boundary

Draft SQL and rollout/rollback notes are in `docs/database/p2-review/README.md`. These files are outside automatic migrations. Preparing them was authorized; applying them was not.

- New contact inquiry table: applied manually by the user and verified through Home → API → database → authenticated Admin Inquiries.
- Full saved-search filter persistence and filter-aware alerts: code implemented with legacy compatibility; user manually applied the nullable `filters` column on 2026-10-27; a zero-row API read returned 200 and confirmed it exists. Live save/replay remains pending: the in-app browser does not support the existing prompt() dialog, so no test saved search was created. The user will save the test search in Chrome/Edge. Map requests also currently fail to fetch. New full-filter requests fail with 503 rather than silently saving broader criteria; old clients without `filters` keep their existing behavior.
- Direct CRM Offer persistence: design only; current lifecycle mapping remains unchanged.
- Recipient-specific message read receipts: design only; current shared receipt behavior remains unchanged.
- Checkout fee lock: design only; fee drift for in-flight checkout remains unresolved.

## Verification record

- Backend full suite on 2026-10-27: 195/195 passed after the saved-search phase, with local test sockets outside the sandbox. Database calls in these tests are mocked.
- Frontend full suite on 2026-10-27: 37/37 passed after the saved-search phase.
- Go unit suite on 2026-10-27: all packages passed. The optional read-only PostGIS test ran but could not connect within its 20-second timeout; live SQL execution remains unverified.
- Production build on 2026-10-27 passed. Existing bundle-size and third-party direct-eval warnings remain.
- Targeted lint for the reset page, inquiries page, conversation helper, Home inquiry component and analytics component passed. This is not a claim that the repository-wide baseline lint findings are resolved.
- Independent review found the numeric-zero regression; it was fixed and re-reviewed without another blocker.
- Independent saved-search review found no blocking regression. A further text-preservation test ensures saved criteria keep the active map's literal whitespace semantics.
- `git diff --check` passed (line-ending notices only).

No claim of complete live-flow validation or complete P2 resolution is made while the database-dependent work and verification limits above remain.

The user ran the contact inquiry SQL manually in Supabase SQL Editor and explicitly authorized one dummy inquiry. Verification record ID: `76c6da13-3941-4501-a6d7-5a47a8cebc6f`, name `TEST Inquiry flow verification`, email `test@example.com`. The record remains in the database; no deletion or outbound email was performed. Anonymous GET `/api/admin/inquiries` returned 401; public GET `/api/inquiries` returned 404. Browser evidence: `docs/evidence/home-inquiry-success.png` and `docs/evidence/admin-inquiry-verified.png`. The other four SQL files have not been applied by the agent. Saved-search SQL was manually applied by the user and its column verified. The other three integrations remain design-only.


### Saved-search profile crash follow-up (2026-10-27)
Profile Search Radars crashed with ReferenceError because the row variable s was referenced as search in alert controls. Corrected the row references, persisted title display and replay navigation to /map with savedSearch state. Regression test covers rendering, alert update and replay payload; frontend full suite: 38/38 passed. Live profile renders the user's Search list 1 Kurunagala record; database confirms version-1 filters persisted. Run Search Radar restores its Sale/default criteria and boundary, returning two Kurunegala listings. Non-default full-filter replay remains covered by automated tests. No records or alert preferences were changed during live verification. Evidence: docs/evidence/saved-search-profile-fixed.png.

### CRM Offer persistence (2026-10-27)
Approved implementation maps direct lead Offer writes and reads to the separate Offer enum label. Existing Active remains Showing; no historical rows are reclassified. Seven repository regression cases cover every stage roundtrip, assigned-agent scoping, and the existing conversation Offer path. Targeted 7/7 and backend full 202/202 tests passed using mocked database calls. Live enum SQL application and real reload verification remain pending; no live lead was modified. Apply docs/database/p2-review/crm-offer.sql manually before using the new direct-lead Offer write path. Keep the enum label on rollback; old application versions would misclassify Offer on read.

CRM SQL applied manually by the user on 2026-10-27. A zero-row leads query filtered by lifecycle_status=Offer returned 200, confirming enum acceptance. Live Agent write/reload verification remains pending; no lead records modified.

CRM live verification completed on 2026-10-27. The original Nimesha conversation lead survived Offer reload and was restored to Closed (database verified). User authorized one dummy direct lead, 2028345e-f380-4977-a511-9f440712b97b, named TEST — CRM Offer verification. Created through createViewingLead; changed through authenticated Agent CRM UI to Offer; exact database row returned lifecycle_status Offer; browser reload retained Offer. Restored dummy to New and verified database value. Test record remains; no email/message sent. Evidence: docs/evidence/crm-direct-offer-reload.png. CRM Offer phase complete; read receipts and checkout fee lock remain design-only.

### Recipient-specific receipts implementation (2026-10-27)
User approved frozen historical read_at baseline for pre-migration messages. New recipient_receipts marker distinguishes existing false versus insert default true. Read endpoint upserts only authenticated viewer receipts for delivered incoming messages; duplicate reads preserve first timestamp. Shared read_at is no longer mutated. List and navbar unread counts use per-viewer state; sender Read label uses named counterpart only, never arbitrary admin. All-message unread scans paginate to avoid hiding older unread behind read rows; regression covers this. Independent review found this pagination blocker and it was fixed. Backend 211/211 and frontend 38/38 passed. SQL and live verification pending; do not restart backend until message-receipts.sql commits. Legacy rollback loses new receipt state in old application counts, so retain receipt table and avoid blind rollback.

User confirmed receipt SQL applied manually on 2026-10-27. Zero-row reads of messages(id,recipient_receipts) and message_receipts(message_id,user_id,read_at) both returned HTTP 200. Latest backend restarted on port 5000 after migration. Live isolation verification pending explicit test-message authorization.

### Recipient receipts live verification complete (2026-10-27)
User explicitly authorized one message in Mark-Nimesha conversation. Sent through authenticated Agent CRM UI: TEST — Recipient receipt verification; no reply required. Message ID 4ea9ee66-e858-4267-8bdc-79a0a9eaeb54; database default recipient_receipts=true verified. Live repository read operations using actual Admin and Buyer IDs verified: Admin receipt recorded, Buyer remained unread and unread query included test, sender recipient_read_at stayed null. Buyer receipt then cleared only Buyer unread; sender recipient_read_at populated. Repeated Buyer read retained first timestamp and exactly one Buyer receipt. Shared messages.read_at untouched. Authenticated sender Messages UI rendered Read for this test. Admin/Buyer operations were verified through repository/database, not separate browser sessions; controller auth/isolation covered by tests. Evidence: docs/evidence/recipient-receipt-read-verified.png. One test message remains, no email sent. Recipient-specific receipt phase complete; checkout fee lock remains pending.

### Checkout fee lock implementation ready (2026-10-27)
User approved locked orders, atomic settlement, paid legacy ACK and unpaid legacy reconciliation. Implemented server fee ownership checks, reusable 30-minute orders, locked checkout response consumed by frontend, signature/merchant/amount/currency/mode validation, service-role invoker settlement RPC, unique provider/order transaction guards, unchanged moderation state and durable leased receipt queue. Client completion now only reads payment status, including sandbox. SMTP errors propagate for receipt retry. Persistent worker and protected daily Vercel cron configuration added; deployed CRON_SECRET required, no actual env/deployment change. Independent review initially found swallowed SMTP failure and absent serverless retry; both corrected; re-review found no remaining blocker. Final backend 232/232, frontend 40/40, targeted lint and production build passed (build rerun alone with RAYON_NUM_THREADS=1 after resource contention). SQL execution still pending user manual apply; local Docker daemon unavailable. Run payment-orders.sql then rollback-only payment-orders-verify.sql before backend restart. No real or simulated paid database record, gateway payment or email created during implementation.

Checkout SQL application confirmed by user. Verification initially stopped before any writes because all 14 listings were Paid. User explicitly approved temporary use of an existing Paid listing inside the rollback-only test. Updated payment-orders-verify.sql to prefer unpaid otherwise reset one owned Paid listing only inside its transaction, preserve moderation, and rollback all test changes. Final SELECT exposes PASS after rollback. Manual rerun and runtime activation still pending.

### Checkout database verification and local activation complete (2026-10-27)
User ran updated rollback-only SQL and reported PASS: checkout checks completed; all test writes rolled back. Independent read-only checks afterward: payment_orders=0, payment_receipt_outbox=0, linked transactions=0; all 14 listings remain Paid. Restarted latest backend on port 5000. Payment config HTTP200, fee500.00 LKR, sandbox=true; health200; unauthenticated checkout401; receipt retry endpoint503 because actual CRON_SECRET is not configured (fail closed). Local persistent retry worker active. Vercel activation requires host CRON_SECRET; real env files unchanged. No real gateway payment or receipt email performed. All P1/P2 code phases now implemented and listed database migrations applied manually; real PayHere end-to-end payment and deployed cron remain outside this verification.
