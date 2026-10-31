# Phase 5 checkout completion addendum

## Objective and inherited authorization

The owner requested completion of Phase 5 on 2026-10-31, resuming the deferred checkout batch. Retain the approved isolated local database, actual payment handlers/hook, existing PayHere sandbox credentials and scoped ngrok ingress. The owner retains git operations and sandbox card entry. No hosted writes, real payments, SMTP delivery, worker activation or normal environment changes.

## Current evidence

The normal app derives notify_url from VITE_API_URL, which was observed as localhost:5000. PayHere cannot deliver server notifications there. The earlier isolated browser bridge separately returned 404 for an actual provider callback; its rejected-request reason and order registration still need diagnosis. Interrupted seller-session cleanup has not passed its eleven-table baseline comparison. Docker's engine pipe is currently absent.

## Recommended implementation

1. Preserve the current private journals. Inspect and recover only their exact disposable users/properties/orders in the identity-checked local database. Require persisted baseline hashes before committing recovery. Validate seller-mode bcrypt identity against the separately retained temporary password; never accept an arbitrary bcrypt hash. Account for the separate created-property journal only when its run matches. Refuse uncertainty and roll back.
2. Add an optional complete public callback URL setting, VITE_PAYHERE_NOTIFY_URL, to the actual hook. An explicit value must be HTTPS without credentials or fragment; reject malformed values before creating a payment order. When absent retain the existing API-derived destination for compatibility. Document that local gateway testing needs a reachable public setting. Keep merchant terms and signature/settlement authority on the server. Do not edit actual .env files.
3. Keep the existing minimal checkout page for the four required gateway cases. Diagnose bridge refusals using sanitized booleans for method/path/order/merchant checks; do not weaken known-order or signature validation. Verify the registration path with an actual API response, fixing only a reproduced defect. Point the isolated Vite setting at its random scoped callback URL.
4. Run Visa success, Mastercard success, cancellation and official documented decline through PayHere sandbox after network, Docker and ngrok are available. Require authentic signed callback and exact local order/property/transaction/outbox state for success. Keep cancellation/decline unpaid. Do not replay callbacks whose fixtures were removed. Seller wizard/photo work is not required to repeat these already-approved checkout cases; its unfinished mode remains explicitly outside any claimed verified seller-wizard scope.
5. Close listeners, remove only run-owned fixtures, compare all eleven table baselines and migration ledger, and stop retained test services. Record results and remaining limits accurately.

## Alternatives considered

Changing VITE_API_URL to ngrok couples browser API access and callback routing and exposes more routes than needed. Using the normal hosted app would write to user data. The separate callback setting plus existing scoped harness preserves the approved boundary with the smallest product change.

## Verification and completion

Write regression tests before callback/recovery changes and observe meaningful failures. Cover explicit public callback precedence over localhost API, invalid explicit URL refusal, compatible fallback, exact recovery ownership/password/journal checks, bridge rejection and actual response registration. Run focused checks sequentially, then required backend/frontend aggregates, lint and build once after final changes. Run the real checkout API profile twice when the stack is available. Reuse prior completed flow evidence without unjustified reruns.

Phase 5 may be marked complete only after all agreed gateway cases, fixture preservation and final review pass. Network/engine unavailability is a blocker, not a passing result. Latest remote CI remains a separate check requiring connectivity.

## Review status

Self-review: implementation is limited to the diagnosed callback defect, exact recovery, guarded harness and completion evidence. No schema/dependency/payment-term changes. Owner explicitly approved this design on 2026-10-31 before implementation.
