# Review & Publish extraction evidence

Scope: presentation-only extraction of Step 4 from `frontend-react/src/pages/AddProperty.jsx` into `frontend-react/src/components/property/create/ReviewPublishStep.jsx`. The parent retains its original conditional and motion root, callbacks, state, helpers, and other steps. The child receives the original free values, including `locationMode` and `boundaryCoordinates` for the coordinate summary.

## Review package

- Baselines: `AddProperty.before.jsx` and `usePropertyForm.before.js` in this directory, copied before source edits.
- Source: `frontend-react/src/pages/AddProperty.jsx` and `frontend-react/src/components/property/create/ReviewPublishStep.jsx`.
- Actual parent and real hook characterization: `frontend-react/src/pages/AddProperty.reviewPublish.test.jsx`. HTTP, payment, image compression and browser boundaries are controlled; the new child is not mocked.
- Executable structural proof: from the repository root run `python docs/evidence/phase6-review-publish/verify_reconstruction.py`. It asserts the entire child inner markup matches the original bytes, substitutes it back into the parent and restores approved imports to assert byte equality with the full baseline parent, and compares the hook bytes. This also covers all parent statements and earlier steps.

## Verification

Before production edits: `npm test -- src/pages/AddProperty.reviewPublish.test.jsx` from `frontend-react` passed 5 tests. These cover sale, rent and land summary conditions, preview and empty-preview behavior, photograph and panorama counts and labels, edit/back navigation retention, numeric-zero fee fallback, submission validation, pending disabled state and a controlled save error.

After extraction: `npm test -- src/pages/AddProperty.integration.test.jsx src/pages/AddProperty.categoryPrice.test.jsx src/pages/AddProperty.location.test.jsx src/pages/AddProperty.specificationFields.test.jsx src/pages/AddProperty.mediaContracts.test.jsx src/hooks/usePropertyForm.integration.test.jsx src/pages/AddProperty.reviewPublish.test.jsx` passed 7 files / 45 tests. `./node_modules/.bin/eslint src/pages/AddProperty.jsx src/components/property/create/ReviewPublishStep.jsx src/pages/AddProperty.reviewPublish.test.jsx` passed. The reconstruction script passed.

No full suite, browser appearance or focus verification, real payment/account request, or backend service was performed. Independent review and final aggregate verification are owned by the coordinating agent.
