# Checkout resume checkpoint

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
