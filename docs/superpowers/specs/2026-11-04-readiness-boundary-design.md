# Public readiness boundary

Status: owner approved and implemented2026-11-04. Backend verification and scoped
review passed; deployed readiness/monitor acceptance remains open.

## Evidence

Public GET /health/ready queries settings with an exact count and returns
error.message for both returned SDK errors and thrown exceptions. Its behavior
does not depend on NODE_ENV. The canonical schema defines platform_settings, not
settings; actual deployed schema/aliases were not inspected.

An offline VM loaded the exact registered readiness handler from server.js with
synthetic SDK responses. Both failure paths returned503 and exposed the synthetic
internal-host/schema marker. It selected count with count=exact/head=true from
settings. No dotenv, application startup, database, network or provider was used.
An initial diagnostic script syntax error was corrected before these results.

The installed postgrest-js transform builder supports abortSignal; this was
checked in local package source. Current readiness supplies no explicit deadline.
No actual stalled request or live information disclosure was attempted.

## Options

- Recommended: fixed canonical-table HEAD probe,5s transport abort, confirmed
  SDK success and one safe public failure shape. Keeps monitoring HTTP200/503.
- Sanitize response only: stops raw text but leaves schema mismatch and unbounded
  latency unresolved.
- Redesign global errors/health/monitor authorization together: broader contracts
  and rollout impact; defer to a separate audit/design.

## Proposed behavior

Extract a small readiness handler module for focused testing. Keep /health
liveness and existing Docker health checks unchanged. For readiness use the
existing backend Supabase client to HEAD-select id from platform_settings with
limit1, no exact count and no row/setting-value response. An empty table is
healthy if the query succeeds. No fallback to settings or broader privilege grant.
This checks one backend database permission/query path, not every dependency,
RLS identity, Storage, provider or business transaction.

Pass a real AbortController signal through the installed SDK's abortSignal API;
abort at5000ms, clear the timer on settlement and fail on an aborted signal even
if a transport resolves late. Do not replace global fetch. A timeout is not proof
of database disconnection; use the neutral public term unavailable.

Require a well-formed SDK result with error exactly null and integer2xx status
before ready200. Returned/thrown errors, timeout and malformed results produce
503 with status=unready, database=unavailable, error='Database readiness
unavailable.' and timestamp. No raw details, stack, host/schema/error code or
exception cause in response or new logs. Keep success status=ready,
database=connected, db_latency_ms and timestamp. Existing health request logging
already records method/path/status/latency; do not add per-probe raw-error logs.
Document this intentional failure-body change for external monitor consumers.

No caching, new rate limiter/authentication, schema/privilege/env/dependency change,
container startup, live account/DB/provider call or release. Public liveness
metrics and broader global/controller logging remain separately open.

## Verification and limits

Test-first handler/actual HTTP registration with mocked SDK boundary: exact
canonical table/projection/head/limit/no count, successful empty table, returned
and thrown sensitive errors, malformed result/status, no premature success,
real abort signal at5000ms, late resolution, timer cleanup and unchanged liveness.
Fake timers plus an abort-aware synthetic transport establish deadline behavior;
no real database reachability is inferred. Run focused/full backend regression
and independent scoped review. No frontend rerun for backend-only behavior unless
source tracing finds a consuming frontend contract.

Real deployed readiness and monitor compatibility stay release checks. Existing
profile/Node24 image evidence does not cover this new handler. Production schema,
credential containment, Storage privacy and whole-phase gates remain open.

## Implementation evidence

Extracted healthController factory registered in the actual server. Canonical
HEAD/id/limit1, abort plus response deadline, fixed failures and strict successful
SDK result checks implemented. Boundary11 red/3 baseline passes then14/14 green;
two loopback HTTP cases included in full backend1186/1186 across79 suites
(28.07s). Initial HTTP fixture failed transitive SDK construction; isolated with
a synthetic SDK factory while keeping config/dotenv external boundaries mocked.
No actual DB/provider call. Independent review no actionable P1/P2. Frontend/
Docker readiness consumers not found in searched paths; liveness unchanged.
See [monitor contract/evidence](../../phase7-readiness.md). No fresh image,
production, frontend or vulnerability clearance implied.
