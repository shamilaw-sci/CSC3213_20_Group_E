# Phase 6 selected Admin UI completion

Scope: `ListingsPage` only. Preserve the existing route/default export, styles,
permissions, query/mutation behavior, normalization, filters, callback values,
Leaflet setup and external import order. No fixes, redesign, backend, dependency,
environment, live service or browser operations.

1. Characterize the original page's inspection payment/photo/spatial/approval
   behavior and table search/filter/delete actions; retain rejection tests.
2. Move `ListingDetailsModal` intact, including local state, receipt fallback,
   clipboard timeout, photo selection and map markup, into the listings directory.
3. Move the complete stateless header/filter/table overview with explicit props.
   Keep all data fetching, mutations, normalization and handlers in the page.
4. Verify executable exact reconstruction of the modal body, overview markup,
   complete parent after import exclusions, and parent data/action region.
5. Run focused tests and source lint under Node 512 MB / four V8 pool threads /
   one Rayon thread / one Vitest thread. Root runs combined final checks once.

Source-ready milestone: steps 1–5 implemented. Evidence and limitations are in
`docs/evidence/phase6-admin-ui-final/report.md`.
