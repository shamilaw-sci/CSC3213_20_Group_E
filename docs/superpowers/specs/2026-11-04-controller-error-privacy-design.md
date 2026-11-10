# Controller and service error privacy

Status: owner approved and implemented2026-11-04. Scoped tests/review passed;
broader policy and release gates remain open.

## Confirmed evidence

Offline VM probes of actual source confirmed:

- Shared validator's non-Zod catch returned a synthetic private exception marker.
- Analytics passed a raw synthetic Error object to console.error. An initial
  JSON-only capture hid Error.message; inspecting captured error fields confirmed
  the marker. No real log was accessed.
- Real Google controller logic with valid synthetic claims and a synthetic
  repository error/statusCode403 returned403 and the private marker. Provider and
  database boundaries were mocked; this is not a demonstrated real-provider or
  account takeover. The same unowned-status catch pattern exists in Apple/Facebook.

Source scan also found raw error logs in auth/social mail catches, analytics,
Admin listing/user handlers, property metadata parsing, saved-search alerts,
payment callback/receipt queue, agent/property repositories and email service.
Email success logs contain recipient, subject and SMTP response. Historical
feasibility/saved-search/favorites fallback messages expose schema/setup details.
No real SMTP/payment/provider call, environment values, database or account used.

## Options

- Recommended: one bounded batch fixing the observed direct-response/logging
  sites with regression markers, preserving business and recovery behavior.
- Validator/social only: closes those responses but leaves observed raw service
  errors and recipient/SMTP logging untouched.
- Global arbitrary-object log scrubber: risks losing intended recovery context
  and cannot reliably identify every secret string. Do not claim that as a cure.

## Proposed changes

Extend existing fixed public-error ownership metadata with account-banned and
social-link-conflict codes. Construct those errors only in the current trusted
account checks. Social catches return403 only for those owned codes and their
fixed messages; unowned/provider/repository statusCode403 follows the existing
generic provider401 failure path. Preserve bans, subject identity, collision
rules, claim validation, signup role and session issuance semantics.

Shared validator keeps its structured Zod issue responses/coercion/merge behavior;
unexpected parser exceptions return a fixed400 without exception.message or stack.
Historical schema-specific endpoint messages become fixed user-facing messages
without relation/column/migration paths. Preserve existing status codes and empty
fallback collections; availability/fallback policy remains a separate review.

Replace raw error arguments/messages at the explicitly observed sites with fixed
operation events and only necessary bounded context. New context may include
verified UUID operation/property/order IDs or fixed stages/counts, not arbitrary
error code/message/details/stack, request/body/metadata, recipient, subject,
password/token/URL or SMTP response. Preserve already-reviewed bounded recovery
events and their semantics. Email success becomes a generic sent event; delivery
errors remain propagated when strict=true. A legacy Error-instance fallback in
the logger may emit fixed classification only, not message/stack; this is not
arbitrary metadata redaction or end-to-end privacy clearance.

Exact scope: controllers/authController.js, socialAuthController.js,
analyticsController.js, admin/adminListingController.js, admin/adminUserController.js,
property/propertyWriteController.js, savedSearchController.js, paymentController.js,
inquiryController.js, feasibilityController.js, favoritesController.js;
repositories/agentRepository.js and propertyRepository.js;
utils/emailService.js, paymentReceiptQueue.js, logger.js, publicError.js;
middleware/validate.js. Change only the described privacy/error presentation sites.

No query/role/payment-signature/settlement transition, write order, actual retry,
optional-versus-required failure or delivery scheduling change. Keep payment
conflict/retry status decisions based on existing internal codes; do not log the
original exception or weaken failed delivery propagation. Keep Admin fire-and-
forget alerts from failing listing approval. No auto email/provider activation.

## Verification and boundaries

Test-first synthetic private markers in returned/thrown failures and email success
metadata, asserting absence from captured console/logger/client responses. Social
tests distinguish owned bans/link conflicts from forged/unowned403 for all three
providers, including unchanged session/no-write restrictions. Validator tests
preserve Zod shapes and suppress unexpected exceptions. Payment/mail tests retain
retry/strict/optional behavior and bounded recovery context. Update only legacy
schema/log text expectations intentionally changed by this design. Run focused/
full backend and independent scoped review; frontend only if source tracing finds
an exact-message consumer affected. External delivery and SDKs remain mocked.

No dependency install, real logs/SMTP/payment/provider/accounts/DB, schema/env,
Docker, staging/commit/push or deployment. Proxy/browser/collector policy,
retention/access controls, future log sites and other source findings remain
open. This batch does not close the entire Assessment or Acceptance package.

## Recorded evidence

Initial7 regressions red with46 baseline passes, then53 focused green. Forged
issues regression exposed a non-Zod exception path; actual ZodError checking
preserves structured issues and suppresses the unowned shape. Added strict/
optional mail, metadata, analytics and UUID context checks. First aggregate run
1208/1209 required updating a legacy raw-error-log expectation to the approved
UUID-only contract. Fresh full backend1210/1210 across82 suites (24.961s) passed;
independent review no actionable P1/P2. See [evidence and limits](../../phase7-controller-privacy.md).
No frontend exact-text consumer found; no frontend or fresh image run. No real
delivery/provider/DB/infra/Git/deploy operation or wider privacy closure claim.
