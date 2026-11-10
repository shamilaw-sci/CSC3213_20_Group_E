# Phase 7 Agent dashboard refresh generation plan

Approved resilience scope. TDD/systematic-debugging/React best practices/verification-before-completion; owner retains Git and real environments.

**Goal:** A stale dashboard refresh cannot overwrite a newer snapshot or pending optimistic mutation, resurrect a deleted lead, clear newer loading state or report an obsolete error.

**Files:** frontend-react/src/pages/agent/Dashboard.jsx; new Dashboard.refresh.test.jsx; phase7-security-plan.md. Keep parent state ownership, endpoints, payloads, UI layout and extracted modules.

**Design:** A ref holds an active dashboard request session created by the existing auth/load effect. Cleanup deactivates it. Each fetch captures/increments readVersion and commits data/error/final flags only if active/latest. Each mutation captures this session, increments readVersion to invalidate older reads, increments pendingMutations and shows refreshing state. While pending, refreshes are deferred. Mutation completion updates only its active session, queues required refreshes and triggers one refresh after the last pending mutation settles. Preserve status success/failure refresh semantics; preserve delete-failure no-refresh behavior, cancellation and existing rollback/toasts. Inactive/unmounted sessions cannot update/toast/launch refresh. Do not claim server-side ordering or same-lead concurrent write serialization.

- [x] Add real-parent deferred tests: old manual refresh after newer mutation refresh; stale refresh error; old completion cannot release newer spinner; old pre-mutation response cannot overwrite pending stage; deleted lead cannot reappear; unmounted request error cannot toast; defer reconciliation until overlapping mutations settle.
- [x] Run red before production edits. Use existing test fixtures/panel controls, no real API or fixed sleeps.
- [x] Implement active/readVersion/pendingMutations/refreshQueued session and begin/finish helpers; wrap status/delete handlers without changing methods/payloads/confirmation or success/error text.
- [x] Run new tests plus all existing Agent page tests one thread worker with512MiB heap/semi-space4/RAYON_NUM_THREADS=1; full lint/build; one full frontend run if focused health passes, sequentially. Record native resource failures separately if they recur.
- [x] Independent read-only bounded review; diff/index hygiene; record exact counts, intentional request-coalescing behavior and limitations. No backend/Go rerun, hosted writes or real browser acceptance for this frontend-only batch.

## Execution result

2026-11-02: red7/7 failed on original behavior; focused44/44 across6 Agent files passed; full frontend298/298 across47 files passed in162.74s. Full lint/build passed with existing bundle/Lottie warnings. Independent bounded read-only review found no actionable introduced defects. Whitespace/index checks passed. Same-lead write ordering, request cancellation/server ordering and real-browser acceptance remain outside this batch. No backend/Go rerun, real accounts/API mutations, database/environment/dependency change or stage/commit/push/deploy occurred. phase7-security-plan.md records optional coverage and remaining gates.
