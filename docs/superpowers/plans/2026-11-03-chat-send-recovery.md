# Approved chat send recovery implementation

Owner approved2026-11-03. Existing checkout/manual Git; no real DB/Storage/network calls.

1. Add actual-controller/repository tests with mocked Supabase, verifying definitive returned-rejection cleanup versus thrown/unknown ambiguity, awaited cleanup/error identity, malformed-row refusal and post-commit timestamp behavior. Run focused tests and observe intended red outcomes.
2. Add private per-invocation rejection provenance helper in utils/chatMessageFailure.js (WeakMap wrapper, no mutation of shared errors). Repository tags only recognized returned INSERT errors, not thrown errors. Add fixed-bucket removal requiring matching conversation UUID and exact generated filename format. Controller tracks the key only after upload succeeds, catches insertion separately, awaits safe cleanup, logs sanitized recovery metadata, preserves original errors. Confirm returned message identity/conversation before success; treat timestamp failures as secondary, never clean after commit.
3. Run focused tests and full backend with512MiB heap/semi-space4MiB. Request independent review; fix issues and rerun affected checks. Syntax/whitespace/index verification.
4. Record outcomes and limits in approved design, remaining-work tracker and Phase7 plan. No frontend/Go rerun, schema/config/dependency/stage/commit/push/deploy. Durable cleanup/idempotency and private Storage acceptance remain open.

Completed steps1–4 on2026-11-03. Red27 failed/8 passed; focused41/41; final full backend943/943 across65 suites. Initial aggregate sandbox attempt failed localhost socket cases; permission-correct retry passed. Independent review no actionable findings; syntax/whitespace/index checks passed. No real DB/Storage/network, frontend/Go rerun or guarded-local integration rerun in this batch.
