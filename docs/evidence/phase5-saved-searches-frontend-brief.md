# Phase 5 Saved searches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify existing saved-search persistence, ownership, matching coordination and rendered UI success/failure behavior.

**Architecture:** Extend the fixed local integration launcher with one saved-searches profile and complete table snapshots. Exercise real DB/API/matcher/admin paths while replacing only email delivery with spies; add rendered frontend tests without production changes.

**Tech Stack:** Existing Node/CommonJS, Jest/Supertest/pg, Express/Supabase JS, React/Vitest/Testing Library and retained stack-c PostgreSQL/PostgREST.

## Global Constraints

- No production changes without a reproduced defect and bounded proposal; no dependencies, migrations, application .env, live writes, real email, worker activation, payment, Storage access, deployment or git mutations.
- Owner keeps commit/push; keep evidence/private credentials untracked and index empty.
- Reuse fixed stack-c identity/loopback/checksum/ledger guards and allowlisted child environment. Port5000 remains blocked; do not permit58323 for this profile.
- Run heavy checks sequentially, using existing dependencies. Start/stop only the inspected retained DB/REST; preserve containers, originals, volumes and config.
- Cleanup exact run-owned searches before properties/users; assert all six complete app-table snapshots and canonical ledger preserved even after assertion failure.

### Task 2: Rendered saved-search interactions

**Files:** Create `frontend-react/src/components/map/MapTopBar.integration.test.jsx`, `frontend-react/src/pages/ProfileSettings.integration.test.jsx`. Reuse existing map-hook replay tests. No product files changed.

**Interfaces:** Controlled `api.post/get/patch/delete` spies, `MemoryRouter`, rendered MapTopBar/ProfileSettings. Consume the existing saved-search payload/route-state contracts.

- [ ] Render full-filter save with effective cap; assert exact serialized payload and success feedback. Add no-boundary, prompt cancel,401 and503/general failure cases without successful-save feedback. Stub dialogs/toasts and restore mocks/DOM after every test.
- [ ] Render saved-search list using mocked API only. Cover alert toggle success and rejected promise rollback, delete success removal and failure retention, run-search navigation carrying full persisted criteria/zero values. Assert visible UI changes and requests, not only internal helpers. Avoid real map/network/animation services.

```jsx
fireEvent.click(screen.getByRole('button', { name: 'Toggle email alerts for this saved search' }));
await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/saved-searches/s1/alerts', { emailAlertsEnabled: false }));
await waitFor(() => expect(screen.getByText('Email alerts on')).toBeTruthy()); // rejected request rollback case
```

- [ ] Run `npx vitest run src/components/map/MapTopBar.integration.test.jsx src/pages/ProfileSettings.integration.test.jsx src/hooks/useMapSearch.test.jsx --maxWorkers=1` twice, then focused ESLint. Package diff and obtain task review. Report any product defect before changing behavior.

