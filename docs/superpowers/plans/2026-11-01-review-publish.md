# Review & Publish presentation extraction

Owner requested continuation of discussed preservation-first refactoring. Scope is Step4 render presentation only. Keep original parent conditional/motion root/class and all31 non-render statements, helpers, hook and earlier steps. No git/env/dependencies/services changes.

Create components/property/create/ReviewPublishStep.jsx, returning a fragment containing exact original inner Step4 markup. Pass original free values/functions as props with their existing names: formData,isRentType,isLandType,images,virtualTourFiles,virtualTourMetadata,previewUrls,paymentConfig,loading,goToStep,handleSubmit,formatLKRPreview; include any additional actual original render dependencies only if source inspection requires them and report explicitly. No new derived-state/effects/wrappers/keys/ref/memoization/control primitives. Copy display-only formatting/fallback expressions exactly; actual payment/config/submission authority remains in original hook/backend. No currency/fallback, numeric-zero, text, validation, event, loading/disabled or edit-navigation correction.

- [x] Preserve sources privately. Add actual-parent characterization on original first: Edit links/back retain fields, sale/rent/Land summary/card conditions, preview/count/tour metadata, fee fallback and pending/error/disabled publish behavior. Keep HTTP/payment controlled, new module unmocked, real hook. Existing positive save/draft-retry suites remain unchanged. No real payment/account call.
- [x] Extract exact Step4 inner markup and needed icons only; parent retains its original motion root and callback owners. Prove byte reconstruction outside approved imports/Step4 replacement, child markup equality, hook bytes and all earlier render sections.
- [x] Run focused wizard tests plus new review tests and changed-source lint; independent spec/quality review and fixes before aggregate.
- [x] One final full frontend suite, lint/build and hygiene/docs. Record browser appearance/focus as unperformed if tooling unavailable, separate from owner acceptance. No claimed visual verification.

Code/runtime gates complete. Browser appearance/focus remains explicitly unperformed, separate from owner acceptance.
