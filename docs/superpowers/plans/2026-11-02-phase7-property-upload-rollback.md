# Phase 7 property upload rollback plan

Approved resilience scope; use TDD, systematic-debugging and verification-before-completion. Owner retains Git; no real Storage/database/environment/dependency changes.

**Goal:** A late successful upload from an already-failed create request cannot escape its rollback because cleanup ran early.

**Files:** backend-node/controllers/property/propertyWriteController.js; new tests/propertyUploadRollback.test.js; existing tests/propertyRemainingController.test.js characterization; phase7-security-plan.md.

**Root cause:** Promise.all rejects on first upload failure while other uploads can still complete. Fire-and-forget removal may finish before those late writes. The controller also returns the original failure before knowing cleanup outcome.

**Minimal design:** local completeUploads(promises) awaits Promise.all normally; on rejection waits Promise.allSettled(promises) before rethrowing the original first rejection. Keep photo batch before tour batch and original successful array order. In addProperty catch, await removeImages on this request's tracked attempted paths; catch cleanup errors separately and emit structured event property_upload_rollback_failed with sellerId/paths only using existing logger. Always forward original error after cleanup outcome. Preserve payloads, authorization, pending/Unpaid defaults, fees, media naming and routes.

- [x] Deferred-promise tests simulate failed photo/tour upload, late committed sibling and in-memory object removal. Assert no cleanup before all started uploads settle, no DB insert and no remaining attempted object after successful removal. Do not use fixed sleeps or real Storage.
- [x] Test DB insert failure waits for removal; cleanup failure retains original error and emits sanitized exact recovery paths; success retains URL order and no rollback. Test first rejection identity remains when several uploads fail; unauthorized role makes no upload/cleanup/insert calls.
- [x] Run red tests against current controller; keep first failure evidence separate from timing/harness defects.
- [x] Implement small completeUploads helper and awaited bounded-to-request cleanup. Update the old fire-and-forget characterization fixture to resolve cleanup and its name to reflect intentional new behavior; do not leave a never-resolving promise that contradicts the approved behavior.
- [x] Run focused create/numeric/rollback tests then full backend sequentially with512MiB heap/semi-space4; syntax/whitespace and independent bounded review. No frontend rerun for backend-only rollback logic.
- [x] Record limits: no durable cleanup queue or process-crash guarantee, no transport abort/timeout, no upload-byte validation or filename redesign; stalled uploads can still stall settlement. No real-local Storage acceptance here. Logs support operator recovery but are not automatic retry or proof of cleanup.

## Execution result

2026-11-02: red4 failed/3 passed on original controller; focused35/35 passed; full backend749/749 across56 suites passed. Independent read-only review reported no actionable introduced defects. Syntax/whitespace checks passed; no index changes. Existing fire-and-forget characterization intentionally updated; deferred tests independently assert late siblings settle before removal and cleanup completes before original error forwarding. Real-local Storage was not run; limitations above remain. No frontend change/run in this batch.
