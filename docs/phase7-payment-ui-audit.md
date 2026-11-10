# Payment frontend audit —2026-11-04

Read-only continuation after prepared batch27; no runtime changes were made by
the original audit. Owner subsequently approved batch28, implemented with scoped
verification in [payment UI evidence](phase7-payment-ui-boundary.md).

Actual usePayhere source was exercised in an offline VM with synthetic hook/API/
SDK/timer boundaries. Config rejection left a displayed500.00, while the synthetic
server checkout started with locked750.00. A synthetic provider error marker was
echoed into user feedback and a navigation timer scheduled. No real environment,
browser/provider/account/database/payment or delivery was used. Server-side
amount authority is preserved in source; this is not a demonstrated charge or
client-price tampering bypass.

Review falls back to500, MyProperties hardcodes Pay Rs.500, callback/timer cleanup
is absent, completion ignores its order argument and current tests accept multiple
terminal outcomes for a single attempt. Existing draft retention is useful but
needs busy/lifetime coordination for the proposed quote/config states.

[Concrete proposed design](superpowers/specs/2026-11-04-payment-ui-boundary-design.md)
groups these related changes for review. It preserves server settlement and adds
no backend/SQL/provider operations. The original audit baseline backend1320/1320 and frontend347/347/lint/build
predated the design implementation; subsequent batch28 frontend401/401/lint/build
verification is recorded in payment UI evidence. Customer billing placeholders and real provider/browser acceptance remain
separate. Password changes remain owner-deferred.
