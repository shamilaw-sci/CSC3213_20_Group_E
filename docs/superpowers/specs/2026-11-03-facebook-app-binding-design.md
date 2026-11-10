# Facebook expected-app binding — proposed S3 correction

Status: owner approved and implemented2026-11-03. Mocked verification/full backend complete; no live tokens/provider calls or real configuration changes.

## Evidence

facebookLogin bounds its input and calls graph.facebook.com/me with a timeout, but never checks the expected app. An isolated actual-controller fixture (mocked provider/DB/cookie boundary, real session issuer with synthetic secret) returned200/session issuance with no FACEBOOK_APP_ID or FACEBOOK_APP_SECRET, one provider call and no debug_token request. This proves absent expected-app enforcement, not a real cross-app exploit/account takeover. App-scoped subject differences must not be ignored when assessing impact.

Initial proof setup transitively initialized dotenv through authController; no values were printed or live provider/DB/mail calls made. Corrected the harness to block transitive dotenv/config setup and repeated the same result under explicit isolation. No actual credentials were used for verification.

Primary-source research2026-11-03: direct Meta documentation remained inaccessible/429. Meta's [current token probe source](https://github.com/facebook/agentic-tools/blob/main/plugins/devtools/skills/debug-access-token/scripts/debug_token_probe.py) demonstrates debug_token with a separate app credential derived server-side from app ID/secret. The [archived official SDK metadata implementation](https://github.com/facebookarchive/php-graph-sdk/blob/5.x/src/Facebook/Authentication/AccessTokenMetadata.php) validates expected app ID, user ID and expiry; its age is a limitation, not current compatibility clearance. These are research sources, not an invoked installed skill. No live token inspection is requested.

## Options

1. Recommended: require backend expected-app configuration and inspect token metadata before fetching profile or accessing DB. Preserve the existing provider-subject account boundary and response contract.
2. Disable the backend Facebook endpoint until provider configuration/real acceptance exists. Smaller containment patch but removes the login path entirely.
3. Keep /me alone because the frontend button is disabled. Insufficient: direct clients can call the backend route.

## Proposed contract

Retain malformed-input400 before any provider call. Require trimmed backend FACEBOOK_APP_ID and FACEBOOK_APP_SECRET; missing/blank configuration returns503 before provider/DB/session access. App ID must be a bounded numeric string; secret remains backend-only. Add blank example configuration/documentation only; do not read/change real .env or request secret values in chat. Compose passes the backend variables without exposing the secret as VITE/build data. Frontend activation remains excluded.

Call fixed HTTPS graph.facebook.com/debug_token with input_token and server-side app credential, using a five-second timeout and no redirects. Keep the existing unversioned transport for this bounded patch, consistent with the accessible primary probe; Graph version lifecycle and actual supported-app configuration remain a separate deployment gate rather than guessing a current API version.

Require a well-formed metadata object, is_valid exactly true, app_id exactly the configured string, type exactly USER, nonempty string user_id and finite numeric future expires_at before /me or DB access. Deliberately reject missing/zero/non-numeric/non-expiring expiry in this user-login path. If data_access_expires_at is present, require finite numeric future expiry too; absent optional field is not inferred expired. This conservative policy needs real-provider acceptance before activation and does not support page/app/system tokens.

Fetch /me with the same bounded/no-redirect transport only after valid metadata. Require profile.id exactly equal to inspected user_id and a nonempty email before shared account lookup. Preserve provider-subject matching, email collision refusal, role/ban restrictions, public fields and version2 cookie behavior. No new email-linking or provider identity schema. Do not treat profile email presence as a new mailbox-verification guarantee.

Reject wrong app/subject/type/validity/expiry with generic401 and no DB/session writes. Provider errors must retain generic safe logs/responses: never log raw Axios objects, URLs/params, app secret, app access credential or user token. Do not forward these errors to the raw global logger. Existing verified shared-helper403 restrictions remain.

## Verification and limits

Actual evidence:37 new controller cases initially35 failed/2 passed; final focused117/117 across3 files and full backend1046/1046 across70 suites passed (18.727s). One old positive fixture needed valid inspection metadata/new no-redirect option; assertions were preserved. Independent review found no actionable defects. Syntax/whitespace/index checks passed. Blank example variables and backend-only Compose references added; real .env unchanged. No real provider/DB/browser/schema/dependency/stage/commit/push/deploy or local integration rerun. Optional gaps: individual missing app/type/user fields, nonfinite/null optional data expiry and complete profile-param/query assertions. Actual Meta/Graph version readiness remains open.

Test actual controller with all provider/DB/mail boundaries mocked. Cover wrong/missing/blank config; input types/length; malformed metadata; wrong app; false/string validity; USER vs other type; missing/mismatched subject; expired/zero/nonfinite/string timestamps; optional data expiry; provider errors on either call; profile mismatch/no email; positive existing/new provider flows, ban/Admin/collision restrictions, safe session/public shape and absence of private markers in logs/responses. Assert metadata rejection prevents /me, every rejection prevents DB/session changes, and two fixed endpoints/options are used on success. Demonstrate red tests, then focused/full backend and independent review.

No real Facebook account/API/credentials, frontend button activation, dependency/schema/config deployment, stage/commit/push/deploy. Owner must configure secrets privately and validate actual provider behavior/supported Graph API before rollout. Apple nonce/replay/key-fetch and other Phase7 gates remain open. This patch would close only the prepared expected-app validation subtask, not the whole OAuth work package.
