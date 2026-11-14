# Specification fields extraction review package

Scope: `AddProperty.jsx` imports and Step 3 fields only; new `PropertySpecificationFields.jsx` and actual-parent `AddProperty.specificationFields.test.jsx`. The original motion root, media/navigation subtree, map, other steps and form hook remain in place.

Characterization: original parent passed five focused files, 34 tests before extraction; extracted parent passed the same 34 tests after extraction. New tests cover field visibility across House, Land, Rent House and Rent Villa, and native numeric values and raw multiline description through Previous and stepper navigation. Existing `AddProperty.categoryPrice.test.jsx` covers category resets and preservation. The hook is real and unmocked; API, payment, map and image dependencies are controlled.

Preservation: run `python docs/evidence/phase6-specification-fields/verify_preservation.py` from repository root. It proves exact original field bytes with only handler prop substitution, complete parent byte equality after the approved import and field substitution, and hook byte equality. Parent equality covers the 31 documented non-render statements, top-level declarations, map, media/navigation and other step JSX. Snapshots are preserved.

Focused command from `frontend-react` (PowerShell): `$env:RAYON_NUM_THREADS='1'; node --max-old-space-size=512 --max-semi-space-size=4 node_modules/vitest/vitest.mjs run src/pages/AddProperty.integration.test.jsx src/hooks/usePropertyForm.integration.test.jsx src/pages/AddProperty.categoryPrice.test.jsx src/pages/AddProperty.location.test.jsx src/pages/AddProperty.specificationFields.test.jsx --maxWorkers=1 --pool=threads`. Final result: 5 files, 34 tests passed. Focused ESLint: `node node_modules/eslint/bin/eslint.js src/pages/AddProperty.jsx src/components/property/create/PropertySpecificationFields.jsx src/pages/AddProperty.specificationFields.test.jsx` passed.

Full checks and independent review are coordinated by the parent. Appearance and native focus comparisons remain pending; no browser verification is claimed.
