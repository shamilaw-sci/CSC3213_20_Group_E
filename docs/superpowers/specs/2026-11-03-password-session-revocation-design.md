# Password-change session revocation — approved design

2026-11-03. Security finding S6 confirmed with synthetic runtime proof. Owner approved the recommended credential-bound token design and one-time existing-session re-login policy on2026-11-03. Implementation/verification now proceeds; no deployment or live configuration change is authorized.

## Evidence and impact

An isolated Node process ran the actual resetPassword handler, protect and optionalAuth with a synthetic JWT secret, user, repository/database stubs and no external calls. Reset returned200 and changed the stored password hash. A session JWT minted before reset still authorized protect and still attached optionalAuth identity afterward. No real .env, account, credential, email or DB was used or printed. Existing access JWTs expire after one day and check current role/ban status, but do not bind to the current password credential. Password reset tokens are already password-bound/single-use; that protection does not revoke existing session tokens.

Consequence: a copied valid session can survive the account owner's password reset until expiry or another existing rejection condition. Treat this as a high-priority recovery gap. Ordinary logout currently clears the browser cookie; it is not server-side revocation of a copied JWT. These are separate concerns.

## Recommended bounded approach: credential-bound session tokens

Add a shared server helper using existing Node crypto/jsonwebtoken, without database schema/env/dependency changes. New session claims include session_version=2 and credential_version, a domain-separated HMAC-SHA256 over JSON ["thirasara-session-v2", user.id, user.password_hash or null], keyed by existing JWT_SECRET. Never put password_hash/raw password in a JWT or HTTP response. Compare fixed-length stamp values safely.

All session issuers must use it: consumer registration/password login, social login and dedicated admin login. Registration uses the hash just successfully persisted; social signup uses the confirmed null password state; existing social/admin/password accounts use their stored credential. Validators protect and optionalAuth fetch the current password_hash internally, check required session version/stamp and strip the hash before attaching req.user. Keep fresh role/ban checks, explicit Bearer precedence and purpose-token rejection. Audit getMe's redundant JWT verification to ensure it cannot create another authentication authority.

Password reset's atomic password-hash change then invalidates every previously issued version2 session on its next authenticated request. Password change through Profile updates should refresh the current browser's version2 cookie only after confirmed write, preserving the current legitimate interaction while revoking old copies/other devices. Admin/Bearer token refresh handling must be explicit: update the current frontend admin credential if applicable, and document how direct Bearer clients replace their token. Reset completion must clear stale local login state rather than presenting an authenticated UI after credentials are revoked. Ordinary non-password profile changes do not invalidate sessions.

## Required compatibility choice

Owner selected the recommended strict legacy rejection policy on2026-11-03. No temporary legacy acceptance is enabled.

**Recommended:** reject every legacy session missing the version2 credential stamp when this change is rolled out. All already-signed-in users/admins must sign in again once. Passwords, accounts, roles and data are not changed. Normal fresh login works with version2 tokens. This is required to avoid leaving pre-fix captured sessions valid after password reset.

**Alternative:** temporarily accept old session tokens until their natural expiry. This avoids the immediate sign-in prompt but explicitly retains S6 for those tokens (up to their remaining one-day lifetime); it cannot be reported as immediate recovery security.

A server-stored session/version registry would support broader per-session/logout/admin revocation, but requires separate database/Storage-like owner rollout and is not included in this no-DDL correction. The recommended credential-bound design does not invalidate a copied current token merely because its browser logged out; keep that limitation explicit.

## Implementation and acceptance after decision

1. Add failing regression tests around actual reset/password-change→old-token refusal for cookie and Bearer, optionalAuth identity removal, fresh token success, admin/social/registration issuance and rejection of legacy/malformed/purpose tokens under the selected compatibility policy.
2. Implement shared versioning/issuance/verification, preserving public user response fields and avoiding password-hash exposure/logging. Update fixture-issued tokens and test helpers intentionally; never weaken assertions or change JWT_SECRET to make tests pass.
3. Verify current-device password-change refresh, other-device rejection, reset UI clearing and admin/Bearer handling. Failed password writes must not revoke or rotate a valid current credential; a normal profile edit must retain the session.
4. Run focused tests then full backend/frontend, lint/build and relevant guarded local login/role/reset cases only with existing identity/cleanup protections. No real email/account/password reset.
5. Independent review and owner-controlled coordinated deployment gate. Issuers/validators must move together and old serving revisions must not remain an authentication bypass. No deployment or live JWT secret change is authorized here.

## Limits and sources

No global session registry, logout revocation, MFA, refresh-token architecture or schema migration is implied. Requests already authenticated before a password change are not retroactively canceled. An attacker who knows the new password or can sign in through another still-valid credential is a separate compromise scenario.

Sources: [OWASP forgot-password guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html), [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), repository auth/reset source and the isolated runtime proof above.
