# Phase5 CRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development for the bounded CRM implementation and review. Owner forbids git mutations; omit generic commit steps.

**Goal:** Prove and,where necessary,correct the existing agent CRM lifecycle for direct and conversation leads.

**Architecture:** Fixed real local CRM profile using existing isolation harness,plus rendered AgentDashboard tests with service-boundary mocks. Reproduce defects before minimal path-specific production fixes.

**Tech Stack:** Existing Jest/Supertest/pg,Express/Supabase JS,React/Vitest/Testing Library and retained stack-c.

## Global constraints

One CRM batch only;no dependencies,migrations,app.env,live writes,emails,worker activation,Storage,real payments,deployment or git staging/commit/push. Keep private evidence untracked. Fixed loopback stack-c only;block5000/58323/external access. Exact-owned cleanup and ten complete snapshots/ledger after success/failure. Heavy checks sequentially. Use focused tests while iterating;one final backend/frontend aggregate run per final implementation,repeat only for relevant failures/changes.

### Task1: Integrated CRM test/fix deliverable

**Files:** Extend `backend-node/integration/run-local.cjs`,`database-state.cjs`,`backend-node/tests/integrationState.test.js`;create `backend-node/integration/run-crm.cjs`,`crm.jest.config.cjs`,`crm.integration.cjs` and `frontend-react/src/pages/agent/Dashboard.integration.test.jsx`. Only reproduced defects may require bounded `backend-node/repositories/agentRepository.js`,`backend-node/tests/crmOffer.test.js` or `frontend-react/src/pages/agent/Dashboard.jsx` changes.

**Interfaces:** Consume `runLocal(profileName)`,`snapshotState(client,names)`,`identitySql`,`validateDatabase`,`allowedAppPorts`. Produce `crm` fixed profile with ten tables and explicit config. Preserve every existing profile's table list and transport/delivery restrictions.

- [ ] Add pure snapshot tests for leads/conversations/messages/message_receipts;observe unsupported-table red,then add static key mappings. Include deterministic composite receipt ordering.

```js
const client={query:jest.fn().mockResolvedValue({rows:[{snapshot:[]}]})};
await snapshotState(client,['leads','conversations','messages','message_receipts']);
expect(client.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY message_id,user_id'));
```

- [ ] Add fixed CRM profile/config/wrapper. Use base `setup.cjs` unchanged: all email and workers forbidden. Explicit integration configs remain excluded from default discovery.

```js
// run-crm.cjs
require('./run-local.cjs').runLocal('crm');
// crm.jest.config.cjs
module.exports={rootDir:'..',testMatch:['<rootDir>/integration/crm.integration.cjs'],
  setupFiles:['<rootDir>/integration/setup.cjs'],testTimeout:15000,verbose:true};
```

- [ ] Revalidate identity,seed two approved agents and representative consumer/admin/pending/rejected/banned accounts with real login cookies. Create owned image-free properties,property/support conversations,latest/older messages and receipt fixtures. Guest booking creates direct lead through actual endpoint. Use short synthetic notes to respect existing lead_source varchar100.
- [ ] Test combined normalized GET/order/latest message/empty/isolation,all five stages for both sources,metadata and partial update persistence,role/auth/foreign ownership/invalid input preservation and deletion/repeat/missing/cascade behavior. Retain real desired assertions on product failures; do not modify schema or silently skip failing behavior.

```js
expect(response.status).toBe(200);
expect((await db.query('SELECT lifecycle_status,timeframe_to_move,pre_approval_status FROM public.leads WHERE lead_id=$1',[leadId])).rows[0])
  .toMatchObject({lifecycle_status:'Offer',timeframe_to_move:'1-3 Months',pre_approval_status:true});
```

- [ ] Render dashboard with controlled API and user context. Assert stage PUT and post-reload visible result,error recovery including open lead detail,delete confirm/cancel/success/failure and unauthorized redirect. Use real component and independent expected data;no real polling/maps/network. Wait on observable effects rather than fixed sleeps.
- [ ] Parent runs initial real CRM and focused frontend tests sequentially,captures relevant error output. If defects reproduce,implement minimal corrections only after preserving failing cases. Keep role/owner predicates/API shape unchanged;patch only supplied metadata,do not reset omitted lifecycle;restore authoritative modal/card state on failed mutation. Add focused repository regression assertions as needed,then rerun changed tests.
- [ ] Cleanup exact own receipts/messages/conversations/leads,then properties and individual UUID/email users;recover API inserts via exact agent owners;verify full ten snapshots/ledger after failure too. Direct config without launcher must refuse before fixtures. Run final CRM twice,focused rendered tests twice and focused lint.
- [ ] Package CRM-only diffs with baseline copies of modified tracked files and new tests;obtain bounded spec/quality/safety review. Resolve actionable findings with covering checks,without unrelated refactoring or repeated full suites.

