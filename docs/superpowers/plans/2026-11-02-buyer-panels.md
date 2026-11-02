# Buyer dashboard presentation batch

Approved Phase 6 scope: extract the inner appointments, favorites and saved-search roots into BuyerAppointmentsPanel, BuyerFavoritesPanel and BuyerSavedSearchesPanel. Retain parent tab conditions and every existing import. Preserve native events, row keys/order, statuses, fallback formatting and full saved-search map replay. All state, effects, memo calculations, requests and mutations remain in BuyerDashboard.

1. Snapshot the original parent and characterize its actual rendered behavior with controlled API/auth/router dependencies.
2. Run the bounded characterization and existing KPI tests against the original parent before extraction.
3. Transplant only the three JSX roots with original free bindings passed as props.
4. Require executable strict whole-parent reconstruction, original imports and unchanged non-return/helper evidence.
5. Rerun focused tests and source ESLint. Root coordinator handles independent review, full regression and navigation maps. Browser acceptance remains deferred.

Evidence: docs/evidence/phase6-buyer-panels. Node heap 512 MB, semi-space 4 MB, Rayon one thread, Vitest one thread worker. No dependency, backend, environment, git or live-service changes.
