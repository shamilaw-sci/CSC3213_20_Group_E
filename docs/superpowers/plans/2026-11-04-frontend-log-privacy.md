# Frontend log privacy implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent production frontend diagnostics from emitting arbitrary private
errors/messages/config while preserving existing application outcomes.

**Architecture:** A small fixed-event error/warn utility is the sole production
console boundary, enforced with existing ESLint. Observed call sites pass literal
event names only, without metadata or error evaluation.

**Tech Stack:** React/JavaScript, Vitest/Testing Library, existing ESLint; no new dependencies.

## Global constraints

Approved spec ../specs/2026-11-04-frontend-log-privacy-design.md.
Preserve existing requests, auth/logout/storage/error messages, retries and payment
semantics. No owner-deferred password changes, real accounts/providers/payments,
DB/schema/env/infra/dependency changes or Git staging/commit/push/deployment.
Sequential checks, Node512MiB/semi4MiB, RAYON1, Vitest threads/maxWorkers1.

### Task1: Fixed diagnostic boundary and regression protection

- [x] Add failing utility tests for known events/severity and unknown event/error/
  Axios marker arguments; actual Admin auth, property-form and payment-hook
  failure-path privacy assertions while retaining outcome assertions.
- [x] Run red tests before implementation. Create utils/clientLog.js with explicit
  event allowlist and fixed unknown fallback, ignoring all extra arguments.
- [x] Migrate every observed production console site to fixed operation events;
  preserve severity and remove evaluation of arbitrary error/message properties.
- [x] Add narrowly scoped existing ESLint no-console rule for production src,
  with explicit utility/test exclusions. Verify lint rejects a synthetic raw
  console statement for a production filename but permits test capture.
- [x] Run focused tests; address real regressions without changing business behavior.

### Task2: Review and verification

- [x] Independent bounded read-only review; fix actionable findings with regressions.
- [x] Full frontend tests, lint/build sequentially. Unchanged backend's latest
  full1320/1320 remains historical for its unchanged source, not a fresh rerun.
- [x] Record evidence/limits and update status/remaining inventory; whitespace and
  empty-index checks. No browser/collector/whole-phase clearance assertion.

Completed2026-11-04: focused55/55; full frontend347/347 across52 files (242.02s),
lint/build pass; independent read-only review no actionable P1/P2. Existing build
warnings and external/whole-phase acceptance remain open. No Git publication.
