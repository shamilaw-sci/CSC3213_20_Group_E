# Admin settings and export audit —2026-11-04

Read-only continuation after prepared batch24; the full backend1257/1257 result
belongs to that revision. Subsequent approved fixes are recorded in
[settings evidence](phase7-platform-settings-integrity.md) and
[report evidence](phase7-report-export-integrity.md), superseding the audit's
original preparation-only status without claiming real production acceptance.

## Settings

Actual-source offline VM probes confirmed settings200 for numeric0 with no
write, and for -1/object/12.345 passed as string values although checkout's
existing formatter rejects them. A synthetic unconfirmed upsert result still
produces success. Another probe confirmed that an actual settings read error is
converted to the fallback500.00. These are synthetic failure/data proofs, not
changes to a real fee or evidence of a real charge.

SettingsPage renders editable boost-fee/gateway/moderation/session/category
controls, but the settings write controller persists only listing_fee and has
no audit-trail write. The frontend nevertheless claims parameters were saved
and committed to an audit trail. PAYHERE_MODE actually controls checkout mode;
the dashboard selector is not connected to it. Unrendered maintenance/email/
loan fields are also present as frontend defaults. The current Admin guard
remains in place; this is not an authorization bypass finding.

Proposed settings correction (development document archived locally)
was subsequently owner approved and implemented as batch25.

## CSV exports

The report type allowlist and repository-owned column names prevent caller
selection of arbitrary tables/columns. All value cells are quoted and embedded
double quotes doubled. Existing sanitizer prefixes ASCII =,+,-,@,tab and CR.
Synthetic actual-controller output shows leading LF and full-width equals are
not prefixed, while ordinary = is prefixed. No spreadsheet was opened and no
formula execution/exfiltration was attempted or demonstrated.

[OWASP CSV Injection guidance](https://community.owasp.org/attacks/CSV_Injection)
lists LF and full-width triggers and cautions that safety varies with spreadsheet,
locale, save/reopen and downstream use. Therefore current output coverage is
incomplete; a live exploit claim or universal-safe escaping claim is unwarranted.
Before an export change, define intended human spreadsheet versus machine import
consumers, textual-prefix policy and representative spreadsheet acceptance. No
export code changed in the original settings design; the owner subsequently
confirmed both consumer types and approved batch26 CSV/JSON changes. Actual
spreadsheet acceptance and universal CSV clearance remain unclaimed.

## Limits

No real database, environment, credential, provider, account, payment, message,
Docker, dependency, Git mutation or deployment. Source tracing and synthetic
probes do not close browser/production acceptance or the seven remaining packages.
