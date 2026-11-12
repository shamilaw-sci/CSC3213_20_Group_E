# User and Buyer walkthrough fixes

Scope: resolve recorded Common User and Buyer issues before resuming Seller tests. Preserve existing unrelated changes; owner handles commits and hosted SQL execution.

## Approach
Use focused fixes in existing modules, with backend enforcement for validation and persisted server state for upgrade requests. Avoid broad refactors and UI-only workarounds. Diagnose uncertain failures before implementation.

## Batches and acceptance
1. Profile: reject invalid phone values on client and server, accept supported local/international formats, keep optional empty phone behavior; distinguish missing and incorrect current password and clarify label. Invalid writes must leave saved values unchanged.
2. Seller upgrade: restore pending status after reload, confirm persisted submission, handle repeats consistently, prepare a separately reviewed hosted atomic approval migration, and connect Admin notification to the request. Owner applies hosted SQL; never remove isolated-test guards.
3. Search and analytics: search-area map focus, saved-search boundary restoration, readable price comparison with validated structured floor-area units and no fabricated fallback, correct Apple icon.
4. Feasibility and assistant: recorded currency/grouping wording, saved calculation restore, actionable validation errors, draggable chat launcher constrained to viewport without accidental open.
5. Booking handoffs: diagnose guest booking, reconcile booking/conversation CRM identity and stages, resolve genuine chat threads, preserve failed drafts, and show booking notifications.

## Verification
Run focused meaningful regression checks per batch and relevant build/lint checks. Then user performs one Sinhala-guided retest at a time. Mark local automated checks separately from user acceptance and hosted rollout. Keep all unresolved cases explicit.

## Alternatives
UI-only patches are smaller but leave server validation and state gaps. Broad rewrites add unnecessary regression risk. Focused end-to-end fixes are recommended.
