# Phase7 role-request transaction rollout

Owner approved the design and then the concrete local amendment2026-11-03.
Code, guarded candidate and separate temporary supplement passed real local
PostgreSQL/PostgREST/HTTP/locking acceptance23/23. All temporary objects/fixtures
were removed and the test database restored. This is not production adoption;
the required function is currently absent from the restored test target.

## Behavior and dependency

Admin approval/rejection calls only resolve_seller_role_request(uuid,text).
Approval accepts a pending SELLER request whose locked target user is BUYER.
Rejection resolves a pending request without changing a role. The intended SQL
transaction updates both role/status or neither. Existing direct Admin role
edits and user request-creation semantics are outside this change.

The function uses invoker privileges and an empty search_path. Revoke PUBLIC,
anon and authenticated execution; only the backend service_role gets EXECUTE.
Existing protect/requireAdmin middleware authorizes the HTTP caller. Never
expose the service key or trust body-supplied decision/role/user identity.

Missing request =>404; already resolved =>400; unsupported stored role,
ineligible user or historical uniqueness conflict =>409. Unavailable/missing
function, malformed result and other failures =>generic500 through the existing
error handler. No sequential fallback, retry or compensating role reversal.
Network failure can still leave the caller uncertain whether an atomic commit
completed; refresh request/user state before a manual retry.

The unique(user_id,status) constraint remains. Resolution can fail409 if an
older request already has the same final status; both current writes must roll
back. Do not delete history or relax constraints to make this test pass.

## Approved isolated acceptance amendment — completed locally

The dedicated runner implements the following owner-approved boundary:

1. Use only the existing fresh acceptance DB/REST pair, localhost59322/59321,
   nonce-labelled volume and approved loopback bridge. Apply the existing full
   stopped/running identity, image, nonce, binding, network and ready guards.
   Start only that pair when needed; leave retained stacks and unused network.
2. Verify original initializer provenance/patch hashes, two migration entries,
   all19 tables/catalog, and absence of the new function. Never update the ready
   receipt, canonical migrations, target.sql or existing provenance to authorize
   a different schema. Take separate additive test receipts and baseline snapshots.
3. First run the exact candidate inside BEGIN with transaction-local
   thirasara.phase7_role_request_test=rollback-only. Inspect function owner,
   invoker/search_path, signature and ACL. Perform SQL cases and ROLLBACK; compare
   all19 full data snapshots/catalog/ledger with the initial baseline.
4. Real concurrent connections and PostgREST cannot see an uncommitted function.
   For that phase, commit a separately reviewed equivalent function-only test
   supplement and synthetic fixtures in this fresh target under a dedicated
   nonce/hash receipt. This is an explicit temporary schema amendment, NOT
   execution of the rollback-only candidate with its guard stripped. Verify exact
   function/source/ACL drift against the receipt before any fixture writes.
5. Run backend HTTP valid/invalid/unauthenticated/non-Admin scenarios through
   registered ephemeral loopback listeners with the existing strict network and
   inert-provider mocks. Verify direct REST anon/authenticated execution denied,
   service_role execution works and response confirmation is enforced.
6. Use separate PG connections and lock observations/bounded deadlines (no
   timing-only assertions): ban locks first =>approval fails without unbanning;
   approval locks first =>later ban leaves BANNED; approve/reject and two approvals
   yield one winning resolution. Use only synthetic fixture IDs.
7. Inject a fixture-scoped second-write failure with a reviewed temporary trigger;
   assert BUYER/pending remain and remove that trigger. Check historical unique
   conflict rollback, unsupported requested role, non-BUYER targets and missing/
   resolved request. Do not disable RLS or constraints.
8. Remove only exact new fixture IDs and exact receipt-owned temporary objects
   (trigger/helper/function), after checking object ownership/definitions/hashes.
   Never drop baseline objects or CASCADE. Verify original complete snapshots,
   logical catalog/ledger and retained-resource states. Preserve private logs and
   separate receipt. Stop only the new pair and retain its volume/networks.

Owner approval covered the temporary committed function, synthetic fixtures,
failure-injection trigger/helper and precisely checked removal needed to restore
the original target. A rollback-only function test by itself cannot establish
cross-connection HTTP/concurrency behavior. This specific amendment was approved
and executed; that authorization does not extend to production or retained stacks.

## Production adoption sequence — owner-controlled

1. Finish real isolated SQL/HTTP/race/rollback acceptance and independent review.
2. Package a separate reviewed production migration with exact signature/body,
   owner, invoker/search_path and restricted ACL. Keep isolated guard SQL out of
   production; do not copy a stripped candidate into a live SQL editor.
3. Owner applies function before deploying dependent endpoint code, validates
   deployed identity/grants/schema cache and checks with controlled accounts.
4. Coordinate retirement of revisions still running sequential approval. Rolling
   back to those revisions reintroduces the demonstrated risks; do not advertise
   code rollback as a safe recovery procedure. Keep new endpoints unavailable if
   dependency checks fail. No function removal while dependent code is active.

Remaining limitations: Admin authorization is still checked at the existing
HTTP middleware boundary; no stronger administrator-demotion serialization is
introduced. Direct-role edit confirmation, user request-creation races, long-term
history/retention policy and request idempotency remain open.

## Preparation verification

New48 boundary/repository/Admin-gate cases:44 failures/4 existing-gate passes
before implementation, then48/48 passed. Focused93/93 across6 suites and full
backend1109/1109 across73 suites passed. Independent scoped source review found
no actionable issues. Existing auth/session socket tests initially failed EACCES
inside the sandbox; rerun with loopback permissions passed. No real database or
container/provider operation occurred. Frontend/Go/container runtime not rerun.

## Real local acceptance — 2026-11-03

The exact rollback-only candidate compiled in PostgreSQL17.11.0.006, executed
service-role approval and rejected a banned target, then ROLLBACK restored all19
table snapshots/catalog/ledger. Separately guarded temporary committed SQL used
the same function/ACL definitions on the approved fresh DB/REST pair only.

All23 real cases passed: anon/authenticated direct RPC denial with42501 and
unchanged state; service-role success; actual Admin HTTP approval/body-spoof
resistance/rejection; anonymous/non-Admin/banned-caller denial; all six non-BUYER
roles denied promotion; invalid stored role; missing/invalid/resolved request;
forced second-write failure and historical uniqueness-conflict rollback; both
ban/approval lock orderings; approve/reject and duplicate-approval serialization.
Concurrency checks observed pg_blocking_pids rather than depending on sleeps.

Before cleanup, the runner compared exact recorded function/trigger metadata
and all synthetic fixture identities under table locks. It removed only those
objects/IDs without CASCADE. All19 complete snapshots, logical catalog, migration
ledger and public trigger metadata matched the starting state; original ready
patch, provenance and completion receipt stayed unchanged. Only the fresh pair
was stopped; retained resource identities/states and volume/two networks were
preserved. Per-run private receipts/logs remain untracked under docs/evidence.
The original candidate is retained byte-for-byte for hash reproducibility; its
preparation-time UNEXECUTED header is superseded by this rollback-test record.

Harness failures are retained, not counted as passes: initial Docker-unavailable
preflight refusals made no DB changes; the owner started Docker. A trigger OID
string/integer comparison refused the temporary phase and rolled it back. Two
OPTIONS probe forms returned PGRST202/PGRST100 rather than providing suitable RPC
readiness. They were replaced with documented read-only service-role OpenAPI
discovery, which waited through startup503 responses for200 and the exact POST
path. All failed DB attempts verified full restoration and stopped the pair.
No function or transaction assertion was relaxed.

Guard tests passed26/26 (initial16 red/2 passes; separate OID and discovery
regressions red then green). Latest full backend1135/1135 across74 suites passed
(25.686s); independent pre-execution and post-evidence reviews found no remaining
actionable P1/P2 findings. No frontend/Go/provider/Storage test or production
adoption, runtime upgrade, crash-recovery or request-idempotency claim.

Reproduction: with Docker running and this fresh pair stopped, from backend-node
run `node integration/phase7/run-role-request.cjs`. It refuses wrong identities,
changed original receipts/catalog or pre-existing amendment objects. A crash
can leave a private lock/receipt-owned objects for manual inspection; it does not
silently resume, delete unknown objects or claim automatic crash recovery.

Readiness reference: [PostgREST16 OpenAPI](https://docs.postgrest.org/en/stable/references/api/openapi.html).
