# Phase 7 security and resilience — approved scope

Approved by owner on 2026-11-02. Starting commit: 2510d2d on version-3.0.

## Goal and constraints

Reduce demonstrated security and recovery risks without regressing existing product flows or undoing Phase 6 module boundaries. Completion means recorded evidence for the agreed controls and no unresolved critical/high findings in the reviewed scope; it does not mean a guarantee of zero vulnerabilities.

Owner retains stage/commit/push. Never stage docs/evidence/. No live credential, environment, database, schema, dependency or infrastructure changes; no real accounts, messages, emails or payments; no resets. SQL changes require separate owner application. Preserve existing interfaces and legitimate business behavior; document intentional security-related changes explicitly.

Use sequential heavy checks, Node heap512 MiB/semi-space4 MiB, RAYON_NUM_THREADS=1 and Vitest one thread. Reuse Phase 5 guarded integrations only where affected contracts justify them. No full-suite reruns for documentation/example-only changes. Deadline assumption awaiting owner confirmation: Nov8 structural freeze, Nov9 aggregate checks, Nov10 fixes only/last editable day.

## Evidence register at approval

| ID | Condition observed in source | Initial priority / limits |
| --- | --- | --- |
| S1 | Git tracks go-map-service/.env; DATABASE_URL has a password component, non-loopback host and no obvious placeholder marker | Urgent credential-exposure risk; credential activity and access scope unverified; values withheld |
| S2 | Canonical baseline creates public chat-attachments bucket/public SELECT policy; conversation repository returns getPublicUrl | High privacy candidate; hosted configuration and unauthenticated retrieval not tested |
| S3 | Google audience comparison is conditional on configured client ID; social account lookup uses email without provider-subject matching | High identity-boundary candidate; no real provider/account exploit attempted |
| S4 | Production auth cookies use SameSite=None; inspected mutation paths have no explicit CSRF check | High candidate; actual browser/request exploitability requires controlled verification |
| R1 | Property uploads use Promise.all and fire-and-forget cleanup after rejection | Late successful uploads may outlive cleanup; reproduce with controlled deferred responses |
| R2 | Booking and agent-profile paths ignore some Supabase returned errors and perform sequential writes | Partial-success reporting/retry risk; distinguish optional conversation failure from required booking failure |
| R3 | Agent polling/send/refresh paths lack stale-response guards; some scroll timers are untracked | Reproduce selection switching, overlapping refresh/mutation and unmount scenarios |

Existing protections observed: fresh DB-backed session roles, banned/purpose-token rejection, admin route middleware, conversation participant checks, property owner checks, signed server-authoritative payment settlement, secret-protected receipt retries, upload count/size/MIME limits, Go HTTP timeouts and parameterized-query architecture. Presence is not proof of complete coverage.

## Ordered batches

### 7A — containment and assessment completion

- [ ] Owner privately establishes whether S1 credential is active; if active, rotates/revokes it and reviews access. No agent login with the exposed value.
- [ ] Owner removes tracked .env from index while retaining local file; checks staged diff without displaying credentials.
- [ ] Inspect remaining routes/controllers/repositories for role/owner/data exposure, mass assignment and failure behavior. Record paths and exact negative cases, not only middleware presence.
- [ ] Review DB grants, RLS, callable functions and Storage policies against custom application JWT identity; do not assume Supabase auth.uid() represents the application's custom session.
- [ ] Review public RPC reachability, broad grants including TRUNCATE, public agent-profile fields, and Storage list/read/write boundaries. Establish transport reachability before assigning exploit severity.
- [ ] Review frontend HTML/URL sinks, admin token storage, public build configuration, request logs and tracked secret patterns without printing values.
- [ ] Obtain advisory results for locked Node dependencies and Go modules without installation, upgrades or auto-fix. Record tool/date, failed scans and reachability rather than treating an unavailable scan as clean.
- [ ] Complete findings register with confidence, prerequisites, impact, reproduction, proposed correction, preservation constraints and acceptance cases.

### 7B — identity and attachment privacy

First write separate executable plans for social auth, cookie-authenticated requests and chat-file authorization. Source owners: backend-node/controllers/socialAuthController.js; authController.js; middleware/authMiddleware.js; server.js; repositories/conversationRepository.js; controllers/conversationController.js; frontend message attachment consumers; canonical migration additions if required.

Acceptance cases: missing/wrong provider audience and provider-subject mismatch rejected before account writes; legitimate existing/new login retained; linking an existing account requires explicit ownership evidence; cookie-authenticated cross-origin mutations rejected while legitimate browser/Bearer clients work; participant-only file delivery, outsider/anonymous denial, expired access and old-link behavior explicitly assessed. Do not silently break existing attachment history. Do not edit an already applied canonical migration.

### 7C — writes and recovery

Separate plans for property/media rollback, chat attachment persistence and booking/profile writes. Owners: controllers/property/propertyWriteController.js, repositories/propertyRepository.js, controllers/conversationController.js, controllers/agent/agentBookingController.js, controllers/agent/agentProfileController.js and agentRepository.js.

Acceptance cases: a delayed upload completing after another upload fails leaves no owned orphan; cleanup failure is observable/recoverable; message insert failure after upload has a defined cleanup outcome; required DB failures cannot produce false success; optional booking conversation failure does not falsely imply booking failure; retries do not create unintended duplicates. Any transactional SQL or changed idempotency contract gets its own reviewed design.

### 7D — frontend request lifecycle

Owner: frontend-react/src/pages/agent/Dashboard.jsx and actual-parent tests. Use deferred promises/fake timers for A-to-B conversation switching, delayed send completion, overlapping refresh/mutation and unmount. Apply current-selection/request guards and tracked timer cleanup with no unrelated UI/poll-frequency redesign. Verify drafts, successful sends, CRM stages and error recovery remain correct.

### 7E — acceptance and release decision

Run focused tests after each behavior change with demonstrated red/green evidence. Run aggregate frontend/backend suites, lint/build and Go checks after combined changes. Choose guarded integrations by actual affected contracts; retain identity/cleanup guards and no external delivery. Record exact browser scenarios and exclusions. Request independent review before release; fix findings and rerun affected checks. Owner checks new-commit CI and decides release against residual risks. No PR, merge or deploy is authorized here.

## Status

Twenty-eighth batch2026-11-04: approved payment UI configuration/quote/callback
boundary implemented. No invented display/merchant/mode; strict locked terms,
changed-fee second-click review, bounded requests, shared SDK/terminal/timer
ownership and form duplicate/draft guards. Core red25 then40green; further form/
page/stale-config6red and Review2red; focused87/87. Later unmounted submit1red
fixed, utility/form/hook55/55 and actual form+payment integration2/2 passed. Lint
passed; independent review/follow-up no actionable P1/P2. First aggregate397/401
exposed4 old MyProperties mock-contract failures; corrected fixture and focused
10/10 passed. Fresh full frontend401/401 across57 files (267.23s), lint/build
passed; existing large-chunk/Lottie-eval warnings remain.
[Evidence/limits](phase7-payment-ui-boundary.md): no real payment/provider or
backend/SQL/env/infra/Git publication change. Billing/SDK/browser acceptance and
durable ambiguous-create recovery remain separate.

Twenty-seventh batch2026-11-04: owner approved frontend diagnostic privacy.
Fixed allowlisted event utility replaces52 direct console sites across36
production files; existing ESLint guards new raw-console calls. Actual Admin
session/form/payment regressions3red/41baseline pass plus missing utility suite;
focused55/55 and fresh lint passed. Independent read-only review found no
actionable P1/P2. Full frontend347/347 across52 files (242.02s), lint/build passed.
Existing large-chunk/Lottie-eval warnings remain. Existing business
outcomes and owner-deferred password decision preserved. See
[evidence/limits](phase7-frontend-log-privacy.md).

Owner decision2026-11-04: password rotation/revocation declined after explanation;
credential containment remains owner-deferred, with exposure/activity unverified.
Do not rotate or repeatedly request rotation without new owner direction.

Twenty-sixth batch2026-11-04: owner chose spreadsheet and machine-import uses
and approved CSV/JSON report integrity design. Validated formats, explicit
columns, spreadsheet CSV trigger handling, raw projected JSON, corrected
transactions actions and truthful download outcomes implemented. Backend
20red/3pass then focused35/35; frontend10red/1pass then11/11 passed. Full backend
1320/1320 across86 suites (26.06s), independent review no actionable P1/P2.
Combined frontend334/334 across51 files (245.25s), lint/build passed. Existing
large-chunk/Lottie-eval warnings remain. Actual spreadsheet/
locale/download acceptance remains separate. See [evidence](phase7-report-export-integrity.md).

Twenty-fifth batch2026-11-04: approved platform settings integrity implemented.
Positive canonical fee validation, matching upsert results, missing-versus-error
reads and checkout fail-on-fee-error; truthful fee-only Admin UI with independent
theme and asynchronous guards. Backend29red/26pass then focused71/71; frontend
15red then15green plus malformed-load coverage. Full backend1297/1297 across85
suites (22.724s), frontend323/323 across49 files (261.94s) passed. Independent
review no actionable P1/P2. No live settings/provider/payment/schema/infra or Git
publication operation. See [evidence](phase7-platform-settings-integrity.md).

Twenty-fourth batch2026-11-04: approved Admin write confirmation and seller
request preservation implemented. Direct role/profile writes confirm matching
rows and expose owned partial409; seller creation preserves existing pending
requests and distinguishes new201 from confirmed existing200. New regressions
38red/7pass then45green; array-ID follow-up red fixed, focused109/109 and full
backend1257/1257 across84 suites (26.045s) passed. Independent read-only review
found no actionable P1/P2. See [evidence/limits](phase7-admin-write-confirmation.md).
Sequential atomicity/concurrency and production adoption remain open; no schema,
infra, frontend, credentials, provider or Git publication operation.

Twenty-third batch2026-11-04: approved controller/service privacy implemented.
Owned social403 messages preserve actual bans/link conflicts; unowned403 becomes
generic provider401. Genuine Zod issues remain structured; unexpected/forged
issues fixed400. Reviewed raw controller/repository/mail/payment logs now fixed
events/UUID-only payment context; email recipient/subject/SMTP details removed.
Strict delivery/retry/status/write-order behavior preserved. Initial7 red/46
baseline passes then53 focused green; forged-issue regression corrected. First
aggregate1208/1209 had an intentional legacy log-contract mismatch; fresh full
backend1210/1210 across82 suites (24.961s) passed after UUID privacy expectation
update. Independent review no actionable P1/P2. [Evidence/residual scope](phase7-controller-privacy.md).
No frontend rerun (last305/305), real delivery/account/DB/provider/env/dependency/
Docker/Git/deploy action. Collector/proxy/custom-message/arbitrary-metadata and
wider phase gates remain open; no whole privacy clearance.

Twenty-second batch2026-11-04: approved shared error/log privacy implemented.
Fixed public mappings/owned WeakMap metadata, generic unknown500 and stack:null
in every environment; AI safe503 preserved. Structured shared logs omit actual
URL/path IDs/query/header/body/raw errors, retaining route template/status/latency
and health-success suppression. Seven red privacy regressions then focused84/84;
actual loopback parser/ownership/logging tests and full backend1198/1198 across81
suites (23.025s) passed. Independent review no actionable P1/P2. See
[contract/evidence](phase7-error-logging.md). Per-controller/validator/proxy/
collector policy remains open; no whole logging clearance. No frontend rerun,
real logs/DB/provider/env/dependency/Docker/Git/deploy operation.

Twenty-first batch2026-11-04: approved public readiness fix implemented as a
focused handler. Canonical platform_settings HEAD/id/limit1/no exact count,
five-second actual abort and response deadline, strict SDK success and fixed503
without raw provider details. Liveness/200 success fields unchanged; failure-body
monitor contract documented in [readiness evidence](phase7-readiness.md).
Boundary11 red/3 baseline passes then14 green; actual HTTP registration/failure/
liveness cases and full backend1186/1186 across79 suites (28.07s) passed. HTTP
fixture transitive SDK setup failure corrected with synthetic client stub.
Independent review no actionable P1/P2. No frontend rerun (last305/305), actual DB/
provider/env/schema/dependency/Docker/Git/deploy action. Deployed readiness and
monitor compatibility, broader logs and other phase gates remain open.

Twentieth batch2026-11-04: approved profile input/avatar preflight implemented.
Typed known fields before repository access, canonical bounded raster input/basic
signatures/3MiB, password/email checks before upload, randomUUID owned keys/no
overwrite, safe errors/recovery and explicit partial outcomes. Picker validates
before FileReader, errors visible from every tab and partial saves displayed.
Controller16 red regressions then green; reviewer WebP high-bit P2 reproduced and
fixed with raw bytes. Full backend1170/1170 across77 suites (49.998s), frontend
305/305 across48 files (179.13s), lint/build passed. Legacy MIME expectation
updated after first frontend304/305; no unrelated assertions weakened. Independent
review no remaining actionable P1/P2 in this batch. See [evidence](phase7-profile-preflight.md).
No real Storage/SQL/provider/Docker/dependency/Git/deployment action. Prior image
smokes predate this code. Decoder/malware/pixel safety, durable reconciliation,
social reauthentication and coordinated password policy remain separate work.

Nineteenth batch2026-11-04: approved Node24 alignment completed across both
Docker Node paths, four CI jobs, .nvmrc and package/root-lock engine metadata.
Dependency graphs/versions/resolutions/integrity unchanged. Both Docker contexts
exclude private env/npmrc files; additional filtered contexts refuse symlinks.
Backend1135/1135, frontend301/301 across48 files (198.25s), lint/build and8 context/
endpoint guards passed. Actual Linux/amd64 Node24.22.2 backend/builder images and
frontend Nginx smoke passed offline: UID1000/dumb-init/imports/health/no unexpected
sockets, Nginx config/health/index/11 asset paths. Removed only new smoke
containers; all prior identities/states/networks/volumes/image IDs preserved.
Approved base/APK/locked npm downloads were inside Docker; new images/cache retained.
Independent pre/final review cleared one remote-npipe P2 after red/green tests;
no remaining actionable P1/P2 in this batch. See [runtime evidence](phase7-node24-runtime.md).
Local Node24.14.1 tests plus24.22.2 image smoke do not imply CI execution, image
CVE clearance, production rollout or whole-phase readiness. No real env/provider/
DB/host install/Git/deploy actions. This supersedes the earlier Node20 mismatch
as a prepared/local verification gate; owner release adoption remains open.

Role-request acceptance amendment2026-11-03: owner approved temporary function,
synthetic fixtures and scoped failure trigger/helper only in the existing fresh
target. Exact candidate compiled/tested under ROLLBACK; separate guarded
supplement passed23/23 real SQL/HTTP/ACL/rollback/locking scenarios. Removed exact
owned objects/fixtures; complete all19 snapshots/catalog/ledger/public triggers,
original ready/provenance/completion receipts and retained resources restored;
fresh pair stopped, volume/two networks preserved. Guard26/26 and latest full
backend1135/1135 across74 suites (25.686s) passed. Independent pre/post review no
remaining actionable P1/P2. Harness refusals/OID/OPTIONS corrections and final
read-only OpenAPI readiness are documented in [rollout evidence](phase7-role-request-rollout.md).
This supersedes the unexecuted/local-acceptance-pending status of batch18 below.
No production adoption, crash recovery/idempotency, frontend/Go/Storage/provider
acceptance, runtime/dependency upgrade, staging/commit/push/deployment occurred.

Eighteenth runtime batch2026-11-03: approved role-request transaction design
implemented as one fixed-decision repository RPC with UUID/result confirmation,
fixed conflict responses and sanitized failures; no sequential fallback. New
restricted invoker/row-lock SQL candidate is UNEXECUTED and not a migration.
Function-before-code owner adoption and real SQL/HTTP/race/rollback acceptance
remain required. See [rollout and proposed local amendment](phase7-role-request-rollout.md).
New48 cases red44fail/4 existing-gate passes then48/48; focused93/93 and full
backend1109/1109 across73 suites (28.373s). Independent review no actionable
findings. Initial existing-auth socket failures were sandbox EACCES; approved
loopback rerun passed. No DB/container/provider/config/dependency/frontend/Go/
Git/deploy action. Previous58 local acceptance cases do not cover this new RPC.
Also recorded Node20 Docker versus locked Supabase Node>=22 mismatch; no runtime
upgrade or container compatibility claim.

Seventeenth runtime batch2026-11-03: approved Apple-only signing-key transport installed once through SDK hook, fixedGET key endpoint/no redirects, real5000ms AbortController through body consumption, parent cancellation preserved and timers/listeners disposed. Global fetch unchanged; SDK cache/signature/audience behavior retained. New15 cases red15fail then15/15; focused168/168 and full backend1061/1061 across71 suites (24.371s). Independent review no actionable findings; syntax/whitespace/index checks passed. Real SDK/synthetic RSA/mock transport only; no real provider/DB/config/schema/dependency/frontend/Git/deploy action or local profiles rerun. Local Node24 used; Node20 runtime/real Apple and nonce/replay remain open. This supersedes older pending-deadline wording/counts below.

Apple continuation2026-11-03: installed SDK/source and isolated key-getter fixture confirm no explicit AbortSignal on signing-key fetch. Client/backend also lack nonce binding; no real replay exploited. Prepared [bounded signing-key deadline design](superpowers/specs/2026-11-03-apple-key-fetch-deadline-design.md), pending approval. Nonce replay needs a separate coordinated/shared-state flow and is explicitly not solved by this deadline. No runtime/full-suite/provider/config/DB changes; latest backend1046/1046 remains prior evidence.

Latest2026-11-03: sixteenth runtime batch (Facebook expected-app binding) implemented after owner approval. Mandatory backend FACEBOOK_APP_ID/SECRET (missing503), fixed debug_token inspection before /me/DB, strict expected app/USER/validity/subject/future-expiry checks, profile subject match, bounded no-redirect calls and sanitized failures. Blank examples/backend Compose references only; frontend activation/real configuration unchanged. New37 cases red35fail/2pass; focused117/117 and full backend1046/1046 across70 suites passed. Independent review no actionable findings; syntax/whitespace/index checks passed. No real provider/DB/env/schema/dependency/Git/deploy actions; real Meta/Graph-version acceptance remains open. This update supersedes older fifteen-batch/test totals below.

Scope approved; assessment/release gates remain incomplete. Twenty-eight bounded runtime batches and the rollback-tested database ACL candidate are prepared, with scoped verification recorded below. Appointment identity additionally requires an unapplied owner schema/backend-only lead-write permissions; prepared code is incompatible with old schema. Role-request code requires its unapplied function. [Current remaining-work tracker](phase7-remaining-work.md) groups the outstanding work into seven substantial packages; it supersedes the initial status wording without treating prepared code as deployed mitigation. Credential containment, private Storage/DB adoption, supported container runtime and final acceptance still require closure.

### First runtime batch — Google claim validation

Implemented on 2026-11-02 in controllers/socialAuthController.js with36 new HTTP-level mocked-boundary tests. Google login now rejects malformed/oversized credentials before verification, requires a configured audience, bounds tokeninfo requests to5 seconds, and validates returned audience/issuer/expiry/subject/email-verification claims before DB/session access. Provider errors no longer print their raw response payload. Missing audience configuration intentionally returns503; unusable claims return401; malformed credentials return400. Valid user/cookie shape and ban/admin restrictions remain.

Evidence: initial sandbox run could not open Supertest sockets (EACCES), which is not a product test failure. The unsandboxed red run produced26 assertion failures/10 passes on the previous controller. After the fix, focused Google/auth/middleware/authorization tests66/66 passed; full backend621/621 across50 files passed. No real provider/database/email request was used. A separate read-only reviewer found no actionable bounded-patch issues. Optional gaps recorded: numeric-exp acceptance, trimmed-config fallback and exact credential-length boundary tests; full cookie-option comparison beyond HttpOnly was not added here.

This closes only the implemented Google validation subtask, not S3. Email/provider-subject linking, Google email-authority rules, Facebook/Apple validation, retained tokeninfo production transport and CSRF remain open. Frontend/Go suites and real-local integrations were not rerun for this backend-only batch. No commit/push/deploy or live configuration change occurred.

Further source inspection confirms public agent endpoints intentionally expose contact/profile fields and filter detail listings to approved status; the public/contact privacy policy still needs explicit documentation. Agent CRM controllers enforce AGENT role and pass req.user.id into repository writes. These observations do not substitute for endpoint-negative tests.

### Second runtime batch — provider account identity

Implemented on2026-11-02 in the shared social helper. Exact provider+provider_id is now the primary account lookup. Matching subjects retain the stored account/email if the provider email changes. Email lookup is used only to reject signup collisions; no automatic account linking or provider reassignment occurs. Lookup/insert/avatar-update errors fail closed; avatar state changes only after successful persistence. Existing new-user BUYER signup and ban/admin session restrictions remain.

Intentional behavior change: an existing password-only/legacy/different-provider account cannot sign in through implicit email matching. It must use its original sign-in method. An explicit authenticated linking/recovery experience is not implemented. An email collision returns403 without writes/session creation. No schema or provider uniqueness constraint was added; ambiguous provider matches fail through maybeSingle, while concurrent first-time signup/duplicate identity prevention remains an assessed limitation requiring a separate database design.

Evidence: query-aware collision regressions reproduced nine incorrect200 responses on the previous shared helper across Google/Facebook/Apple. After the fix, focused social/auth96/96 passed with the initial30 new tests. Independent read-only review found no actionable introduced defects; reviewer-suggested role, missing-email and avatar-persistence cases expanded the new file to46 cases. Final full backend667/667 across51 suites passed. Syntax/whitespace checks passed; index remains empty. All OAuth/DB/email boundaries were mocked; no real provider login or hosted compatibility claim.

S3 implicit email linking subtask is addressed in code, but overall social-auth closure remains open for remaining provider-token validation, login CSRF, configuration readiness, dependency/transport decisions and real routed acceptance. Credential containment, private chat-file delivery and broad Phase7 acceptance remain open. No frontend/Go suites, real-local profiles, stage/commit/push/deploy or live changes were performed in this batch.

### Third runtime batch — CSRF request-source validation

Implemented on2026-11-02 in middleware/csrfProtection.js, mounted after cookie parsing and before body parsing/routes. Unsafe requests validate exact configured CLIENT_URL Origin; absent Origin falls back to Referer origin. Null/malformed/lookalike/wrong-port/untrusted origins are denied403, including login/admin login, form submissions and multipart uploads. Explicit bad Origin cannot be rescued by Referer/Bearer/proxy headers. Invalid configured origin fails503 for guarded requests. Source-less cookie mutations are denied unless a nonempty explicit Bearer credential is supplied without browser Fetch Metadata. Any source-less browser Fetch Metadata marker denies unsafe requests. No-source/no-session/non-browser requests retain compatibility; this allowance is intentional, not a universal missing-source rejection policy.

Safe GET/HEAD/OPTIONS are unchanged. Only exact POST /api/payment/notify (optional single trailing slash) bypasses this check; existing callback validation/signature/terms/settlement remains mandatory. Other payment routes and methods are guarded. Normal configured browser origins and explicit non-browser Bearer requests retain existing auth authority. No frontend header/payload/session change.

Evidence: actual-server red34 cases produced25 failures/9 passes on previous code; after guard focused auth/security64/64 passed. Expanded source/config cases bring this file to44 tests; full backend711/711 across52 suites passed. Independent bounded read-only guard review found no actionable introduced defects. Syntax and whitespace checks passed. Unit logout test now supplies legitimate source metadata. Guarded CRM/listings/saved-searches/Storage/login-roles/checkout fixture request helpers were adapted for intentional cookie-source requirements; fixture syntax/API availability verified, but these real-local profiles were not executed. Their prior Phase6 results do not validate this change.

Limitations: no real browser Origin/Referer/Fetch Metadata or deployment acceptance was run. Source-less legacy cookie scripts must adopt trusted Origin/Referer or Bearer. GET messaging read-receipt side effects remain outside this unsafe-method guard; review separately. XSS can defeat same-origin browser protections. Token-based CSRF options, deployment CLIENT_URL correctness and remaining provider configuration still need assessment. S4 has a tested code mitigation, not complete application-wide CSRF assurance. No live credentials/config/database/email/payment/Storage writes or Git staging/commit/push occurred.

### Fourth runtime batch — chat attachment delivery preparation

Backend upload now persists a managed chat bucket/object reference. Existing receipt-decorated message delivery (individual reads, previews and unread responses) signs valid historical/new references; send responses use the same decorator. Only configured SUPABASE_URL/chat bucket/exact message conversation UUID paths may be signed. References outside that boundary are hidden.120-second signed URLs are response-only bearer capabilities; no per-download session recheck is claimed. No row migration or object move/delete is performed. Signing failure produces null attachment_url/attachment_unavailable=true while preserving message text/success; consumer/Admin pages show an unavailable/retry hint. No permanent public fallback is emitted.

Unit utility first failed because the new module did not exist (not a reproduced old-product exploit). Separate existing-repository/controller red tests then reproduced4 failed assertions/2 passes for permanent URL persistence/read delivery and undecorated send response. Focused attachment/receipt40/40 passed after implementation. Full backend742/742 across55 suites passed. New tests total31 across3 files. Frontend full lint/build passed with existing chunk/Lottie warnings. Syntax/diff whitespace checks passed; canonical migrations and manifest are unchanged. No stage/commit/push.

Independent bounded read-only review found no actionable introduced defect. Coverage limits: previews/unread/authorized-read attachment endpoint paths were source-traced and repository-tested, not all asserted at endpoint level; anonymous send/BANNED attachment denial and invalid signer-returned URL variants lack dedicated cases. Signing is sequential, which bounds concurrency but has not been latency/load-tested on long attachment histories. No new signing timeout/circuit breaker is claimed.

S2 remains OPEN: public bucket/policies have not changed, so previously public URLs may still work. The owner [cutover/recovery procedure](phase7-chat-storage-cutover.md) contains a private-bucket/restrictive-policy review template, identity/key/policy preflight, synthetic access/expiry/cache checks and privacy-preserving recovery. It is not an applied migration. No real-local Storage stack or real browser download acceptance ran. Deployment/hosted rollout must wait for coordinated code/key/policy verification. Credential containment is independently still open.

Frontend suite verification gap for this batch: the first command included unsupported Vitest --minWorkers and ran no tests. Corrected single-thread-pool attempts inside/outside sandbox produced no results and were stopped. A single-fork-pool attempt reported native AlignedAlloc out-of-memory failure (not an assertion failure) and was stopped. Heap512MiB/semi-space4MiB, RAYON_NUM_THREADS=1 and one worker remained set. Read-only host inspection afterward found no matching workspace Vitest processes; none were killed. No further repeated full run was attempted after the native-memory evidence. Current full frontend test acceptance is pending; historical284/284 Phase6 results are not a fresh verification of these UI hints. Fresh lint/build passed as recorded above.

### Fifth runtime batch — property upload rollback timing

Implemented on2026-11-02. Photo/tour upload batches retain normal concurrent operation, photos-before-tours sequence and successful URL ordering. On the first failure, the controller now waits for every already-started sibling upload to settle before removing request-tracked attempted paths. Cleanup is awaited before forwarding the original first rejection. Failed cleanup logs property_upload_rollback_failed with sellerId/exact attempted paths using the existing logger, without logging raw Storage errors or replacing the original error. Existing roles, filenames, create payload, pending/Unpaid defaults and payment authority remain unchanged.

Evidence: seven deferred-promise tests produced4 failing assertions/3 passes on the old controller (early photo/tour cleanup, early insert-error forwarding, missing structured recovery log). After fix focused property35/35 passed, then full backend749/749 across56 suites passed. Independent bounded read-only review found no actionable introduced defects. Syntax/whitespace checks passed; index empty. Old Phase6 fire-and-forget characterization was intentionally updated to completed cleanup; the new deferred test verifies waiting rather than merely changing a mock. No new frontend edits/checks for this backend-only batch.

R1 late-upload rollback race is addressed within the tested controller lifecycle, not globally closed. Real-local Storage verification has not been run. Stalled uploads/cleanup can still stall the request; no transport abort/timeout, durable retry queue or process-crash guarantee is introduced. Logs support operator recovery only. Chat attachment insert-failure cleanup, partial booking/profile writes, public-bucket cutover, credentials and fresh frontend/browser acceptance remain open. No live/Storage/database/env/dependency changes, stage/commit/push or deploy occurred.

### Sixth runtime batch — required/optional agent write outcomes

Implemented on2026-11-02. Agent profile user-update returned errors now stop before profile writes/success responses. Empty profile results cannot report success; repository profile lookup errors cannot fall through to insertion. A later profile failure after a successful user write logs agent_profile_partial_write with agentId only and forwards the original error. No compensating overwrite of potentially concurrent user changes is attempted.

Booking requires a returned lead before optional conversation work. Returned errors at conversation lookup/create/message stages are handled like thrown optional failures: stop subsequent optional work, retain the existing persisted booking201/lead/success text, and emit booking_conversation_recovery with stage and exact lead/agent/buyer identifiers only. Missing created conversation is also treated as optional failure. New logs exclude raw database errors/contact details/notes. Guest/self/role behavior and write sequence remain unchanged.

Evidence: new11 tests produced8 failures/3 passes on old behavior, then11/11 passed. Broader agent/booking32/32 passed; full backend760/760 across58 suites passed. Independent bounded read-only review found no actionable introduced defects. Syntax/whitespace checks passed; index empty. Existing characterization intentionally changed from ignored user-write error to successful required write and from raw exception log to sanitized recovery event. No frontend run/change for this batch.

R2 is only partially addressed. Separate user/profile writes remain non-atomic. Zero-row user-update confirmation, ambiguous commits, retry idempotency/concurrent conversation creation and durable recovery require separate design. Optional review coverage gaps: empty profile result after successful user write, no-row conversation creation and existing-conversation message success lack dedicated new assertions. Existing logs do not automatically repair partial writes. No real-local/hosted bookings/messages/DB writes, migration/env/dependency changes, stage/commit/push/deploy occurred. Earlier credential/Storage cutover and frontend acceptance gates remain open.

### Seventh runtime batch — Agent chat lifecycle

Implemented on2026-11-02 in the existing Dashboard parent, retaining extracted panels/state authority. Selection now synchronously invalidates the prior request session, clears old displayed messages and permits the new selection's own send state; selecting the same object is a no-op. Poll/read/send completions may commit only to an active session with the latest read version. Old sends skip stale refresh/toast/finally updates. Poll/send scrolling shares a tracked timer cleared on selection change/unmount; a late read after unmount cannot schedule another timer. Existing4000ms polling including off-tab activity, FormData trimming/immediate draft clearing and same-chat send failure behavior remain unchanged.

Evidence: existing chat baseline5/5 passed; seven new deferred/fake-timer cases all failed on old code (red7 failed/5 passed), then focused Agent page37/37 across5 files passed. Full frontend291/291 across46 files passed (156.65s) with one thread worker, heap512MiB/semi-space4MiB and RAYON_NUM_THREADS=1. Full frontend lint/build passed with existing bundle/Lottie warnings. Independent bounded read-only review found no actionable introduced defects. All three pipeline/modal/messages selection prop paths were source-traced to the guarded callback. No real network/account/message/browser session was used. Read-only process inspection while the aggregate run was quiet confirmed the workspace Vitest process was active; the run then completed normally.

This fresh aggregate result supersedes the frontend suite gap recorded in batch4, including the two small attachment-unavailable hints in the combined workspace. It does not create dedicated hint/browser/download tests or private Storage acceptance. Previous failed/stopped runner attempts remain part of the history; no runtime/config/dependency change was made to obtain this result.

Coverage limits: same-object reselection, stale rejected-send toast suppression, pipeline/modal wrapper invocation and pending poll at send start lack dedicated new assertions. No request abort, overlap suppression, backend send idempotency, account-switch isolation or dashboard/CRM refresh generation guard is introduced. Real browser/routed acceptance remains pending. This batch does not close all R3 risks. Backend was not rerun for frontend-only changes; last backend evidence remains760/760 from the previous batch. Credential/private-bucket and broader Phase7 gates remain open.

### Eighth runtime batch — Agent dashboard refresh generations

Implemented on2026-11-02 in the existing Dashboard parent. Auth/load effect creates an active dashboard session; cleanup invalidates it. Fetches commit snapshots/errors/loading flags only for the latest active read version. Beginning a status/delete mutation invalidates older reads, tracks pending mutations and sets refreshing state. Required refreshes are deferred/coalesced until all pending writes settle; status success/failure retains refresh, delete failure/cancellation retains no-refresh behavior. Old/inactive mutations cannot toast/update UI or launch reconciliation into a newer session. Successful deletion cannot be undone by an older in-flight snapshot. Endpoints/payloads/confirmation/defaults/layout/module boundaries remain unchanged.

Evidence: seven new real-parent deferred tests all failed on old behavior; focused Agent/CRM/chat44/44 across6 files passed after fix. Full frontend298/298 across47 files passed in162.74s with one thread worker/512MiB heap/semi-space4MiB/RAYON_NUM_THREADS=1. Full frontend lint/build passed with existing bundle/Lottie warnings. Independent bounded read-only review found no actionable introduced defects. Diff whitespace/index checks passed. No backend/Go rerun or real network/account mutation occurred for this frontend-only batch.

Remaining limits: same-lead/server-side write ordering is not serialized; no request cancellation or transactional server snapshot is introduced. Optional review coverage gaps are auth-session replacement during mutation, mutation completion after unmount, delete-failure refreshing release/no-refresh assertion and mixed overlapping status/delete outcomes. Real browser, private Storage cutover and credential containment remain open. The earlier chat lifecycle result remains separate; this data-session guard does not establish chat/auth-account-switch isolation.

### Ninth runtime batch — Apple audience and provider input boundaries

Implemented on2026-11-02. Apple login now rejects malformed/nonstring/blank/oversized id_token before SDK access, requires trimmed APPLE_SERVICES_ID (missing/blank503 before SDK/DB), retains installed SDK signature verification with explicit audience/expiration options, and checks returned audience/Apple issuer/finite future expiry/subject/email/email_verified before account lookup. Facebook gets the same credential shape/8192-character bound and a5000ms Graph profile request timeout. Apple/Facebook failure logs now use fixed messages without raw SDK/provider response/error payloads. Public example config adds blank Google/Apple client identifier fields; local .env files are unchanged. Existing shared account identity/cookie/role behavior remains.

Evidence: new34 cases red25 failed/9 passed, focused social/auth121/121 passed, full backend794/794 across59 suites passed. Independent bounded read-only review found no actionable introduced defects. Syntax/whitespace checks passed; index empty. Existing cross-provider account fixtures use/restored synthetic Apple audience/issuer. No real provider credentials/accounts/emails/network calls were used in tests. Frontend/Go suites were not rerun for this backend-only batch; last frontend result remains298/298 from batch8.

S3 remains open for Facebook expected-app token binding, Apple nonce/replay/auth-code flow, SDK key-fetch timeout and real provider/deployment readiness. Official Meta docs were unavailable/429 through the browsing tool; no debug_token implementation or new app secrets were invented. Apple official search guidance and installed SDK source were checked (audience omitted would omit that verifier restriction); Apple markdown endpoint was tool-unsupported. Frontend Facebook/Apple buttons currently report not configured and were not activated. Optional review gaps include malformed/missing Apple payload claim variants, numeric-exp success and exact input boundary tests; role restrictions remain covered through shared-identity fixtures. No database/schema/env/dependency or stage/commit/push/deploy changes occurred.

### Tenth runtime batch — confirmed agent rows/concurrent role guard

Implemented on2026-11-03. Required user profile update now selects only id/single and verifies the authenticated target ID before writing agent profile. Resubmission confirms agent profile row identity, then applies REJECTED_AGENT→PENDING_AGENT only when the current database role still matches REJECTED_AGENT, and confirms returned user ID. No unconditional fallback can overwrite a concurrent ban/approval/other role change. If the earlier profile write completed but role transition fails, agent_resubmission_partial_write logs agentId only and preserves the original error.

New source-confirmed finding S5: resubmission's prior unconditional role write could overwrite a concurrent BANNED/AGENT/BUYER role with PENDING_AGENT. Query-aware regression cases reproduced each exact overwrite. New12 cases initially red11 failed/1 passed; refined three concurrency cases explicitly reported expected original role vs actual PENDING_AGENT. After fix focused agent40/40 passed and full backend806/806 across60 suites passed. Independent bounded read-only review found no actionable introduced defects. Syntax/whitespace/index checks passed. Positive characterization fixtures now provide confirmed row IDs; no negative expectations weakened.

This addresses the agent-profile zero-row confirmation limitation recorded in batch6 and S5's tested role-overwrite path. Profile/user writes remain non-atomic: profile changes can precede a rejected role transition. No compensating overwrite, generalized ban enforcement across all writes, ambiguous-commit guarantee or durable recovery is introduced. Optional coverage gaps: wrong/missing returned user ID specifically after resubmission, returned profile error identity, thrown role-query rejection. No real-local/admin/account/DB actions, frontend/Go rerun, schema/env/dependency change, stage/commit/push/deploy occurred. Last frontend evidence remains298/298 from batch8. Credential/private Storage/OAuth/real-browser and broader Phase7 gates remain open.

### Session lifecycle investigation — S6, subsequently approved in batch11

2026-11-03. New high-priority finding: pre-reset session JWTs remain authorized after a successful password reset. A fixture-only Node proof ran the real resetPassword/protect/optionalAuth with synthetic secret/user/DB/repository hooks and observed resetStatus200, storedHashChanged=true, preResetSessionStillAuthorized=true and preResetOptionalIdentityStillAttached=true. No real environment/account/secret/email/database was used. Current session tokens carry identity/role/one-day expiry but no password credential binding; reset-token single use does not revoke access sessions.

[Concrete proposed design](superpowers/specs/2026-11-03-password-session-revocation-design.md) recommends schema-free credential-bound version2 session claims shared by every issuer/validator, with no password-hash exposure. To close legacy-token exposure immediately, rollout must require all existing users/admins to sign in once again. Temporary legacy acceptance would retain S6 until those tokens expire. This compatibility change needs an explicit owner decision under the existing preserve-behavior/major-change agreement. No runtime code/token policy has changed for this investigation. Latest test results remain806/806 backend and298/298 frontend from earlier batches, not rerun for documentation/proof only.

### Eleventh runtime batch — approved credential-bound sessions

Owner approved the version2/one-time re-login policy on2026-11-03. Implemented shared sessionToken helper, domain-separated HMAC credential binding with explicit stored string/null state, required version/stamp/HS256 checks and timing-safe comparison. All registration/password/social/Admin session issuers use it; social signup selects its actual stored credential internally. protect/optionalAuth read current hash internally and strip it from req.user; /me uses the existing protected identity rather than a second token authority. Legacy/purpose tokens cannot become current sessions. No schema/env/dependency/JWT-secret changes.

Successful reset CAS invalidates previous sessions on their next check and clears browser cookie. Confirmed Profile password update refreshes current cookie and returns a replacement only for Admin/explicit Bearer clients. Consumer remains HttpOnly; normal edits/failed writes do not rotate. Reset UI clears public/Admin stale state; current Admin profile update refreshes its cached token. Existing role/ban/Bearer precedence/public fields remain.

Evidence: actual reset/change/middleware red7 failures/3 passes then10/10 green; helper/issuer tests and valid-token fixture migration culminated in full backend831/831 across63 suites. Initial full run had12 saved-search fixture failures due to missing explicit credential state; fixed fixture null, not production fallback. An issuer-test dependency mock was corrected after setup refused missing Supabase config. UI red2 failures/4 passes, corrected async test act timing, focused6/6 green; full frontend301/301 across48 files passed (176.41s). Full lint/build and syntax/whitespace/index checks passed; existing chunk/Lottie warnings remain. Independent bounded server/fixture and frontend reviews found no actionable introduced defects.

Guarded real-local: verified DB/REST loopback identities/images/network, marker/checksums/ledger and read-only snapshot; ran40 login/role/reset/password-change/Admin cases. First39/40 failed before the reset request due to a fixture undefined Origin; exact cleanup/state/ledger passed. Corrected only fallback metadata; final40/40 passed with actual hash CAS/revocation/fresh cookie/Bearer flows. All seven exact run users removed; complete starting users snapshot and canonical ledger preserved. Only the two retained DB/REST containers were started and stopped (confirmed exited); volumes/containers preserved, Storage/Auth/unrelated containers unchanged, external mail/gateway forbidden. Other guarded/browser profiles were not rerun; their application token fixtures were migrated/syntax-checked. Checkout-browser hashes stay server-side and are excluded from public/browser fixture objects; infrastructure JWTs unchanged.

S6 mitigation is verified in the prepared combined code/local scope, not deployed. [Owner rollout/recovery](phase7-session-rollout.md) requires coordinated issuers/validators/frontend, one-time sign-in and retirement/protection of old serving revisions. No commit/push/CI/deploy/live account/credential change occurred. Limitations: browser logout alone does not revoke copied current tokens; no session registry, retroactive in-flight cancellation or cross-tab state sync is added. Optional coverage gaps remain for unsupported-algorithm HTTP cases, signup-null path through full social issuer, profile fallback password rotation and storage-failure UI branches. Real browser/deployment acceptance, credential containment, private chat Storage and broader Phase7 gates remain open.

## Advisory snapshot — 2026-11-02

### Facebook app-binding preparation — 2026-11-03

Revisited S3 after primary Meta source became accessible: current official token-probe source describes separate app-authorized debug_token inspection; archived official SDK validates app/subject/expiry. Main developer docs still inaccessible/429; no current production compatibility claim. Isolated controller proof returns200/session with no expected app config and no token inspection, using synthetic token/secret and mocked provider/DB. Initial proof transitively initialized dotenv; no values/live calls occurred; corrected harness blocks it and repeated the result. Prepared [bounded Facebook design](superpowers/specs/2026-11-03-facebook-app-binding-design.md), pending approval. No runtime/env/schema/provider/account changes or tests rerun. Existing1009/1009 backend and58/58 local acceptance remain prior evidence.

### Fresh committed-schema acceptance completed — 2026-11-03

Owner approved the new local DB/REST target and explicitly amended its network to a separate loopback bridge after the internal-only network suppressed actual publication. Guards refused missing runtime bindings; stopped-endpoint NetworkID handling was corrected without relaxing running checks. All retained stacks were preserved; no deletes/resets. Reviewed cached image/minimum official Storage SQL bootstrap avoided a legacy role cycle and supplied bucket-limit columns. The unchanged canonical CLI chain resumed its pending baseline after the failed transaction; exact two-entry ledger/checksums verified. Separate purpose/nonce test SQL committed hardening plus owner FK/index only on the fresh DB; rollback candidate guards were not stripped.

Results: new real HTTP7/7 grouped cases plus CRM10/listings32/saved5/checkout4 =58/58. Each profile preserved all19 table/catalog/ledger starting state after exact cleanup. Full backend1009/1009 across69 suites (19.534s), including26 environment/network guard cases; ready replay verified current ledger/hash/catalog without DDL replay. Independent pre-action/final reviews found and resolved replay/prestart/privilege-coverage issues; final reviews had no actionable findings. First HTTP attempt failed setup due to missing fixture price; all19 cleanup checks still passed, and only the fixture was corrected. Completion verified zero application rows, retained container identities/states and volume/network lists, then stopped the new pair; new volume/two networks retained. Private evidence untracked; index empty. No image/dependency/tool install, live/provider/real account/.env/baseline/Git/deploy action. [Readable evidence and limits](phase7-local-acceptance.md).

This closes bounded local committed ACL/appointment/favorites HTTP acceptance, not production adoption. The original CRM launcher still refuses old stack-c schema; new-target CRM10/10 is current evidence. Storage API/private cutover, real OAuth/browser, deployed Go/consumer compatibility, credential containment, future role defaults, remaining assessment/recovery and owner CI/release remain open. Frontend/Go were not rerun for this test-tool-only batch; older frontend301/301 and the Go verification limitation remain recorded.

### Committed-schema acceptance preparation — 2026-11-03

Prepared [fresh local acceptance proposal](superpowers/specs/2026-11-03-phase7-disposable-acceptance-design.md): separate DB/REST containers/new volume/network/59322+59321 loopback bindings, independent guards, synthetic data, offline bootstrap provenance, reviewed test-target committed SQL and exact cleanup. Read-only Docker/image/listener inventory confirms cached images/no proposed listener reported; all rechecks required before creation. No resources started/created, schema/data/env/runtime changes or tests rerun. Explicit approval needed for this new infrastructure/test-database persistence boundary; existing rollback-only candidate guards must not be stripped or falsely reused for commits. Live adoption/private Storage/OAuth/deployed Go/CI gates remain open.

### Fifteenth runtime batch — approved favorites publication boundary (S8)

Owner approved2026-11-03. Favorite tuple lookup uses current account/user ID and maybeSingle; actual errors fail before property access/write. Existing favorites remain removable after withdrawal without private property lookup. New additions require exact approved status; own-approved400 retained. Collection uses properties!inner(*)/properties.status=approved plus user_id and defensively filters missing/non-approved nested values. Response/public field shape retained. No status-based stored-favorite deletion or concurrency serialization.

Evidence:19 new actual-controller/repository cases red12fail/7pass; focused39/39; full backend983/983 across68 suites (17.087s). Positive old authorization fixtures updated for explicit approved status/new lookup ordering without weakening404/own400 assertions. Independent bounded review no actionable findings. Syntax/whitespace/index checks passed. No real DB/API/provider/schema/env/dependency/frontend changes or stage/commit/push/deploy; no guarded-local/frontend/Go rerun. Actual PostgREST inner relationship/browser acceptance and stronger foreign-tuple/withdrawal-sequence tests remain open. Existing unapplied appointment schema dependency/release gates remain unchanged.

### Alternate endpoint inventory — S8 favorites publication bypass

2026-11-03. Traced remaining favorites/saved-search/feasibility/inquiry/analytics/payment route boundaries and consolidated [endpoint inventory](phase7-endpoint-inventory.md). Confirmed S8: favorites additions/read lack publication restriction, allowing a known pending listing ID to be saved and returned despite normal detail404. Fixture-only real-controller sequence observed add200/read200 with pending private fixture contact data; all repositories mocked, no real DB/account/network. Prepared [bounded favorites design](superpowers/specs/2026-11-03-favorites-publication-boundary-design.md), pending approval. No runtime/schema changes or full test reruns. Broader profile input/avatar, admin role-request races, analytics public-field policy and raw logging remain assessed follow-ups, not closed controls.

### Fourteenth runtime batch — prepared appointment account ownership (S7)

Owner approved2026-11-03 code/schema-candidate preparation/mocked verification. Booking now supplies req.user.id as a separate trusted owner argument (guest NULL); list/delete always filter nonempty buyer_id and never email. User-supplied body owner cannot impersonate. Added unapplied isolated-only nullable UUID FK/index candidate/no historical email backfill. Candidate and CRM preflight require backend-only direct lead writes; trusting a client-writable owner column would otherwise leave a forgery path. Current CRM refuses missing owner schema/retained direct-write grants before snapshots/API/fixtures, preserving old ledger guards. New code is incompatible with old-schema booking/appointment operations; coordinated owner schema-before-code and separate committed acceptance are mandatory, not completed.

Evidence:19 ownership cases red19fail; guard2red after correcting incomplete unrelated JWT mock; focused95/95 across6 files and full backend964/964 across67 suites (17.072s) passed. Independent bounded review no actionable findings. Syntax/whitespace/index/two-file migration checksums passed. No schema/candidate execution/container/local-integration/provider/frontend/env/dependency/stage/commit/push/deploy. Earlier guarded CRM10/10 predates this change and is not current acceptance. See [rollout gates](phase7-appointment-owner-rollout.md). Actual FK/index/deletion behavior, committed PostgREST relationships, frontend history/guest handling and owner retention confirmation remain open. S7 is prepared mitigation, not deployed closure.

### Appointment ownership investigation — S7, 2026-11-03

High-priority source/fixture finding: account appointment reads/cancellation authorize with mutable/unverified email rather than account ID. getBuyerAppointments ignores userId; deleteBuyerAppointment uses lead_id+client_email. Password signup/profile email changes have no mailbox verification. A guest email not already registered can therefore be claimed by an account and used as appointment authority. Actual repository fixture showed only email predicates/read returned guest lead/delete succeeded; no live account/data/network used. Public agent detail role/approved-listing restrictions and route-wide Admin middleware were also source-traced; no blanket endpoint-audit clearance.

Prepared [stable appointment owner design](superpowers/specs/2026-11-03-appointment-owner-identity-design.md), pending approval: nullable authenticated buyer_id, no historical email backfill, ID-only account access, guest/historical agent management preserved. Requires separately owner-applied schema/compatible test environment; no runtime or migration changes. Missing-email unbounded list risk must fail closed in implementation. This is a substantive open finding, not optional coverage polish.

### Thirteenth runtime batch — approved bounded chat send recovery

Owner approved2026-11-03. Repository-proven returned statement rejections (23502/23503/23514/22P02/42501) can now clean only the exact request-owned confirmed upload, with conversation UUID/generated-name/fixed-bucket validation. Per-invocation WeakMap wrapper avoids shared error mutation/reuse authority; thrown/unknown/timeouts/single-row/unique conflicts remain uncertain and retain files with sanitized recovery metadata. Cleanup awaited; failure logs safe metadata and preserves original insert error. Confirmed message row/conversation required before success. Post-insert timestamp failures now log recovery and return201; committed messages/files survive timestamp/signing errors. No durable queue/idempotency/cross-service atomicity added.

Evidence:35 new actual-controller/repository cases red27 failed/8 passed; focused recovery/access/repository41/41 green. Full backend943/943 across65 suites passed (17.425s) after initial sandbox aggregate hit266 EACCES socket failures/677 passes. Independent bounded review found no actionable defects. Syntax/whitespace/index checks passed. All new DB/Storage boundaries mocked; no live/local DB/Storage calls, schema/env/dependency/frontend changes, stage/commit/push/deploy. No frontend/Go or guarded-local rerun. Optional thrown-timestamp/AGENT-mapping/encoded-path cases remain; actual Storage acceptance/durable recovery and existing Phase7 release gates remain open.

### Chat send recovery investigation — 2026-11-03

Fixture-only real-controller proof observed committed message followed by timestamp failure returning forwarded error/no201; uploaded file followed by rejected insert has no cleanup step in source. No real DB/Storage/account/network used. Prepared [bounded recovery design](superpowers/specs/2026-11-03-chat-send-recovery-design.md): confirmed-message timestamp failures become secondary/logged, definite returned statement rejections can clean exact request-owned uploads, ambiguous outcomes retain files. Pending owner approval; no runtime change/full test rerun. Full idempotency/durable recovery and private Storage cutover remain separate open gates.

### Remaining-work assessment — 2026-11-03

Added [remaining-work tracker](phase7-remaining-work.md): twelve prepared code batches, rollback-tested DB candidate, seven substantial open packages. Refreshed stale top-level status; no unsupported completion percentage. Initial frontend sink search found no searched raw HTML/eval constructs, but URL/admin-storage/logging audit remains incomplete. Confirmed tracked Go.env filename without reading values. govulncheck absent. Go test attempt was silent/stopped without result; explicit offline/local-toolchain escalated retry failed before tests: installed Go1.26.2 versus required>=1.26.10. No tool/dependency install or module change. Existing Go acceptance/advisory gate remains open; previous Node/frontend/integration results unchanged. No runtime/live/schema/env/Git mutation.

### Combined affected-flow local regression — 2026-11-03

After the session/CSRF/agent/chat/AI batches, reran affected guarded profiles sequentially against verified retained stack-c DB/REST, with512MiB heap/semi-space4MiB. Results: CRM10/10, listings32/32, saved searches5/5, checkout4/4; total51/51. Each launcher verified container/workdir/checksum/DB/API/marker/ledger identity and exact synthetic fixture cleanup, then complete starting/ending table snapshots: respectively10/5/6/11 tables plus canonical ledger. External mail/gateway/provider delivery forbidden/mocked. Detailed listings/saved-search/checkout logs remain private/untracked under docs/evidence; CRM result observed directly in tool output. No failed scenarios or fixture/state drift reported.

Only retained DB/REST containers were started/stopped; Storage/Auth/volumes untouched. No runtime/schema/env/dependency changes, stage/commit/push/deploy. These runs exercise existing retained database permissions; candidate ACLs were not committed/applied and hardened HTTP acceptance remains open. Browser/Storage/receipt-worker profiles not rerun in this batch. Latest full mocked backend evidence remains908/908; frontend301/301 from the earlier session batch, not a fresh frontend run. Credential containment, private chat cutover, deployed role/consumer compatibility and remaining whole-phase gates remain open.

### Twelfth runtime batch — approved AI tool input boundary

Owner approved the bounded AI validation/error-sanitization design on2026-11-03. Strict independent Zod schemas plus plain-object checks now validate model-produced arguments before either database tool. Literal Unicode locations/types retain Sinhala/Tamil joiners, spaces/apostrophes/periods/hyphens; filter grammar, wildcards, unknown keys, malformed shapes and invalid prices are rejected with fixed structured tool errors/no DB calls. Zero price is applied. Unknown tool names cannot reach a DB tool. Approved property/agent role filters, projections, five-row caps, model/guest access and regular replies retained. Query/provider failures now become fixed safe503 errors/logs rather than forwarding raw exceptions; this is an intentional error-behavior change.

Evidence: focused77 cases red69 failures/8 passes, initial implementation76/77 exposed Sinhala joiner compatibility, corrected to77/77. Full backend908/908 across64 suites passed (17.762s). Independent bounded review found no actionable defects. Syntax/whitespace checks passed and index empty. All SDK/DB interactions in new tests mocked; no real Gemini/DB/account/env/schema/dependency/frontend change, stage/commit/push/deploy. No frontend/Go rerun. Optional gaps: prototype-named unknown tools, agent-specific returned/thrown query errors, missing-key sanitization. Provider deadlines/output budgets, real Gemini/PostgREST acceptance and broader data-sharing/auth audit remain open. Existing credential/Storage/deployed database/session release gates remain open.

### Gemini tool boundary investigation — 2026-11-03

Source review confirms bounded HTTP message/history and two fixed backend read tools, but no validation of model-produced tool args. Fixture-only proof invoked real aiController with mocked SDK/DB: response200, raw location filter grammar accepted and object maxPrice forwarded to DB builder. No real Gemini/DB/env/account used. This is a query-input trust gap, not a demonstrated unapproved-row/SQL bypass; status=approved remains an independent condition. Proposed bounded validation/literal-search/error-sanitization design saved in [AI tool boundary](superpowers/specs/2026-11-03-ai-tool-input-boundary-design.md), pending approval. No runtime changes or full test rerun. Broader AI deadlines/output cost/data-sharing/logging audit remains open.

### Approved database ACL candidate — 2026-11-03

Follow-up consumer/Go compatibility: owner identifies Admin Dashboard/Gemini chat with uncertainty about implementation; source confirms both use Node, with Gemini receiving selected backend tool results rather than database credentials/arbitrary SQL access. Go directly queries properties and needs16 columns/spatial functions/RLS-compatible visibility, not the two public application RPCs. Added [same-role diagnostic/runbook](phase7-map-database-compatibility.md); SQL validated on isolated local service_role with all16 columns and PostGIS EXPLAIN, no application row output/writes. Marker/ledger unchanged; DB/REST restored stopped, no other services changed. Actual deployed Go identity and external inventory remain open. No runtime/env/schema/Git mutation or full test rerun.

Owner approved backend-only access for19 application tables/five exact application RPCs and rollback-only local verification. Candidate and guarded runner documented in [database review](phase7-database-access-review.md). Baseline red on direct privileges; candidate green across eight table/four column privilege types, raw PUBLIC ACLs, effective anon/authenticated/RPC denial, preserved service-role grants and synthetic agent/lead operations. Negative runner-flag refusal and explicit moderation-column grant removal passed. Complete19-table data/catalog/identity/ledger restoration passed after rollback, including failed baseline. No persistent database changes. Independent review/follow-up found no actionable defects. Syntax/checksum/whitespace checks passed; index empty. Only retained DB/REST started/stopped; no Storage/Auth/volume changes. Not packaged/applied as a migration; committed hardened HTTP behavior, external consumers/Go-role compatibility/default privileges and owner rollout remain open. Existing Phase7 gates remain open.

### Database access source review — 2026-11-03

Continued the remaining database/RPC inventory in [database access review](phase7-database-access-review.md). Confirmed baseline excess non-DML grants across15 public tables, anonymous lead INSERT policy, all-row agent profile SELECT including moderation rejection_reason, and ownership-free authenticated sales-history insertion policy. Remote reachability/current deployed drift remain unverified; application custom JWTs must not be equated with Supabase authenticated identities. The two public application RPCs are invoker functions, and baseline properties RLS has no policy, so public EXECUTE alone is not a demonstrated row-access bypass. Payment RPC service-role restrictions remain present.

Added and subsequently executed a catalog-only read-only SQL evidence collector on verified isolated stack-c. Existing identity preflight passed;19 public relations/25 policies/27 default ACL entries collected. Effective anon TRUNCATE confirmed across15 tables. Anonymous local agent_profiles moderation-column query with limit=0 returned200/empty array; leads OPTIONS advertised POST, with no insert attempted. The two anon-executable application functions are invoker functions. Private raw catalog evidence remains untracked under docs/evidence. Marker/ledger identity rechecked, no application data or business RPC queried by the collector. Only retained DB/REST containers started then stopped; Storage/Auth/volumes untouched. No ready-to-apply corrective migration, baseline/schema/policy/data/env/runtime changes or full test reruns. Deployed reachability, direct-write acceptance and compatibility inventory remain open before a reviewed owner-applied migration. Existing credential containment, Storage cutover and release gates remain open.

Read-only npm audit completed against the registry after the sandbox's first backend attempt failed DNS resolution. No installation, auto-fix or lockfile change was performed.

| Scope | npm audit result |
| --- | --- |
| Backend omit=dev | 0 reported vulnerabilities |
| Frontend omit=dev | 0 reported vulnerabilities |
| Backend including development dependencies | 19 affected-package entries: 3 low, 16 moderate, 0 high/critical |
| Frontend including development dependencies | 11 affected-package entries: 2 low, 9 moderate, 0 high/critical |

Counts include transitive/meta-vulnerability entries, not independent exploit counts. Reports include minimatch glob amplification (GHSA-g3hv-75wg-m249), frontend deepmerge prototype poisoning (GHSA-gcqx-w48m-w2h4), and backend Jest/coverage dependency chains. Some suggested fixes entail major downgrades; do not run audit fix --force. Tooling reachability, exact remediation compatibility and development-environment exposure remain to be assessed. Zero reported production advisories does not prove application security.

govulncheck was not found on PATH; Go vulnerability scan remains unperformed. No tool was installed. SQL review also identified broad anon/authenticated table grants including TRUNCATE and a public search RPC; grants alone are not evidence of a remotely reachable exploit. Assess Data API/RPC reachability and effective privileges in a guarded environment before closure.
