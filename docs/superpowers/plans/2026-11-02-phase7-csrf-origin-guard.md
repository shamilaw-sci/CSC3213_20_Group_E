# Phase 7 CSRF source-origin guard plan

Approved Phase7 request-security scope. Execute inline using TDD and verification-before-completion; owner retains Git. No live/env/dependency/schema changes.

**Goal:** Block forged browser mutations before handlers, authentication and uploads while preserving legitimate configured frontend, explicit Bearer API and signed webhook flows.

**Design/files:** new backend-node/middleware/csrfProtection.js mounted in server.js after cookieParser and before body parsing/routes; new tests/csrfProtection.test.js exercises actual server. Configure trusted source using existing CLIENT_URL (localhost5173 fallback); parse strict HTTP(S) origin without credentials/query/fragment/path other than /. Reject invalid config with503 for guarded requests. Compare supplied Origin as an exact serialized origin, not suffix/prefix/Host/X-Forwarded-Host. If Origin absent, parse Referer HTTP(S) URL and compare origin. Null/malformed/untrusted supplied source returns403. Origin takes priority over Referer.

GET/HEAD/OPTIONS pass unchanged. POST /api/payment/notify (and its one trailing slash) alone bypasses source validation; existing callback schema/signature/settlement remains authoritative. For no-source requests, a nonempty explicit Bearer credential may proceed to existing authentication; cookie token without source returns403. No-source, no-session non-browser clients remain compatible. Reject Sec-Fetch-Site cross-site/no-source browser requests even without cookies to protect login; valid configured cross-site frontend Origin still works. Browser unsafe requests with no source and any Fetch Metadata marker are rejected. Do not derive trust from proxy headers or exempt all payment/auth routes.

**Intentional change:** legacy scripts sending cookie-only mutations without Origin/Referer must supply trusted source metadata or switch to explicit Bearer. No frontend payload/header change needed for normal browser requests. Existing cookie logout test supplies a trusted Origin. Guarded login-role fixture cookie mutations must carry configured source; update transport helper without running stack.

- [x] Add actual-server tests: hostile-origin JSON/form/multipart mutations, login/logout/admin-login, null/malformed/lookalike/wrong-port origins, conflicting source headers; assert403 before DB; trusted Origin/Referer pass; missing-source cookie denies; no-source Bearer passes to auth; source-less Fetch Metadata login denies; safe methods pass; callback exception limited to POST/exact path, callback still schema-validates.
- [x] Run red on old server (missing source guard), not count socket permission failures as product evidence.
- [x] Implement small middleware with explicit source-validation branches and mount before parsers/routes. No token/session changes or CORS broadening.
- [x] Update legitimate cookie-only test/guarded fixture metadata; do not weaken negative assertions.
- [x] Run focused security/auth and full backend sequentially (512MiB heap/semi-space4); syntax/whitespace checks; independent bounded review.
- [x] Record exact counts and exclusions. No browser-real-origin acceptance or live callback/DB/Storage write. GET message-read side effects, token-based CSRF strategy, XSS, distributed session controls and deployment CLIENT_URL readiness remain separate concerns.

Reference: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html . Use configured source origin because frontend/backend may be on distinct origins; CORS alone is not the mutation guard.

## Execution evidence

Red actual-server34 cases:25 failed,9 passed before the guard. Focused auth/security64/64 passed after implementation. Expanded file44 cases; full backend711/711 across52 suites passed. Independent read-only guard review found no actionable introduced findings. Additional guarded cookie clients in CRM/listings/saved-searches/Storage/checkout were updated with source metadata after the full default run; they are outside the default Jest suite and received syntax/API checks only, not real-local acceptance. Tests keep all authorization/signature assertions intact. See phase7-security-plan.md for remaining scope and optional browser/edge coverage. No product runtime changes followed the passing full suite.
