# Favorites listing publication boundary — proposed S8 fix

Status: owner approved and implemented2026-11-03. Mocked controller/repository and full backend verification complete; real PostgREST/browser acceptance remains open.

## Confirmed issue

Property detail hides non-approved listings from unrelated users. Favorites toggle retrieves any property by ID, checks only own-property restriction, and inserts the favorite. Favorites list retrieves properties(*) with no status filter and returns each nested property unchanged. A synthetic controller sequence returned200 on adding a pending listing, then200 containing its fixture private contact field. No real DB/account/listing/network used; actual hosted exposure was not tested. Knowing a non-public listing ID is a prerequisite; guessing valid IDs is not established by this proof.

## Options

1. Recommended: enforce approved-only additions and current approved-only favorites results, with safe removal of existing withdrawn favorites. Bounded controller/query change; no schema/UI endpoint change.
2. Keep unavailable-listing placeholder cards. More UI/API work and a product decision about which non-public metadata may remain visible.
3. Block only new additions. Leaves previously saved listings exposed after withdrawal; insufficient for closure.

## Proposed behavior

Look up only the authenticated account's favorite tuple first; propagate lookup failures before any write. If it exists, allow removal without requiring public listing visibility. This permits cleanup of old favorites after withdrawal, and never returns private property details. Keep normal removal response and exact user/property deletion predicates.

If no favorite exists, require property status exactly approved before insertion. Missing/unpublished listings return the same404/no insert; retain approved own-property400 behavior. Do not introduce owner/Admin publication exceptions into this consumer collection; adding one's own listing remains forbidden. Existing duplicate/racing toggle semantics remain outside this patch.

For collection reads, use an inner property relation with status=approved at the database query boundary, scoped by current user ID, preserving existing public property fields/response shape. Also filter malformed/missing/non-approved nested results before response as defense in depth. No non-approved contact/image/title/status data should be returned. Do not change canonical property detail owner/Admin exceptions or delete stored favorite rows merely because a listing is unpublished.

## Acceptance

Tests first: actual controllers with query-aware mocked DB, including new pending/rejected/draft additions denied, approved add/removal preserved, own approved listing denied, existing withdrawn favorite removable, list containing mixed statuses returns approved only, repository emits current user ID/inner relation/status predicate, failures cannot insert/delete, missing/foreign favorite tuple never authorizes another user's delete. Demonstrate red behavior, then focused/full backend and independent review. Existing favorites UI uses the same array shape; no frontend change expected, but actual UI/committed DB acceptance remains scoped separately. No real API/DB/provider calls or schema/dependency/config/Git/deploy actions.

## Actual evidence and limits

New19 tests initially12 failed/7 passed. After implementation focused publication/authorization/property privacy39/39 passed; full backend983/983 across68 suites passed in17.087s. Existing positive authorization fixtures now provide approved status and absent-favorite lookup, preserving404/own400 negative assertions. Independent bounded review found no actionable defects. Syntax/whitespace/index checks passed. No real DB/API/frontend/schema/env/dependency/stage/commit/push/deploy changes.

Repository now uses maybeSingle so absence is not confused with a real query failure; duplicate/cardinality failures are not ignored. Collection applies inner relationship/status and current-user predicates, with defensive controller filtering. Existing withdrawn favorite removal avoids loading property details. Concurrent toggle/moderation races are not serialized; an approved listing can be withdrawn after an add check, but subsequent collection queries must filter current approval. Optional stronger query-aware foreign-tuple/withdrawal-sequence tests and actual PostgREST inner-relationship acceptance remain open. No deployed S8 closure claim.

Subsequent [fresh committed-schema acceptance](../../phase7-local-acceptance.md) passed real PostgREST inner/status filtering, unpublished-add denial and approved→withdrawn read exclusion/removal. This closes the local inner-relationship/withdrawal-sequence acceptance gap; stronger foreign-favorite test and browser/production acceptance remain separate. No deployed S8 closure claim.
