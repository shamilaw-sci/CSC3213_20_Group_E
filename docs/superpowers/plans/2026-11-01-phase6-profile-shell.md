# Phase 6 Profile shell implementation plan

> For agentic workers: use executing-plans for this approved bounded extraction; root coordinates review. No git mutations.

**Goal:** Extract header, summary cards and tab presentation with identical behavior and appearance.

**Architecture:** Stateless ProfileHeader({user,avatarUrl,onAvatarChange,onExploreListings,onFindAgents,children}) keeps summary children at the original location. ProfileSummaryCards({appointmentCount,favoriteCount,savedSearchCount,unreadMessagesCount,onTabChange,onMessages}) and ProfileTabs({userRole,activeTab,appointmentCount,favoriteCount,savedSearchCount,onTabChange}) render original markup. Parent retains all state, 37 non-render statements, effects, handlers, routing and keyed panels.

**Tech Stack:** Existing React, lucide-react, framer-motion, Vitest, Testing Library.

## Global constraints

No backend/auth/environment/database/CSS/token/dependency or git mutations. Preserve classes, text, icons, native semantics, role checks, tab order, file input and activeProfileTab motion location exactly. Characterize existing behavior before extraction; no artificial failing product tests for this approved refactor.

## Task 1: Characterization

- [x] Preserve original source in docs/evidence/phase6-profile-shell/ProfileSettings.before.jsx.
- [x] Add frontend-react/src/pages/ProfileSettings.shell.test.jsx using actual parent and unmocked extracted modules; identity fallbacks, avatar preview, CTA routes, summary actions/counts, role tabs/order/query and state retention.
- [x] Run all six profile test files against original source.

## Task 2: Presentation extraction

- [x] Create frontend-react/src/components/profile/ProfileHeader.jsx, ProfileSummaryCards.jsx and ProfileTabs.jsx by moving original JSX; wire exact props in frontend-react/src/pages/ProfileSettings.jsx.
- [x] Compare parsed non-render statements against baseline (37 identical), rerun six focused files, focused ESLint and git diff --check.

Root owns browser parity, maps/checkpoint, aggregate suite/lint/build and independent reviews. Owner retains staging/commit/push.

## Bounded implementation evidence

- Existing five profile files against original source: 58/58 passed, 23.76s.
- Six files including 16 shell characterizations against original source: 74/74 passed, 25.90s.
- Same six files after extraction: 74/74 passed, 26.97s.
- Parent non-render AST comparison: 37 before / 37 after, identical.
- Focused ESLint for parent, three modules and new test: exit 0.
- git -c core.fsmonitor=false diff --check: exit 0, line-ending warnings only.
- Existing calculator/checklist tests also verify state retention across tab changes; shell role-matrix cases assert stable request counts.
- Root browser parity, maps/checkpoint, aggregate suite/lint/build and independent reviews remain pending at implementation handoff.

Root acceptance2026-11-01: aggregate211/211 across30 frontend files; full lint/build exit0; two independent reviews approved.16 base DOM/computed/layout pairs and final settled screenshot pairs match; initial11/16 pixel results and five shadow recaptures retained.20 native-focus/tab-selection and12 hover/click comparisons matched. Maps/checkpoint/remaining-work table updated; fixture stopped/listener closed/viewport reset/task tab closed. Owner retains manual git actions; all Phase6 remains in progress.

Final hygiene:29 non-evidence files clean, index empty. Header/Summary copied trailing whitespace removed; Vite/Oxc generated output identical before/after, changed-module lint and final build exit0 (3.25s). Roadmap encoding-write failure restored and disclosed; root reviewed restored scope, and detailed history remains in checkpoint. Follow-up independent docs review unavailable due agent usage limit; do not count it as passed.
