# Shared error/logging boundary implementation

Approved2026-11-04; execute inline, owner retains Git. No dependency, provider,
DB, Docker, external telemetry, env or deployment operations.

- [x] Add failing privacy regressions for production/development shared errors,
  status spoofing, upload/parser mapping and request-log private markers.
- [x] Implement owned fixed public errors, safe shared context/logger and global
  mapping; migrate the safe AI unavailable error without changing its response.
- [x] Verify actual HTTP registration/health suppression and existing auth/AI
  contracts; full backend and scoped independent review, fix actionable issues.
- [x] Record evidence/residual controller/proxy scope; whitespace/index checks.

Result: seven red regressions, focused84/84, full backend1198/1198 across81 suites and scoped review passed. Real loopback tests cover parser/privacy/ownership. Wider controller/proxy policy and owner rollout remain open.
