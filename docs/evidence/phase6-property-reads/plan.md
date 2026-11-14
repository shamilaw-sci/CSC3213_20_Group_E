# Property reads preservation plan

1. Snapshot the parent and inspect existing privacy coverage.
2. Add mocked direct-controller characterization for pagination, role guards, envelopes and forwarding, plus exact detail payload/error contracts missing from route coverage; run against original.
3. Copy only three complete read handlers to property/propertyReadController.js and import their unchanged names into the facade.
4. Run focused tests and executable normalized whole-parent reconstruction, copied-body and export identity proof. The root agent handles broader checks and code-map updates.

No routes, repositories, queries, DB clients, environments, dependencies or git mutations are in scope. Existing propertyPrivacy route tests cover anonymous, approved, owner/admin, foreign identity, banned/reset-token behavior; new direct tests focus on full envelopes and forwarding.
