# Platform settings integrity —2026-11-04

Owner approved the settings design and continued Phase7 remediation. Prepared
batch25 is implemented with backend1297/1297 and frontend323/323 passing.
Later combined report-batch frontend334/334/lint/build passed; see report evidence.

## Changed behavior

Admin fee updates reject nonplain bodies, missing/invalid/nonpositive/nonfinite/
excess-precision amounts before any write. Only listing_fee is persisted, using
the existing payment formatter's canonical two-decimal form and current positive
range. A matching returned setting_key/value is required before a success
response. No arbitrary controls or audit-trail persistence is claimed.

Admin reads return only the supported listing fee. Both Admin and payment fee
reads distinguish confirmed absence from failures using maybeSingle. The existing
500.00 default is preserved for a confirmed missing row; database/malformed
results propagate as errors. Checkout cannot create an order or issue its hash
after a fee lookup error. Invalid stored amounts are not rewritten silently.

SettingsPage now reads the actual nested settings response rather than using a
hardcoded1500 default. It edits string fee drafts, sends only the canonical fee,
disables edits during load/save, retries failed loads and requires a matching
server response before success. It retains the draft on unconfirmed saves,
guards late completions after unmount and logs no raw errors. Theme buttons work
independently. Unsupported gateway/boost/moderation/session/category editors and
fake values/audit claims are removed; the page explains its supported controls.
Existing gateway/session/upload/category enforcement is unchanged.

## Evidence

- Audit proofs in phase7-settings-export-audit.md used actual source and synthetic
  boundary responses, without live accounts, settings, environment or payment.
- Backend red run29failed/26passed across new fee and checkout coverage. The
  initial follow-up exposed6 obsolete legacy truthy/falsy settings expectations;
  these now assert confirmed missing/default versus invalid input behavior.
- Frontend15 regressions all failed against the old page; all15 passed after
  correction. One initial relative-import typo was fixed before verification.
- Focused backend71/71 passed. Added installed-SDK mocked-fetch missing/error
  distinction, malformed payment setting results and payment-config failure
  checks; full backend **1297/1297 across85 suites,22.724s** passed.
- Independent bounded read-only review found no actionable P1/P2 findings.
  Optional extra coverage suggested late-load unmount and thrown read rejection;
  both paths have cancellation/error handling in source. No external operation
  or reviewer test run was performed.
- Full frontend323/323 across49 files,261.94s passed. No real browser or settings
  operation was performed. Later report-batch aggregate verification supersedes
  these counts only for its tested source revision.

## Boundaries

No schema/env/credential/infra/dependency changes, real account/provider/payment
or delivery, Git staging/commit/push or deployment. Sequential/unknown commits,
concurrent Admin edits, actual database/browser/provider acceptance and the seven
remaining packages are not closed by fee validation. Historical Node24 image
smokes and local SQL acceptance predate these changes. CSV/JSON report correction
is a separate prepared design and has not been implemented by this batch.
