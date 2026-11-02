# Phase 6 Profile due-diligence presentation implementation plan

> For agentic workers: use executing-plans for this approved bounded extraction; root coordinates review. No git mutations.

**Goal:** Make checklist presentation and static copy independently discoverable with identical behavior and content.

**Architecture:** DueDiligencePanel({ checkedItems, onToggleCheckItem }) renders the exact existing inner JSX using the six source-derived objects exported by dueDiligenceItems.js. ProfileSettings retains all 37 non-render statements, checklist state/toggle handler, query/tab ownership and direct keyed motion wrapper.

**Tech Stack:** Existing React, lucide-react, Vitest and Testing Library; no dependencies.

## Global constraints

Preserve all existing work. No backend/auth/environment/database/CSS/token/dependency changes or git mutations. Preserve every original key, title, description (including Sinhala), order, native clickable div, class, Check icon and handler argument. This preserves existing text without asserting current legal accuracy. Private baseline and AST evidence stay under docs/evidence/phase6-profile-due-diligence/ and untracked.

## Task 1: Characterize original parent

- [x] Preserve ProfileSettings.before.jsx and run existing four profile files (50 scenarios).
- [x] Add src/pages/ProfileSettings.dueDiligence.test.jsx using actual parent and unmocked presentation. Assert six original items/order/copy and checked defaults (extractSearch/surveyPlan true), native div semantics, title/description/indicator/card bubbling, independent multiple toggles, tab/query retention with unchanged reads/no mutations, and defaults on a fresh mount.
- [x] Run the five profile files before extraction; this approved refactor uses existing-behavior characterization rather than artificial failing product tests.

## Task 2: Exact presentation extraction

- [x] Create src/components/profile/dueDiligenceItems.js by moving the exact inline array, without normalization/freezing.
- [x] Create src/components/profile/DueDiligencePanel.jsx from original inner space-y-6 div, import Check and the items, and rename only toggleCheckItem invocation to onToggleCheckItem.
- [x] Replace only inner JSX with <DueDiligencePanel checkedItems={checkedItems} onToggleCheckItem={toggleCheckItem} />; remove only unused parent Check import.
- [x] Compare parsed non-render statements against preserved source (37 identical); run five focused files, focused ESLint and git -c core.fsmonitor=false diff --check.

Run from frontend-react with $env:RAYON_NUM_THREADS='1':

```powershell
node --max-old-space-size=512 --max-semi-space-size=4 node_modules/vitest/vitest.mjs run src/pages/ProfileSettings.test.jsx src/pages/ProfileSettings.integration.test.jsx src/pages/ProfileSettings.panels.test.jsx src/pages/ProfileSettings.calculator.test.jsx src/pages/ProfileSettings.dueDiligence.test.jsx --maxWorkers=1 --pool=threads
node node_modules/eslint/bin/eslint.js src/pages/ProfileSettings.jsx src/components/profile/DueDiligencePanel.jsx src/components/profile/dueDiligenceItems.js src/pages/ProfileSettings.dueDiligence.test.jsx
```

Root owns browser parity, maps/checkpoint, aggregate suite/build and independent review. Owner retains staging/commit/push.


## Bounded implementation evidence

- Existing four files against original parent: 50/50, 18.04s.
- Original parent with eight checklist characterizations: five files 58/58, 23.08s.
- Extracted presentation/content with the same tests: five files 58/58, 24.48s.
- Focused ESLint parent, panel, content and test: exit 0.
- Private AST report: 37 before/37 after non-render statements, identical.
- git -c core.fsmonitor=false diff --check: exit 0 (existing unrelated MyProperties.integration.test.jsx line-ending warning).
- Root browser parity, aggregate gates, maps/checkpoint and reviews remain pending at implementation handoff.

Root acceptance2026-11-01: aggregate195/195 across29 frontend files; full lint and production build exit0.12 base and12 settled interaction screenshot pairs pixel-identical, with matching DOM/computed styles/layout and observed card hover. Independent spec/quality reviews approved. Maps/checkpoint updated; fixture stopped, listener closed, viewport reset and task tab closed. Owner controls stage/commit/push; whole Phase6 remains in progress.
