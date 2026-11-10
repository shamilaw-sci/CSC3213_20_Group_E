# Profile preflight implementation plan

Owner approved2026-11-04; execute inline. No Git staging/commit/deployment or
real Storage/database/provider operations. Dependency versions unchanged.

- [x] Add controller regression tests for malformed input, forged image bytes,
  password-before-upload ordering, safe failures and legacy partial outcomes;
  observe RED before implementation.
- [x] Implement focused pure parser and avatar preflight, random owned object
  names/no upsert, password/email checks before upload, safe recovery events and
  explicit partial-success response for legacy schema fallback.
- [x] Align profile picker types/size and test rejection/valid selection with
  FileReader mocked; preserve existing session cache behavior.
- [x] Run focused/full backend and frontend tests/lint/build sequentially under
  established memory/worker limits. Independent scoped review; resolve findings.
- [x] Record exact evidence and limitations; whitespace/index checks, no deploy.

Result: full backend1170/1170, frontend305/305 across48 files, lint/build passed. Independent review WebP P2 fixed with a red regression then cleared; no remaining actionable P1/P2. Real Storage/decoder/durable recovery and wider Phase7 gates remain open. No dependency, SQL, Docker or Git/deploy actions.
