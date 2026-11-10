# Admin role writes and seller request creation

Status: owner approved and implemented2026-11-04. Full backend1257/1257 and
independent read-only review passed. Production and wider phase gates remain.

## Evidence and purpose

Offline VM probes of the actual repository/controller, using synthetic database
results and no environment or network access, reproduced three outcomes:

- A zero-row user update returns HTTP200 for a ban while the role remains BUYER.
- An AGENT user update followed by a returned profile error returns HTTP200.
- Creating a replacement seller request deletes the pending request first; an
  insert failure then leaves no pending request.

These demonstrate response/state handling defects under synthetic failures, not
a demonstrated live exploit. The canonical schema already enforces UNIQUE
(user_id, status) on role_requests. The seller-resolution RPC batch remains
separate and requires owner adoption before production use.

## Approaches

Recommended: confirm direct writes and explicitly report partial outcomes, and
make pending seller creation nondestructive and repeatable using the existing
unique constraint. This needs no schema change and closes the reproduced gaps.

A response-only fix would leave request deletion and ignored profile failures.
A new transaction RPC could make role/profile changes atomic, but expands the
database adoption and local SQL acceptance scope. That is a separate follow-up;
this batch must not describe sequential writes as atomic.

## Direct role changes

Validate the target UUID before repository access for ban, unban and role edit.
Keep the existing role allowlist and Admin authorization. Optional reason must
be null or a string of at most2000 characters; reject objects/arrays/oversize
values before any write. Trim a supplied string; blank becomes no reason.

Select id and role from the user update and require exactly one matching row
before reporting success or attempting a profile update. No matching row maps
to a fixed404. Returned malformed/mismatched data, database errors and uncertain
transport outcomes fail generically without a success claim. An error or
unconfirmed result does not prove that a write was rolled back.

Preserve current profile-write conditions: AGENT clears rejection_reason;
REJECTED_AGENT with a nonempty reason sets it. Require confirmation of the
matching agent_id and intended rejection_reason for that second write.
If it errors, throws or cannot be confirmed after the role write was confirmed,
return a fixed409 partial-outcome message: the role changed, profile update
could not be confirmed, and the Admin should refresh before retrying. Emit a
fixed recovery event with a validated target UUID and fixed stage only. Do not
automatically revert the role or retry either write. A successful role response
confirms the observed write, not durable exclusion of later concurrent changes.

Use owned public-error metadata for fixed404/409 responses; never trust a
repository exception's arbitrary statusCode/message. Other failures retain the
shared fixed500 path. Ban/unban successful messages stay compatible.

## Seller request creation

Remove the pending DELETE. Insert a new pending SELLER request and select only
id, user_id, requested_role and status. Require a matching UUID row with the
authenticated user, SELLER and pending before returning a new-request201.

On the insert's PostgreSQL23505 conflict only, read the pending request for this
user. A confirmed pending SELLER row is an already-submitted200 response; retain
its ID, timestamps, reason and contents. Missing, mismatched or non-SELLER pending
rows return a fixed409 conflict. Other failures fail generically. Do not overwrite
or delete a pending request or resolved history. Never turn a transport error
into a duplicate-success claim. A later client retry can discover a committed
pending row through the same unique constraint path.

Keep the existing current-BUYER precheck and server-chosen SELLER target. This
does not atomically lock the user during creation. Concurrent bans/resolutions
remain possible; the prepared resolution RPC's current-BUYER check remains the
guard against approving a banned user. Read confirmation is a point-in-time
observation, not a lock or an assertion that approval has not happened afterward.

## Verification and boundaries

Add regression tests first against the actual repository/controller paths:
zero-row/malformed/mismatched role results; required profile returned errors,
throws, missing rows and successful confirmation; bad inputs with zero writes;
new request confirmation, duplicate preservation and failed inserts without any
DELETE, mismatch/history conflicts, and unknown-outcome failures. Verify fixed
messages and marker-free logs. Update old tests that assumed undefined write
results meant success; preserve authorization coverage and allowed-role behavior.
Run focused tests, full backend tests sequentially, whitespace checks and an
independent bounded read-only review. Report actual counts and limitations.

No real accounts/provider calls, schema/environment/credential changes, Docker
operations, dependency installs/upgrades, deployment or Git staging/commit/push.
No change to self-demotion/last-Admin policy, current unban-to-BUYER behavior,
role-resolution SQL, durable retries or cross-row transaction guarantees.
Seven major Phase7 packages remain; this is one scoped increment within them.
