# Phase 7 Agent chat request lifecycle plan

Approved resilience scope. Use TDD/systematic-debugging, React best practices and verification-before-completion. Owner retains Git; no API/schema/dependency/environment changes.

**Goal:** Old selections/reads/sends cannot overwrite another buyer's chat or leave stale scroll timers after unmount.

**Files:** frontend-react/src/pages/agent/Dashboard.jsx; extend existing Dashboard.messages.test.jsx; phase7-security-plan.md. Retain parent state ownership and extracted panel boundaries.

**Design:** A ref holds an active chat session with readVersion/scrollTimer. Each selection invalidates the previous session synchronously, clears its timer/messages/sending state, then sets the selected lead. A same-object selection is a no-op so it cannot invalidate a session without effect restart. Pass this selection callback through existing setSelectedLead props to pipeline/modal/messages. Polling effect creates session, increments read version for each request, commits only active latest-version results, replaces scroll timer and clears interval/timer on cleanup. Preserve4000ms polling including off-tab behavior.

Send captures session/lead ID before await; invalidates earlier reads at send start; after POST returns, refresh only if session still active. Commit only latest active refresh. Track send scroll through the same session timer. Old sends cannot clear current sending state or toast an error into a new selection. New selection enables its own send; same-selection draft trimming, immediate clearing, payload and failure semantics remain unchanged. No backend request cancellation or polling-overlap optimization is introduced.

- [x] Run existing chat tests first; baseline5/5 passed using one-thread worker with512MiB heap/semi-space4 and RAYON_NUM_THREADS=1. System free memory is constrained; no concurrent heavy checks.
- [x] Add deferred-promise/fake-timer tests for old A response after selecting B, immediate clearing while B pending, same-chat out-of-order polling, late A send after B selection, old send not releasing B's pending flag, unmounted pending read and untracked send scroll cleanup.
- [x] Run red on unchanged Dashboard; ensure failures demonstrate lifecycle behavior, not runner/resource errors.
- [x] Implement session guards and selection invalidation with no UI layout/content/payload/interval redesign. Preserve ongoing sender IDs and all existing panels.
- [x] Run focused chat plus existing Agent page regressions one worker; lint/build; attempt full frontend suite only after focused health is established, sequentially and with bounded memory. If native resource failures recur, record them and do not claim aggregate acceptance.
- [x] Independent bounded review, diff whitespace/syntax tooling, record exact counts/exclusions. No real account/polling/network/browser session. Dashboard stats/CRM refresh races and mutation concurrency remain a separate subtask.

## Execution result

2026-11-02: existing5/5 baseline; red7 failed/5 passed; focused Agent37/37 across5 files; full frontend291/291 across46 files passed in156.65s with one thread worker/512MiB heap/semi-space4MiB/RAYON_NUM_THREADS=1. Full lint/build passed with existing bundle/Lottie warnings. Independent read-only review found no actionable introduced lifecycle defects. Whitespace check/index hygiene passed; no backend changes or rerun for this frontend-only batch. Fresh aggregate frontend result closes earlier runner acceptance gap; routed browser/Storage acceptance remains open. No accounts/network/messages/DB/credentials/dependencies/Git mutation occurred. Optional review gaps and remaining R3 dashboard-refresh/account-switch risks are recorded in phase7-security-plan.md.
