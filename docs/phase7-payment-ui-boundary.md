# Payment UI boundary —2026-11-04

Owner approved the concrete design. Prepared batch28 is implemented and verified:
full frontend401/401, fresh lint/build passed. No real payment/provider operation.

## Changed behavior

Payment configuration has explicit loading/ready/error states with no invented
fee, merchant or sandbox default. Canonical positive LKR amounts and explicit
merchant/currency/mode are required. Both Review and MyProperties use the loaded
fee or a quote tied to the selected property, show actual test/live mode, disable
payment when configuration is unavailable and offer an explicit retry. The fixed
500 payment labels and unverified regulatory claim are removed.

Initiation requires a mounted hook, current ready config, expected displayed
amount, valid property UUID and available SDK before hash requests. The server
response must match property UUID, valid order UUID, exact canonical amount,
32-hex hash, currency, merchant and mode. If its locked amount differs from the
displayed amount, retain a property-bound quote and require another explicit
click before opening PayHere. SDK parameters retain the validated server terms;
no secret/hash generation or payment settlement occurs in the client.

Config/hash/advisory/status requests have explicit10s/15s/5s/10s deadlines and
abort signals. A Promise race bounds noncooperative operations and consumes late
settlement/rejection. Config retry invalidates prior loads immediately; captured
initiation functions cannot keep using an invalidated config. Deadline/abort is
an unconfirmed outcome, never proof that an order write rolled back.

A shared SDK owner prevents overlapping initiation across hook instances. Per-
attempt identities, terminal guards, post-await checks and timer cleanup suppress
stale work. Completion must match its order UUID. Only an observed matching
server Paid property can produce success; completion alone stays informational.
Dismissal is informational, SDK errors fixed and marker-free. Cleanup neutralizes
only still-owned callbacks on the captured SDK object, preserving foreign handlers.
Owned terminal outcomes retain the SELLER/AGENT dashboard destinations.

The form has a synchronous submission guard, retained confirmed draft reference,
separate saving/SDK busy state and mounted checks. A second price-review click
reuses the saved draft. Settled create/initiation attempts release saving state;
active checkout independently disables payment. Unavailable config prevents draft
creation through these payment actions. No standalone Save Draft feature added.

## Verification

- Offline actual-source audit and synthetic proof in phase7-payment-ui-audit.md.
- Initial25 new hook tests failed against old readiness/lifecycle behavior; the
  new utility suite initially could not load before implementation.
- New core validation/deadline/lifecycle tests40/40 passed after implementation.
  Additional form/page/stale-config red run6failed/33passed, and Review2failed,
  then implemented. Older explicit-price argument expectations failed4 cases and
  were updated without dropping their multipart/WKT/draft-retry assertions.
- Focused87/87 across7 files passed. A further captured-submit-after-unmount test
  failed1/39passed and was fixed with an early mounted guard. Focused55/55 across
  utility/form/hook tests then passed, including deadline/late-result/wrong-property
  coverage. Actual form+real-payment-hook integration2/2 additionally passed:
  changed quote retains one draft and launches only on the second click; failed
  config creates no draft/hash/SDK call.
- Prior PayHere URL-override cases, explicit modes, locked terms and fresh server
  Paid status assertions remain. Obsolete assumed-sandbox/fallback-fee/multiple-
  terminal tests were changed to enforce the approved failure/ownership contract.
- First lint found no-control-regex in the merchant validator. Equivalent
  whitespace/control code-point checks preserve the validation without weakening
  lint; fresh full lint passed.
- Independent bounded read-only review and follow-up found no actionable P1/P2.
  Reviewer performed no edits/tests/external operations.
- First full frontend397passed/4failed plus4 associated render errors across57
  files (288.69s): an older MyProperties integration mock returned only
  triggerPayment, so the page could not read the new required config state.
  Updated that mock to the confirmed ready-config/quote/busy/retry interface;
  retained all deletion/moderation assertions. Focused MyProperties10/10 passed.
  A fresh full rerun then passed **401/401 across57 files,267.23s**, with no
  reported unhandled errors. Fresh lint and production build (2.94s) passed.
  Existing large-chunk/Lottie direct-eval warnings remain; no suppression or
  dependency upgrade performed.

## Sources and limits

Official [PayHere SDK documentation](https://support.payhere.lk/api-%26-mobile-sdk/javascript-sdk)
was consulted during design for order-ID completion and backend verification.
The existing signed webhook, locked order/hash, expiry/ownership and settlement
logic are unchanged. Backend1320/1320 is previous unchanged-source evidence,
not a fresh backend rerun. Baseline frontend347/347 predates this batch.

SDK global error/dismissal callbacks lack order identity; these bounded controls
cannot establish provenance of every delayed third-party SDK event. Actual
provider/domain/browser behavior, modal closure and user acceptance remain open.
Billing/contact placeholders were explicitly excluded pending product policy.
Unknown initial listing-create outcomes can still need durable reconciliation;
this batch adds no cross-reload queue, server idempotency or automatic retries.

No real accounts/provider/payment/mail/DB/Storage, schema/env/credential/infra or
dependency change, staging/commit/push/deployment. Password changes stay owner-
deferred. Earlier SQL/Node24 image evidence predates these changes. Whole-phase
release/security clearance and the seven remaining major packages are not claimed.
