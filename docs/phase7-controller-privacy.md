# Controller/service privacy — 2026-11-04

Approved scoped follow-up implemented. Social bans/link conflicts now require
owned fixed public-error metadata; arbitrary SDK/database statusCode403 cannot
echo exception text. Real account bans/collisions retain their403 messages and
identity/session restrictions; unowned errors use existing generic provider401.

Shared validator preserves real ZodError issue shapes but rejects forged issues
and unexpected parser exceptions with fixed400. Historical favorites/search/
feasibility schema messages use user-facing unavailable text; statuses and empty
fallback collections were preserved. Their availability semantics remain open.

Observed raw errors in auth/social mail catches, analytics, Admin/property handlers,
search alerts, repositories, inquiry handlers, payments and receipt queues were
replaced with fixed operation events. Payment recovery context retains only
explicit UUID order/property IDs; arbitrary payment IDs/errors are excluded.
Already reviewed bounded recovery events were preserved. Email success logs no
recipient/subject/SMTP response; failures log fixed text and still rethrow when
strict. Logger Error-instance metadata fallback excludes message/stack; arbitrary
object metadata is not generally scrubbed or declared safe.

## Verification

Initial regressions7 failed/46 baseline passes, then focused53/53 passed. An
additional forged-Zod-issues regression failed then passed after checking actual
ZodError ownership/type; real structured validation is tested. Mock mail verifies
successful metadata privacy, strict receipt rejection and optional welcome failure
behavior. Analytics raw-error capture and operation-context privacy are tested.
All three providers retain existing ban/link tests and reject unowned403 errors
without issuing sessions or writing accounts.

The first full run1208/1209 exposed a legacy acknowledgement-log assertion expecting
raw error text and a non-UUID fixture ID. It now uses a UUID and checks retained
recovery identity with absent error text; send-count/lease/retry assertions were
not weakened. Fresh full backend1210/1210 across82 suites passed (24.961s).
Independent scoped review found no actionable P1/P2 and no remaining raw error
log arguments at reviewed target sites. No exact-message frontend consumer found
for changed schema fallback text; frontend not rerun (latest305/305).

No real delivery, SMTP/payment/provider/account/DB/log access, dependency/env/
schema/Docker/Git/deployment action. Fake transports and loopback HTTP only;
earlier image evidence predates these changes. Owner CI/build/release adoption
remains required. Proxy/browser/collector policies, retention/access, arbitrary
metadata, custom validation-message policy, future call sites and wider source/
recovery/acceptance findings remain open. No end-to-end privacy clearance.
