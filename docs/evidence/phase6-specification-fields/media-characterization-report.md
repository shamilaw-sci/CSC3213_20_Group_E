# Media characterization report — 2026-11-01

Scope: actual AddProperty page and real form hook, with controlled HTTP, payment, map, GPS, compression and object-URL boundaries. Existing presentation remains unmocked. No create or payment calls occur in any scenario. Product source was not changed by this work.

Six scenarios in `frontend-react/src/pages/AddProperty.mediaContracts.test.jsx` characterize:

1. Eight HD files including one exactly 5 MiB accepted; ninth rejected; a larger file takes size rejection precedence over count and is not compressed.
2. Four deferred compressions resolved out of order produce input-ordered previews, with original compression options and URL calls tied to distinct compressed file identities; two removals revoke the matching URLs and promote the first remaining preview to PRIMARY. Distinct 1, 2, 4 and 8 MiB compressed sizes produce a visible 12.00 MiB total for the remaining 4 and 8 MiB files.
3. Previous/stepper navigation preserves HD previews and performs no revocation; page unmount revokes remaining URLs.
4. A compression success before a sibling failure creates an orphan URL that is not revoked on unmount; no previews are committed and the failure is visible.
5. Five tours including one exactly 5 MiB accepted with Room defaults; sixth rejected; oversized rejection precedes count alert.
6. Tour labels remain aligned with remaining files after removal; label changes and removal rerender and create additional URLs, none revoked, while ordinary HD URL is revoked on unmount.

Verification, sequentially in `frontend-react`:

- `$env:NODE_OPTIONS='--max-old-space-size=512 --max-semi-space-size=4'; npx vitest run src/pages/AddProperty.mediaContracts.test.jsx --maxWorkers=1` — exit 0, 1 file and 6 tests passed.
- `$env:NODE_OPTIONS='--max-old-space-size=512 --max-semi-space-size=4'; npx eslint src/pages/AddProperty.mediaContracts.test.jsx` — exit 0, no diagnostics.

Limitations: These are characterization tests of existing behavior, not fixes. Both the mixed-success orphan and render-time tour URL accumulation are pre-existing resource leaks. File sizes are overridden metadata rather than large allocations. File-to-preview alignment is observed through distinct compression output identities, object URL calls and the visible remaining storage total, not by submitting a listing. The total identifies the remaining pair in this scenario but cannot distinguish their order; no create/payment flow was exercised. No full suite, browser visual check, or source extraction was performed.

Review follow-up: repeated both focused commands above after strengthening the ordering/removal case; 6/6 tests passed and ESLint exited 0 with no diagnostics.
