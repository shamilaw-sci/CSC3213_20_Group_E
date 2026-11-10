# Role-request resolution transaction

Status: owner approved2026-11-03; endpoint/repository preparation implemented,
guarded SQL candidate rollback-tested; approved separate temporary supplement
passed real local23-case acceptance and was removed. Production adoption remains open.

## Evidence and intended behavior

The current Admin route requires a fresh authenticated ADMIN session. However,
`adminRoleRequestController.approveRoleRequest` checks only the request status,
then calls two independent repository writes. `updateUserRole` filters only the
user ID; `resolveRoleRequest` filters only the request ID. Neither enforces the
BUYER-to-SELLER transition inside the write.

On 2026-11-03 an offline VM loaded the actual controller and repository with
synthetic Supabase responses; no config module, dotenv, socket or real data was
loaded. Three reproductions observed:

1. A pending SELLER request for a BANNED user changed the user to SELLER and
   returned 200 with the request approved.
2. A synthetic request-status write failure left the user SELLER and the request
   pending while the controller forwarded an error.
3. A synthetic stored requested_role of ADMIN changed the user to ADMIN. The
   ordinary buyer request endpoint creates only SELLER requests; this third case
   requires invalid stored data and does not demonstrate a normal buyer-to-ADMIN
   exploit.

The baseline has a unique (user_id, status) constraint. A second historical
approved/rejected request can therefore conflict during resolution. Do not
delete history or loosen the constraint as part of this fix.

## Options

- Recommended: resolve each request in one database function call, locking and
  validating the request and target user before atomically updating both rows.
  Requires a separately adopted database function and real local acceptance.
- Schema-free conditional writes: validate requested role and compare the user
  role in the UPDATE. Reduces ban overwrites but cannot make the two records
  atomic or fully serialize approve/reject. This is only partial mitigation.
- Compensating writes: change the user and attempt a reversal after failure.
  Rejected because a reversal can overwrite a later legitimate change and a
  network failure cannot establish whether the preceding write committed.

## Proposed contract

Add `public.resolve_seller_role_request(p_request_id uuid, p_decision text)` as
SECURITY INVOKER with an empty search_path and fully qualified table names.
Revoke EXECUTE from PUBLIC, anon and authenticated; grant only service_role.
The existing backend protect/requireAdmin middleware remains authoritative for
the initiating account; the service credential stays exclusively on the server.
This does not introduce database authorization from a caller-supplied actor ID.

Accept only decisions approved or rejected. Lock the request row FOR UPDATE,
then check existence and pending status. For approval, require requested_role
exactly SELLER, lock its target user row FOR UPDATE, and require current role
exactly BUYER. Update the user to SELLER and the request to approved in the same
transaction. Rejection changes only the pending request to rejected, allowing
an Admin to reject an invalid requested role safely. No agent-profile write is
needed for a BUYER-to-SELLER transition.

Concurrent approval/rejection calls serialize on the request. A ban that commits
before approval obtains the target-user lock makes approval fail; a ban ordered
after successful approval leaves the user banned. Never restore a role using a
stale value. SQL failure, including the existing historical-status uniqueness
conflict, must roll back the whole call. No automatic retry or compensation.

Return a small outcome with request ID, decision and target user ID on success;
do not return user profiles. Missing request maps to 404, resolved request keeps
the current 400 contract, and invalid stored requested role/ineligible current
role/history conflict map to generic 409. Invalid decision/UUID input maps to
400 before RPC. Other database failures propagate through the existing error
handler without raw database details in this endpoint's response or local logs.
Only a confirmed matching RPC outcome produces success. Missing function must
fail closed; never fall back to sequential writes.

## Scope and adoption

After design approval, prepare controller/repository changes, mocked regression
tests, a guarded rollback-only SQL candidate, and rollout documentation. Keep
the existing direct Admin role-edit/ban endpoints and user request-creation
semantics outside this batch. Their write confirmation, request-creation race,
history policy and administrator-demotion timing remain separate findings.

Production adoption remains owner-controlled. Do not edit canonical baseline
migrations, apply to live/retained databases, modify credentials, stage or commit.
The new endpoint code requires function adoption before deployment.

Real acceptance requires a reviewed supplement to the existing fresh Phase7
test target, exact function ACL/catalog guards and preserved data/catalog/ledger
receipts. Do not silently alter the ready target's hash receipt or replay its
initializer. Present that concrete test-target amendment for approval before
applying it; local mocked tests alone cannot close the database race finding.

## Verification criteria

Mocked tests must cover existing middleware, valid approval/rejection, banned
and other non-BUYER targets, unsupported stored role, absent/resolved request,
invalid input, malformed/mismatched RPC results, returned/thrown RPC errors,
missing function and no sequential fallback. Update the old test which currently
asserts the unsafe two-write order.

Real PostgreSQL/PostgREST acceptance must additionally demonstrate rollback
after a forced second-write failure, both ban/approval lock orderings,
approve/reject and duplicate-approval serialization, historical unique-conflict
rollback, anon/authenticated denial and service-role success. Run affected and
full backend checks after implementation, then independent scoped review.

## Primary references checked 2026-11-03

- [Supabase database functions](https://supabase.com/docs/guides/database/functions):
  invoker security and explicit function execution grants.
- [PostgreSQL 17 transactions](https://www.postgresql.org/docs/17/tutorial-transactions.html):
  atomicity of multiple writes.
- [PostgreSQL 17 explicit locking](https://www.postgresql.org/docs/17/explicit-locking.html):
  row locks and concurrent updates.

The changelog.md fetch initially returned unsupported text/markdown. During
implementation the HTML changelog and relevant release entries were checked;
explicit service-role grants remain part of the candidate. Local locked
supabase-js2.117.2 declares Node>=22 while backend Dockerfile specifies Node20.
That separate runtime/adoption issue is recorded in the remaining-work tracker;
no image, dependency or lockfile was changed.

## Preparation evidence

New boundary/repository tests:44 failed/4 Admin-gate checks passed before runtime
changes; all48 then passed. Focused93/93 across6 suites passed. Initial combined
run had26 socket EACCES failures in existing auth/session tests; loopback-enabled
rerun93/93 passed. Full backend1109/1109 across73 suites passed (28.373s).
Independent scoped review found no actionable issues in controller/repository,
SQL source, tests or rollout. No SQL execution, database/container/provider call,
credential/dependency/frontend/Go change, Git staging/commit or deployment.

The preparation evidence above initially covered mocked boundaries/source only.
Subsequently the owner approved and completed the separate local amendment:
23/23 real SQL/HTTP/ACL/rollback/locking cases passed, temporary objects/fixtures
removed, all19 snapshots/catalog/ledger/triggers and original receipts restored,
only fresh pair stopped and retained resources preserved. Guard26/26 and latest
full backend1135/1135 across74 suites passed; pre/post independent reviews found
no remaining actionable P1/P2 findings. The original candidate file/hash is
preserved including its preparation-time header. See the
[completed local amendment and owner adoption boundary](../../phase7-role-request-rollout.md).
