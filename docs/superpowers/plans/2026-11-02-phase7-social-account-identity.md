# Phase 7 social account identity plan

Approved Phase7 identity scope; execute inline using TDD and verification-before-completion. Owner retains all Git/live changes.

**Goal:** Never authorize an existing account solely because a provider supplies the same email.

**Files:** controllers/socialAuthController.js, tests/googleLoginSecurity.test.js and new tests/socialAccountIdentity.test.js under backend-node; phase7-security-plan.md.

**Behavior:** Shared Google/Facebook/Apple account lookup first uses exact provider+provider_id with maybeSingle. Query errors fail closed. A matching subject returns its existing account even if the provider email changed, without silently changing the stored email. BAN/ADMIN restrictions remain. A missing identity checks email only for collisions; any existing email blocks implicit linking with403 and no session/write. A genuinely new email/identity may create a BUYER through the existing signup flow. No schema/dependency changes, provider-account reassignment, explicit account-linking UI or migration.

**Intentional compatibility change:** password-only/legacy accounts cannot automatically link at social login. They must use their original sign-in method; recovery/explicit linking is separately designed. Matching social identity keeps authority when email changes; email is not a replacement identity proof.

- [x] Add HTTP regression cases across all three handlers with mocked provider/DB/email boundaries: matching subject, changed email, password-account collision, different-provider collision, different-subject collision, missing identity/email, lookup errors and new signup. Assert collision denies before writes/cookie; assert new signup role remains BUYER and welcome email only follows successful insert.
- [x] Demonstrate red failures against existing shared helper. Adapt Google validation fixture mock to provider-identity lookup only after red evidence.
- [x] Replace email-primary helper with provider-primary lookup; use maybeSingle and throw every query error; guard empty identity fields. Reject collisions with a fixed403 instruction to use original sign-in. Preserve email/cookie/response formats. Check avatar update returned error instead of silently reporting success; do not mutate local user until update succeeds.
- [x] Run focused social/auth regressions then full backend suite sequentially with512MiB heap/semi-space4. Review diff/syntax/whitespace. Obtain bounded independent review.
- [x] Record results and limitations. No real OAuth callback, hosted data, email, schema, credential or dependency changes. This fixes implicit linking; Facebook app-token binding, Apple audience configuration, CSRF and tokeninfo transport remain separate open findings.

## Verification result

Nine query-aware email collision cases failed on the old helper with200 instead of403. Initial focused social/auth tests96/96 passed after the fix. Reviewer found no actionable introduced defect; expanded tests cover ban/admin, missing email and avatar update success/failure. Final full backend667/667 across51 suites passed. New identity test file contains46 cases; all provider/DB/email boundaries are mocked. Index empty and syntax/diff whitespace checks passed. The schema has no new provider-identity uniqueness guarantee; concurrent signup/legacy duplicate handling requires separate assessment. No live writes, credentials, dependency changes or Git mutation occurred.
