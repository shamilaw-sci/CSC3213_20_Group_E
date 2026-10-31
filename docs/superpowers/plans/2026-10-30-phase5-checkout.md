# Phase5 Checkout Implementation Plan

> Use subagent-driven-development for routine tests and a focused review of this bounded checkout deliverable. Owner retains staging/commit/push.

**Goal:** Verify locked checkout and real sandbox webhook settlement while preserving isolated DB baseline.

**Architecture:** Fixed automated profile with dummy signing terms;separately guarded manual browser fixture using existing sandbox credentials/ngrok and actual usePayhere. No normal backend/env/tunnel changes.

**Tech Stack:** Installed Node/Jest/Supertest/pg/Supabase JS/React/Vite/Vitest,PayHere sandbox SDK,existing ngrok.

## Constraints

Checkout only;no real money/cards/user contacts,hosted DB writes,real email/worker/Storage/deps/schema/env changes or git mutations. Existing profiles/port5000 outbound ban unchanged. Eleven full snapshots/ledger including platform_settings. Exact own fixtures only. Heavy tests sequentially;focused iterations and final aggregates once. UI uses existing approved test destination/data;no sandbox keys/domains/settings changed.

### Task1: Automated checkout and hook coverage

**Files:** Extend integration/run-local.cjs,database-state.cjs,tests/integrationState.test.js;create integration/run-checkout.cjs,checkout.jest.config.cjs,checkout.setup.cjs,checkout.integration.cjs. Extend frontend-react/src/hooks/usePayhere.test.jsx only for missing cases. No production changes unless an actual reproduced defect is reported.

- [ ] Write platform_settings snapshot guard first;observe unsupported-table red,then add id mapping and fixed checkout profile with eleven tables.
- [ ] Setup fixed dummy sandbox merchant/secret;mock only receipt drain/start and email boundary,retaining real app/auth/orders/SQL. No gateway network. Fixture fee reads existing platform_settings/fallback500 without mutation.
- [ ] Real sessions and exact-owned properties/orders;assert locked fee/terms ignore client overrides,role/ownership rejection,reuse/concurrent creation,advisory confirmation,invalid signatures/merchant/currency/amount/mode/paymentID,ignored statuses,valid form success,replay/concurrent idempotence and reused provider-ID conflict rollback.
- [ ] Verify exact property/order/transaction/outbox state throughout;cleanup own children before properties/users after failure too;parent eleven full snapshots/ledger must match. Direct config refuses without launcher.
- [ ] Review existing hook tests first;add only missing cancellation/error/awaiting-versus-Paid/invalid locked response/role navigation assertions. Keep actual hook with SDK/API boundaries mocked. Focused tests only;parent coordinates heavy runs.

### Task2: Browser harness with actual sandbox

**Files:** Create integration/run-checkout-browser.cjs,checkout-browser.cjs and focused guard helpers/tests as needed;private session artifacts in docs/evidence only. Do not modify production hook/API/UI/env for harness convenience.

- [ ] Verify DB/API/marker/checksums/ledger and existing tunnel exactHTTPS→localhost5000;reject occupied5000/5173 and wrong target. Pass only verified local DB credentials and existing merchant credentials to child;force sandbox/dotenv off/mail+worker disabled.
- [ ] Keep eleven-table snapshot;seed generated seller/agent/known properties. Private API allows only own checkout/config/confirm/property reads with real middleware. Public5000 ingress permits random-path health and POST/urlencoded known-order callbacks only;no full-app exposure. Require fresh health sentinel through ngrok before payments.
- [ ] Local Vite virtual page reuses actual usePayhere and PayHere SDK,with test auth/local API adapters. Set only notify_url to random-path ngrok base;no server secrets in client. Export sanitized status/callback evidence and a stop/cleanup control;keep service key/merchant secret in memory only.
- [ ] Focused security review before startup. Use observed official sandbox Visa/Mastercard successes,cancel and decline in browser;require real webhook/DB status and capture outcome screenshots. Do not treat frontend completion alone as success. No new credentials/settings or real transactions.
- [ ] Stop ingress/listeners and exact own fixtures;compare full baseline/ledger. Retain interrupted fixture IDs/control information privately for recovery. Do not alter existing user processes/tunnel.

### Task3: Final verification/checkpoint

- [ ] Run real automated profile twice;focused hook tests;backend aggregate once after final changes;frontend aggregate/lint/build once if frontend tests changed. No unrelated profile reruns without cause.
- [ ] Record actual browser/API results,limitations,failures and reviewer findings in docs/phase5-checkout.md;update integration README and concise phase5-checkpoint.md. Do not mark completion if manual sandbox requirements remain unverified.
- [ ] Stop only test DB/REST,verify retained resources;secret/whitespace scan including tracked edits,index empty. No staging/commit/push/deploy.
