# Admin rejection dialog module

Relocate existing named RejectModal unchanged, including local reason state, to admin/components/listings/RejectModal.jsx. Preserve parent imports/global CSS/Leaflet initialization and every other definition. Actual-page original2/2 passed before extraction after correcting ambiguous textbox selector in test harness; extracted2/2 and source lint passed. Verify full page/child exact source, independent review and root regression gates. No live API/email/env/deps/git changes. Browser checks deferred.
