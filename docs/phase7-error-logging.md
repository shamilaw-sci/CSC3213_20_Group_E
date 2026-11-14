# Shared errors and request logs — 2026-11-04

Owner-approved shared-boundary change implemented. Request logs now use a fixed
event, allowlisted method, static Express route template or unmatched, HTTP status
and nonnegative latency. They omit actual URL/path IDs, query, headers, cookies
and body. Successful liveness/readiness logs remain suppressed; failures retain
status logging. Global errors log fixed classification plus the same safe context.

Unknown exceptions return generic500 with stack:null in every environment.
Parser invalid-JSON/oversized-body and upload limit/type errors return fixed
400/413 messages without excerpts, file/MIME/field values or raw error details.
Other controller responses that bypass this handler are unchanged.

Public application errors require WeakMap-owned fixed metadata. Arbitrary
statusCode/message/code fields and cloned errors cannot authorize a public
message; mutation of owned instance fields cannot change its registered response.
AI unavailable retains503 and its existing safe message. This intentionally
changes shared upload/parser/unknown-status error texts and removes development
stack output; clients should use status/message rather than private exception
details. No new logging service or external telemetry was added.

Seven privacy regressions failed before implementation, then focused84/84 with
existing AI cases passed. Five real loopback HTTP cases verified route-template
logging, unmatched request privacy, health suppression, owned-versus-forged errors,
and actual JSON parser/size failures. Full backend1198/1198 across81 suites passed
(23.025s). Independent scoped review found no actionable P1/P2. Syntax/whitespace
and empty-index checks recorded; no staging/commit/push/deployment.

This is shared-boundary acceptance only. Controller-specific logs/responses,
shared validator fallback messages, frontend/proxy/collector logs, retention and
access policy remain open. No real logs/accounts/DB/provider/Docker/env/dependency
operations or frontend rerun; frontend remains305/305 from its last affected
batch. Existing images predate this code; owner CI/build/release adoption is
required. No whole-phase privacy/security clearance.
