# Report export integrity —2026-11-04

Owner explicitly confirmed reports serve both spreadsheet users and machine
imports, then approved the separate CSV/JSON design. Prepared batch26 is
implemented and verified: full backend1320/1320, frontend334/334, lint/build pass.

## Changed behavior

The existing protected Admin export route accepts only static report types and
csv(default)/json formats, rejecting malformed query shapes before reads.
Transactions now select only their exported columns. CSV preserves quoted cells,
double-quote escaping, header order and finite numeric values; potentially
formula-bearing text gets the approved spreadsheet tab prefix with detection of
ASCII/full-width triggers, leading whitespace and controls including LF.
Leading controls are removed only from this display representation before the
prefix. JSON keeps the selected raw string/number/null values, projecting only
the same columns in {columns,rows}. Missing fields become null. Correct media
types and deterministic extensions distinguish the two formats.

ReportsPage now requests transactions with the chosen format, rather than
invalid csv/pdf report types. It offers spreadsheet CSV and data JSON actions,
prevents duplicate pending exports, clears/disposes feedback timers and ignores
late completions after unmount. Failed downloads show an error; only fulfilled
download preparation says 'Download started.' The nonexistent generated/logged
success claim and unsupported PDF action were removed. A browser download call
does not prove a file was saved/opened successfully. The helper validates
type/format, uses matching Blob types/filenames and revokes object URLs in finally
even when preparation/click throws. No raw Axios errors are logged by this flow.

## Evidence

- Original source audit/synthetic CSV probes are in phase7-settings-export-audit.md.
  No formula, spreadsheet or real account was executed.
- Backend new tests20failed/3passed before implementation; focused35/35 after
  implementation and intentional legacy CSV prefix expectation update.
- Frontend new tests10failed/1passed before implementation, then11/11 passed.
  They exercise actual API helper/page paths with synthetic Axios/download calls.
- Full backend **1320/1320 across86 suites,26.06s** passed after report changes.
- Full frontend **334/334 across51 files,245.25s** passed; lint and production
  build passed. Existing large-chunk and Lottie dependency direct-eval warnings
  remain; no dependency upgrade or warning suppression was performed.
- Independent bounded read-only review found no actionable P1/P2. Optional extra
  tests suggested anchor-creation failure and feedback-timer disposal; finally
  cleanup and effect disposal are explicit in the reviewed source.

## Limits

[OWASP CSV guidance](https://community.owasp.org/attacks/CSV_Injection) was consulted
for trigger coverage and spreadsheet/save-reopen variability. CSV is intended for
spreadsheet display; JSON for exact source data imports. Do not paste raw JSON
values into spreadsheet formula cells and assume they are sanitized. No universal
spreadsheet/locale/save-reopen protection or actual Excel/Sheets acceptance is
claimed. Export size/pagination and existing transaction-display data policy
remain separate assessment items.

No new dependencies/schema/env/credentials/infra, real accounts/provider/payment,
Git staging/commit/push or deployment. Earlier local SQL/Node24 image acceptance
predates these changes. This is not whole-phase security or release clearance.
