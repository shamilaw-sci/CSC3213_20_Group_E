# Agent Acceptance Fixes Implementation Plan

> Execute approved spec task by task with failing regressions, focused checks and final integration verification. No commits or deployments.

**Goal:** Correct the seven recorded Agent issues and prepare focused manual retests.

**Architecture:** Keep existing repository/controller/UI boundaries. Add owner-only application status to authenticated current-user response; normalize nested Admin profile reads; persist banner focal point with additive schema fields.

**Tech Stack:** React, Vitest, Express, Jest, Supabase/PostgREST, PostgreSQL, Nodemailer.

## Constraints

- Follow approved spec at docs/superpowers/specs/2026-11-14-agent-acceptance-fixes-design.md.
- Preserve public privacy and pre-existing evidence logs; no historical email resend.
- Work in current version-3.0 checkout for ongoing local acceptance; no main/master changes.
- Manual acceptance remains pending until user verifies each changed path.

## Task 1: Registration and profile read/write data

- [x] Add failing Jest regressions for camelCase payload through registerSchema into registerUser and stored profile, snake_case compatibility, public language selection, and authenticated application status privacy.
- [x] Run `npm test -- --runInBand tests/agentAcceptanceData.test.js` in backend-node; confirm reported defects fail.
- [x] Update authValidator/authController/userRepository and agentRepository selections; add bounded registration values and owner-only application status. Include pending applicant phone in Admin repository selection.
- [x] Run focused data/auth/privacy suites.

## Task 2: Pending/rejected applicant UI

- [x] Add failing Vitest regression for pending review notice/no Hub action and rejected reason display without approved Hub access.
- [x] Update SecuritySettings to show explicit application state and owner reason from current user; keep approved Agent controls.
- [x] Run `npm test -- src/components/profile/SecuritySettings.agent.test.jsx` and existing ProfileSettings suites.

## Task 3: Admin review and email (admin_fixes agent)

- [x] Add failing tests for Agent queue count/link, nested profile details and review/reject dialog transitions, blank server rejection reason and mail success/failure outcomes.
- [x] Implement Topbar Agent queue, readable applicant details, validated rejection email with escaped content and delivery warning after confirmed write.
- [x] Run focused Admin tests; report actual commands/results.

## Task 4: Banner position (banner agent)

- [x] Add failing slider/save/cancel/image-reset and backend range-validation regressions.
- [x] Implement x/y position in Studio/public rendering and controller/validator. Add additive hosted-review SQL with default 50 and range checks.
- [x] Coordinate repository selected fields with Task 1. Run focused tests. Do not apply hosted SQL without documenting actual schema requirements.

## Task 5: Integration and focused acceptance

- [x] Review all diffs for privacy, accidental credential exposure, unrelated changes and mail side effects.
- [x] Run full backend/frontend tests, frontend lint/build and `git diff --check`.
- [x] Prepare seven-path retest queue and schema instructions; inspect live read paths without logging contact details or secrets.
- [x] Record verified automated results separately from pending manual acceptance.

Manual acceptance is a separate pending operator-guided queue in docs/agent-fix-retest.md. User applied SQL and read-only schema check passed. Final automated verification: backend109/1456; frontend73/495; lint/build pass. No commits.
