# Checkout completion implementation plan

> Use subagent-driven-development for the independent hook change and focused review. Owner retains staging/commit/push. Continue in the existing version-3.0 workspace as previously agreed.

**Goal:** Complete the remaining Phase 5 checkout acceptance cases against the isolated local stack, with fixture preservation.

**Architecture:** Retain the approved actual hook/API/RPC harness and scoped callback bridge. Add separate public callback configuration; strengthen exact crash recovery without weakening identity checks.

**Tech stack:** Existing Node/Jest/pg, React/Vitest/Vite, retained Docker DB/REST, PayHere sandbox and ngrok. No new dependencies.

## Constraints

No hosted writes, real payments/card/contact data, SMTP/worker activation, schema/dependency/actual .env changes, broad cleanup or git mutations. Private journals remain under untracked docs/evidence. Heavy checks sequentially. User enters sandbox card details.

## Task 1: Public callback setting

- [x] Extend actual hook regression tests for explicit HTTPS VITE_PAYHERE_NOTIFY_URL precedence, invalid explicit URLs rejected before order creation, and existing fallback; run red.
- [x] Implement the smallest hook change, document setting in README; run focused green/lint and obtain focused spec/quality review.

## Task 2: Exact fixture recovery

- [x] Inspect journals without printing credentials and verify exact retained DB/REST identity and local bindings.
- [x] Test recovery validation for baseline table/hash completeness, exact run/user/property identities, seller bcrypt password verification and same-run optional created-property journal; run red.
- [x] Refactor validation into a testable recovery helper and require eleven baseline hashes for completion recovery. Keep all deletes in a transaction and compare snapshots/ledger before commit. Preserve original journals.
- [x] Run reviewed recovery against local stack; require exact cleanup and full baseline PASS before new fixtures.

## Task 3: Harness callback diagnosis

- [x] Trace actual response registration and callback method/path/order/merchant without printing callback secrets.
- [x] Cover a reproduced guard/registration defect with failing test; fix minimally, preserving strict scoped ingress and real signature validation. Wire isolated Vite to explicit callback setting.
- [x] Obtain focused review, run real API profile twice, verify ngrok sentinel and start fresh minimal browser fixture.

## Task 4: Gateway and closeout

- [x] Observe actual sandbox Visa/Mastercard success, cancellation and documented decline with user card entry. Verify authentic callback and DB settlement state; no completion from onCompleted alone.
- [x] Stop listeners; exact owned cleanup, eleven complete snapshots and canonical ledger must match. Stop retained test services.
- [x] Run final backend/frontend aggregates, lint/build sequentially after changes. Record exact results and limits, review final diff and update checkpoints. Do not mark Phase 5 complete if a required case remains blocked.
