# Payment UI boundary implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display only observed fees and own checkout requests/callbacks/timers.

**Architecture:** Pure payment boundary validators and bounded abortable requests;
shared SDK ownership and per-hook attempt/quote state; form/page integration.

**Tech Stack:** React, Axios, Vitest/Testing Library, existing ESLint; no dependencies added.

## Global constraints

Approved spec ../specs/2026-11-04-payment-ui-boundary-design.md. Preserve server
amount/hash/settlement, current callback URL override guard and role destinations.
No live account/provider/payment/DB/env/schema/credential/infra or Git publication.
Owner-deferred password changes excluded. Sequential checks, Node512/semi4,
RAYON1/Vitest threads/maxWorkers1. Prior backend1320/1320 is unchanged-source evidence.

### Task1: Shared validation and checkout lifecycle

- [x] Add red tests for config readiness/error/retry, strict locked order results,
  changed fee review, request deadlines/abort, callback identity/first terminal,
  SDK owner isolation, foreign handlers and late completion/timer suppression.
- [x] Implement utils/paymentUiBoundary.js and refactor hooks/usePayhere.js into
  explicit config/quote/busy states with owned requests/callbacks and safe feedback.
- [x] Preserve and adapt prior callback URL/server-mode/status assertions to the
  confirmed ready config and server UUID/hash fixtures; run focused tests.

### Task2: Form and page integration

- [x] Red tests for unavailable config/no draft creation, sync duplicate-submit
  suppression and released loading/retained draft retry; actual Review/MyProperties
  loaded fee/error/retry/quote states and explicit expected-fee argument.
- [x] Update usePropertyForm.js, AddProperty.jsx, ReviewPublishStep.jsx and
  MyProperties.jsx; expose checkout quote/state/retry and fixed logger event.
- [x] Update old test mocks to the new ready config interface, replace obsolete
  fallback/duplicate-terminal expectations, preserving unrelated form/UI contracts.
- [x] Run focused hook/form/page tests and lint; investigate genuine failures.

### Task3: Review and aggregate verification

- [x] Independent bounded read-only review; fix actionable findings with regressions.
- [x] Full frontend tests, lint/build sequentially; record actual evidence and
  remaining SDK/browser/billing/durable-recovery limits.
- [x] Update spec/evidence/master/inventory/tracker; whitespace and empty index
  checks. No whole-phase/deployed payment acceptance claim.

Completed2026-11-04: focused87/87, later55/55, actual form/payment2/2;
old MyProperties mock correction10/10; fresh full frontend401/401 across57 files
(267.23s), lint/build pass. Independent review/follow-up no actionable P1/P2.
No real payment/provider/deployment; evidence and SDK/billing/ambiguous-create
limits are recorded in phase7-payment-ui-boundary.md.
