# Remaining agent controller separation

Approved preservation-only scope: move postReview/bookViewing to agentBookingController, updateAgentProfile/resubmitApplication to agentProfileController, and getDashboardStats to agentDashboardController under controllers/agent. Keep agentController as an explicit facade in the original export order; retain original dependency loading. Routes, middleware, repository/config identities and all handler bodies/comments remain unchanged.

1. Snapshot the complete current parent. Add mocked characterization for dashboard arithmetic/defaults/pipeline/activity ordering/errors; profile conversion and user-before-profile writes; rejected-application guards/payload/await/errors; booking conversation failure ordering. Run against the original parent.
2. Copy complete handlers exactly, changing only dependency-relative paths. Keep original parent dependency imports and add explicit child imports.
3. Run executable normalized full-parent and complete-child source proof, then focused mocked suites sequentially using Node 512 MB and Jest --runInBand from backend-node. Root coordinates aggregate verification and independent review.

No database, environment, dependency, query, auth, schema, behavioral or git changes. Preserve existing partial writes and ignored returned errors; no cleanup. Evidence under docs/evidence/phase6-agent-remaining is private and untracked. No real integration profile is authorized in this batch.
