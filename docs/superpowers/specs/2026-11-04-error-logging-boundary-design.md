# Shared error and request-log privacy boundary

Status: owner approved and implemented2026-11-04; scoped backend verification and
review passed. Wider controller/proxy/collector logging remains open.

## Source and offline evidence

Actual global errorHandler was evaluated in a VM with production NODE_ENV and
synthetic exceptions. Ordinary errors produced generic500 but logged the private
marker; an error with statusCode503 exposed the marker in both response and logs;
an unknown Multer error exposed it in400 and logs. Actual request-logger source
logged a synthetic token query parameter from originalUrl. No app startup, dotenv,
real logs, credentials, accounts, database or network was used.

Reset-link generation also places a token in the frontend query string. This is
not evidence that actual edge/proxy logs captured a real token; edge log policy
needs separate verification. Other controllers/middleware still log/return raw
details directly and are outside closure of this shared-boundary batch.

## Options

- Recommended: safe shared error mapping and structured request/error logs with
  static route templates, plus explicitly owned public application errors.
- Remove query strings only: useful but leaves raw errors and path identifiers.
- Replace logging throughout all controllers/proxies in one batch: larger
  contract/observability scope; assess and fix those independently afterward.

## Proposed behavior

Use a small public-error helper with an internal fixed code/status/message table.
Keep ownership metadata in a WeakMap, so external error.statusCode/message/code
cannot authorize a public message. Migrate the known AI unavailable503 error to
that helper, preserving its current safe client message. Existing social403 paths
return directly and must retain behavior; do not rewrite unrelated controllers.

The global handler sends generic500 for unrecognized failures. Recognized Multer
limit/type and body-parser invalid-JSON/oversized-body cases get fixed400/413
messages without filenames, MIME/field values or excerpts. Recognized internal
public errors use helper-owned status/message. Never trust arbitrary statusCode
or forward error.message/stack/cause. Keep response message and stack:null fields
for compatibility, including development mode; document this deliberate privacy
change. Existing useful validation route responses remain outside this handler.

Replace originalUrl logging with fixed event, allowlisted/bounded method,
static Express route template (or unmatched), integer HTTP status and nonnegative
latency. Do not record actual URL/path identifiers, query, headers, cookies, body,
provider details or error stack/message. Use the same safe request context in
global error events plus a fixed classification code. Preserve routine health
success-log suppression and failure status logging; no new endpoint or secret.

No new dependency, external logging service, telemetry delivery, schema/env or
infra change. This removes sensitive diagnostics from these shared paths; it
does not establish end-to-end logging clearance or replace an operator-approved
private diagnostic strategy. Per-controller/validator/proxy logs remain open.

## Verification

Test-first production/development error mapping with private marker assertions:
unknown errors/status codes, parser/Multer cases, internally owned versus forged
public errors, safe AI503 compatibility and absent raw logs/stack. HTTP tests
verify query/path/header/body markers never appear in shared logs, unmatched
routes stay generic and normal middleware behavior remains. Preserve existing
session/authorization/health/AI regressions. Run focused/full backend and scoped
independent review. No frontend rerun unless a consuming contract changes.

Owner retains Git/CI/release. No real request/provider/logging account/DB or
Docker operation. Tests cannot establish deployed proxy/collector retention or
access policy; those remain acceptance work.

## Evidence

Seven regressions red7/7 before implementation, then focused84/84 with existing
AI tests. Five actual loopback HTTP cases and full backend1198/1198 across81 suites
(23.025s) passed. Independent review no actionable P1/P2. No dependency/env/DB/
provider/Docker/telemetry/Git/deploy operation. Frontend not rerun for backend-only
shared behavior. [Contract and residual scope](../../phase7-error-logging.md).
