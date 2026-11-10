# Phase 7 agent write error handling plan

Approved security/resilience scope. Use systematic-debugging/TDD/verification-before-completion and bounded independent review. Owner retains Git and live changes.

**Goal:** Required writes cannot report success after a known failure; optional conversation work cannot turn a persisted booking into a failed booking response.

**Files:** backend-node/controllers/agent/agentProfileController.js, agentBookingController.js; repositories/agentRepository.js updateAgentProfile lookup; new tests/agentWriteFailures.test.js and agentProfileLookup.test.js; existing agentRemainingController.test.js characterization; phase7-security-plan.md.

**Design:** Profile controller checks users.update returned error before proceeding, rejects an empty profile result, and logs sanitized agent_profile_partial_write when a later profile failure follows a successful user write. Do not compensate by overwriting concurrent user data. Repository must propagate profile lookup error instead of falling through to insert. Booking controller requires a nonempty lead, checks returned errors at optional conversation lookup/create/message writes, and logs booking_conversation_recovery with leadId/agentId/buyerId/stage only. Optional failures retain201 and exact existing lead/success message; guest/self/role behavior unchanged. No raw error/phone/email/notes in these new logs.

- [x] Reproduce known returned-error false success with direct controller tests. Cover empty required outcomes, lookup failures before writes, partial profile write recovery, booking required-lead failure, optional lookup/create/message errors and healthy/guest flows. No live DB/email or sleeps.
- [x] Run red before code. Add repository test that lookup errors do not cause profile insert/update.
- [x] Implement minimal guards and structured logging using existing logger. Preserve request payloads, role gates, lead-before-conversation sequence and status201 after optional failures.
- [x] Update characterization that deliberately ignored returned user errors to successful mandatory write; change old raw optional-error log expectation to sanitized structured event. Retain conversion/default/sequence assertions.
- [x] Run focused agent/booking tests then full backend sequentially with512MiB heap/semi-space4; syntax/whitespace; independent read-only review.
- [x] Record remaining limits: separate profile writes are not atomic; zero-row user update verification, idempotent booking retry/concurrent conversation creation and ambiguous DB commits need separate design. Recovery logging is not a durable queue. No new migration/schema/env/dependency/real-local profile or frontend change.

## Execution result

2026-11-02: red8 failed/3 passed; new11/11 green; focused agent/booking32/32; full backend760/760 across58 suites passed. Independent read-only review found no actionable introduced defects. Syntax/whitespace passed and index empty. No real bookings/messages/database/environment/Storage/dependency or Git mutations. R2 remains partial within the limits above; optional coverage gaps are recorded in phase7-security-plan.md.
