# Phase5 payment receipts Implementation Plan

> **For agentic workers:** Use subagent-driven-development for this single bounded deliverable and one review. Owner prohibits git mutations;omit generic commit steps.

**Goal:** Prove payment receipt generation,content,lease/retry behavior and retry authorization without delivery.

**Architecture:** Dedicated fixed receipts profile,exact-order test transport scope,real DB/RPC/queue/rendering and inert nodemailer capture. Ten complete app snapshots/ledger provide independent preservation.

**Tech Stack:** Existing Node/Jest/pg/Supabase JS/nodemailer,retained stack-c;no new dependencies.

## Global constraints

Receipts only;no PayHere/ngrok/browser/cards,message-read receipts,SMTP,backgroundworker/cron,Storage,live changes,deps/schema/app.env/deploy/git mutations. Manual drain is allowed only for registered synthetic order IDs with captured mail. Never invoke a real unscoped sweep. Keep fixed numeric-loopback/5000/external guards and ten full snapshots after success/failure. Exact-owner cleanup;private evidence untracked. Heavy checks sequentially;focused iterations,one final backend aggregate;frontend unchanged,do not rerun it without cause.

### Task1: Scoped receipt integration and retry access

**Files:** Extend only `backend-node/integration/run-local.cjs`;create `run-receipts.cjs`,`receipts.jest.config.cjs`,`receipts.setup.cjs`,`receipt-scope.cjs`,`receipts.integration.cjs` under that directory,plus `backend-node/tests/receiptScope.test.js`,`paymentReceiptRetryAccess.test.js`. Extend existing paymentReceiptQueue.test.js only if acknowledgement error coverage is absent. No production changes unless a reproduced defect warrants a bounded correction.

**Interfaces:** Existing runLocal(profileName),directRestUrl,allowedAppPorts,identitySql/validateDatabase and full ten-table snapshots. New makeReceiptScope returns mutable orders/recipients Sets and assertOrder/assertRecipient/wrapFetch guards;no credentials or arbitrary targets accepted.

- [ ] Add guard tests first:registered UUID passes;null/undefined/foreign/malformed scope refuses before forwarding;wrong endpoint/recipient refuses;allowed claim/settle retains base checked transport. Observe missing-helper red,then implement minimal test-only helper. Preserve all existing profile entries and guard behavior.

```js
const scope=makeReceiptScope();scope.orders.add(id);
expect(()=>scope.assertOrder(null)).toThrow();
expect(()=>scope.assertOrder(id)).not.toThrow();
```

- [ ] Add receipts fixed profile with same ten table list as CRM,wrapper calling runLocal('receipts'),config using base setup then receipts.setup. Dedicated setup overrides only scoped queue/real receipt email and inert nodemailer. Worker.start and other email exports throw. Test dummy EMAIL_USER/PASS/CLIENT_URL may be set only here. Global fetch wrapper inspects RPC args against scope before passing to original checked fetch.

```js
module.exports={rootDir:'..',testMatch:['<rootDir>/integration/receipts.integration.cjs'],
 setupFiles:['<rootDir>/integration/setup.cjs','<rootDir>/integration/receipts.setup.cjs'],testTimeout:15000,verbose:true};
```

- [ ] Seed unique seller/example.test identities,known image-free property/order IDs with sandbox/dummy merchant terms. Register IDs before actual RPC/drain. Actual settlement RPC enqueues one receipt and repeat settlement leaves one row/transaction. Verify recipient,title,amount before email rendering. Never generate checkout hashes/webhooks or use hosted credentials.
- [ ] Test scoped real queue success/sent retries,concurrent same-order drains,SMTP rejection/lease protection/owned expiry/retry,missing dummy credentials,stale lease acknowledgement and no baseline delivery. Assert captured subject/recipient/HTML/decimal amount and full row state,not just status code. Add pure queue acknowledgement-failure case if needed;record possible at-least-once duplicates honestly.

```js
await drain(order.id);
expect(await outbox(order.id)).toMatchObject({status:'sent',attempts:1});
expect(sendMail.mock.calls[0][0]).toMatchObject({to:fixtureEmail,subject:expect.stringContaining('Payment Receipt')});
```

- [ ] Add isolated controller retry tests with mocked queue/settings/property/order dependencies:missing configuration503,invalid/missing/session authorization401,correct dummy bearer200 exactly one unscoped MOCK call,downstream error to next. Restore env each case. Never use that real endpoint for an authorized global DB sweep.
- [ ] Cleanup exact owned outbox/transactions/orders before properties/users;recover all fixtures after setup/assertion failure with owner-qualified SQL. Revalidate identity before writes/cleanup and parent snapshot all ten tables after either outcome. Direct config without launcher must refuse before fixtures.
- [ ] Parent coordinates real preflight and two real suites;focused guard/access/queue tests as needed. Preserve exact errors for any failure;no assertion weakening or unrelated fixes. Package receipts-only diff/newfiles and get one bounded spec/quality/safety review.

