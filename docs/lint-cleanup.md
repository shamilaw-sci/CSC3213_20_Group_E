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
