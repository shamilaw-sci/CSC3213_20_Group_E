# Phase 3: incremental lint cleanup

Status: in progress. First checkpoint: 2026-10-28, based on `5a8cddd`.

## Baseline and scope

`npm --prefix frontend-react run lint` reported 51 errors and 10 warnings, matching the original full-repository frontend baseline, including `fix-imports.js`. Keep this scope for comparisons. Do not suppress rules or rename unused symbols merely to satisfy an ignore pattern.

## Batch 1: unused imports in three Agent modals

Removed 15 unused import bindings from AgentCustomizationStudioModal, DigitalAgentCardModal and WriteReviewModal. Retained the customization modal's useRef and API imports and the review modal's API import because they are used. No component logic, hook dependencies, API calls or UI markup changed.

Verification:

- Full ESLint API scan of `frontend-react/.`, using the existing configuration: 36 errors, 10 warnings. All three changed files have zero errors and zero warnings.
- Remaining findings by rule: no-unused-vars 27; no-undef 2; static-components 2; purity 2; immutability 3; exhaustive-deps 8 warnings; incompatible-library 2 warnings.
- Existing frontend suite: 14 files and 40 tests passed outside the sandbox.
- Production Vite build passed with RAYON_NUM_THREADS=1; existing large-chunk and Lottie direct-eval warnings remain.
- `git diff --check` passed before this evidence file was added; the final checkpoint also checks the documentation diff.

These checks do not establish live browser-flow coverage. The batch adds no new behavior requiring a new regression test. The owner performs commit/push; remote CI for this batch remains pending. Rollback is an isolated revert of the batch commit, retaining other phases' work.

Next: another small group of unused bindings, reviewing each initializer for side effects. Hook lifecycle, nested component identity and render-time purity findings require separate behavior-focused changes. Phase 3 is complete only when the agreed lint scope has zero errors and relevant tests/build pass; this checkpoint does not meet that completion criterion.

## Batch 2: seven more unused imports

The owner reported remote CI successful for batch 1, commit `5905ece`. Batch 2 starts from that commit and removes seven unused import bindings across BookViewingModal (four), MapControls (one), AgentSearch (one) and admin AnalyticsPage (one). No hook calls, state initialization, event handlers or markup changed. Booking-date purity, map effect dependencies and AgentSearch's unused state/value findings remain separate work.

Fresh verification on 2026-10-28:

- Full ESLint scan, same scope/configuration: **29 errors, 10 warnings**, down from 36 errors. Remaining errors: 20 no-unused-vars, 2 no-undef, 2 static-components, 2 purity, 3 immutability. Warnings remain 8 exhaustive-deps and 2 incompatible-library.
- Frontend tests: **14 files, 40 tests passed**, outside the sandbox.
- Production build: passed with RAYON_NUM_THREADS=1; existing large-chunk and Lottie direct-eval warnings remain.
- Final diff/whitespace review includes this evidence update. Remote CI for batch 2 remains pending the owner's manual commit/push.

Rollback remains an isolated revert of this batch. Phase 3 is still in progress; no lint rules were disabled or findings hidden with ignore-pattern renaming.

## Batch 3: unused state and theme bindings (2026-10-29)

The owner reported remote CI successful for batch 2, commit `52cc462`. Batch 3 removes six unused bindings from BuyerCommandHub (three), FeaturedResidences (one), admin Topbar (one) and admin SettingsPage (one). Array holes preserve the loading setters and all their existing updates. Calculator state hooks retain their values without binding unused setters; theme hooks retain the used fields. Hook call order, initial values, requests, effects and markup remain unchanged. This intentionally preserves currently invisible loading state updates rather than changing render timing as part of lint cleanup.

Fresh verification across the midnight checkpoint, 2026-10-28/29:

- Full ESLint scan with the existing configuration: **23 errors, 10 warnings**, down from 29 errors. All four changed files have zero findings. Remaining errors: 14 no-unused-vars, 2 no-undef, 2 static-components, 2 purity, 3 immutability; warnings remain unchanged.
- Existing frontend suite: **14 files, 40 tests passed**, outside the sandbox.
- Production build passed with RAYON_NUM_THREADS=1. Existing large-chunk and Lottie direct-eval warnings remain.
- Final whitespace and diff review covers only these four source files and this progress record. No new behavior tests were added for omitted bindings; live flow coverage is not claimed.

Remote CI remains pending the owner's manual commit/push. Rollback is an isolated revert of this batch; Phase 3 remains in progress.
