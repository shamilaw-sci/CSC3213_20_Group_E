# Guarded PayHere browser acceptance implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Obtain distinguishable real-browser simulation and actual Sandbox callback evidence using the approved isolated workflow.

**Architecture:** Pure guards, a test-only Vite fixture entry/API shim and a bounded runner. Simulation has no DB/provider. Sandbox reuses the existing fresh Phase7 environment and real payment controller with inert mail/receipt delivery.

**Tech Stack:** Existing Node/Vite/React/Postgres tools and browser CUA; no installs.

## Global constraints

Approved spec ../specs/2026-11-04-payhere-browser-acceptance-design.md.
Exact approved tunnel origin/localhost5000; fresh DB59322/REST59321 only.
No retained stack/schema/env edits, real funds/customer data, dependency updates,
Git stage/commit/push/deploy or credential rotation. Never stage docs/evidence.
Secrets selected only in server memory; clean child env; empty Vite env/public dirs.
Sequential checks, Node512/semi4/RAYON1. Exact fixture cleanup/all19 preservation.

### Task1: Guards and fixture browser

- [ ] Red guard tests: tunnel/type/path/order/merchant/socket/env isolation and exact scoped fixture cleanup.
- [ ] Implement browser-guards.cjs, browser-fixture.cjs and fixture entry/adapters.
- [ ] Verify deterministic simulation HTTP boundaries and browser-visible readiness,
  price review, error/cancel/Paid distinctions and unmount with inert SDK.

### Task2: Fresh-target Sandbox runner

- [ ] Implement guarded start/identity/snapshot/fixture/listener lifecycle using
  existing environment/state/catalog; full private recovery receipt before writes.
- [ ] Clean environment and selective existing Sandbox keys, real payment routes,
  narrow public callback bridge, no real mail/worker/media/other providers.
- [ ] Guard/lifecycle tests and independent bounded review before external Sandbox.

### Task3: Actual acceptance and restoration

- [ ] Verify existing ngrok/public health sentinel and Sandbox mode/origin before
  official test-card input. Run Visa/Mastercard/cancel/decline and scoped results.
- [ ] Record browser plus callback/DB evidence distinctly; never infer Paid from
  onCompleted. Report any unresolved provider/browser blocker precisely.
- [ ] Stop exact fixture listeners; exact cleanup; compare all19/catalog/ledger/
  provenance/retained resources; stop only fresh pair started by this runner.
- [ ] Update evidence/spec/master/tracker, whitespace/empty index. No production claim.
