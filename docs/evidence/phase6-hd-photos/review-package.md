# HD photo extraction review package

Scope: `frontend-react/src/pages/AddProperty.jsx` imports and HD JSX only; new `frontend-react/src/components/property/create/HDPhotosSection.jsx`. Parent retains the motion root, all non-render statements, media handling and cleanup, and the 360, navigation, map, and other field markup. The seven bindings are imageCount, previewUrls, onUpload, onRemove, currentSizeMB, maxSizeMB, and progress.

Review anchors: `parent-before.jsx.snapshot`, `hd-markup-before.snapshot`, and `hook-before.snapshot` preserve the pre-extraction bytes. Run `python docs/evidence/phase6-hd-photos/verify-reconstruction.py` from the repository root. It reconstructs the original parent byte-for-byte, checks the child against the exact original markup with only the approved reference substitutions and wrapper, and compares hook bytes.

Verification after extraction: reconstruction proof passed. The six focused wizard test files passed (6 files, 40 tests) with `npm test -- src/pages/AddProperty.integration.test.jsx src/pages/AddProperty.categoryPrice.test.jsx src/pages/AddProperty.location.test.jsx src/pages/AddProperty.specificationFields.test.jsx src/pages/AddProperty.mediaContracts.test.jsx src/hooks/usePropertyForm.integration.test.jsx` from `frontend-react`. Changed-source ESLint passed (exit 0) with `npx eslint src/pages/AddProperty.jsx src/components/property/create/HDPhotosSection.jsx` from `frontend-react`.

Independent source/spec/quality review and aggregate verification are coordinated by the parent. Browser visual/focus verification remains pending. Known HD/tour resource leaks remain outside this extraction.
