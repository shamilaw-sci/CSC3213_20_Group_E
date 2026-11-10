# Approved AI tool boundary implementation

Owner approved2026-11-03. Use the existing checkout; manual Git only. No live provider/DB calls.

1. Add `backend-node/tests/aiToolBoundary.test.js` exercising the real controller with mocked Gemini and Supabase. Cover valid/invalid args, literal-string grammar, zero price, safe filters/projections/limits, no-tool replies and sanitized provider/query failures. Run `npm test -- --runInBand --runTestsByPath tests/aiToolBoundary.test.js`; verify intended current-code failures.
2. Extend `backend-node/validators/aiValidator.js` with strict per-tool schemas and export them. Add controller-side plain-object checking, schema validation before DB access and fixed invalid/unsupported results. Apply price0, preserve positive query behavior. Replace raw provider/query error propagation/logging with fixed safe errors/events. No model/auth/schema/dependency changes.
3. Run focused tests, full backend `npm test -- --runInBand --silent` with512MiB heap/semi-space4MiB. Request bounded independent review; resolve findings and rerun affected checks. Syntax/whitespace/index verification. No frontend/Go rerun needed unless their code changes.
4. Mark design approved/implemented, record actual evidence and limitations in Phase7 plan. Do not claim production or real Gemini acceptance. No stage/commit/push/deploy.

Implementation details follow the approved spec: Unicode literal strings max120/80, strict plain objects, no unknown keys, finite nonnegative numeric prices, fixed structured tool errors, sanitized503 failures. Tests must inspect exact call-through query guards as well as absence of DB calls for invalid args.

Completed steps1–4 on2026-11-03. Actual red69 failed/8 passed; initial implementation caught one Sinhala joiner compatibility failure, corrected with safe U+200C/U+200D allowance. Focused77/77; full backend908/908 across64 suites (17.762s),512MiB heap/semi-space4MiB, sequential. Independent review found no actionable defects. Syntax/whitespace/index checks passed. No frontend/Go rerun, live provider/database calls, applied schema/env/dependency changes or stage/commit/push/deploy.
