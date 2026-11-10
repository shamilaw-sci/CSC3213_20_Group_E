# Platform settings integrity implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Validate and confirm listing-fee writes, fail on fee-read errors and make
Admin settings accurately reflect supported functionality.

**Architecture:** Reuse paymentMoney canonicalization. Repository reads distinguish
missing from error, and writes confirm selected key/value. Admin page edits only
the fee with explicit asynchronous states and independent theme preference.

**Tech Stack:** Node24/CommonJS/Jest, React/Vitest/Testing Library, Supabase.

## Global constraints

Approved spec: ../specs/2026-11-04-platform-settings-integrity-design.md.
Preserve current positive fee range/default-on-confirmed-missing, role guards,
gateway/settlement/session/upload/category policies and combined WIP.
No real DB/env/credential/schema/provider/infra/dependency/Git publication actions.
Heavy checks sequential: Node512MiB/semi-space4MiB, frontendRAYON1/Vitest1worker.

### Task1: Backend setting contract

Files: controllers/admin/adminSettingsController.js; repositories/adminRepository.js
settings methods; repositories/settingsRepository.js; tests/platformSettingsIntegrity.test.js;
tests/adminRemainingController.test.js; tests/checkoutOrders.test.js.

- [x] Add red tests: malformed/nonpositive/excess precision fees stop before write;
  canonical saves require exact selected key/value; missing defaults, errors and
  malformed values remain distinct; checkout fee error prevents orders/hash.
- [x] Run red tests, implement smallest shared canonical validation and repository
  read/write confirmation, update obsolete mocked contracts, run focused checks.

### Task2: Truthful Admin page

Files: pages/admin/pages/SettingsPage.jsx and new SettingsPage.test.jsx.

- [x] Add red UI tests: loading/error/retry, strict fee-only payload, invalid drafts,
  confirmed versus failed saves, pending locking, unsupported controls absent,
  independent theme preference and unmount safety.
- [x] Replace fake settings/defaults with loaded fee state; preserve theme styles,
  remove unsupported editors/audit claims, validate exact confirmed response,
  preserve drafts on errors and guard async lifecycle. Run focused tests.

### Task3: Verification and evidence

- [x] Run full backend then full frontend tests, lint/build sequentially.
- [x] Independent bounded read-only review; resolve actionable findings with tests.
- [x] Record actual results/limits and remaining packages; update spec/trackers,
  check whitespace and empty index. No release-readiness claim.

Completed2026-11-04. Combined full backend1320/1320, frontend334/334, lint/build
passed; independent bounded reviews found no actionable P1/P2. Real deployments,
spreadsheet/browser acceptance and remaining phase gates remain separate.
