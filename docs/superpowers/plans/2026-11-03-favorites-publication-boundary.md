# Approved favorites publication boundary

Owner approved2026-11-03. Current checkout/manual Git. No real DB/API calls.

1. Add real-controller/repository tests with mocked external DB/property lookup for non-public adds/reads, valid approved behavior, existing withdrawn removal, owner scoping and lookup/write failures. Observe red failures before implementation.
2. Query the current account's favorite first; remove existing tuple without returning property content. Use maybeSingle so no row is null while actual lookup errors propagate. New additions require approved status, retain own-approved400. Collection query uses properties!inner(*) plus properties.status=approved and user_id; controller defensively filters missing/non-approved nested values. Preserve endpoint/response/public field shape and deletion predicates.
3. Update existing positive authorization fixtures with approved status/new lookup ordering, keeping negative assertions. Run focused/full backend under512MiB heap/semi-space4MiB; independent review; syntax/whitespace/index checks.
4. Record actual evidence and limits. No schema/frontend/dependency/config/stage/commit/push/deploy or real-local profile run. Actual PostgREST/browser acceptance remains separate, along with existing appointment schema dependency.

Completed steps1–4 on2026-11-03. New19 cases red12fail/7pass; focused39/39 and full backend983/983 across68 suites. Independent bounded review no actionable defects; syntax/whitespace/index checks passed. Query emission and controller defense verified with mocked boundaries, not committed PostgREST/browser acceptance.
