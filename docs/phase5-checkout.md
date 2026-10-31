# Checkout resume checkpoint

## Completed checkout batch

**Status: COMPLETE within the approved scope. Phase5 is now6/6 flows complete.** This section supersedes historical pending/deferral/environment notes below. Owner retains commit/push; base edc93e6 with new uncommitted completion changes. The normal hosted application and user data were not changed.

| Acceptance | Final evidence |
| --- | --- |
| Real API repeatability |4/4 twice; eleven full table snapshots and canonical ledger preserved after both runs |
| Visa SELLER |Genuine signed status2 callback HTTP200; order paid/property Paid; moderation pending unchanged; one transaction/one pending outbox |
| Mastercard AGENT |Same exact settlement invariants, separate order/payment/provider reference |
| Cancellation |Actual embedded gateway close triggered production hook private-Draft feedback; order pending/property Unpaid; no transaction/outbox |
| Documented decline |Official Insufficient Funds card displayed Payment Declined; signed status-2 callback HTTP200; order pending/property Unpaid; no transaction/outbox |
| Final fixture cleanup |Session19492 exit0; listeners closed, exact fixtures removed, all eleven complete snapshots and canonical ledger matched |
| Test service shutdown |Retained DB/REST/Storage each confirmed exited; containers/volumes/originals retained |
| Final regressions |Backend41 suites436/436; frontend26 files144/144; full lint/build exit0 |
| Review |Focused recovery/hook/harness reviews approved; final code review no blocker; acceptance gaps subsequently closed |
| Final hygiene |15 changed/new non-evidence files credential/whitespace clean; git diff --check pass; index empty; all five harness/recovery files syntax-valid; temporary5000/5173 listeners confirmed closed |

Final database assertions checked both success orders/callbacks and exact transaction/outbox counts, both unpaid cases and unchanged moderation, signed decline callback and exactly two inert receipt-drain boundary calls. Raw evidence is private: checkout-completion-final-status, checkout-completion-cases, checkout-completion-backend/frontend JSON, API repeat log, recovery-run records and screenshots. Raw callback bodies remain private and must never be staged. No SMTP delivery occurred.

Implemented changes: optional complete HTTPS VITE_PAYHERE_NOTIFY_URL validated before order creation; compatible fallback retained. Actual .env files untouched. Harness order registration now captures originalUrl/method before mounted Express routing (two actual routed-response assertions failed before correction). Recovery supports exact retained bcrypt password validation, rejects malformed/same-run journal ambiguity and requires eleven saved baseline hashes before committing exact cleanup. Interrupted seller and native-allocation-start fixtures were recovered with fullHashCompared=true. Original journals retained/backed up.

Focused hook32/32; combined response/recovery/guard/lifecycle12/12 pass. Final aggregate commands used bounded Node512MB/semi-space4MB, one Vitest thread/native Rayon worker, sequentially. Full lint exit0 and Vite build exit0 (existing large-chunk/Lottie direct-eval warnings). Initial sandbox temporary-directory and Windows native-allocation failures are environment failures, not product assertion failures. Browser launcher now supplies fixed child memory/worker bounds; no Windows settings changed. Only inherited blank-line trailing spaces were removed after the final aggregate; no semantic source changes followed verification. Final docs review accepted completion within the approved scope. All agent-created checkout tabs were closed; the owner's merchant portal/tunnel were left alone.

Browser distinction: Chrome embedded gateway/nested frames stayed blank. Visa/Mastercard used the observed actual official form URLs in separate tabs, producing genuine signed callbacks. The in-app browser rendered the actual embedded SDK/nested card form; cancellation and decline were performed there. Decline Return to Site caused SDK advisory completion; the hook showed awaiting server confirmation and did not claim Paid. Normal full seller wizard and universally functioning Chrome embedded checkout are not established by this batch. Full --seller-ui/photo transport remains outside this completion claim. These limits remain visible; automated tests are not represented as comprehensive deployed E2E.

No new dependencies/schema/normal environment/tunnel settings, hosted writes, real payments/cards, real email, worker activation, staging/commit/push/deployment. Existing hosted authorized orders and normal callback configuration need a separately controlled provider/configuration workflow; no manual Paid toggle. Next roadmap priorities are separate from Phase5 closeout. Remote CI for these uncommitted changes is unavailable until the owner pushes; latest pushed edc93e6 remote result was not independently rechecked.

Official test-card reference checked during the batch: [PayHere Sandbox & Testing](https://support.payhere.lk/sandbox-and-testing). It documents simulated sandbox processing and the exact success/Insufficient Funds test scenarios used.

## Historical execution notes (superseded by completion above)

## Active completion continuation — 2026-10-31

Owner resumed Checkout and approved docs/superpowers/specs/2026-10-31-checkout-completion-design.md. Changes are uncommitted on version-3.0 after edc93e6; owner retains git actions.

- Interrupted seller fixture recovery passed with exact users absent, zero orders removed, all eleven persisted baseline hashes and canonical ledger matching. Original journals backed up privately. Recovery now supports bcrypt by checking the retained exact disposable password and rejects incomplete baselines/malformed created journals; focused independent review approved.
- Hook supports optional complete HTTPS VITE_PAYHERE_NOTIFY_URL, validates explicit values before creating an order and preserves old fallback when absent. No actual .env changed. Meaningful regression failures observed before fix; hook32/32 and focused lint pass. Independent focused review approved.
- Harness callback404 root cause reproduced: mounted Express routers shorten req.path during res.json, skipping order registration. Tracker captures originalUrl/method before routing. Actual routed-response tests failed twice before correction; combined response/recovery/guard/lifecycle12/12 passed. Focused review approved; callback signature and known-order guards remain intact.
- Real checkout API profile4/4 twice; eleven complete snapshots and ledger preserved after both runs.
- First new browser launch failed in native allocation before payment. Its exact fixtures recovered afterward with fullHashCompared=true. Current launcher bounds child heap512MB/semi-space4MB and native Rayon workers1; subsequent launch succeeded.
- Current active browser session19492 is the minimal approved harness (not seller wizard), sandbox only, local DB/REST, delivery disabled. Public ngrok sentinel matches current run via system HTTP client; Node external fetch reports UND_ERR_SOCKET, other side closed. Private session/journal files identify exact run; never replay an earlier callback.
- Embedded gateway/card frames still remain about:blank. Opening their observed official URLs in separate tabs loads the actual sandbox form. Visa form handed to owner for card entry; awaiting result. This workaround does not establish a functioning embedded dialog or seller wizard. Mastercard/cancel/decline and final aggregates/cleanup remain pending. Do not mark Phase5 complete.

When resuming, inspect this active session before starting a new one. If session19492 is alive, use status/stop; otherwise exact recovery requires latest journal and eleven hashes. Payment tab is a user handoff. No normal app/tunnel settings, hosted data, email or worker changed.

Confirmed user-run checkout root cause (2026-10-31): read-only request to the running Vite-served usePayhere module showed VITE_API_URL=http://localhost:5000. The production hook derives notify_url from this setting, so actual notification destination is http://localhost:5000/api/payment/notify, unreachable by PayHere servers. Ngrok current request history was empty. User screenshots show sandbox Authorized payments while actual UI shows the synthetic listing Drafts(Unpaid). This user-run app uses the normal seller account/data, not the earlier isolated seller fixture; do not claim local fixture isolation or delete its listing. Fix direction: separate public webhook URL from browser API base, set sandbox notify to the verified ngrok HTTPS URL, retain signature validation; existing authorized orders require verified provider callback reconciliation, not a manual Paid toggle or another payment. No configuration/data change made in this diagnosis.

URGENT RESUME: seller session10564 exited1 with pg Connection terminated unexpectedly during stop, without preservation PASS. Exact seller/agent and seeded property fixtures may remain; cleanup/baseline comparison NOT verified. Do not start another fixture or overwrite current private journal. Existing recovery script assumes not-a-login-hash, while seller mode uses bcrypt hashes, so it must not be blindly run. Restore memory/DB connectivity, validate current journal and exact IDs, then recover with the persisted eleven baseline hashes. No new user-created property/payment was submitted.

2026-10-31 seller UI batch: --seller-ui mode added; actual local seller login and dashboard verified. Mock land entered through step3, but actual UI requires a photograph and media transport is forbidden. No property submission/payment yet. Next: isolated disposable photo transport plus focused coverage/review of new seller guard paths, then fresh UI session and user payment handoff. Existing focused guard/lifecycle6/6 and syntax checks passed. Session10564 stop requested. Shell later failed CreateProcessWithLogonW1455 (memory/pagefile capacity), so avoid more workers until resources recover. Local-only dummy login is in private evidence; do not reuse after cleanup.

Updated 2026-10-30 (Asia/Colombo). Phase 5 remains 5/6 flows complete. Checkout browser verification is incomplete. Owner retains staging, commit and push.

## Verified before pause

- Real checkout API: 4/4 twice; eleven complete application snapshots and canonical ledger preserved.
- Hook: 17/17. Frontend aggregate: 129/129; lint and build passed.
- Backend aggregate on this continuation: 39 suites, 430/430 tests passed (29.076s), including the final hash helper test. Latest focused guard/lifecycle tests: 6/6.
- Browser fixture uses the actual production hook and sandbox SDK, isolated local DB/API, scoped ngrok callback ingress, and disabled receipt delivery. Existing application environment and tunnel settings were unchanged.

## Browser attempts and pause

First attempt crashed with Node/Vite out-of-memory before card entry. Exact owned fixtures were recovered and the ledger verified. That initial journal lacked baseline hashes, so full pre-crash snapshot comparison was unavailable. The recovery explicitly records fullHashCompared=false.

The subsequent attempt used reduced Vite dependency scanning and persisted baseline hashes. Public health and hook adapters passed verification. Starting Visa created a pending order, but the PayHere iframe remained loading. No card details were entered and no genuine settlement was verified.

At the user's stop request, browser fixture session 22361 exited successfully after closing its listeners and removing its exact fixtures. All eleven complete snapshots and the canonical ledger matched. The agent-created checkout tab was closed; the user's PayHere tab and ngrok were left alone. Do not reuse that session, gateway request or fixture IDs.

## Current continuation

After the owner opened the apps, exact retained DB/REST containers were started and the read-only checkout preflight passed container/DB/API/marker/checksum/ledger checks. The existing ngrok HTTPS origin and localhost:5000 target matched the guard. Storage stayed stopped. No new fixture or payment was started.

Browser control is currently blocked: Computer Use reports "native pipe is unavailable" (Windows error 2). A lightweight retry and JavaScript kernel reset/reinitialization did not recover it. Browser actions were not attempted. The pending backend aggregate passed 430/430, then the retained DB/REST services were stopped. Next resume requires restoring the Codex browser/computer-use connection before starting a new fixture.

Next bounded batch: inspect retained stack-c DB/REST identities and bindings, start only those services if stopped, verify the existing tunnel and free listeners, then launch a fresh guarded browser fixture. Verify its public health sentinel and transformed hook adapters before payment. Investigate the gateway iframe loading with observed browser evidence before changing code or settings.

Pending manual cases: sandbox Visa success, Mastercard success, cancellation and documented decline. Success requires a genuine signed callback plus local order/property/transaction/outbox evidence; browser completion alone is insufficient. After the batch, close listeners, remove only owned fixtures, compare snapshots/ledger, save results and stop test services. No hosted DB writes, real email, real cards, staging or push.
`n2026-10-31 diagnostic batch: browser control restored; fresh public ngrok health passed. Embedded PayHere checkout and nested card iframe stayed about:blank. Opening observed iframe URLs as top-level pages loaded the gateway and official dummy Visa form. Simulated Visa submission displayed Payment Completed, but status showed no callbacks, pending order, Unpaid property, zero transactions/outbox. This does NOT satisfy checkout success. Direct iframe navigation may affect provider parent-frame completion; diagnose this before further attempts. Session98609 stopped exit0: eleven complete snapshots/ledger preserved and exact fixtures removed. Test DB/REST stopped. Mastercard/cancel/decline remain untested.
`nCallback diagnosis correction: ngrok retained a POST for the exact Visa order with status_code=2, expected merchant and exact random callback path; response was plain Not Found (HTTP404). Thus the provider DID send a callback; the prior no-callback conclusion referred only to the harness accepted-callback array and was incomplete. The public bridge rejects requests before recording callbacks, so next diagnostic must inspect its allowPublic inputs/known-order registry with sanitized reason flags. Do not replay the old callback: its fixtures were already cleaned. No new fixtures or production changes in this diagnostic pass.
