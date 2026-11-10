# Report export integrity implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Correct report downloads and separate protected spreadsheet CSV from
unmodified typed JSON for machine consumers, as owner approved2026-11-04.

**Architecture:** Existing protected controller validates report type/format;
static projected columns feed CSV/JSON serializers. Existing API helper downloads
the chosen format with reliable URL cleanup. Page uses transactions and reports
only observed download outcomes.

**Tech Stack:** Node/CommonJS/Jest, React/Vitest/Testing Library; no new dependencies.

## Global constraints

Follow ../specs/2026-11-04-report-export-integrity-design.md. Preserve existing
report columns/order, Admin guards and default CSV compatibility. No real
spreadsheet/provider/account/DB/infra/env/credential or Git publication operation.
Heavy checks sequential, Node512/semi4, frontendRAYON1/Vitest1worker.

### Task1: Export controller/repository

- [x] Red tests for accepted/rejected format/type before reads, JSON raw typed
  values/static projection, CSV trigger/control/full-width/whitespace escaping
  and correct filenames/content types. Files: tests/reportExportIntegrity.test.js.
- [x] Implement validation/serialization in admin/adminReportController.js and
  explicit exported transaction selection in adminRepository.js. Update legacy
  CSV expectation for intentional prefix change. Run focused tests.

### Task2: Download helper and page

- [x] Red tests in ReportsPage.test.jsx and api/adminApi.export.test.js: correct
  transactions+format request, fail versus success, pending/unmount guards and
  object-URL cleanup on click failure.
- [x] Implement type/format validation, media type/extension and finally cleanup;
  replace invalid CSV/PDF type buttons with transactions CSV/JSON actions, remove
  fake success/audit claims, guard lifecycle and feedback cleanup. Run focused tests.

### Task3: Review and aggregate evidence

- [x] Independent bounded read-only review; address actionable findings with tests.
- [x] Full affected backend/frontend tests, lint/build sequentially; document
  actual counts, CSV application/locale acceptance limits and owner gates.
- [x] Update spec/evidence/master/remaining inventory; check whitespace and empty
  index. Do not claim whole-phase or real-browser acceptance.

Completed2026-11-04. Combined full backend1320/1320, frontend334/334, lint/build
passed; independent bounded reviews found no actionable P1/P2. Real deployments,
spreadsheet/browser acceptance and remaining phase gates remain separate.
