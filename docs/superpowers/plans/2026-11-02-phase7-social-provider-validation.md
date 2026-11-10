# Phase 7 remaining provider input/Apple audience validation

Approved security scope; TDD/verification-before-completion and independent bounded review. Owner retains all Git/live configuration/dependency changes.

**Goal:** Apple login cannot proceed without an explicit configured audience or usable verified identity; provider endpoints reject malformed credentials and never log raw provider errors.

**Files:** backend-node/controllers/socialAuthController.js; new tests/socialProviderValidation.test.js; existing socialAccountIdentity.test.js synthetic Apple fixtures; backend-node/.env.example public placeholders; phase7-security-plan.md.

**Design:** Apple id_token string/nonblank/max8192 before SDK call. Require trimmed APPLE_SERVICES_ID; missing/blank config returns503 before SDK/DB. Retain installed apple-signin-auth signature verification with configured audience/ignoreExpiration=false. Validate returned aud equals config, issuer=https://appleid.apple.com, finite future numeric/string expiry, nonblank string subject/email and boolean/string true email_verified before shared identity helper. Invalid claims401; malformed input400. Fixed error log only. Existing account lookup/cookie/ban/admin/BUYER semantics remain.

Facebook accessToken gets the same string/nonblank/max8192 guard, a5000ms Graph profile timeout and fixed error log. No app-binding claim: Meta debug_token docs failed tool fetch/429, so new app-token/credential verification is not invented. Existing provider-scoped account helper stays authoritative but does not establish expected Facebook app binding. Frontend Facebook/Apple buttons currently show not-configured messages; this batch does not activate them.

- [x] Add HTTP tests with mocked SDK/Graph/DB/email for malformed credentials, missing/blank Apple config, bad aud/issuer/expiry/subject/email verification, valid Apple bool/string claims, explicit SDK audience options, valid Facebook timeout and provider error sanitization.
- [x] Run red against old controller; then minimal guards/timeout/log changes. No verification-library replacement, new dependencies, secret reads or real provider calls.
- [x] Update cross-provider account fixtures to provide a synthetic APPLE_SERVICES_ID/Apple issuer, restoring environment after each test. Add placeholder-only config documentation; do not edit local .env.
- [x] Focused social/auth tests then full backend sequentially with512MiB heap/semi-space4; syntax/whitespace and independent review. No frontend/Go rerun for backend-only changes.
- [x] Record open Facebook app binding, Apple nonce/replay/auth-code flow and real provider/deployment readiness. This does not establish complete OAuth/OIDC security.

Sources: Apple verifying-a-user documentation requires aud=client_id; installed apple-signin-auth verifyIdToken uses jsonwebtoken.verify with RS256/Apple issuer and spread options. Apple markdown fetch was rejected by the browser tool; primary search snippet and installed SDK source were checked. Meta official access-token/debug_token pages were unavailable/429; retain that gap.

## Execution result

2026-11-02: red25 failed/9 passed in new34 tests; focused121/121 passed; full backend794/794 across59 suites passed. Independent bounded read-only review found no actionable introduced defects. Syntax/whitespace and empty-index checks passed. No local credential/config, dependency, schema, live provider/account/email, Git stage/commit/push or deploy changes. Example identifiers remain blank. S3 is not globally closed; Meta app binding, Apple nonce/code/replay/key-fetch timeout and real readiness remain open. See phase7-security-plan.md for optional coverage/exclusions.
