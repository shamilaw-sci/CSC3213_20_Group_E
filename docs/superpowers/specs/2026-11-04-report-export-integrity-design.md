# Report export integrity for spreadsheets and system imports

Status: owner approved and implemented2026-11-04, after confirming that reports
serve both spreadsheet users and system imports. Backend1320/1320 and focused
frontend11/11 passed; full frontend334/334, lint/build also passed.

## Evidence

Actual-controller synthetic output leaves leading LF/full-width equals unprefixed
while prefixing ordinary equals. Existing quotation/doubled-quote handling is
retained. Source tracing also confirms ReportsPage calls exportReport('csv') and
exportReport('pdf'), although the backend accepts only report types transactions,
users and listings. Its catch falsely displays 'Export generated and logged.'
as success. The API helper always assigns a .csv filename. No actual export,
spreadsheet or formula execution was attempted. See phase7-settings-export-audit.md.

## Options and recommendation

Recommended: keep CSV as an explicitly human spreadsheet export, and add typed
JSON for machine imports. This prevents formula-neutralization prefixes from
silently changing imported source values. A single modified CSV cannot promise
both spreadsheet safety and exact raw text preservation. A raw CSV alternative
would continue exposing formula-bearing cells to spreadsheet software and is
not proposed. Building XLSX/PDF would add a larger dependency/rendering scope.

## Backend contract

Preserve existing protected Admin route and fixed report-type allowlist. Add an
optional format query with exactly csv (default) or json. Reject nonstrings,
arrays/objects or unknown formats before repository access. Keep static column
allowlists for each report and use explicit selected columns, including replacing
transactions select('*') with its current exported columns only.

CSV keeps column order and existing quoted/doubled-quote escaping, and uses a
spreadsheet text prefix for text that may begin a formula: account for ASCII
=,+,-,@, leading controls including LF/tab/CR, whitespace before those triggers,
and full-width variants. Prefix inside the quoted field using a tab for formula
triggers after normalization for detection only; preserve original cell text
after the prefix, never normalize source values themselves. For leading control
characters, remove leading ASCII controls only from the spreadsheet display
representation before adding the text prefix, so LF cannot remain the initial
cell character; JSON retains them exactly. Numeric JS values may remain numeric
text when finite; null stays empty. Do not promise universally safe CSV after
every spreadsheet/locale/save/reopen workflow. Document intended spreadsheet use
and acceptance limits; do not execute malicious formulas in tests.

JSON returns an attachment with application/json and deterministic
thirasara-<type>-report.json filename. Its payload contains {columns:[...],rows:[...]},
projecting only the same exported columns in order. Preserve selected raw string,
number and null values without formula prefixes, and no additional fields. Missing
fields become null. A JSON response is a data format, not a safe instruction to
paste those raw strings into spreadsheets. No arbitrary table/column selection,
streaming/pagination redesign, PDF generation or dependency addition.

## Dashboard and download helper

ReportsPage exports transactions using two accurately named actions: 'Export
spreadsheet CSV' and 'Export data JSON'. Pass transactions as the report type and
format in the existing filters argument; remove the nonfunctional PDF action.
Only a fulfilled download helper call can trigger 'Download started.'; a failed
request or download preparation shows an error, never a generated/logged claim.
Browser acknowledgement cannot prove that a file was saved or opened successfully.
No raw Axios/error logs. Keep existing layout, transaction display and unrelated
filters unchanged. Guard unmount/late completions, prevent duplicate pending
exports, and clean up feedback timers.

The API helper validates supported type/format locally, sets the proper .csv/.json
filename and media type, and revokes any created object URL in finally even if
anchor creation/click fails. Preserve the default CSV contract for existing callers.
No real browser download, account, DB/provider operation or messaging is required.

## Verification and boundaries

Red tests first against actual controller/repository/API/page paths with mocked
boundaries: allowed types/formats, reject before reads, static column projection,
CSV control/full-width/whitespace triggers and quotation, unmodified JSON values,
accurate content type/filename, fulfilled versus rejected helper/page outcomes,
no false success, duplicate pending lock and lifecycle/object-URL cleanup.
Run focused and full affected suites, frontend lint/build sequentially and obtain
independent bounded read-only review. No new dependencies, schema/env/credentials,
infra, real delivery/provider, Git stage/commit/push or deployment.

Actual Excel/Sheets save/reopen/locale behavior remains an explicit acceptance
gate, and export limits/pagination are still separate assessment items. Seven
major Phase7 packages remain; this batch does not claim full phase closure.
