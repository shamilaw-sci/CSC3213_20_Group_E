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

