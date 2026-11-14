# Selected Admin listings extraction evidence

Source-ready: `ListingDetailsModal.jsx` owns the unchanged inspection modal and
its local clipboard/photo state. `ListingsOverview.jsx` owns the stateless full
header, filters and table. The route page retains normalization, query keys,
fetching, all mutations, toast/error behavior, search filtering and callbacks.
Leaflet CSS, initialization and asset imports remain in the parent; external
dependency import order is retained using side-effect imports where bindings
moved. The existing default export and lazy route import remain unchanged.

Original characterization and extracted characterization: 4/4 tests passed in
`ListingsPage.audit.test.jsx` and `ListingsPage.reject.test.jsx`. Coverage includes
transaction receipt/amount/status, relative/absolute photography selection,
boundary coordinate order, approval state, close, seller search, empty table,
status query, confirmed delete and original reject reason/cancel behavior.

Command: `node --v8-pool-size=4 frontend-react/node_modules/vitest/vitest.mjs run
--root frontend-react src/pages/admin/pages/ListingsPage.audit.test.jsx
src/pages/admin/pages/ListingsPage.reject.test.jsx --pool=threads --maxWorkers=1`
with `NODE_OPTIONS=--max-old-space-size=512`, `RAYON_NUM_THREADS=1`.

Focused source ESLint: passed on page and both extracted components under the
same Node limits. `python docs/evidence/phase6-admin-ui-final/verify-reconstruction.py`
passes exact comparisons for complete modal body and overview markup and rebuilds
the complete original page after explicit import exclusions. Thus all original
parent data logic, helper and mutation bodies and Leaflet initialization compare
exactly, rather than relying on selected substring checks.

No browser/live visual acceptance performed. Exact classes/markup reconstruction
supports structural preservation; combined build/full tests and independent
review are owned by the coordinating task. Existing Leaflet/modal quirks remain.
