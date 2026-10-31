# Phase5 CRM bounded batch

Status: owner approved continuation of the described CRM test/fix flow on2026-10-30. One CRM batch only. Existing phase5 checkpoint is the entry point; owner keeps staging/commit/push.

## Design and alternatives

Use actual isolated DB/API integration plus rendered AgentDashboard interactions. Mock-only testing would miss lifecycle enum/persistence and joins; full deployed/browser E2E would introduce external services beyond this batch. Reuse checked stack-c DB/REST and installed dependencies. No new architecture,features,migrations or services.

CRM comprises direct `leads` bookings and `conversations` with joined buyer/property and latest message. Test GET/PUT/DELETE `/api/agents/leads`, real guest booking POST `/api/agents/:id/book-viewing` for lead creation, all five New/Contacted/Showing/Offer/Closed stages and reload mapping for both sources. Use type=property conversations compatible with the canonical schema. Signed-in booking's optional conversation-link creation is outside this bounded CRM pipeline batch; do not alter canonical schema to accept type=agent.

## Behavior and failure checks

Only approved AGENT role may use CRM; another agent's rows cannot be read/updated/deleted. Other roles,anonymous and banned sessions must be refused. Validate malformed update UUID/status/boolean/length inputs without state changes. Capture existing missing/foreign update response shape while asserting no unauthorized write; deletion should404 on foreign/missing/repeated removal. Do not invent new API status contracts.

Verify legacy normalization,latest-message preview,joined property/buyer data,combined updated-date ordering and empty list. Direct lifecycle mapping must preserve Offer. Verify API metadata updates: timeframe/pre_approved persist for both sources and partial updates preserve omitted status/metadata. Notes are displayed from existing message/booking source; no new note editor/write contract is added. Direct invalid enum writes,if reached, must preserve the row rather than partially apply changes.

Render production AgentDashboard with controlled API/dialog/toast boundaries. Cover lead display,stage change success and reloaded stage,error recovery to authoritative stage,delete confirm/cancel/success/failure and role redirect. No real message polling/network or maps. Where a real defect is reproduced, retain failing tests and apply only a bounded correction to that path,with red/green evidence and review. Potential corrections are partial metadata persistence/normalization in agentRepository and dashboard mutation recovery; expand neither schema nor API authorization/business rules. A broader product-policy ambiguity must be reported before changing it.

## Preservation and security

Fixed CRM profile snapshots ten complete tables: users,properties,saved_searches,transactions,payment_orders,payment_receipt_outbox,leads,conversations,messages,message_receipts. Static allowlist keys are id except leads:lead_id and message_receipts:message_id,user_id. Test new allowlist entries before adding them. Retain exact container/project/image/network/loopback identity,checksums,DB/API marker/ledger,dotenv suppression and blocked external/5000/Storage transport. Use base setup that refuses all email and receipt workers; no delivery spies are needed for CRM.

Seed UUID/example.test accounts and exact-owner fixtures. Recover guest API inserts by assigned fixture-agent IDs. Cleanup exact owned receipts/messages/conversations/leads before properties/users; verify ownership before destructive SQL. Observe cascade removal only for own fixtures. Full snapshots and canonical ledger must match after failed assertions as well as success. Never reset,bulk-delete,mutate baseline rows,alter app .env or remove Docker resources. Start/stop inspected retained DB/REST only; Storage stays stopped.

## Acceptance and usage

One CRM session/batch. Focused red/green checks during implementation; final real CRM profile twice and focused rendered interactions twice for repeatability. Backend full suite once after final changes; frontend full suite/lint/build once after final frontend changes. Existing profile reruns only if shared changes create a specific concern; static profile addition/allowlist expansion alone is covered by guard tests. One bounded reviewer covers test/fix/harness correctness,with stronger diagnosis only if needed. No remote CI/manual-browser claim without running it. Record exact errors,results,limits and next action in `docs/phase5-crm.md` and concise `docs/phase5-checkpoint.md`. No receipts/checkout work in this session.
