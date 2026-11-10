# Chat send failure recovery

Status: owner approved and implemented2026-11-03; scoped tests/full backend verification complete. No database/schema changes or live calls.

## Source and fixture evidence

The real sendMessage controller uploads before createMessage, then updates the conversation timestamp before returning201. Fixture-only invocation with mocked repository showed one committed message followed by forwarded error/no201 when timestamp update failed. A second fixture completed one upload then rejected message insert; source has no cleanup operation. No real message, file, account, DB or network was used. Retrying a false failure can duplicate a committed message, though this proof did not itself retry.

## Options

1. Recommended bounded recovery: distinguish confirmed persistence, definite insert rejection and uncertain insert outcome. Preserve successful sends after optional timestamp failure and clean up only safe rejected uploads. No schema change.
2. Full idempotent send protocol/outbox: stable request key, uniqueness/transaction design and durable reconciliation. Stronger duplicate/crash recovery, but requires a separate schema/API/frontend design and owner-applied migration.
3. Delete on any send error. Rejected: a timeout or post-insert error can occur after a successful commit, so deletion can break an existing message's attachment.

## Proposed contract

Authorization remains before upload. Keep sender/role mapping, message/body/file fields, safe filename generation, signed response decoration and201 response shape. No new public endpoint or client request field.

Track only the exact newly uploaded conversation-scoped object key from this request, after upload confirmation. Storage upsert remains disabled. Add an internal repository remove method for that key; it must validate the expected conversation UUID/path shape and fixed chat bucket. Never accept a cleanup path from req.body, an arbitrary stored URL, another message or another request.

For a definite database insert rejection, remove that exact object and await completion. Conservative recognized PostgreSQL statement-rejection codes:23502 (not-null),23503 (foreign key),23514 (check),22P02 (invalid representation),42501 (permission denied). Restrict classification to an error returned by the actual createMessage insert result; arbitrary thrown transport errors do not qualify merely because they have a code field. Do not classify unique conflicts, SQLSTATE class08/connection loss, timeouts, malformed/missing rows, PGRST single-row errors or unknown errors as safe deletion evidence. Preserve the original send error after cleanup; a cleanup failure adds a sanitized recovery event and cannot mask it.

If insertion fails with an uncertain outcome, retain the upload and emit a sanitized recovery event with conversation/user IDs and the exact generated key (never message text/file contents/token/signed URL/raw exception). Forward the original error under existing API error policy. This does not resolve uncertain commits, guarantee no orphan, or prevent duplicate retries. Durable reconciliation remains open.

Once createMessage returns a confirmed row, never delete the attachment due to timestamp update or signed-delivery failure. Timestamp update is secondary: log a sanitized recovery event if it fails, then continue returning the saved message201. This intentionally changes false-error behavior after confirmed insertion. Require an identifiable returned message row matching this conversation before declaring success; malformed/missing data is uncertain and retains any file. If signed decoration throws unexpectedly, retain the committed message/file and preserve existing error behavior; signed-delivery utilities already handle normal signing failures as unavailable.

## Tests and acceptance

Use actual controller/repository with mocks at external boundaries. Demonstrate current red cases for uploaded-then-definite-rejection cleanup and committed-then-timestamp-failure201. Verify auth refusal has no upload/removal; upload failure performs no removal; successful text/file sends unchanged; each recognized returned rejection cleans only owned key; unknown/thrown/timeout/single-row failures retain files; cleanup failure preserves original error and sanitized recovery metadata; malformed insert row cannot produce false success; committed row survives timestamp/decoration failures. Query-aware repository tests must distinguish returned insert errors from thrown errors without rewriting shared errors or accepting user-controlled cleanup paths. Run focused/full backend tests and independent review. No real Storage/DB/network/provider call.

## Limits and rollout

No cross-service atomicity, durable cleanup job, process-crash recovery, request idempotency or guaranteed ordering is added. Non-atomic profile writes/same-lead ordering remain separate. No private-bucket cutover, credential/config/schema/dependency/frontend change, stage/commit/push/deploy. Deploy only with the existing owner-controlled Phase7 acceptance/release process.

## Actual verification

New actual-controller/repository suite35 cases: initial27 failed/8 passed, then35/35 green; combined recovery/access/repository41/41 passed. Per-invocation WeakMap wrapper distinguishes recognized returned insert errors without mutating shared driver errors; original send errors are restored. New remove method validates the conversation UUID and generated basename before fixed-bucket deletion. Full backend943/943 across65 suites passed in17.425s with512MiB heap/semi-space4MiB. Earlier sandbox aggregate failed266 socket cases with EACCES (677 passed); permission-correct rerun passed all943. Independent bounded review found no actionable defects. Syntax/whitespace/index checks passed.

Optional coverage gaps: thrown timestamp failure, successful AGENT sender remapping, invalid conversation UUID/encoded cleanup paths. No live Storage or guarded local profiles were rerun for this batch; all new external boundaries mocked. Actual Storage cleanup/timeout behavior and the existing private-bucket cutover gate remain open. Original design excludes durable recovery and retry idempotency; those limits remain.
