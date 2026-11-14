# Credential-bound sessions — owner rollout notes

2026-11-03. Owner approved required one-time re-login for existing sessions. Code/test preparation only; no commit/push/deployment, real credential change or schema migration has been performed.

## Behavior

Every application session issuer now creates version2 credentials bound by a keyed, domain-separated HMAC to the account ID/current stored password hash. Raw password/hash is never a JWT claim or public user field. Every protected/optional authentication request checks the current stored credential and existing role/ban rules. Legacy session JWTs are rejected; reset-purpose JWTs remain unusable as sessions. No database column/table or dependency is added.

After successful password reset, old sessions fail on their next authentication check, the current browser cookie is cleared and reset UI clears cached public/Admin login state. Fresh login with the new password works. After confirmed Profile password change, the current browser receives a fresh HttpOnly cookie; other copies/old devices are rejected. Normal profile edits do not rotate the session. Failed password writes/resets do not invalidate a valid unchanged credential.

Direct Bearer clients changing a password via PUT /api/auth/profile must replace their credential with response.token before subsequent requests. Admin profile password changes return that replacement too; the current frontend updates its existing admin_token cache. Consumer cookie clients do not receive/cache a body token. Client storage failure prompts sign-in instead of masking a committed password change.

## Coordinated release gate

1. Review/commit/push the combined server issuers, validators, frontend state/refresh handlers and test-fixture changes together. Owner retains Git control; never stage docs/evidence/ or local .env. New-commit CI is still required.
2. Deploy coordinated issuer/validator code and compatible frontend under a separate owner deployment request. This document does not authorize deployment or changing JWT_SECRET. Confirm all real login paths have access to the internally selected password_hash using the existing server-only key.
3. Existing users/admins must sign in again once after rollout. Do not re-enable legacy acceptance to avoid this prompt; that would retain the pre-reset session gap. Accounts/passwords/data are not migrated by rollout.
4. Retire/protect old serving revisions and alternate server URLs. An old validator still reachable against the same database/keys may accept pre-fix tokens after reset. Updating only the main frontend/API alias does not prove that those paths are gone.
5. Verify allowed/forbidden cookie/Bearer sessions, Admin/public routes, normal profile edits, current-device password-change refresh, other-device reset/change revocation, optional identity removal and no hash exposure. Use synthetic staging fixtures and disabled external delivery; no real account reset is implied.

## Evidence in this workspace

- New actual-controller/middleware reset/change tests: initial7 failed/3 passed, then10/10 green.
- Shared helper/issuer and migrated API fixtures: full backend831/831 across63 suites passed. Initial discovery run exposed12 saved-search fixture failures due to missing explicit credential state; the fixture now supplies confirmed null, not a permissive production fallback. A new issuer test initially lacked its saved-search dependency mock; that harness setup was corrected without adding real environment credentials.
- Focused reset/Profile UI6/6 passed after initial2 failures/4 passes. Initial async test act warnings were corrected by awaiting the real parent updates; no assertions were relaxed.
- Guarded DB/REST preflight passed. Real-local login/role/reset/change/Admin profile40/40 passed; seven exact run-owned users removed, full starting users snapshot and canonical ledger preserved. First run39/40 failed before the reset request due to undefined test Origin; exact cleanup/preservation passed, then fallback metadata was corrected and the full profile passed. External email/gateway delivery remained forbidden.
- Only the retained loopback DB/REST containers were started and stopped; volumes/containers/schema preserved. Storage/Auth and unrelated containers were not changed.
- Independent bounded server/fixture and frontend reviews found no actionable introduced defects. Frontend full lint/build passed with existing chunk/Lottie warnings. Final full frontend result is recorded in phase7-security-plan.md after completion.

Other guarded listings/CRM/saved-searches/Storage/checkout/receipts/browser profiles were not rerun for this batch. Their manually minted application sessions were migrated where needed and syntax-reviewed; infrastructure Supabase JWTs remain unchanged. Checkout-browser fixture password hashes stay in a server-side Map and are not copied into browser/user fixture data. These source checks are not acceptance results for unexecuted profiles.

## Recovery and limits

Keep version2 validation in a recovery build. Rolling back to a legacy validator reopens S6; do not use that as an automatic compatibility fallback. Frontend recovery may require fresh sign-in while retaining server-side enforcement. No automatic force-push, migration or secret rotation is part of this change.

This is password-credential revocation, not a global session registry. A copied current token is not revoked solely by browser logout; it remains bounded by its expiry/current credential/role checks. Requests already authenticated before a password change are not retroactively canceled. Cross-tab UI state may remain stale until another request/reload. An attacker retaining another valid login credential is a separate compromise scenario. Real browser/deployment acceptance and the wider Phase7 security assessment remain open.
