# Payment UI configuration, quoted fee and callback ownership

Status: owner approved and implemented2026-11-04. Focused tests, fresh lint and
independent review passed; full frontend401/401 across57 files, fresh lint/build
also passed. Real provider/browser acceptance remains separate.

## Confirmed evidence

An offline VM ran the actual usePayhere source with synthetic hooks, API responses,
SDK callbacks and timers. A rejected payment-config read left displayedFee500.00;
the separately confirmed checkout then started with locked amount750.00. Calling
the SDK error callback echoed a synthetic private provider marker into the user
message and scheduled navigation. No real environment, account, provider, charge,
database or browser was used. This is a display/error-handling proof, not evidence
that the server accepts a client-chosen amount or that a payment was made.

Source tracing additionally found MyProperties hardcodes 'Pay Rs.500'. Review
uses paymentConfig.listingFee ||500; the hook also fabricates a merchant fallback.
Callback functions and navigation timers lack lifetime/attempt guards. Existing
tests intentionally invoke dismissal then error on the same attempt and observe
two messages/navigations. onCompleted ignores its order-ID argument. The form
retains a confirmed draft ID, but saving/loading and retry states need coordinated
guards to avoid disabled retries or duplicate creates around pending responses.

The backend checkout path already locks server-owned terms, checks current owner,
and reuses an unexpired compatible pending order. Its signed webhook/settlement
remains the authority. This batch changes only the frontend boundary.

## Options

Recommended: one coherent correction for truthful loaded fees, explicit review of
a changed locked quote, fixed SDK errors and owned asynchronous checkout lifetime.
This addresses both AddProperty and MyProperties through their shared hook.

Only changing displayed text leaves fabricated fallback/config and stale callbacks.
Rebuilding checkout/provider/backend transactions would expand the scope without
being necessary for these confirmed frontend gaps. Keep that work separate.

## Configuration and UI contract

Replace fabricated config with explicit loading/ready/error states. Validate
positive canonical LKR fee using the established0.01..9999999999.99 range,
bounded nonempty public merchant ID, currencyLKR and a genuine boolean sandbox
flag before ready. Reject malformed responses and avoid defaults for errors or
missing required values. Provide an explicit retry action. Guard/abort config
loads on unmount and prevent stale load responses from becoming current.
Bound config requests at10s; timeout is an error state with explicit retry.

Review and MyProperties show only the loaded fee or a current property-specific
locked quote. Loading/error states display no guessed amount and disable payment
actions; error offers Retry payment configuration. Keep other page functionality
available. Expose test/live mode accurately from the validated configuration.
Remove fixed500 labels and the unverified regulatory-approval claim from this
payment summary; use plain 'Pay securely with PayHere' text. Preserve existing
layout/styles and approved gateway control policy.

## Initiation and changed fee review

Payment actions pass the amount currently displayed for the selected property to
the hook as the expected amount. Guard configuration readiness, mounted lifetime,
valid expected amount and SDK availability before order initiation. Require a
confirmed server checkout with the requested property UUID, order UUID, positive
canonical amount, currencyLKR, bounded merchant ID,32-hex hash and boolean mode.
No hash/secret generation or verification in the client. Merchant/mode changes
against loaded config fail with a fixed refresh instruction.

When the locked amount differs from the displayed/expected amount, retain a quote
bound to that property and update the visible price with an informational review
message. Do not open PayHere. Require another explicit payment click with the
now-displayed quote amount. A later server mismatch repeats review. Querying a
quote may create/reuse a pending order but does not initiate a charge. Preserve
server order/hash/amount values unchanged when starting the SDK. Bound hash
requests at15s with cancellation on unmount. Timeout/abort may leave a pending
order committed; report an unconfirmed outcome and require explicit retry rather
than claiming rollback or automatically creating another order.

Keep confirmed draft IDs across retries. Coordinate form saving and checkout busy
state, including a synchronous duplicate-submit guard before the first create.
Always release form-saving state after the create/initiation attempt settles;
SDK-active state independently disables payment actions until a terminal outcome.
No ready config means no draft create or hash request through these payment
buttons. Do not introduce a new standalone Save Draft feature. Retrying after a
confirmed draft save reuses that draft rather than creating another listing.
Uncertain initial property-create outcomes remain a separate durable recovery
problem; no automatic create retry/rollback or idempotency guarantee is added.

## Callback and timer ownership

Use a synchronous attempt token and one shared active SDK owner across hook
instances, preventing overlapping popup launches. Capture the SDK object and
installed callback identities. Only mounted/current owned attempts may update
state, make advisory/status requests or schedule navigation. A completed callback
must match its confirmed order ID. Consume only the first valid terminal callback;
repeated completion/dismissal/error cannot overwrite it or navigate again.

Bound advisory/status requests at5s/10s respectively and cancel on unmount.
Recheck ownership after asynchronous advisory/status operations. Only an observed
server Paid property response produces success; checkout completion by itself
remains informational. Dismissal is informational, error text is fixed and never
interpolates arbitrary SDK data. Use fixed existing/new allowlisted log events
without raw errors. Preserve owner dashboard destinations for legitimate outcomes.
Clear timers on unmount/new attempt and suppress late timer navigation. Release
shared ownership and remove/neutralize only callbacks still belonging to the
captured attempt; never erase handlers installed by another owner. Release locks
on failed initiation and terminal outcomes without pretending payment rollback.

The SDK exposes global callbacks, and error/dismissal do not carry order identity.
Captured callback ownership and single-active-attempt guards are bounded controls;
they cannot prove the identity of every delayed event from third-party SDK code.
Actual provider/browser acceptance remains required.

## Sources, verification and limits

Consulted official [PayHere JavaScript SDK guidance](https://support.payhere.lk/api-%26-mobile-sdk/javascript-sdk):
completion is not proof of successful payment, the completion callback provides
an order ID, and hashes belong on the server. Existing signed backend settlement
is preserved. The initially tried older checkout documentation URL was inaccessible;
the current official SDK page was found and read. No real SDK was executed.

Red tests first: loading/failed/malformed config/no invented fee; retry/stale load;
invalid order fields; wrong-property/order callbacks; changed quote requiring a
second click; no duplicate draft/order popup starts; SDK absence; fixed private-
marker-free messages; first-terminal-only and unmount/late status/timer behavior;
two hook instances/shared ownership and foreign-handler preservation. Retain
locked terms, fresh server Paid status and confirmed-draft retry assertions.
Update obsolete fallback/duplicate-terminal tests intentionally rather than
weakening the new contract. Test actual hook/form/page paths with mocked APIs/SDK.

Likely files: hooks/usePayhere.js, a focused utils/paymentUiBoundary.js,
hooks/usePropertyForm.js, pages/AddProperty.jsx, pages/MyProperties.jsx,
components/property/create/ReviewPublishStep.jsx and utils/clientLog.js allowlist;
associated hook/form/review/MyProperties tests. Keep responsibilities small.
Run focused/full frontend tests, lint/build sequentially and independent review.
Backend source unchanged; retain its prior1320/1320 evidence without a fresh-run
claim. Frontend347/347 is the baseline before this new design.

No real account/provider/payment, schema/env/credential/infra/dependency change,
Git staging/commit/push or deployment. Owner-deferred password changes remain
excluded. Provider customer-contact placeholders/billing-data policy, actual
provider/domain configuration, durable ambiguous commits, backend settlement and
existing order history are outside this batch. Seven major packages remain.
