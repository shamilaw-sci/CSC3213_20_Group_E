# Specification fields implementation plan

Owner approved the [design](../specs/2026-11-01-property-specification-fields-design.md). Existing owner-managed version-3.0 checkout; preserve prior changes. No git mutations, dependencies, environment or real services.

- [x] Preserve parent/hook sources privately. Add actual-parent tests for four category field conditions, raw description/native values and previous/stepper retention; protect existing category resets. Run strengthened tests against original before extraction.
- [x] Extract original field block only into fragment-returning PropertySpecificationFields with formData,isLandType,isHouseType,onChange. Keep original parent motion root and complete media/navigation subtree. No effects/state/memoization/normalization or additional controls.
- [x] Prove31 parent non-render statements/top-level declarations/hook bytes unchanged and exact substitution of field block. Existing map/media/other-step JSX must match original. Run focused tests/lint; independent review.
- [x] Run full frontend/lint/build sequentially with512MB/semi-space4MB and one worker. Attempt appearance/native-focus verification only through available documented UI tools; record unavailable coverage honestly.
- [x] Update code/UI maps, spec/checkpoint and hygiene/index. No stage/commit/push; evidence stays untracked.

Focused command: from frontend-react, set RAYON_NUM_THREADS=1; node --max-old-space-size=512 --max-semi-space-size=4 node_modules/vitest/vitest.mjs run src/pages/AddProperty.integration.test.jsx src/hooks/usePropertyForm.integration.test.jsx src/pages/AddProperty.categoryPrice.test.jsx src/pages/AddProperty.location.test.jsx src/pages/AddProperty.specificationFields.test.jsx --maxWorkers=1 --pool=threads. Existing baseline29; strengthened original/final must pass. Characterization protects current behavior, not artificial failing product tests.

Browser appearance/native-focus comparison remains an outstanding acceptance gate; tool unavailable. Implementation/checks complete does not mark Step3 accepted.
