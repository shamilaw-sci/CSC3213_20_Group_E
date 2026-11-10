# Platform settings integrity and truthful Admin controls

Status: owner approved and implemented2026-11-04. Backend1297/1297 and frontend
323/323 passed; later report batch aggregate verification is recorded separately.

## Evidence and objective

Offline VM probes of actual code with synthetic database results confirmed:

- Numeric0 produces settings200 without any write.
- Negative fee, object and three-decimal fee produce settings200 and are passed
  for storage as -1, [object Object] and12.345; existing checkout formatMoney
  rejects each. Even a synthetic zero-row/unconfirmed upsert returns200.
- settingsRepository.getSettingValue returns fallback500.00 on a database error,
  so an unavailable fee can be presented/used as a guessed checkout price.

Source tracing found that SettingsPage sends many editable defaults but the
backend persists only listing_fee. The UI claims all parameters were saved and
committed to an audit trail. No audit write exists in this flow. Gateway mode
actually comes from PAYHERE_MODE, while the selector starts from a hardcoded live
default; moderation/session/category controls do not configure their enforcement.
Some additional fields are unused defaults only, not rendered active controls.
No real account, fee, database, environment value, charge or provider was used.

## Options

Recommended: repair the existing listing-fee read/write path and make the Admin
page expose only its functioning configuration. Preserve local theme selection.
Remove inactive settings editors and replace them with a short plain explanation
of what can be configured here. This avoids inventing policy/enforcement.

A backend-only validation fix leaves misleading security/gateway controls and
the UI audit claim. Implementing every displayed control would require separate
policy designs, authorization/enforcement and provider/deployment acceptance;
that is outside this bounded correction.

## Fee write contract

Keep router-wide protect/requireAdmin. PUT /admin/settings must have a plain
object body with listing_fee. Accept only finite numbers or bounded decimal
strings; trim strings, reject other types, empty/missing values, zero/negative,
exponents, NaN/infinity, excess precision and overlong input before any DB write.
Use existing paymentMoney.formatMoney for the positive decimal range and exact
two-decimal canonical form. Its current range0.01..9999999999.99 is retained;
this does not introduce free listings or a new price policy.

Allowlist only listing_fee for persistence. Additional body fields are ignored
for backward compatibility and are never treated as saved parameters. Upsert
the canonical value on existing setting_key uniqueness, select setting_key and
setting_value, and require a single matching key/value row. Zero/malformed/
mismatched rows and returned/thrown errors fail with fixed shared errors and no
success claim; unknown outcomes do not imply rollback. Return200 with
{message:'Listing fee saved.',settings:{listing_fee:canonicalValue}} only after
confirmation. No added audit-trail claim, arbitrary log data or automatic retry.

## Fee read and checkout contract

GET /admin/settings returns only the supported listing_fee in canonical form;
do not blindly expose all platform_settings rows. Distinguish a confirmed missing
row from a database error using maybeSingle. Preserve the established missing-row
default500.00. Errors or malformed existing values fail generically without
displaying a made-up fee or silently rewriting the stored value.

Apply the same missing-versus-error distinction in settingsRepository used by
payment config/checkout. An actual settings error must propagate to the existing
safe error handler and prevent order creation/hash issuance. Preserve the
current default only for a confirmed missing row. Existing invalid values still
fail the existing formatter. Current order amounts, settlement/signatures,
server-controlled gateway mode, receipt delivery and existing orders stay intact.

## Admin page behavior

Preserve the existing page/theme styles without a visual redesign. Keep the
working Light/Dark/System theme preference independent of fee saving. Show a
loading/error state and no invented fee before a successful settings response.
Use the returned canonical fee; retain the editable fee as a string so empty
input/decimal precision are not silently changed by Number coercion. Label the
input accessibly, constrain it to the existing range/precision and validate
before Save. Send only {listing_fee:draft}. Disable fee editing/saving while
loading or a save is pending; guard late responses on unmount and clean up any
feedback timer. A failed load leaves saving disabled and offers a retry.

Remove nonfunctional boost-fee/gateway-mode/moderation/session/category editors
and their fake defaults from this page. Explain concisely that only listing fee
and interface theme are configurable here, and gateway mode is managed
separately. Do not display an assumed effective gateway/limit/category value or
wire new controls to runtime behavior. On a confirmed save, set canonical state,
clear dirty state and show 'Listing fee saved.'; failure keeps the draft and
never shows success. Remove the nonexistent audit-trail promise. Never log raw
Axios responses/errors. No changes to actual upload/session/category policies.

## Verification and boundaries

Write meaningful red tests first: invalid fee/no writes, canonical valid values,
required matching upsert results, error/privacy and missing/default/error reads.
Use actual repository/controller logic with mocked boundaries and the installed
SDK with an injected fetch where query cardinality matters. Cover payment config
and checkout settings errors preventing order creation and success/hash responses.
Frontend tests cover load/retry, only-fee payload, invalid draft/no save,
pending/confirmed/failure states, inactive controls absent, independent theme
behavior, late response/unmount and no unsupported audit claim.

Run focused then full backend/frontend tests sequentially with approved memory
limits, frontend lint/build and independent bounded read-only review. Record
actual evidence/limits; no phase-completion or production acceptance assertion.
No schema/env/credential/infra changes, real accounts/providers/payments,
dependency installation/upgrades, Git stage/commit/push or deployment.

CSV export findings from the same audit are recorded separately; CSV behavior
does not change under this settings scope. Seven major packages remain.
