# Phase 7 required row confirmation and resubmission role guard

Approved security/resilience scope; TDD, systematic-debugging and verification-before-completion. Owner retains Git/live/schema changes.

**Goal:** Required agent writes cannot report success with zero confirmed rows, and resubmission cannot overwrite a concurrent ban/role transition.

**Files:** backend-node/controllers/agent/agentProfileController.js; repositories/agentRepository.js resubmitApplication; new tests/agentWriteConfirmation.test.js; existing agentWriteFailures.test.js and agentRemainingController.test.js positive fixtures; phase7-security-plan.md.

**Root causes:** users.update currently checks only error, not affected row. Resubmission checks rejected role in controller but later writes PENDING_AGENT by ID only; a concurrent ban can be overwritten. Profile/user resubmission writes also do not confirm returned rows.

**Design:** profile user update selects id with single and verifies it matches authenticated agentId before continuing. Resubmission profile update selects agent_id/single and verifies exact target. Subsequent user role write adds eq(role,REJECTED_AGENT), selects id/single and verifies exact ID. No matching row/error means failure; do not retry as unconditional role update. If profile write completed but role transition fails, emit sanitized agent_resubmission_partial_write/agentId via existing logger and rethrow original failure. Do not compensate over concurrent changes or claim transactionality.

- [x] Add controller tests for missing/wrong returned user row and matching-row success, with no downstream profile write on missing confirmation.
- [x] Add repository tests for missing/wrong profile target, concurrent BANNED/AGENT/BUYER role preserved, eligible rejected-agent success and returned role-write error recovery metadata. Query-aware fake applies writes only where filters match, reproducing old unconditional role overwrite.
- [x] Run red before implementation. Then add only select/single/ID checks, role condition and recovery event. Preserve routes/messages, input payload, roles, profile-first order and caller interface.
- [x] Adapt existing successful mocks to return confirmed target IDs; retain original error/conversion/order assertions.
- [x] Focused agent/booking tests then full backend sequentially with512MiB heap/semi-space4; syntax/whitespace/index checks; independent bounded review. No frontend/Go rerun for backend-only change.
- [x] Record limits: profile/user writes are not atomic; profile may already change before a concurrent role rejection. Ambiguous commits/durable recovery and generalized concurrent ban enforcement require separate design. No live accounts/admin actions/DB/schema/dependency/env or Git changes.

## Execution result

2026-11-03: initial red11 failed/1 passed across12 new cases; refined3 concurrency cases explicitly reproduced BANNED/AGENT/BUYER overwritten as PENDING_AGENT. Focused40/40 and full backend806/806 across60 suites passed after fix. Independent bounded read-only review found no actionable introduced defects. Syntax/whitespace/index checks passed. No real/local account/admin/DB/Storage operations, schema/env/dependency changes or Git mutation. Separate writes remain non-atomic; optional coverage gaps are recorded in phase7-security-plan.md.
