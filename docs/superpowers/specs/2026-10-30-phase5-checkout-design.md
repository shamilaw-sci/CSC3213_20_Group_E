# Phase5 Checkout batch

Status: owner approved Checkout continuation and existing PayHere sandbox/ngrok use on2026-10-30. Existing merchant setup is retained;no new domain/key/account changes requested. One checkout batch only;owner controls git actions.

## Verified context and approach

Open portal is sandbox.payhere.lk with Sandbox Mode badge;merchant ID matches configured backend ID. Existing ngrok HTTPS tunnel forwards localhost5000;TCP5000/5173 currently have no listener. Normal backend .env targets hosted Supabase and must not be used for writes. Use existing verified stack-c DB/REST for all checkout records,with actual Express/controllers/repositories/RPCs. Keep normal app config and tunnel unchanged.

Three layers:real isolated API success/failure/replay tests;focused actual usePayhere hook tests;actual PayHere sandbox browser payments on an isolated harness using that production hook. Mock-only tests cannot establish DB atomicity/webhook delivery;using the normal hosted backend would violate isolation. No real money or real card/contact data. Official test Visa/Mastercard/decline data only.

## API automation

Fixed checkout profile uses dummy merchant/signing secret,sandbox mode and inert receipt-drain boundary;worker/email remain forbidden. Actual form-encoded notifications use valid/invalid signatures and real locked orders/settlement. Cover server-controlled fee/mode/merchant,owner/role checks,pending-order reuse/concurrency,browser advisory confirmation never paying,invalid/tampered terms,ignored pending/cancel/fail statuses,verified success,repeat/concurrent callback idempotence,reused provider ID conflict and no wrong-order changes. Preserve outbox generation but do not deliver it. Add platform_settings:id to the static snapshot allowlist with a test-first guard;preserve eleven full tables/ledger without altering the setting.

## Isolated browser fixture and public ingress

A parent launcher verifies local identity/API/ledger and derives local Supabase credentials in memory. Read only existing PayHere merchant ID/secret from backend.env;copy neither hosted DB settings nor SMTP credentials. Child NODE_ENV=test/dotenv suppression prevents normal listener/worker startup. Explicitly force sandbox mode. Capture/disable receipt delivery. Seed exact UUID/example.test seller/agent and image-free properties for Visa,Mastercard,cancel,decline.

Bind a private API listener to an ephemeral127.0.0.1 port,allowing only config/hash/confirm and exact fixture property reads. Use real authentication and checkout handlers. No register/admin/general CRUD exposure. A local Vite page renders actual usePayhere with test auth/API adapters and existing PayHere SDK. Browser API adapters talk only to this private listener;notify_url alone uses existing ngrok URL plus a random per-run callback path. No merchant secret/Supabase service key reaches browser bundles.

Port5000 bridge exposes only a random-path health sentinel and form POST callback for exact registered order IDs. Forward approved requests through actual Express validation/signature/settlement path;never expose full application routes. Register IDs only from actual owner checkout responses. Unknown paths/orders/methods refuse. Verify port ownership and ngrok routing using the unique health sentinel before any payment. If occupied/mismatched,fail closed without killing/reconfiguring existing processes. Existing test profiles retain their port5000 ban;new browser ingress does not authorize arbitrary outbound calls.

Browser uses test Visa/Mastercard successes,one cancellation and one documented decline,with real ngrok callback and DB state evidence. Treat onCompleted as advisory,not proof;require signed webhook plus Paid/order/transaction/outbox state and correlate sandbox merchant payment details. Test UI may show awaiting confirmation while webhook is delayed. No credentials saved in browser. Capture screenshots/results and sanitized callback summaries;secret/config/callback bodies stay private under untracked evidence. If the sandbox setup rejects existing credentials,report actual error rather than changing domains/keys unprompted.

## Preservation and completion

Keep full eleven-table baseline in memory. Cleanup exact-owned outbox/transactions/orders before own properties/users,with recovery by known owner IDs,then compare complete baseline/ledger. Close public bridge first,then private API/Vite and scoped fixtures;retain Docker resources and stop only test DB/REST. Keep an explicit stop command/fixture-ID recovery note if interrupted. No worker/SMTP/Storage/migration/dependency/live writes,staging,commit,push or deploy.

Run automated API profile twice,focused hook tests as justified,one backend aggregate and frontend aggregate/lint/build only if hook/test changes require them. One focused review including public ingress/isolation before manual browser server startup;fix findings with covering checks. Actual gateway/browser results are separate from local automation;do not mark Phase5 complete if required gateway checks remain blocked. Record exact failures and concrete checkpoint for resumption.
