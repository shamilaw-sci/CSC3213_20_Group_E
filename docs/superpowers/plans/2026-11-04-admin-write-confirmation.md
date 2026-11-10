# Admin write confirmation implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Confirm Admin role writes and preserve pending seller requests on failure.

**Architecture:** Repository methods validate selected write results and classify
fixed owned errors. Controllers validate input before writes and expose new versus
existing request outcomes. Sequential role/profile writes explicitly expose partial
confirmation; existing unique(user_id,status) handles pending insert conflicts.

**Tech Stack:** Node24, CommonJS, Supabase query builder, Jest.

## Global constraints

Follow approved spec `../specs/2026-11-04-admin-write-confirmation-design.md`.
No live accounts, DB/schema/env/credentials, Docker or dependency operations.
No staging/commit/push; preserve existing combined WIP and private evidence.
Keep Admin policies, current BUYER precheck and server-selected SELLER.
Tests sequential, Node heap512MiB/semi-space4MiB. Review narrowly read-only.

### Task1: Direct roles and pending request creation

Files: repositories/adminRepository.js; controllers/admin/adminUserController.js;
controllers/authController.js; utils/publicError.js; new tests/adminWriteConfirmation.test.js
and tests/sellerRequestCreation.test.js; existing tests/adminManagementController.test.js.

- [x] Add actual repository/controller regression tests with synthetic database
  chains: missing/mismatched rows; user error prevents profile write; profile error,
  throw and zero rows become partial409; confirmed writes succeed; input rejects
  without writes; insertion failures preserve pending records; only23505 permits
  lookup; repeated pending requests return200, new requests201; mismatch409.
- [x] Run new tests and record expected failures before runtime edits.
- [x] Implement bounded role/reason/UUID validation, owned fixed errors and exact
  selected row confirmation; log fixed partial event with validated UUID only.
- [x] Replace DELETE/insert with insert/confirmed23505 lookup; return
  `{created:boolean, request:row}`; controller distinguishes201/200.
- [x] Update valid controller fixtures to UUID and confirmed repository contracts.
- [x] Run focused tests; run full backend tests once focused pass. Investigate
  genuine failures and repeat affected checks as needed.
- [x] Request independent read-only review; resolve actionable findings, add
  meaningful regressions and verify affected tests.
- [x] Update scope/evidence, endpoint inventory and remaining-work tracker with
  actual counts and limits. Verify whitespace and empty index; no release claim.

Completed2026-11-04: focused109/109; full backend1257/1257 across84 suites;
independent review no actionable P1/P2. See phase7-admin-write-confirmation.md
for red/green evidence, historical frontend results and residual limits.
