# Phase 5 Saved searches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Verify existing saved-search persistence, ownership, matching coordination and rendered UI success/failure behavior.

**Architecture:** Extend the fixed local integration launcher with one saved-searches profile and complete table snapshots. Exercise real DB/API/matcher/admin paths while replacing only email delivery with spies; add rendered frontend tests without production changes.

**Tech Stack:** Existing Node/CommonJS, Jest/Supertest/pg, Express/Supabase JS, React/Vitest/Testing Library and retained stack-c PostgreSQL/PostgREST.

## Global Constraints

- No production changes without a reproduced defect and bounded proposal; no dependencies, migrations, application .env, live writes, real email, worker activation, payment, Storage access, deployment or git mutations.
- Owner keeps commit/push; keep evidence/private credentials untracked and index empty.
- Reuse fixed stack-c identity/loopback/checksum/ledger guards and allowlisted child environment. Port5000 remains blocked; do not permit58323 for this profile.
- Run heavy checks sequentially, using existing dependencies. Start/stop only the inspected retained DB/REST; preserve containers, originals, volumes and config.
- Cleanup exact run-owned searches before properties/users; assert all six complete app-table snapshots and canonical ledger preserved even after assertion failure.

### Task 1: Real saved-search integration

**Files:** Modify `backend-node/integration/run-local.cjs`, `database-state.cjs`, `backend-node/tests/integrationState.test.js`; create `backend-node/integration/run-saved-searches.cjs`, `saved-searches.jest.config.cjs`, `saved-searches.setup.cjs`, `saved-searches.integration.cjs`.

**Interfaces:** Consume `runLocal(profileName)`, `snapshotState(client,names)`, `validateDatabase(identity)`, `identitySql`, `allowedAppPorts`. Produce fixed profile entry and independently runnable explicit integration suite. Existing profiles retain their table lists and delivery boundaries.

- [x] Add a pure test requiring `snapshotState(client,['saved_searches'])` to query complete rows ordered by id; run focused Jest and observe current unsupported-table failure before adding its allowlist entry.

```js
const client = { query: jest.fn().mockResolvedValue({ rows: [{ snapshot: [{ id: 'search', filters: { version: 1 } }] }] }) };
expect((await snapshotState(client, ['saved_searches'])).saved_searches).toEqual([{ id: 'search', filters: { version: 1 } }]);
expect(client.query).toHaveBeenCalledWith(expect.stringContaining('FROM public.saved_searches t'));
```

- [x] Add `saved_searches:'id'` to the static snapshot allowlist. Add the profile with tables users/properties/saved_searches/transactions/payment_orders/payment_receipt_outbox. Wrapper/config follow existing fixed launchers:

```js
// run-saved-searches.cjs
require('./run-local.cjs').runLocal('saved-searches');
// saved-searches.jest.config.cjs
module.exports = { rootDir: '..', testMatch: ['<rootDir>/integration/saved-searches.integration.cjs'],
    setupFiles: ['<rootDir>/integration/setup.cjs', '<rootDir>/integration/saved-searches.setup.cjs'],
    testTimeout: 15000, verbose: true };
```

- [x] Setup overrides only emailService with inert saved-search and seller-status spies; do not replace matching/controller/repositories or relax transport/worker guards. Invalid payload logs may remain visible.
- [x] Seed unique users/login cookies, own properties/searches; cleanup own searches first, properties next, UUID/email users last. Recover API inserts using owner IDs. Revalidate identity before seeding and cleanup; use parameterized SQL and explicit ownership assertions. Complete before/after snapshots are the independent preservation check.
- [x] Test POST/GET legacy/default and full criteria, zero values/polygon/type derivation, ignored owner spoof, isolated list/order, duplicate records, invalid input unchanged, anonymous/banned rejection, owner alert on/off persistence, malformed/missing/foreign toggle, missing/foreign/repeated DELETE preserving unrelated rows.
- [x] Test actual matcher with persisted joined users: full/legacy matches, location and criterion nonmatches, disabled/deleted searches, alert toggle effect, exact captured recipient/title/property. Test actual admin approval once/repeat and rejected delivery promises without breaking other captures/approval. Use a bounded predicate wait for detached coordination, and scope counts by unique fixture titles.

```js
expect(response.status).toBe(201);
expect((await db.query('SELECT user_id,filters FROM public.saved_searches WHERE id=$1',[response.body.savedSearch.id])).rows[0])
    .toEqual({ user_id: users.BUYER.id, filters });
expect(sendSavedSearchAlertEmail.mock.calls.filter(([, title]) => title.startsWith(run))).toEqual([
    [users.BUYER.email, matchingTitle, expect.objectContaining({ id: propertyId })],
]);
```

- [x] Run `npm test -- --runInBand tests/integrationState.test.js` (pass), `node integration/run-saved-searches.cjs --preflight` (read-only pass), profile twice (all expected assertions and six snapshots/ledger pass). Direct config without launcher must refuse before writes. Report product failures without weakening desired assertions or changing production.
- [x] Package test/harness diff and obtain task review for spec compliance and quality; resolve actionable findings with focused rechecks.

### Task 2: Rendered saved-search interactions

**Files:** Create `frontend-react/src/components/map/MapTopBar.integration.test.jsx`, `frontend-react/src/pages/ProfileSettings.integration.test.jsx`. Reuse existing map-hook replay tests. No product files changed.

**Interfaces:** Controlled `api.post/get/patch/delete` spies, `MemoryRouter`, rendered MapTopBar/ProfileSettings. Consume the existing saved-search payload/route-state contracts.

- [x] Render full-filter save with effective cap; assert exact serialized payload and success feedback. Add no-boundary, prompt cancel,401 and503/general failure cases without successful-save feedback. Stub dialogs/toasts and restore mocks/DOM after every test.
- [x] Render saved-search list using mocked API only. Cover alert toggle success and rejected promise rollback, delete success removal and failure retention, run-search navigation carrying full persisted criteria/zero values. Assert visible UI changes and requests, not only internal helpers. Avoid real map/network/animation services.

```jsx
fireEvent.click(screen.getByRole('button', { name: 'Toggle email alerts for this saved search' }));
await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/saved-searches/s1/alerts', { emailAlertsEnabled: false }));
await waitFor(() => expect(screen.getByText('Email alerts on')).toBeTruthy()); // rejected request rollback case
```

- [x] Run `npx vitest run src/components/map/MapTopBar.integration.test.jsx src/pages/ProfileSettings.integration.test.jsx src/hooks/useMapSearch.test.jsx --maxWorkers=1` twice, then focused ESLint. Package diff and obtain task review. Report any product defect before changing behavior.

### Task 3: Regression, report and final review

**Files:** Update `backend-node/integration/README.md`, this plan; create `docs/phase5-saved-searches.md`.

- [x] Run Login/roles and Listings integration profiles sequentially, then backend `npm test -- --runInBand`; frontend `npm test -- --maxWorkers=1`, `npm run lint`, `npm run build`. No Storage rerun unless a relevant shared guard change warrants it; existing guard suites must pass.
- [x] Record exact fresh results, native table preservation, controlled email boundary and actual supported API contracts/limits. Obtain final aggregate review using a package of changed/new files; reviewer need not rerun unchanged passing tests.
- [x] Stop only inspected retained REST/DB and verify state. Run `node docs/evidence/phase5-final-scan.cjs` plus `git diff --check`, verify index empty; evidence remains untracked. Mark completed checkboxes only after corresponding output proves them. No commit/push.
