# Phase5 checkout API / hook implementation evidence

Task1 implementation is frozen for coordinated parent verification. No real PayHere traffic, production code, credentials, settings, schema, dependencies, or git state were changed by this task.

## Focused evidence

From `backend-node`:

- `node node_modules/jest/bin/jest.js tests/integrationState.test.js --runInBand --no-cache` before allowlist modification: exit 1; 1 failed / 12 passed. New platform_settings test failed with `Unsupported snapshot table.`
- Same command after adding only `platform_settings: 'id'`: exit 0; 13 passed.
- `node node_modules/jest/bin/jest.js --config integration/checkout.jest.config.cjs --runInBand --no-cache` without launcher: expected exit 1; `Verified integration launcher required.`, zero tests executed, no fixture writes.

From repository root, `node --check` on each of `backend-node/integration/checkout.integration.cjs`, `checkout.setup.cjs`, `checkout.jest.config.cjs`, `run-checkout.cjs`, and `run-local.cjs`: all exit 0.

## Scope and assertions

The fixed checkout launcher inherits stack-c identity, REST/DB cross-check, in-memory full snapshots and canonical ledger validation. Its eleven tables include complete platform_settings rows. It never updates listing_fee. Existing profiles and network policy remain unchanged, including port5000 prohibition. Shared setup refuses direct invocation and suppresses dotenv, SMTP/email and arbitrary sockets; checkout setup uses only dummy sandbox signing terms and a run-order-scoped receipt drain spy. The real outbox is retained without delivery.

Four real Express/auth/order/RPC test chains cover session login, missing authentication, fresh banned role, foreign seller/agent/buyer ownership, actual agent checkout, locked fee/merchant/mode/currency despite client overrides, signed checkout hash, pending reuse and concurrent creation, advisory confirmation, wrong order/owner, form notification signature failure and signed invalid terms, mode mismatch, ignored statuses, concurrent success and replay, exact Paid/pending listing state, one transaction/outbox, and provider-ID reuse rollback preserving both complete fixture states.

Cleanup recovers children through exact preallocated property/title and UUID/email owner pairs, including partial initialization; removes outbox, transactions, orders before properties/users; and asserts fixture absence. Parent snapshot/ledger comparison remains the final preservation authority.

Existing checkout unit tests were inspected and preserved. Existing hook tests were inspected before adding only missing cancellation/error, seller/agent navigation, Unpaid versus Paid status authority, and individual invalid locked-response cases. Actual usePayhere remains intact, with API/SDK boundaries mocked.

## Pending coordinated verification

Parent owns real profile twice, focused hook Vitest, and aggregate checks; none were run here. Commands to schedule sequentially:

- `node integration/run-checkout.cjs` from backend-node (twice).
- Existing frontend focused Vitest command targeting `src/hooks/usePayhere.test.jsx`.

No gateway delivery or browser evidence is claimed by this Task1 report. This is implementation plus focused guard/syntax evidence, not a declaration that Phase5 is complete.
