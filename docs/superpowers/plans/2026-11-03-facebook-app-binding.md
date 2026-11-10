# Approved Facebook app binding

Owner approved2026-11-03. Current checkout/manual Git; no real credentials/provider/DB calls.

Completed steps1–4: new37 cases red35fail/2pass, focused117/117 after positive fixture migration, full backend1046/1046 across70 suites. Independent review no actionable findings; syntax/whitespace/index checks passed. Actual Meta readiness remains open; no live configuration/Git/deployment action.

1. Add real-controller tests with mocked external boundaries for app configuration, debug metadata, subject/expiry/type, profile matching and secret-safe failures. Observe red failures.
2. Require backend app ID/secret, inspect fixed debug_token before /me, require USER/validity/app/user/future expiry, optional data-access expiry and profile subject match. Both calls timeout5000/no redirects. Preserve shared identity/session behavior; add blank examples and backend-only Compose references. No real .env/frontend activation.
3. Migrate existing Facebook positive fixtures to valid synthetic debug responses/configuration without weakening negative assertions. Run focused/full backend and independent review; syntax/whitespace/index checks.
4. Record evidence/remaining real-provider and Graph-version readiness. No schema/dependency/stage/commit/push/deploy.
