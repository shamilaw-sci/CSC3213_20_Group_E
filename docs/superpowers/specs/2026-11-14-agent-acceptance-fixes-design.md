# Agent acceptance fixes

## Scope and approach

Address AGENT-01 through AGENT-07 from the guided desktop walkthrough. Preserve existing Buyer/Seller and approved Agent flows. Use existing controllers, repositories, mail service and Admin styling. No commits, deployment, or test emails to unrelated recipients.

Recommended: targeted corrections with a read-only applicant detail dialog and persistent banner focal point. A larger application-workflow rewrite introduces unnecessary risk; UI-only fixes cannot correct omitted data or missing email delivery.

## Requirements

1. Pending applicants see an explicit awaiting-review notice instead of an actionable Agent Hub button. Approved Agents retain Hub access. Rejected applicants see their application state and saved rejection reason through an authenticated owner-only read, not the public Agent endpoint.
2. Admin bell includes pending Agent applications, refreshes on the existing interval and when opened, and links to Agent Approvals. Preserve Seller/listing notifications.
3. Registration accepts the existing frontend camelCase agencyName/licenseNumber payload and maps it to stored snake_case profile fields, with compatible handling for existing snake_case callers. Admin cards normalize the nested agent_profiles relation. Do not invent a supplied license or overwrite existing fixture data.
4. Admin can open an applicant detail dialog before deciding. Show stored name, email, phone when present, application date/status, agency, license and biography. Clearly label absent values. Keep text readable in light/dark themes. Reject reason dialog and details dialog must not stack; cancel restores review context. Do not expose password/session fields.
5. Reject requires a nonblank reason server-side. After confirmed role/profile writes, send a dedicated rejection email using the existing mail service with escaped name/reason text. Mail failure must not falsely imply the role write failed; return a delivery warning while keeping the rejection authoritative. Owner Profile displays the saved reason after refresh; public profiles remain restricted to approved Agents. Do not auto-resend historical rejection emails.
6. Include languages in public Agent profile reads, preserve all saved entries including Tamil, and test the save/read/reopen path. Verify writes do not silently discard data. Existing language defaults apply only when no saved value exists.
7. Add horizontal and vertical cover-position sliders (0-100 percent, default 50/50), live image preview, and reset-to-center in Profile Studio. Persist position independently from image data and apply it to public profile object-position after reload. New image/preset selection resets position to center; Cancel discards unsaved positioning. Validate numeric range server-side. Provide additive SQL following repository conventions if persistent columns are required; never silently drop position fields when schema is absent. Schema adoption must precede live position acceptance.

## Evidence from inspection

- Register.jsx sends agencyName/licenseNumber; authController reads agency_name/license_number.
- adminRepository returns agent_profiles nested; AgentApprovalsPage reads agency_name/license_number at top level.
- agentRepository public selections omit languages while profile writes include it; AgentProfile falls back to English/Sinhala.
- Topbar fetches listing/Seller queues only.
- adminUserController does not dispatch a rejection email; ProfileSettings omits REJECTED_AGENT profile loading and public getAgentProfile deliberately rejects nonapproved accounts.
- Cover renderer uses centered object-cover; no persisted focal-point controls exist.

## Validation and acceptance

Use failing regressions before implementation for registration mapping, nested Admin data/details, notification counts/navigation, rejection reason validation/owner privacy/mail outcomes, languages round trip, pending Hub state and cover positioning/cancellation. Run focused suites, backend/frontend full tests as appropriate, ESLint and frontend build. Verify SQL and live data paths without exposing credentials. User-guided retest covers only seven changed paths; keep existing passes, and record email/browser/schema limitations explicitly.

Implementation is not manual acceptance. Do not mark issues closed until the corresponding guided retest passes. Leave pre-existing runtime logs out of source changes.
