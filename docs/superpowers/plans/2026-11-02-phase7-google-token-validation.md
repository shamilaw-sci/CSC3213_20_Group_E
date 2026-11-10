# Phase 7 Google token validation implementation plan

> Execute inline with test-driven-development and verification-before-completion. Owner controls Git; retain version-3.0 checkout and do not stage/commit/push.

**Goal:** Reject unusable Google identity/configuration before database access or session creation.

**Architecture:** Keep the existing tokeninfo verification transport and public login/cookie response shape. Add bounded input, mandatory configured audience, explicit returned-claim validation and a verification request timeout. No dependency/environment edits or real provider requests. Account linking is a separate unresolved security boundary.

**Files:** backend-node/controllers/socialAuthController.js; new backend-node/tests/googleLoginSecurity.test.js; docs/phase7-security-plan.md.

## Acceptance and implementation

- [x] Write HTTP-level tests using a small Express app with the real googleLogin controller and real session cookie helper; mock axios, Supabase and email delivery only. Use synthetic tokens/users and no sockets beyond Supertest's loopback listener.
- [x] Assert missing, non-string, whitespace-only and oversized credentials return400 with no provider/DB access. Limit the credential to8192 characters.
- [x] Assert absent/blank GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_ID return503 before provider/DB access; preserve configured fallback support.
- [x] Assert mismatched audience, missing/unverified email, empty/non-string subject, invalid issuer and missing/non-finite/expired expiry return401 with no DB/session access. Accept Google's documented issuers, true or string true email_verified, and numeric/string finite future exp returned by tokeninfo.
- [x] Assert provider rejection returns401 without raw provider error response/credential in logs or HTTP output; use a fixed internal log message.
- [x] Assert valid matching-provider existing user still gets200, original user fields and HttpOnly token cookie; BANNED/ADMIN restrictions remain. Verify tokeninfo uses axios params and a5000ms timeout.
- [x] Run new tests before production edits; failures must demonstrate missing guards rather than harness faults.
- [x] Add minimal controller checks: trim configured client ID; check input/config before verification; use fixed HTTPS endpoint with params; validate returned object/claims before findOrCreateSocialUser. Preserve tokeninfo network verification; do not trust a browser-decoded payload.
- [x] Rerun focused tests, existing auth/middleware/authorization tests, then full backend suite sequentially with NODE_OPTIONS=--max-old-space-size=512 --max-semi-space-size=4. Run diff whitespace check.
- [x] Record exact evidence and remaining scope: tokeninfo transport is retained, provider-subject account lookup/linking and Google email authority rules remain open; no claim of complete social-login hardening.

Reference: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token . Google recommends a production verification library; adoption needs a separately reviewed dependency decision. This batch does not represent that migration.

## Execution result

All listed implementation/verification steps completed on2026-11-02. New tests36; red26 failed/10 passed; focused66/66; full backend621/621 in50 suites. First sandbox run failed socket permission checks and was rerun outside the sandbox with mocked provider/DB/email boundaries. Independent bounded read-only review reported no actionable findings. Optional edge-coverage suggestions and unresolved identity/linking scope are recorded in docs/phase7-security-plan.md. Existing provider-subject matching was used only in the success fixture; no production linking change was made.
