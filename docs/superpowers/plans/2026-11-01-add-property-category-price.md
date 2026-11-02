# AddProperty Category & Price implementation plan

> For agentic workers: use subagent-driven-development or executing-plans task by task. Owner controls all git actions.

**Goal:** Extract only the approved first wizard step and four category objects without observable changes.

**Architecture:** Stateless fragment-returning CategoryPriceStep with the nine approved props; propertyCategoryOptions owns exact source-derived objects. Parent retains its original m.div,31 non-render statements and all other steps/constants/helpers; usePropertyForm remains byte-identical.

**Tech Stack:** Installed React/lucide/framer-motion/Vitest/Vite; no dependencies or CSS migration.

## Global constraints

Owner approved [the exact design](../specs/2026-11-01-add-property-category-price-design.md). Preserve all existing uncommitted work and manual git workflow on version-3.0. No real account/API/DB/payment/upload/email, environment/provider/backend/schema/dependency changes or stage/commit/push. Evidence stays under untracked docs/evidence.

## Task 1: Characterize and extract

- [x] Preserve current AddProperty/hook privately; compare inventory baseline before editing. Run existing page/hook tests (expected16).
- [x] Add actual-parent CategoryPrice characterization, using real usePropertyForm and controlled existing HTTP/payment/map/GPS/compression boundaries. New modules remain unmocked; no helper exports for tests.
- [x] Protect four categories/placeholder/rental period, sale/rent/Land clearing/retention through later-step/back navigation, blank/zero/negative/Thousand/Million/Billion preview and validation, district→Step2 coordinates, raw field retention and existing stepper semantics without create/payment.
- [x] Run original plus new tests before extraction; correct only invalid test assumptions, recording any failure. No product behavior fixes.
- [x] Create src/components/property/create/propertyCategoryOptions.js from exact four original objects/direct icon imports, no freeze/normalization.
- [x] Create CategoryPriceStep.jsx from original inner markup, returning a fragment. Nine props/derived values match design exactly; parent m.div/space-y/native events stay intact.
- [x] Replace only Step1 inner markup plus needed imports. Remove only imports newly unused. Preserve all other steps and top-level helpers/constants.
- [x] Run strengthened focused tests, changed-source ESLint, parent non-render AST31 equality, exact hook byte/hash and retained top-level constants/helper/data proofs; whitespace check.

From frontend-react set RAYON_NUM_THREADS=1 and use node --max-old-space-size=512 --max-semi-space-size=4 node_modules/vitest/vitest.mjs run src/pages/AddProperty.integration.test.jsx src/hooks/usePropertyForm.integration.test.jsx src/pages/AddProperty.categoryPrice.test.jsx --maxWorkers=1 --pool=threads. Baseline omits the new file.

## Task 2: Root acceptance

- [x] Compare source-derived original/actual extracted presentation across four categories × desktop1440x900/mobile390x844 × light/dark, plus focused empty/zero/interaction states. Preserve original wrapper/context/native controls and actual motion; no live hook/map/payment in the visual fixture.
- [x] Independent spec and quality review; source/test findings resolved before acceptance.
- [x] Sequential aggregate frontend suite/full lint/build with bounded memory. Existing multipart/draft/media tests retained.
- [x] Update inventory, maps/spec status and checkpoint only to actual implemented scope. Later three steps remain pending.
- [x] Verify links/whitespace/credentials/index, stop fixture/reset viewport/close task tab. Owner git/remote CI remain pending.

No arbitrary line-count target, styling cleanup, validation fix, shared-control replacement or lifecycle optimization. Rollback only this batch; no branch reset/evidence deletion.

## Acceptance record

Fresh existing16/16; strengthened24/24 before and after extraction. Final full frontend219/219 across31 files, full lint and production build passed. Parent AST31, retained top-level helpers/constants, exact category objects/markup and hook byte equality passed. Both independent reviews approved the bounded extraction. Browser checks:26 DOM/value/geometry/40-selected-style states,20 interaction observations and28 settled exact screenshot pairs. Initial timeout and single-icon capture mismatch/repeat are retained privately, with no application fix. Details and limits are in the [checkpoint](../../phase6-checkpoint.md).
