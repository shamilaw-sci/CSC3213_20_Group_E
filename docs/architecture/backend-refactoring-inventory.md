# Backend responsibility inventory — Phase 6F

2026-11-01. Planning only; no backend/test changes, tests, services, environment access, database requests or git mutations performed. Sources inspected: complete property/agent/admin controllers, their routes and repositories, relevant test sources, integration profile declarations, server mounts, code map and Phase 6 roadmap. Supabase references below describe existing code only; no Supabase operation is proposed or performed.

## Stable entry points and callers

`server.js` mounts `/api/properties`, `/api/agents`, `/api/admin` to their corresponding `routes/*Routes.js`. Those route files are the production callers of these three controller entry points. Repository consumers elsewhere must remain untouched; do not split repositories as a side effect. Keep every current CommonJS controller path/export name, route method, middleware order, status/message/payload and error forwarding behavior.

### Property exports (all called by propertyRoutes.js)

| Export | Method/path below /api/properties | Middleware before handler |
| --- | --- | --- |
| getProperties | GET / | validate(getPropertiesSchema) |
| addProperty | POST / | protect → propertyImageUpload.fields(images max10, virtualTours max5) → validate(addPropertySchema) |
| getMyProperties | GET /my-listings | protect → validate(getPropertiesSchema) |
| updateMyProperty | PATCH /my-listings/:id | protect → validate(updatePropertySchema) |
| deleteMyProperty | DELETE /my-listings/:id | protect |
| searchProperties | GET /search | validate(searchPropertiesSchema) |
| incrementViews | POST /:id/view | none |
| getSimilarProperties | GET /:id/similar | none |
| getPriceInsight | GET /:id/price-insight | none |
| getPropertyById | GET /:id | optionalAuth |

This is current declaration order. Keep specific paths before final `/:id`. Direct controller test imports: `propertyNumericValidation.test.js` imports addProperty/updateMyProperty. Other property API tests load the routes/server, so facade preservation alone is insufficient without middleware preservation.

### Agent exports (all called by agentRoutes.js)

| Export | Method/path below /api/agents | Middleware before handler |
| --- | --- | --- |
| getDashboardStats | GET /dashboard-stats | protect |
| getMyAppointments | GET /my-appointments | protect |
| cancelBuyerAppointment | DELETE /my-appointments/:id | protect |
| getAgentLeads | GET /leads | protect |
| updateLeadMetadata | PUT /leads/:id | protect → validate(updateLeadSchema) |
| deleteLead | DELETE /leads/:id | protect |
| updateAgentProfile | PUT /profile | protect → validate(updateProfileSchema) |
| getAgents | GET / | none |
| getAgentProfile | GET /:id | none |
| bookViewing | POST /:id/book-viewing | optionalAuth → validate(bookViewingSchema) |
| postReview | POST /:id/reviews | protect → validate(reviewSchema) |
| resubmitApplication | POST /resubmit | protect |

Keep static GET paths ahead of GET `/:id`; final POST `/resubmit` is current order and has a different method from GET `/:id`. Direct tests: `authorization.test.js` imports postReview/bookViewing; `agentProfilePrivacy.test.js` imports getAgentProfile. `bookingIdentity.test.js` exercises real routes with mocked dependencies; `crmOffer.test.js` exercises repository behavior, not controller HTTP contracts.

### Admin exports (all called by adminRoutes.js)

POST `/login` calls `login` behind adminLoginLimiter (15 minutes/10 requests). Then `router.use(protect, requireAdmin)` protects every remaining route. `requireAdmin` is an exported middleware, checks fresh req.user role, sets req.admin and calls next. GET `/verify` calls `verifyAdmin`.

| Exports | Methods/paths below /api/admin, in matching order |
| --- | --- |
| getDashboardStats, getRevenueData, getUserGrowth | GET /dashboard/stats, GET /dashboard/revenue, GET /dashboard/user-growth |
| getListings, getListingById, approveListing, rejectListing, deleteListing | GET /listings, GET /listings/:id, PATCH /listings/:id/approve, PATCH /listings/:id/reject, DELETE /listings/:id |
| getUsers, getPendingAgents, getUserById, banUser, unbanUser, updateUserRole | GET /users, GET /pending-agents, GET /users/:id, PATCH /users/:id/ban, PATCH /users/:id/unban, PATCH /users/:id/role |
| getAnalytics, getSearchHeatmap | GET /analytics, GET /analytics/heatmap |
| getTransactions, exportReport | GET /reports/transactions, GET /reports/export/:type |
| getAuditLogs | GET /audit-logs |
| getSettings, updateSettings | GET /settings, PUT /settings |
| getBoosts, toggleBoost | GET /boosts, PATCH /boosts/:id |
| getReportedContent, resolveReport | GET /reported, PATCH /reported/:id/resolve |
| getRoleRequests, approveRoleRequest, rejectRoleRequest | GET /role-requests, PATCH /role-requests/:id/approve, PATCH /role-requests/:id/reject |

Admin `/inquiries` remains an independently validated inquiryController handler after the auth barrier; it is not an adminController export. Direct test import: `listingApprovalAlerts.test.js` imports approveListing. Static repository search found no additional production callers of these controller modules.

## Feasible seams and priority

Keep the old controllers as explicit export facades. Proposed paths below are candidates, not existing modules or implementation approval. Copy complete handlers first; do not introduce wrapper handlers, dependency factories, blanket barrels, shared response builders or new service layers.

1. **Lowest-risk useful pilot: public agent directory/profile reads** in `controllers/agent/publicAgentController.js`: getAgents + getAgentProfile. Both depend only on the existing agentRepository object and request-local variables; no write, callback lifecycle or direct DB client. Existing profile privacy tests cover filtering/not-found. Add pre-extraction characterization for directory limit parsing, null/array/object profile normalization, spread fields, review zero/default rounding and forwarded repository errors. Preserve the in-memory mutation of agent.properties and exact 404 behavior. This is a cohesive two-handler responsibility, not a file for a trivial helper.
2. **Property reads** in `controllers/property/propertyReadController.js`: getProperties + getMyProperties + getPropertyById. Existing propertyRepository only; retain pagination/defaults, seller/agent guard and owner/admin private visibility. Do not include incrementViews in a purported read-only seam: it mutates via RPC. Characterize both pagination envelopes/error branches before extraction.
3. **Admin analytics** in `controllers/admin/adminAnalyticsController.js`: getDashboardStats + getRevenueData + getUserGrowth + getAnalytics. All repository-backed reads; cohesive reporting but weaker direct coverage and date/locale hazards. Characterize fake-clock six-month boundaries, input ordering, missing values and exact envelope before extraction. Do not combine with exportReport or settings.
4. **Property discovery** in `controllers/property/propertyDiscoveryController.js`: searchProperties + getSimilarProperties + getPriceInsight. Shared direct supabase client and ranking engines, distinct query shapes and limits. Existing search/similar API tests help, but price insight HTTP/error coverage is missing. Keep existing direct query placement rather than a repository migration.
5. **Agent CRM/appointments**: getAgentLeads/updateLeadMetadata/deleteLead form CRM; getMyAppointments/cancelBuyerAppointment form buyer appointment management. Keep booking and dashboard out of initial extraction. Thin groups are feasible only if their discoverability justifies another module; no pass-through helper proliferation.
6. **Later, higher-risk groups**: property create/media and owner mutations; agent booking/profile writes/dashboard; admin moderation/users/role requests/reports/settings. Preserve auth/login/receipt/payment internals. Stub admin endpoints (heatmap/audit/boosts/reports) should remain placeholders with current responses, not acquire behavior during extraction.

## Coupling and observable side effects

No controller-level mutable request state or handler-to-handler calls were found. Handlers close over imported repository/client/helper bindings; almost all other closures are request-local maps/reduces/callbacks. Extraction changes relative requires and module loading: preserve mocks at existing repository/config/helper identities and avoid child modules importing their parent facade (cycles). Do not destructure repository methods merely for style; current calls read methods from the repository object. Property's unused generateSafeFileName import still loads uploadMiddleware; changing import-time loading is separate from copying handlers.

| Domain | Contracts to preserve exactly |
| --- | --- |
| Property create/media | Role check precedes uploads; photo Promise.all completes before tour Promise.all. Each upload pushes its path into request-local uploadedFiles before awaiting uploadImage. Filename Date.now/Math.random calls, user path, tour metadata index pairing/filtering and metadata parse logging remain. Catch starts removeImages(...).catch without awaiting it, then next(error); late concurrent uploads/rollback behavior must not be silently repaired. Insert remains pending/Unpaid with created_at Date and exact null/zero/default fields; success201. |
| Property owner writes | Update loads owner row before approved-state refusal; 404 hides foreign ownership, approved edit400. Undefined removal differs from null and from `||`; retry without rejection_reason occurs only when error.message includes that string. Deletion awaits repository cleanup; do not move cleanup to controller. incrementViews treats any falsy count, including0, as404 and forwards RPC errors. |
| Property discovery/privacy | getPropertyById permits approved or owner/admin access. Similar/insight target queries currently do not apply that visibility guard: record as existing behavior, do not normalize during refactor. Similar limit uses Math.min(parseInt(...,10)||6,20); search Number(limit)||20 then slice; insight uses15 comparables. Candidate limits200/300 and exact selections/order remain. Insight null is200 with its distinct message. |
| Agent directory/profile | Directory `rating || 5`, toFixed(1), parseFloat fallback5, profile always a single-element array plus profile alias; preserve additional spread fields. Profile rejects non-AGENT with404 and filters approved properties in memory. |
| Agent booking | Self-check precedes createViewingLead. Lead persists first; only req.user.id may link an account. Conversation lookup → optional insert → message insert are sequential, inside a non-fatal catch;201 can follow a conversation failure. Do not use contact email as identity or make the whole operation transactional. |
| Agent CRM/appointments | AGENT checks remain handler-owned; update passes positional id/user/stage/timeframe/pre_approved unchanged. getMyAppointments passes email and id; cancellation scopes by email. Repository merges conversation/direct leads and owns lifecycle mapping New/Attempted Contact/Active/Offer/Closed, note parsing, latest message and sort. Do not relocate or unify these mappings. |
| Agent profile/resubmit | Profile updates users first when name/avatar is defined, then profile; array joins, Number conversion and undefined removal stay exact. Returned error from users update is currently not inspected. Resubmit checks REJECTED_AGENT, clears rejection reason and repository writes profile before user role. Preserve sequential partial-failure behavior. |
| Agent dashboard | Sequential properties query → getAgentLeads → reviews → profile. Only properties error explicitly throws; review/profile returned errors are not normalized. Portfolio includes all statuses; active/pending counts differ, pipeline uses exact stage strings. First three properties and leads are mapped before merged date sort/top5. Duplicate activeListings fields, date/locale/number formatting and rating fallback remain. |
| Admin login/auth | Keep bcrypt/JWT/cookie expiry, environment reads, role from fresh protect lookup and requireAdmin barrier intact. No auth extraction in first batch. |
| Admin moderation | approveListingOnce transition precedes notifications. Null result triggers existing lookup and404 or already-approved200. Saved-search matching begins fire-and-forget with catch, before awaited seller email; email failure can follow a persisted approval. Reject updates before awaited mail. Delete repository deletes DB row then awaits shared image cleanup. |
| Admin users/roles | Unban sets BUYER; allowed-role list and errors remain. Approve role request validates pending, updates role, then resolves request; reject only resolves. No transaction/failure rollback added. Repository owns profile rejection-reason writes. |
| Admin reporting/settings | Repository dashboard uses ordered Promise.all results and existing paid filters. Revenue groups month names without year; growth uses current day/time and setMonth rollover. Preserve existing timezone/locale/year behavior. CSV sanitizer is a local closure with no external state: preserve trigger regex, quoting, header order, newlines and download headers. listing_fee truthiness fallback500/update gating stays; changing zero handling is outside scope. |

## Existing evidence and gaps

Inspection only: file presence or test names below are not a fresh pass claim. No backend verification executed in this planning batch.

| Existing source | What it protects / limitation |
| --- | --- |
| agentProfilePrivacy.test.js | Direct controller profile filtering/not-found; not directory normalization or real joins. |
| authorization.test.js | Direct review roles/self checks and self-booking; not complete HTTP middleware, rating validation or failure ordering. |
| bookingIdentity.test.js | Actual routes, guest/session/reset-token/self identity with mocked DB/repository; no real persistence or complete conversation failure matrix. |
| crmOffer.test.js | Repository two-source stage roundtrip/ownership/partial fields with in-memory query mock; not all controller statuses/errors/dashboard calculations. |
| propertyPrivacy.test.js | Actual route public/private/owner/admin/ban/reset-token cases with mocked data. |
| propertyNumericValidation.test.js | Controllers behind validation, valid zero and create empty numeric behavior; custom test route, not real upload/ownership/auth pipeline. |
| searchProperties.test.js, similarProperties.test.js | Server API with thenable mocked Supabase: missing q, ranking, empty/custom limit; similar missing target/ranking/custom limit. No proof of real query filters/candidate caps or all failures. |
| similarityEngine.test.js, priceInsightEngine.test.js, searchRelevance.test.js | Engine units; price engine tests do not characterize getPriceInsight HTTP/query/error behavior. |
| listingApprovalAlerts.test.js | Direct handler triggers alert on transition and skips retry; no seller-email timing/failure or missing-row branch. |
| listingDeletionCleanup.test.js, propertyImageCleanup.test.js | Repository deletion/awaited cleanup, missing/DB/cleanup failure and cleanup utility rules; not full controller envelopes. |
| integration/listings.integration.cjs | Declared isolated real lifecycle/roles/ownership/privacy/zero/PostGIS/moderation/delete scenarios. |
| integration/crm.integration.cjs | Declared real booking/joins/order/two-source stages/metadata/auth/deletion/cascades. |
| integration/storage.integration.cjs | Declared real upload bytes/tour association/rejection/rollback/foreign ownership/deletion/shared-reference scenarios. |
| integration/login-roles.integration.cjs | Declared real admin/consumer sessions, invalid/reset credentials, DB demotion/ban/logout. |

No focused existing tests were found naming admin analytics/revenue/growth/export/settings handlers or price-insight HTTP route. Do not infer absence of all indirect coverage, or treat broad E2E filenames as exhaustive contracts. Integration runners are explicit isolated profiles (`run-listings.cjs`, `run-crm.cjs`, `run-storage.cjs`, `run-login-roles.cjs`); inspect their guards/setup and select affected profiles in the later executable plan, with sequential execution. They were not started here.

## Next bounded gate

Recommend designing only the public-agent read pilot first, retaining both old exports and routes. Before implementation: record baseline directory/profile HTTP and direct-import expectations, characterize missing cases, and specify exact copy/import/export diff plus relevant verification. After implementation: compare handler bodies and export set, run focused sequential checks and independent review, then update code-map to the actual child owners. This inventory creates no child controller and does not mark6F complete. Maps currently point to unchanged controllers and remain accurate at that level.
