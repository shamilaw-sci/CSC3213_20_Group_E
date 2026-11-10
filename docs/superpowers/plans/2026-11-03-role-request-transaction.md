# Role-request transaction implementation plan

> **For agentic workers:** Use executing-plans inline for this approved batch;
> request an independent scoped reviewer before finishing. Owner retains Git.

**Goal:** Prepare atomic BUYER-to-SELLER request resolution and fail closed when
the required function or a confirmed result is unavailable.

**Architecture:** One repository RPC call replaces controller-side reads and
sequential writes. A separately adopted SECURITY INVOKER PL/pgSQL function locks
the request and approval target, validates their state and updates atomically.

**Tech stack:** CommonJS Node, Jest, existing supabase-js, PostgreSQL17.

## Constraints

- Approved spec: `docs/superpowers/specs/2026-11-03-role-request-transaction-design.md`.
- No stage/commit/push, dependencies, canonical migration edits, real accounts,
  credentials, live/retained schema changes or container starts in this batch.
- SQL candidate is isolated-only and rollback-only; do not apply it now.
- Real SQL/HTTP/lock acceptance remains a separately approved target amendment.
- Sequential heavy checks with NODE_OPTIONS heap512 MiB/semi-space4 MiB.

## Task 1: RPC boundary and regression tests

Files: new `backend-node/tests/roleRequestTransaction.test.js` and
`backend-node/tests/roleRequestRepository.test.js`; modify
`backend-node/tests/adminRemainingController.test.js`,
`backend-node/controllers/admin/adminRoleRequestController.js`, and
`backend-node/repositories/adminRepository.js`.

- [x] Write tests and verify RED against current sequential code. Cover invalid
  UUIDs, both decisions, unchanged success messages, RPC parameters, all expected
  conflict outcomes, returned/thrown provider errors, missing function,
  malformed/mismatched results, no old read/write fallback and sanitized errors.
  Use actual controller/repository modules with their external boundaries mocked.
- [x] Add `resolveSellerRoleRequest(requestId, decision)` returning the existing
  Supabase `{data,error}` response from exactly one `.rpc(...)` call:

  ```js
  supabase.rpc('resolve_seller_role_request', {
      p_request_id: requestId, p_decision: decision
  });
  ```

- [x] Validate UUID strings before RPC. Do not read client role/user/decision
  fields: the handlers supply fixed approved/rejected decisions. Confirm exactly
  one result row with matching request ID/decision and a UUID target user ID.
  SQLSTATE P7001 =>404, P7002 =>400, P7003/P7004/23505 =>409;
  all other errors become a new fixed-message Error forwarded to next(). Do not
  attach the original error as cause or log it. No automatic retries/fallback.
- [x] Replace the legacy test asserting unsafe write ordering with the single
  atomic call contract. Preserve resolved-request and unrelated tests.
- [x] Run GREEN focused tests plus Admin management/auth/session suites.

## Task 2: Isolated SQL candidate and rollout

Files: new `docs/database/phase7-role-request-transaction.candidate.sql` and
`docs/phase7-role-request-rollout.md`.

- [x] Write candidate guard requiring postgres, PG17, isolated guard namespace,
  an active explicit transaction (runner requirement), and transaction-local
  `thirasara.phase7_role_request_test=rollback-only`. Verify expected users and
  role_requests table ownership/RLS/UUID columns, backend SELECT/UPDATE access,
  and absent proposed function. Refuse public/client write access to both tables.
- [x] Create function with typed UUID/text arguments, TABLE return of request_id,
  decision and user_id, SECURITY INVOKER, empty search_path. Use explicit aliases
  to avoid output-parameter/column ambiguity. Validate decision, lock request
  FOR UPDATE, check pending. Approval requires SELLER and locks current user
  FOR UPDATE with role BUYER; updates both rows. Rejection updates only request.
  Use P7001 missing, P7002 resolved, P7003 stored-role, P7004 ineligible,
  P7005 invalid decision. Let uniqueness/other write errors abort the call.
- [x] Revoke all function privileges from PUBLIC/anon/authenticated, grant
  EXECUTE only service_role. No SECURITY DEFINER, dynamic SQL, historical cleanup,
  table-policy change or exception swallowing. Keep candidate unexecuted.
- [x] Document coordinated owner function-before-code adoption, no old fallback,
  historic conflict behavior and remaining direct-role/request-creation findings.
  Spell out a separate rollback-only local amendment: existing fresh target only,
  preserved baseline/ledger/receipts, dedicated transactions/fixtures, all19 table
  and catalog restoration, RPC ACL/HTTP/lock/forced-failure cases and stop pair.
  Do not change initialize/ready hashes or run it without separate approval.

## Task 3: Verification and review

- [x] Run focused Jest then full `npm test -- --runInBand`, sequentially.
- [x] Independent scoped review of runtime, SQL, tests and rollout against spec.
  Fix actionable issues and rerun affected checks.
- [x] Check diff whitespace, confirm Git index empty, record precise evidence
  and adoption limitations in spec/plan/master tracker/inventory/README.
- [x] Report prepared code and actual counts. No SQL atomicity/race closure claim
  until real PostgreSQL/HTTP acceptance; no production readiness claim.

## Recorded result

All preparation tasks completed2026-11-03. New48 cases:44 red/4 gate passes, then48 green; focused93/93 and full1109/1109 across73 suites passed. Independent reviewer reported no actionable findings. SQL candidate remains unexecuted. Real PostgreSQL/HTTP/race evidence and function adoption remain open; the rollout documents the proposed separately approved local amendment. No Git staging/commit or database/container changes.
