# Property remaining responsibility separation

Approved preservation-only Phase 6 slice, 2026-11-02.

Copy addProperty/updateMyProperty/deleteMyProperty into propertyWriteController and incrementViews/getSimilarProperties/getPriceInsight/searchProperties into propertyDiscoveryController. Discovery includes the views RPC write; it is not read-only. Retain every parent dependency initialization in its original order and the explicit export order. Copy complete handler/comment bodies exactly; only child relative dependency paths change. No routes, queries, repositories, environment, dependencies, Git mutations or live database operations.

1. Inspect original handlers and existing numeric/privacy/cleanup characterization; snapshot original parent.
2. Add mocked characterization for uncovered discovery query/error/envelope, price insight, views and owner/media write contracts. Run against original before extraction.
3. Extract exact bodies, then run executable normalized whole-parent and exact-child proof and relevant focused suites with Node 512 MB/Jest runInBand. Root runs the full backend suite once.

Evidence: docs/evidence/phase6-property-remaining. Original characterization: 25/25 passing before extraction. All database calls mocked. Existing similarity target visibility and zero-view 404 semantics remain intentional preservation observations, not fixes.
