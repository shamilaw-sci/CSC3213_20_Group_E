# Readiness response boundary — 2026-11-04

Owner-approved fix implemented. GET /health/ready uses a canonical
platform_settings HEAD-select id/limit1 without exact counts or returned rows.
An empty table may be ready. Explicit error=null and integer2xx SDK status are
required; malformed results fail closed.

Each request supplies a real AbortController signal to the installed SDK and a
five-second response deadline. Timeout aborts transport; late settlement cannot
turn the response into ready. Timers clear on settlement. Global fetch is not
replaced and no background jobs are introduced.

Success retains200/status=ready/database=connected/db_latency_ms/timestamp.
All failures now return503/status=unready/database=unavailable,
error='Database readiness unavailable.' and timestamp. External monitors that
inspect previous database=disconnected/error values or raw error text must adopt
the neutral unavailable value; HTTP success/failure statuses remain200/503.
No raw provider message, cause, stack, host/schema/code is returned or newly
logged. Existing health request logging supplies path/status/latency only.
GET /health liveness and the existing Docker health checks remain unchanged.

## Evidence

The old exact handler leaked a synthetic internal marker for both returned and
thrown errors and queried settings, which is not in the canonical baseline.
Boundary tests initially11 failed/3 passed, then14/14 passed after the fix.
Fake timers/abort-aware transport verified actual signal abort at5000ms,
no premature response, late-success rejection and timer cleanup. Actual loopback
HTTP tests verify public registration, safe failure and independent liveness.

The first aggregate run passed1184 tests but its new HTTP suite failed setup:
another controller constructs its own SDK client. A synthetic SDK factory stub
fixed that isolation without loading dotenv/credentials or changing runtime.
Fresh full backend1186/1186 across79 suites passed (28.07s). Independent scoped
review found no actionable P1/P2. Frontend source/Compose/backend Dockerfile
search found no readiness consumer; frontend tests were not rerun for this
backend-only change (latest frontend305/305 from profile batch).

No live database/provider/schema/env/dependency/container/Git/deployment change.
This verifies mocked transport and loopback HTTP, not deployed DB reachability,
the backend's full privilege identity, every dependency, provider/Storage health,
business transactions or monitor compatibility. Existing images predate this
handler and require normal owner build/CI/release adoption. Probe caching/rate
limits, liveness metrics policy and broader global/controller logging remain
separate assessment. Other Phase7 release gates remain open.
