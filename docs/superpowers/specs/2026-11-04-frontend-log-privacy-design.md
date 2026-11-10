# Frontend error-log privacy follow-up

Status: owner approved and implemented2026-11-04 after the broad Phase7
remediation instruction. Full frontend347/347, lint/build and independent review
passed; backend source unchanged. Wider acceptance remains separate.

## Evidence and purpose

The2026-11-04 production-source scan found direct error/response/message logging
in frontend auth contexts, Admin pages, property/payment/map hooks, agent/user
dashboards and property/map components. Admin API errors can include Axios config
with Authorization; form errors can include response/config/request context.
The current code passes those objects or uncontrolled exception messages to
console. No actual user token, browser log, collector or account was accessed;
external capture or exploitation is not demonstrated by source tracing.

The settings/report batches already avoid these raw logs in their changed flows.
This follow-up applies the same fixed-event privacy contract across the observed
frontend sites, preserving their existing state, request and error propagation.

## Options

Recommended: one small client-log boundary that accepts only allowlisted fixed
operation events and fixed error/warn levels; migrate observed production console
sites and enforce the boundary with existing ESLint. Unknown events/arguments map
to a fixed fallback, with no arbitrary values or metadata passed through.

Only replacing the observed string arguments would leave future raw-console
regressions easy. A general-purpose secret redactor cannot reliably recognize
every credential, URL, response, payload or personal string, and is not proposed.

## Proposed contract

Create a small frontend utility with fixed known operation-event definitions.
Expose error/warn helpers accepting an event name only. Do not serialize errors,
response/config/headers/body, session/user IDs, URLs, storage content or arbitrary
extra arguments. Unknown or nonstring event names become a fixed generic event.
Do not suppress application control flow or monkey-patch global console.

Migrate all direct production-source console.error/warn/log sites identified by
the scan to this boundary, including existing fixed-event sites where needed for
consistent enforcement. Preserve severity where meaningful. Existing diagnostics
are intentionally reduced to the operation classification; no success/error
messages sent to the user, retry policy, status handling, payment confirmation,
session/login/logout/storage behavior or API requests change in this batch.

Add a narrowly scoped existing-ESLint no-console rule for production src files,
excluding tests and this reviewed utility. Tests remain able to spy/capture
console without altering actual browser behavior. No new dependency or global
logging infrastructure is needed.

## Verification and limits

Red tests first for private marker-bearing errors/config/headers/body/URLs passed
as unexpected helper arguments/events, fixed known classifications/severity and
unknown fallback. Add representative actual-context/hook/component failure-path
checks proving that markers never reach captured log arguments while existing
logout/payment/form error outcomes remain unchanged. Run focused tests, full
frontend tests and lint/build sequentially, plus independent read-only review.
Existing backend1320/1320 remains the latest backend result for unchanged source.

Browser/devtools extensions, network panels, provider SDK logs, runtime third-party
code, collectors, retention/access policies and source-map policy remain separate.
This is not global redaction or end-to-end privacy clearance. No credential
rotation (owner-deferred), live account/provider/payment/DB/infra operation,
dependency change, Git stage/commit/push or deployment.
