# Frontend log privacy —2026-11-04

Owner approved this concrete design after the Phase7 remediation instruction.
Prepared batch27 is implemented and verified: full frontend347/347, lint/build pass.

## Changed behavior

A small private allowlist of46 operation events backs error/warn helpers. Each
helper emits a single fixed event string at its fixed severity. Unknown/nonstring
events map to client_operation_failed without coercion. Extra arguments are
ignored; no error/message/config/header/body/URL/session/user metadata enters the
log boundary. The utility does not monkey-patch console or inspect source data.

Migrated52 direct console sites in36 production files covering auth/contexts,
Admin/user/agent pages, property/payment/map hooks and components. Existing
requests, user-facing feedback, state/error propagation, session/logout/storage
behavior, payment confirmation and retries are preserved. Event names replace
arbitrary diagnostic data only. Direct production console calls now exist only
inside the reviewed utility. Existing ESLint enforces no-console for production
src JS/JSX, with explicit test/utility exclusions; this is a regression guard,
not a global runtime console interceptor.

## Evidence

- Actual Admin-session, property-form and payment-hook failure tests reproduced
  private synthetic markers in console before changes:3 failed/41 baseline
  passing, plus the initially unimplemented utility suite could not load.
- Utility tests cover known event severity/single-argument output, unknown values
  (including errors/arrays/prototype names), extra Axios/config/header/body/URL
  markers and hostile stringification. Actual failure tests retain existing
  cache/session/form/payment assertions while proving log markers absent.
- Focused55/55 across4 files passed. Three legacy login/Admin integration log
  expectations now use fixed events while retaining their business assertions.
- The same synthetic raw console statement passed ESLint before the guard and
  failed afterward with no-console; a test-filename capture still passed.
  Neither probe created a file or used private data.
- First full lint identified5 unused catch parameters and a preexisting BOM
  displaced by adding an import. Removed unused parameters and the displaced
  BOM; fresh full lint passed. No validation rule was weakened.
- Full frontend **347/347 across52 files,242.02s** passed, followed by a successful
  production build. Fresh lint passed. Existing large-chunk and Lottie dependency
  direct-eval warnings remain; no upgrade or warning suppression was performed.
- Independent bounded read-only review found no actionable P1/P2 findings.
  The reviewer performed no edits, tests or external operations.

## Limits

Only this frontend production-source boundary is covered. Third-party/SDK logs,
browser/devtools/network panels, collector capture/retention/access and source-map
policy remain separate. User-facing API error feedback was intentionally retained;
this is not arbitrary data redaction or end-to-end privacy clearance. Existing
map/showcase fallbacks, public payment-config UI defaults and session/storage
failure policy were not redesigned under this logging scope.

Backend source unchanged: latest full1320/1320 is the previous verified revision,
not a fresh backend rerun. No real provider/account/payment/mail/DB/Storage,
schema/env/credential/infra/dependency change, Git staging/commit/push/deployment.
Owner-deferred password changes remain excluded. Earlier SQL/Node24 image
acceptance predates these changes. Seven remaining major packages stay tracked.
