# Buyer panels verification

2026-11-02. Snapshot captured before production extraction. Original actual-parent characterization and existing KPI tests passed 9/9 across two files. After extraction, the identical focused files passed 9/9. Seven new bounded cases cover three empty panels, populated server ordering/status/fallbacks/contact destinations, confirmed and declined appointment cancellation, favorite removal/detail navigation, and saved-search deletion/tab roundtrip/full-row map replay. Dependencies are controlled auth/API/router; no network requests.

`original-focused.log` and `extracted-focused.log` capture the two clean runs. `source-eslint.log` is empty: bounded ESLint passed for the parent, all three children and both focused test files. Runtime limits: Node heap 512 MB and semi-space 4 MB, Rayon one thread and Vitest one thread worker.

Run `python docs/evidence/phase6-buyer-panels/verify-preservation.py` from the repository root. Proof passes strict normalized whole-parent reconstruction including original imports, three exact call-site props and pure presentation wrappers. The unchanged parent non-return statements and UpgradeToSellerTab helper are also compared exactly. Parent active-tab conditions, state/effects/memo calculations, API/mutation handlers and all preexisting imports remain in place.

No full-suite, full-lint, build, browser, backend, environment, dependency or git operations performed by this batch agent. Root coordinator owns broader checks, independent review and navigation maps. Browser visual/focus acceptance remains deferred.
