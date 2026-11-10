# Appointment owner identity — proposed

Status: owner approved code/schema-candidate preparation2026-11-03. Code prepared and mocked verification complete; schema candidate not executed or applied. Live rollout remains gated.

## Confirmed boundary gap (S7)

buyerAppointmentController passes authenticated email/user ID to getBuyerAppointments, but agentRepository applies only client_email; userId is unused. Cancellation filters lead_id/client_email and accepts no authenticated account ID. Registration does not verify mailbox ownership, and updateProfile permits a unique email change without mailbox verification. An attacker can therefore claim an email used only by a guest booking, then reach email-associated appointments. This does not imply they can register an email already held by another registered account.

Fixture-only actual repository invocation showed a different synthetic account ID returned a guest lead with only client_email in read predicates, and cancellation used only lead_id/client_email. Mocked DB result is not a live exploit or proof against hosted data. No real email/account/appointment/DB used. Source confirms leads has no buyer-account owner field, and request body contact email is not ownership evidence.

## Options

1. Recommended: bind registered appointments to immutable application user ID using a nullable leads.buyer_id FK; authorize list/delete only with that ID. Preserve guest agent bookings but provide no account ownership based on guest email.
2. Verified email claim flow: require mailbox proof before claiming existing guest bookings. Larger Auth/email/schema feature; still needs stable ownership and explicit claim semantics. Keep separate.
3. Disable account appointment listing/cancellation temporarily. Safe containment but removes legitimate functionality; use only if owner needs emergency deployment before the identity migration.

## Recommended behavior

Prepare a separate owner-reviewed schema addition, never edit applied baseline: nullable buyer_id UUID referencing public.users, with a supporting index. Historical rows remain NULL; do not backfill by matching emails. Use ON DELETE SET NULL to preserve agent business records when an account is removed, pending owner data-retention confirmation. Existing guest leads remain visible/manageable only through existing authorized agent/Admin paths.

Booking controller supplies buyer_id only from validated req.user.id; ignore/reject request-supplied ownership fields. Anonymous bookings store NULL. Client name/email/phone remain contact details, independent of authenticated owner. Existing self-booking and lead/conversation behavior remain. New signed-in bookings are listed/cancelled only by the bound account even if contact/account email changes; another user with matching email has no access.

Account listing requires nonempty authenticated ID and always filters buyer_id. Account cancellation requires lead_id plus buyer_id and confirms an affected row. Missing ID fails closed before any DB query; no email fallback. Guest/historical unbound records are not listed/cancelled through the account endpoints. This deliberately changes historical email-based discovery; owner/agent-assisted recovery or a future verified claim flow is required. Do not promise automatic history migration.

No guest-facing cancellation token, verified-email flow or broad role redesign is included. Anonymous guest creation remains available, with existing input/auth/CSRF/rate-limit behavior. A known stable ID is not sufficient without the server-side authenticated ownership predicate.

## Preparation, acceptance and release gates

Owner approval here would cover code/schema-candidate preparation and mocked verification only. Existing retained stack-c lacks the new column and fixed migration guards must remain intact. New schema acceptance requires the separately approved hardened disposable environment; do not run changed booking profiles against the old schema or silently fall back to email on missing-column errors. Owner must apply the reviewed schema before deploying dependent code, with coordinated rollout/recovery. Candidate FK/index/column must be reviewed against actual data and deletion policy; no live migration is authorized by this proposal.

Test first with actual controller/repository and mocked external boundaries: mismatched account/same email denied for list/delete; own ID/different email retained; missing IDs no-query; user-supplied buyer_id cannot impersonate; signed-in/guest lead binding; historical NULL remains unclaimed; role/auth/self-booking behavior preserved; errors/zero-row deletion fail correctly. Full backend/frontend affected flows as required, independent review and later real committed-schema integration acceptance. Document exact old-schema incompatibility, historical visibility change and absence of live acceptance.

## Scope limits

This finding increases assessment scope; it is not merely an optional test gap. Existing seven remaining work packages remain open, with S7 tracked under identity/assessment and schema acceptance. No commit/push/deploy/config/credential/email/DB action occurred during this investigation.

## Prepared implementation and evidence

Booking passes authenticated owner through a separate trusted repository argument; request ownership fields cannot establish identity. Guest inserts explicitly store NULL. Account list/delete use only nonempty account ID and always apply buyer_id predicates. Contact email no longer authorizes access. Candidate adds nullable UUID/FK/index without backfill. Source review of direct lead INSERT permissions identified a necessary dependency: owner-assigned fields are trustworthy only when direct anon/authenticated lead writes are closed. Candidate and CRM preflight therefore refuse retained effective direct INSERT/UPDATE column grants. This adds no new public API and does not apply ACLs automatically.

Ownership19 tests initially all failed, then focused95/95 across6 files passed (including two schema-refusal tests). Initial schema-refusal mock lacked a JWT secret and failed at an unrelated stage; corrected isolated test configuration, observed intended red refusal assertions, then green. Full backend964/964 across67 suites passed in17.072s. Independent bounded review found no actionable defects. Syntax/whitespace/index and two applied migration SHA256 checks passed. Candidate outside migration chain; no database/container/provider/env/schema/dependency/frontend changes or local integration execution.

See [rollout prerequisites](../../phase7-appointment-owner-rollout.md). Prepared code is incompatible with the old schema, including guest inserts. Historical CRM10/10 predates this change; current CRM preflight is intentionally expected to refuse unchanged stack-c. Candidate SQL/FK/index, committed PostgREST joins/account deletion and actual frontend history behavior remain unverified. Optional gaps: repository returned errors, positive new-schema preflight (old controller zero-row cancellation behavior remains characterized elsewhere). ON DELETE SET NULL/data-retention suitability must be confirmed before owner migration application. No claim of deployed S7 closure.

Subsequent [fresh committed-schema acceptance](../../phase7-local-acceptance.md) verified local UUID/FK/index, explicit assigned-agent join, actual signed-in/guest binding, same-email outsider denial, changed-email ownership retention and deletion SET NULL behavior. New-target CRM10/10 also passed; retained stack-c launcher still correctly refuses its old schema. Original candidate file not executed; separate guarded test-target SQL used. Frontend history/production retention/deployed adoption remain open.
