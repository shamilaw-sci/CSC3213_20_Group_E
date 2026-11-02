# Phase 6 Profile mortgage presentation implementation plan

> For agentic workers: use executing-plans for this bounded approved Phase 6B design; root coordinates independent review. No git mutations.

**Goal:** Make mortgage presentation discoverable without changing existing calculation, inputs, markup or content.

**Architecture:** Extract one stateless MortgageCalculatorPanel. ProfileSettings retains its four numeric states/setters and exact loanSummary useMemo, all other state/effects/handlers and direct keyed calculator m.div. Further input/results files would add indirection without a separate contract in this batch.

**Tech Stack:** Installed React, lucide-react, framer-motion and Vitest/Testing Library; no dependencies.

## Exact contracts and constraints

- Preserve original current source privately at docs/evidence/phase6-profile-mortgage/ProfileSettings.before.jsx. Preserve every existing uncommitted pilot/module/test change.
- MortgageCalculatorPanel({calcPrice,calcDownpaymentPercent,calcTenureYears,calcInterestRate,loanSummary,setCalcPrice,setCalcDownpaymentPercent,setCalcTenureYears,setCalcInterestRate}). Raw setter callbacks are passed unchanged. Panel owns no state, effects, requests, routes or calculation adapter.
- Defaults remain price35000000, downpayment20%, tenure20 years, interest11.5%. Exact parent useMemo/principal clamp/rounding/stamp-duty branches remain unchanged. All37 parent non-render statements must match preserved source by parsed AST comparison.
- Move only original calculator inner space-y-6 div, preserving classes/DOM/text/icons and advisory. Calculator icon remains parent-used by navigation. Parent motion key/initial/animate/exit and position under AnimatePresence stay unchanged.
- Price slider min5000000 max200000000 step1000000; number input has no added min/max/step. Downpayment slider min10 max50 step5; interest slider min8.0 max18.0 step0.25. Every existing input onChange retains Number(e.target.value), including empty-to-zero and native negative number entry.
- Tenure buttons remain10/15/20/25, key=yr, type=button, same active/inactive classes and setter(yr). All locale formatting, summary property use and overall-outflow expression stay exact.
- No UI/accessibility/behavior fixes, factual updates to existing rate/legal text, global CSS/token, backend/auth/env/db/config/dependency/git changes. Existing content is preserved as application text, not asserted as current advice.

## Task 1: Original-parent characterization

- [x] Preserve source; run existing three profile files (expected37 scenarios).
- [x] Create only ProfileSettings.calculator.test.jsx with actual parent/presentation, mock external/auth/unrelated layout and motion consistently with existing integration tests; new module remains unmocked.
- [x] Cover default fixed outputs, slider bounds/steps and raw number attributes, all input changes with a representative fixed output set, all tenure selections/native types/class state, empty/negative/low-price stamp boundary behavior and state across tab changes with no repeated reads or mutations.
- [x] Use fixed expected numbers independently checked by high-precision discounted-payment summation, never copy production formula into tests. Defaults: monthly298600/principal28000000/down7000000/interest43664071/stamp1399000/outflow80063071. Price40000000/down30/15years/8.25%: monthly271639/principal28000000/down12000000/interest20895074/stamp1599000/outflow62494074.
- [x] Run all four focused profile files before extraction; tests must characterize original behavior without production fixes.

## Task 2: Exact extraction and focused validation

- [x] Copy original inner calculator JSX into MortgageCalculatorPanel.jsx with only Calculator icon import and declared props; preserve all inline handlers/expressions. Replace inner branch with panel and nine original-value/setter props.
- [x] Compare parent non-render AST statements against private original:37 unchanged; preserve direct keyed m.div.
- [x] Run from frontend-react: node --max-old-space-size=512 --max-semi-space-size=4 node_modules/vitest/vitest.mjs run src/pages/ProfileSettings.test.jsx src/pages/ProfileSettings.integration.test.jsx src/pages/ProfileSettings.panels.test.jsx src/pages/ProfileSettings.calculator.test.jsx --maxWorkers=1 --pool=threads.
- [x] Run focused ESLint for parent/new panel/new test sequentially, then git -c core.fsmonitor=false diff --check. Record actual evidence below.

## Root validation and handoff

- [x] Root completed8 base visual pairs and16 settled keyboard screenshot pairs,8 hover comparisons, maps/checkpoint, two independent approvals, aggregate187/187 across28 files, full lint exit0 and build exit0. Evidence/limits are in the checkpoint.
- [x] Owner retains manual staging/commit/push; index remains empty and private evidence untracked. This is one incremental Phase6B batch, not Phase6 completion.

Already-approved parent-owned architecture applies unchanged; characterization passes before extraction without artificial red tests. No renewed permission is required for this exact source-derived scope.

## Bounded implementation evidence

- Original three-file baseline:37/37,15.47s.
- Original implementation plus13 calculator characterizations:4files50/50,17.75s. No expectation adjustment or product behavior fix.
- Extracted implementation:4files50/50,18.26s. Existing profile tests/modules remain unmocked and unchanged.
- Focused ESLint parent/panel/new test:exit0.
- Parent non-render AST:37 before/37 after, identical; report under private mortgage evidence.
- git -c core.fsmonitor=false diff --check:exit0. Root browser/review/aggregate gates remain pending at implementation handoff.

New scenarios include defaults with fixed outputs, exact native ranges/number attributes, a combined price/downpayment/rate/tenure case with fixed outputs, all four tenure choices and exact active classes, empty/negative/50000/100000/100100 numeric inputs and stamp boundary, and state persistence/read stability across tab changes. Expected values were checked independently using60-digit Decimal discounted-payment summation, not production-formula assertions.

Root acceptance:187/187 frontend tests, lint/build exit0;24 base/settled-keyboard screenshot pairs pixel-identical;8 tenure hover comparisons matched. Initial immediate keyboard captures differed only during existing CSS transitions; settled captures matched, with diagnostic evidence retained. Two independent reviews approved. No product correction or git mutation.
