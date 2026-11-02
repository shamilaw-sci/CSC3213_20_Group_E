# Profile solid-action token pilot implementation plan

> For agentic workers: use subagent-driven-development or executing-plans for this approved bounded task. Owner controls all git actions.

**Goal:** Give Start Searching one explicit color owner with identical current rendering and behavior.

**Architecture:** Three CSS aliases and one opt-in components-layer class. Native SavedSearchesPanel button and parent behavior remain unchanged. No React primitive or shared primary migration.

**Tech Stack:** Installed React/Tailwind/Vite/Vitest, current CSS only.

## Global constraints

Owner approved [the exact design](../specs/2026-11-01-profile-action-token-pilot-design.md). Only Start Searching migrates. Preserve layout/font/shadow/radius/transition/native attributes/events, current light/dark colors and all other controls. No dependency/provider/auth/payment/backend/database/environment changes, git mutations or evidence staging. Preserve all previous uncommitted batches.

## Task 1: Baseline and exact CSS change

- [x] Privately preserve SavedSearchesPanel.jsx and index.css under docs/evidence/phase6-profile-action-token.
- [x] Run existing six Profile files: expected74 scenarios. No new implementation-mirroring CSS unit tests.
- [x] Create src/components/profile/profile-actions.css with exactly approved :root aliases --profile-solid-action-bg→--color-blue-600, --profile-solid-action-hover-bg→--color-blue-700, --profile-solid-action-fg→--color-white and components-layer .profile-solid-action/default+hover color rules.
- [x] Import once in src/index.css after existing imports/before @theme, preserving all old stylesheet content/order.
- [x] Replace only Start Searching bg-blue-600/text-white/hover:bg-blue-700 with profile-solid-action; preserve other classes, type, label and callback.
- [x] Preserve Tailwind hover-capability guard @media (hover: hover); reviewer identified it in installed Tailwind source. Verify generated original/current conditions and false-condition behavior; do not equate viewport width with touch emulation.
- [x] Rerun same focused tests and changed JSX ESLint; verify source diff and no other consumer. Parent remains unchanged.

From frontend-react, set RAYON_NUM_THREADS=1 and use node --max-old-space-size=512 --max-semi-space-size=4 node_modules/vitest/vitest.mjs run src/pages/ProfileSettings.test.jsx src/pages/ProfileSettings.integration.test.jsx src/pages/ProfileSettings.panels.test.jsx src/pages/ProfileSettings.calculator.test.jsx src/pages/ProfileSettings.dueDiligence.test.jsx src/pages/ProfileSettings.shell.test.jsx --maxWorkers=1 --pool=threads.

## Task 2: Root acceptance

- [x] Compare preserved original and actual migrated Start Searching at desktop1440x900/mobile390x844 × light/dark × normal/hover/native focus:12 pairs. Compare standard computed CSS/geometry/native attributes and settled screenshots; exclude only intentional class/custom-variable differences.
- [x] Verify Run/toggles/Delete and shared --primary as negative controls against previous measured inventory; preserve dark Run exception.
- [x] Isolated-fixture override of all three new aliases proves their edit ownership, with non-consumer standard styles unchanged. No test colors in application files.
- [x] Inspect generated CSS/layer order and literal source scope; independent spec/quality review where available.
- [x] Run aggregate frontend suite, full lint, production build sequentially using bounded memory. Update inventory, code/UI maps and checkpoint with actual evidence/limits.
- [x] Check links/whitespace/credentials/index, stop fixture/reset viewport/close task tab. Owner stage/commit/push remain pending.

Rollback scope is only new CSS/import and the three class replacements; never reset the branch or delete evidence. Stop expansion on unexplained rendering/cascade drift. Whole Phase6 remains in progress.

Acceptance2026-11-01: baseline/focused74/74 before and after class migration; final aggregate211/211 after hover-guard clarification; full lint/build exit0 (2.75s).12 pixel-identical responsive states,30 negative-control states, three-token ownership and false-condition proofs passed. Production CSS confirms components layer and hover-capability guard. Initial omission was corrected from installed-source/CSSOM review; this is not actual touch-device emulation. Source AST/import/sole-consumer proofs passed. Owner git/remote CI pending; wider Phase6 remains in progress.
