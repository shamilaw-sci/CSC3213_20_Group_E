# Phase5 payment receipts checkpoint

Date:2026-10-30 (Asia/Colombo). Baseline:version-3.0/8625cbb with prior Phase5 work retained uncommitted. Owner controls staging/commit/push. This batch covers payment receipt emails only;message read receipts and checkout remain outside it.

## Scope and implementation

Test-only changes add a fixed receipts profile,exact-order RPC/mail scope,real DB/RPC/queue/template integration and retry-controller authorization tests. No production changes were needed. Existing profile settings,base dotenv/network guards and ten-table snapshot implementation are unchanged. No dependencies,migrations,app.env,Storage or hosted data changes.

One UUID/example.test seller,five uniquely titled image-free properties and five sandbox/dummy-merchant orders are generated per run. Actual local settle_listing_checkout RPC creates receipt outbox/transaction rows;the same settlement repeated leaves one outbox and transaction. These are synthetic DB prerequisites,not PayHere/browser/webhook/card tests.

Actual paymentReceiptQueue.drain and emailService rendering execute against checked DB/REST. Only nodemailer is inert:it captures envelope/HTML without SMTP. Exact registered order UUIDs are mandatory before queue work and before claim/settle RPC forwarding;missing/null/foreign scope and unrelated RPCs are rejected. Captured recipients must be registered example.test addresses. Test dummy sender/password/client URL are local to this child. Other email exports and worker.start remain forbidden. No background worker,cron or actual global sweep is activated.

## Fresh evidence

| Check | Result |
| --- | --- |
| Guard test before helper | Missing-helper RED observed |
| Focused scope/retry/queue tests | 3suites,26/26pass |
| Read-only real preflight | Verified stack-c DB/REST/API/marker/checksums/ledger |
| Real receipt run1 | 6/6pass;2.46s |
| Real receipt run2 | 6/6pass;1.658s |
| Both real runs | Ten complete app snapshots and canonical ledger preserved after exact cleanup |
| Bounded receipts-only review | Spec pass;quality clear;no actionable findings;no tests rerun by reviewer |
| Full backend | 37suites,423/423pass;6.972s |
| Direct receipts config without launcher | Expected refusal before tests/writes;Verified integration launcher required;0tests |
| Shutdown/hygiene | DB/REST/Storage all confirmed exited;resources retained;78 changed/new non-evidence files credential/whitespace clean;index empty;private evidence untracked/unstaged |

Real cases prove settlement/outbox idempotence;exact recipient,subject,title and Rs.1,234.56 email content;sent timestamp/attempt state;sent retry no resend;concurrent same-order drains one capture;SMTP rejection and missing credentials retain a protected lease;owned expiry permits retry;stale acknowledgement cannot mark a newer lease sent;worker/unscoped drains/unrelated mail remain forbidden. Expected synthetic failure logs remain visible.

Retry-controller tests use mocked dependencies/drain only:missing configuration503,missing/wrong/session authorization401,exact dummy bearer200 and downstream failure propagation. The authorized no-argument call is a MOCK,never a real unscoped claim. Existing queue tests now cover acknowledgement errors leaving durable retry state.

## Preservation and delivery limits

The parent compares complete users,properties,saved_searches,transactions,payment_orders,payment_receipt_outbox,leads,conversations,messages,message_receipts and canonical migration ledger after child success/failure. Every cleanup predicate ties exact order/property IDs to generated UUID/email owner. Outbox/transactions/orders are removed before properties/users,including partial setup recovery. No broad delete,reset or native Storage write occurs.

Normal sent retries and active leases prevent duplicate captures. This is **at-least-once delivery**,not an exactly-once SMTP guarantee:the stale-ack test captures once,changes the exact fixture's lease,proves the old acknowledgement cannot overwrite it,then expires the owned lease and captures again on retry. Delivery with uncertain acknowledgement can therefore duplicate an email. No outbox/lease/provider architecture change is claimed or included.

No real email,PayHere/ngrok/browser payment,manual demo or remote CI was run. Frontend has no changed receipt surface in this batch;its full tests/lint/build were intentionally not repeated. Prior frontend results remain historical CRM evidence,not fresh receipt results. Native SMTP transport deliverability,rendering in email clients and full RLS behavior are not established by captured envelopes.

## Resume

Receipt batch acceptance is complete within this scope. Five of six Phase5 flows have scoped acceptance;checkout is the only remaining flow. Use docs/phase5-checkpoint.md for the next session. Keep private logs/config under untracked docs/evidence and let the owner commit/push. No staging,commit,push or deployment was performed.
