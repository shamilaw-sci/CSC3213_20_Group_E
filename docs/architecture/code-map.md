# Code map

Scope: application entry points, the Phase6 extracted Profile panels/shell and AddProperty Steps1–4 presentation/category data. Other domains remain in the [phase roadmap](../phase6-refactoring-plan.md) until inspected; this is not a complete application index.

## Start here

| Question | Entry point |
| --- | --- |
| Which page opens for a URL? | [App.jsx](../../frontend-react/src/App.jsx): route definitions, protected routes and providers |
| Where are frontend diagnostic logs classified and constrained? | [clientLog.js](../../frontend-react/src/utils/clientLog.js) allows fixed operation events only; [ESLint config](../../frontend-react/eslint.config.js) guards direct production console calls; [scope/evidence](../phase7-frontend-log-privacy.md) |
| Where are payment UI terms, requests and SDK lifetime controlled? | [paymentUiBoundary.js](../../frontend-react/src/utils/paymentUiBoundary.js) validates config/locked terms and bounds requests; [usePayhere.js](../../frontend-react/src/hooks/usePayhere.js) owns config/quote/SDK callbacks; [evidence/limits](../phase7-payment-ui-boundary.md) |
| Which Node handler receives an HTTP request? | [server.js](../../backend-node/server.js), then the named routes module |
| Where does polygon map search start? | [main.go](../../go-map-service/main.go), then routes, handlers and repository |
| Where are UI controls/styles? | [UI map](ui-map.md) |
| Where are session issuance, credential binding and password revocation? | [sessionToken.js](../../backend-node/utils/sessionToken.js), [authMiddleware.js](../../backend-node/middleware/authMiddleware.js), auth/social/Admin controllers; [rollout contract](../phase7-session-rollout.md) |
| Where are AddProperty Category & Price controls and category objects? | [CategoryPriceStep.jsx](../../frontend-react/src/components/property/create/CategoryPriceStep.jsx), [propertyCategoryOptions.js](../../frontend-react/src/components/property/create/propertyCategoryOptions.js) and [wizard contracts](add-property-inventory.md); later steps remain in the page |
| What are the actual Profile colors and first token scope? | [Measured baseline](profile-color-inventory.md), approved one-control design (development document archived locally) and [profile-actions.css](../../frontend-react/src/components/profile/profile-actions.css); only Start Searching consumes these tokens |

## Profile Search Radars

| Responsibility | Owner |
| --- | --- |
| `/profile?tab=searches`, tab/query synchronization, initial reads and state | [ProfileSettings.jsx](../../frontend-react/src/pages/ProfileSettings.jsx) |
| Panel heading, empty state, card list | [SavedSearchesPanel.jsx](../../frontend-react/src/components/profile/SavedSearchesPanel.jsx) |
| Search title/criteria, delete/toggle/run controls | [SavedSearchCard.jsx](../../frontend-react/src/components/profile/SavedSearchCard.jsx) |
| Delete request, success timing/toast, failed-delete retention | `handleDeleteSearch` in ProfileSettings |
| Optimistic alert update, PATCH, failure rollback | `handleToggleSearchAlerts` in ProfileSettings |
| Full-row replay to `/map` | Parent `navigate('/map', { state: { savedSearch: search } })`; [useMapSearch.js](../../frontend-react/src/hooks/useMapSearch.js) consumes saved-search state |
| Native controls and exact styles | Panel/card layout classes; Start Searching uses [profile-actions.css](../../frontend-react/src/components/profile/profile-actions.css), imported once by [index.css](../../frontend-react/src/index.css). Other card/control colors and existing global/dark rules stay unchanged |

The panel/card are stateless presentation modules. They do not fetch, mutate data, own routing or move the animation wrapper. ProfileSettings retains the direct keyed `m.div` below `AnimatePresence` and owns all effects/state/handlers.

## Profile Appointments and Favorites

| Responsibility | Owner |
| --- | --- |
| Appointment heading, agent discovery links, empty state and list | [AppointmentsPanel.jsx](../../frontend-react/src/components/profile/AppointmentsPanel.jsx) |
| Appointment status/date, agent/property snippet, Profile/Cancel/Message/Call controls | [AppointmentCard.jsx](../../frontend-react/src/components/profile/AppointmentCard.jsx) |
| Shortlist heading, discovery links, empty state and list | [FavoritesPanel.jsx](../../frontend-react/src/components/profile/FavoritesPanel.jsx) |
| Property image/price/location/features, Remove/View Details controls | [FavoritePropertyCard.jsx](../../frontend-react/src/components/profile/FavoritePropertyCard.jsx) |
| Data reads, counts, tab/query state, keyed motion wrappers | ProfileSettings |
| Confirm cancel, DELETE request, row removal after success and error toast | Parent `handleCancelAppointment(leadId)` |
| Favorite POST toggle, removal after success and error toast | Parent `handleRemoveFavorite(id)` |
| Agent discovery/profile, messages, property discovery/details navigation | Parent callback props; panel/card modules do not import the router |

These modules preserve the existing row/status/default/date/price display expressions and contain no effects or request state. Call Agent remains a native `tel:` link. Button/style lookup is in the [UI map](ui-map.md).

Unchanged API paths: `server.js` mounts `/api/agents` → [agentRoutes.js](../../backend-node/routes/agentRoutes.js) → [agentController.js](../../backend-node/controllers/agentController.js): authenticated `GET /my-appointments` calls `getMyAppointments`; authenticated `DELETE /my-appointments/:id` calls `cancelBuyerAppointment`. `/api/favorites` → [favoritesRoutes.js](../../backend-node/routes/favoritesRoutes.js) → [favoritesController.js](../../backend-node/controllers/favoritesController.js): authenticated `GET /` calls `getFavorites`, and `POST /:propertyId` calls `toggleFavorite`. This refactor changes none of these handlers or middleware.

## Profile Mortgage Calculator

| Responsibility | Owner |
| --- | --- |
| Heading, parameters, tenure buttons, results and advisory presentation | [MortgageCalculatorPanel.jsx](../../frontend-react/src/components/profile/MortgageCalculatorPanel.jsx) |
| Four numeric values/defaults and setters | `calcPrice`, `calcDownpaymentPercent`, `calcTenureYears`, `calcInterestRate` in ProfileSettings |
| Calculation, rounding and displayed summary values | Parent `loanSummary` useMemo; original dependencies and formula |
| Range/number input event conversion | Panel retains `Number(e.target.value)` before calling the parent setter |
| Tab query, state retention and direct keyed animation wrapper | ProfileSettings |

The calculator is local UI with no calculation endpoint or new service. Existing financial/advisory text is preserved verbatim. Displayed estimate semantics, including existing edge cases and number-input limits, remain unchanged.

## Profile Due-Diligence Checklist

| Responsibility | Owner |
| --- | --- |
| Six item keys/order/titles/descriptions | [dueDiligenceItems.js](../../frontend-react/src/components/profile/dueDiligenceItems.js) |
| Heading, card grid, click target, checked classes and Check icon | [DueDiligencePanel.jsx](../../frontend-react/src/components/profile/DueDiligencePanel.jsx) |
| Default checks, per-key toggle, local state across tabs | Parent `checkedItems` and `toggleCheckItem` in ProfileSettings |
| Tab/query synchronization and direct keyed animation wrapper | ProfileSettings |

The six static content objects retain their original literals and order. The panel receives `checkedItems` and `onToggleCheckItem`, makes no request, and retains the original clickable-div semantics. Extract Search and Survey Plan start checked; this remains local component state with original new-mount defaults. Existing legal content is preserved verbatim.

## Profile header, summary and navigation

| Responsibility | Owner |
| --- | --- |
| Identity/avatar/phone display, upload label/input, Explore Listings/Certified Agents actions | [ProfileHeader.jsx](../../frontend-react/src/components/profile/ProfileHeader.jsx) |
| Scheduled Tours, Saved Shortlist, Search Radars, Conversations KPI cards | [ProfileSummaryCards.jsx](../../frontend-react/src/components/profile/ProfileSummaryCards.jsx) |
| Tab order/icons/count badges, agent-role condition and active layout indicator | [ProfileTabs.jsx](../../frontend-react/src/components/profile/ProfileTabs.jsx) |
| Avatar file reader and preview state | Parent `handleAvatarChange`/`avatarUrl`; no upload request occurs on selection |
| Reads/counts, role data, selected tab/query synchronization and route callbacks | ProfileSettings |

ProfileHeader's children slot retains the summary cards at the original position inside the header. The three components add no DOM wrappers or state. Parent passes exact lengths/values; navigation buttons and summary cards call parent callbacks. Existing `layoutId="activeProfileTab"` remains inside the active tab button; direct panel motion boundaries remain in the parent. Existing profile-save behavior stays in `handleSubmit`.

## Saved-search backend path (unchanged)


`server.js` mounts `/api/saved-searches` → [savedSearchRoutes.js](../../backend-node/routes/savedSearchRoutes.js) → [savedSearchController.js](../../backend-node/controllers/savedSearchController.js) → [savedSearchRepository.js](../../backend-node/repositories/savedSearchRepository.js).

| Operation | Route | Controller |
| --- | --- | --- |
| Load rows | `GET /api/saved-searches` | `getSavedSearches` |
| Delete row | `DELETE /api/saved-searches/:id` | `deleteSavedSearch` |
| Toggle alerts | `PATCH /api/saved-searches/:id/alerts` | `toggleAlerts` |
| Save criteria from discovery flow | `POST /api/saved-searches` | `saveSearch` |

All four routes retain existing authentication/validation. Phase 6 pilot makes no backend or schema changes. Controllers also contain alert coordination; this map does not claim every backend query passes through the repository.

## AddProperty wizard

The [AddProperty page](../../frontend-react/src/pages/AddProperty.jsx) coordinates four wizard steps at `/add-property`; App restricts that route to SELLER/AGENT. [CategoryPriceStep.jsx](../../frontend-react/src/components/property/create/CategoryPriceStep.jsx) owns Step1 presentation, native inputs and Continue markup. [propertyCategoryOptions.js](../../frontend-react/src/components/property/create/propertyCategoryOptions.js) owns the four category objects/icons/order. The fragment-returning step keeps the parent's original motion root and direct-child layout.

Parent category/district handlers, price formatter, validation/navigation and all31 non-render statements remain unchanged; State/handlers, Step2 map, tour rows and Step3 navigation remain parent-owned; presentation owners are listed below. [usePropertyForm](../../frontend-react/src/hooks/usePropertyForm.js) remains byte-identical and owns form/draft/submission state and payment handoff. The [wizard inventory](add-property-inventory.md) and approved first-step design (development document archived locally) record contracts and limits.

Verification: [rendered wizard](../../frontend-react/src/pages/AddProperty.integration.test.jsx), [submission hook](../../frontend-react/src/hooks/usePropertyForm.integration.test.jsx) and [category/price characterization](../../frontend-react/src/pages/AddProperty.categoryPrice.test.jsx),24/24 before and after extraction. Full frontend219/219, lint/build and independent spec/quality reviews passed. Synthetic browser results are in the [checkpoint](../phase6-checkpoint.md); HTTP/payment/map boundaries remain controlled, not real SDK/Leaflet/payment results.

Step2: [LocationStep.jsx](../../frontend-react/src/components/property/create/LocationStep.jsx) owns town/address, mode/GPS controls, hint/Clear and navigation markup with original local classes. The parent supplies its unchanged MapContainer JSX as children and retains MapClickEvents/customIcon/state/GPS/validation/navigation logic. See [Spatial Location contracts/acceptance](add-property-location-inventory.md), approved design (development document archived locally) and [actual-parent tests](../../frontend-react/src/pages/AddProperty.location.test.jsx). Final wizard tests29/29 and aggregate224/224; real Leaflet identity/cleanup plus isolated visual evidence are recorded in the checkpoint. Existing LocationPicker is a different implementation and is not substituted. Specs & Photos and Review & Publish remain in the parent.

## AddProperty specification fields

Step3 fields-only implementation: [PropertySpecificationFields.jsx](../../frontend-react/src/components/property/create/PropertySpecificationFields.jsx), four props and fragment root; [actual-parent characterization](../../frontend-react/src/pages/AddProperty.specificationFields.test.jsx). Parent retains all media/navigation/map/other-step markup and31 non-render statements; hook bytes unchanged. Browser appearance/native-focus acceptance is pending; HD presentation is now extracted separately;360 rows/URL creation remain in the parent; VirtualToursSection owns its shell.

## Profile verification entry points

- [ProfileSettings.integration.test.jsx](../../frontend-react/src/pages/ProfileSettings.integration.test.jsx): rendered parent, real extracted modules, controlled API/toast/router; mutations, rollback, replay, empty/legacy/tab behavior.
- [ProfileSettings.test.jsx](../../frontend-react/src/pages/ProfileSettings.test.jsx): existing actual-motion-backed rendering/toggle/replay check.
- [ProfileSettings.panels.test.jsx](../../frontend-react/src/pages/ProfileSettings.panels.test.jsx): actual appointment/favorite panels, original status/default/type/navigation contracts, cancellation confirmation and pending/success/failure removals.
- [ProfileSettings.calculator.test.jsx](../../frontend-react/src/pages/ProfileSettings.calculator.test.jsx): actual parent/calculator controls, default and changed outputs, control attributes and tab-state retention; no formula copied into test expectations.
- [ProfileSettings.dueDiligence.test.jsx](../../frontend-react/src/pages/ProfileSettings.dueDiligence.test.jsx): actual parent/checklist content, original checked defaults, independent per-item clicks/toggle state and tab/new-mount behavior.
- [ProfileSettings.shell.test.jsx](../../frontend-react/src/pages/ProfileSettings.shell.test.jsx): actual parent header/summary/tabs, identity and role conditions, avatar-preview wiring, counts/actions and URL synchronization.
- [savedSearch.test.js](../../backend-node/tests/savedSearch.test.js): existing backend unit/API contracts.
- [saved-searches.integration.cjs](../../backend-node/integration/saved-searches.integration.cjs) via `run-saved-searches.cjs`: explicit isolated real API/database profile; not required to rerun for this presentation-only pilot.

Current execution evidence and limits: [Phase 6 checkpoint](../phase6-checkpoint.md). Private synthetic visual tooling/evidence belongs under untracked `docs/evidence`, not application routes or committed assets.

## HD photo presentation

[HDPhotosSection.jsx](../../frontend-react/src/components/property/create/HDPhotosSection.jsx) is a seven-prop stateless fragment under the original parent motion root. [Media contract tests](../../frontend-react/src/pages/AddProperty.mediaContracts.test.jsx) exercise actual page/hook with controlled boundaries; preservation proof confirms parent/hook bytes outside approved import/HD JSX replacement. Focused40/40 and full235/235 pass. Browser acceptance remains pending.

## 360 tour shell

[VirtualToursSection.jsx](../../frontend-react/src/components/property/create/VirtualToursSection.jsx) takes onUpload/currentSizeMB/maxSizeMB/progress/children. It preserves original DOM and forwards the raw upload event. Parent owns conditional tour rows, render-time object URLs and metadata/removal closures; hook bytes and all31 parent statements remain unchanged. Focused40/40, aggregate235/235 and independent spec/quality review pass; visual/focus checks remain unperformed.

## Review & Publish

[ReviewPublishStep.jsx](../../frontend-react/src/components/property/create/ReviewPublishStep.jsx) is a stateless fragment under the original Step4 motion root. Fourteen props are the original render dependencies, including locationMode/boundaryCoordinates. [Actual-parent tests](../../frontend-react/src/pages/AddProperty.reviewPublish.test.jsx) protect summaries/previews/tour metadata, edit/back retention, fee fallback and controlled pending/error submit states. Parent31 statements/helpers/earlier steps and hook bytes match preserved source. Focused45/45, full240/240 and independent review pass; browser evidence remains unperformed.

## Agent KPI cards

[AgentKpiCards.jsx](../../frontend-react/src/components/dashboard/AgentKpiCards.jsx) owns the four always-visible portfolio/listings/CRM/impressions cards. Dashboard retains all eight scalar derivations/defaults,36 non-return statements and other markup/effects/requests/auth/timers. [KPI actual-parent tests](../../frontend-react/src/pages/agent/Dashboard.kpi.test.jsx) cover populated/default/zero values and refresh request traces; existing integration coverage remains. Inventory: [Agent Dashboard](agent-dashboard-inventory.md).

## Agent overview / properties

[AgentOverviewPanel.jsx](../../frontend-react/src/components/dashboard/AgentOverviewPanel.jsx) owns stage distribution, first-four server-ordered property showcase, reputation and activity presentation. [AgentPropertiesPanel.jsx](../../frontend-react/src/components/dashboard/AgentPropertiesPanel.jsx) owns filter buttons/grid/empty state/View/Add controls. Parent owns tab/filter state, filtering, derivations/navigation and all requests/effects/CRM/chat/modal code. [Actual-parent panels tests](../../frontend-react/src/pages/agent/Dashboard.panels.test.jsx) protect populated/empty states and interactions; no generic property-card abstraction introduced.

## Agent CRM presentation

[AgentPipelinePanel.jsx](../../frontend-react/src/components/dashboard/AgentPipelinePanel.jsx) owns the five-stage board, archive/history toggle and lead-card presentation. [AgentLeadDetailsModal.jsx](../../frontend-react/src/components/dashboard/AgentLeadDetailsModal.jsx) owns dossier presentation and controls. Dashboard retains conditional mounting, all 36 non-return statements, state, requests, handlers and timers. [CRM characterization](../../frontend-react/src/pages/agent/Dashboard.crm.test.jsx) covers original stage defaults/history, dossier fallbacks/navigation and parent actions. [Backend inventory](backend-refactoring-inventory.md) records proposed backend seams; these are not implemented.

## Agent messaging presentation

[AgentMessagesPanel.jsx](../../frontend-react/src/components/dashboard/AgentMessagesPanel.jsx) owns conversation list, selected buyer header, message stream and composer. Dashboard retains selection/draft/send state, polling, effects, timers and messagesEndRef. Original callbacks and strict sender comparison remain unchanged.

## Public agent reads

[publicAgentController.js](../../backend-node/controllers/agent/publicAgentController.js) owns getAgents/getAgentProfile. Existing agentController export entrypoint and agentRoutes remain unchanged. Directory characterization and existing profile privacy tests passed before/after extraction (15/15).

## Property read handlers

[propertyReadController.js](../../backend-node/controllers/property/propertyReadController.js) owns getProperties, getMyProperties and getPropertyById. Existing propertyController export paths and route/middleware order stay unchanged. Pagination, role checks, privacy and response/error contracts are preserved; original characterization30/30 and final full backend473/473 passed.

## Agent CRM and buyer appointments

[agentCrmController.js](../../backend-node/controllers/agent/agentCrmController.js) owns getAgentLeads/updateLeadMetadata/deleteLead. [buyerAppointmentController.js](../../backend-node/controllers/agent/buyerAppointmentController.js) owns getMyAppointments/cancelBuyerAppointment. Original agentController exports remain the route entrypoint; existing role checks and repository argument/email scoping stay unchanged. Booking/profile writes/dashboard remain in the parent controller.

## Agent booking, profile and dashboard handlers

[agentBookingController.js](../../backend-node/controllers/agent/agentBookingController.js) owns review posting and booking, including original optional conversation/message linking. [agentProfileController.js](../../backend-node/controllers/agent/agentProfileController.js) owns profile updates and rejected-application resubmission. [agentDashboardController.js](../../backend-node/controllers/agent/agentDashboardController.js) owns dashboard reads/calculations. The old agentController entrypoint retains explicit imports/exports and initial dependency loading; routes/repositories and existing error/ordering semantics are unchanged.

## Property writes and discovery

[propertyWriteController.js](../../backend-node/controllers/property/propertyWriteController.js) owns create/upload/rollback and owner update/delete handlers. [propertyDiscoveryController.js](../../backend-node/controllers/property/propertyDiscoveryController.js) owns search, similar listings, price insight and view-count increment (the latter is a write). Existing propertyController exports/routes and dependency initialization stay unchanged. Repository/helper/query and error behavior remain original.

## Admin analytics

[adminAnalyticsController.js](../../backend-node/controllers/admin/adminAnalyticsController.js) owns dashboard counts, revenue, user growth and analytics metric handlers. Original adminController entrypoint and authentication/middleware stay unchanged. Existing repository calls, date grouping and response/error behavior are preserved. Remaining Admin operations stay in adminController.

## Admin moderation and users

[adminListingController.js](../../backend-node/controllers/admin/adminListingController.js) owns listing reads/approval/rejection/deletion and existing notification calls. [adminUserController.js](../../backend-node/controllers/admin/adminUserController.js) owns user reads/pending-agent reads/ban/unban/role updates. Existing adminController entrypoint and routes remain stable.

## Admin reports/settings/role requests

[adminReportController.js](../../backend-node/controllers/admin/adminReportController.js) owns transaction reads and CSV export. [adminSettingsController.js](../../backend-node/controllers/admin/adminSettingsController.js) owns platform settings read/update. [adminRoleRequestController.js](../../backend-node/controllers/admin/adminRoleRequestController.js) owns request listing/approval/rejection. Original auth and placeholder endpoints intentionally stay in adminController; stable exports/routes remain.

## Seller KPI pilot

[SellerKpiCards.jsx](../../frontend-react/src/components/dashboard/SellerKpiCards.jsx) owns the five-card KPI section only. SellerDashboard retains all requests/state, paid/draft aggregation and formatLKR. Listings/conversation/chart sections stay parent-owned.

## Seller listing and inquiry panels

[SellerListingsPanel.jsx](../../frontend-react/src/components/dashboard/SellerListingsPanel.jsx) owns recent listing loading/empty/cards and View/Create actions with five original props. [SellerConversationsPanel.jsx](../../frontend-react/src/components/dashboard/SellerConversationsPanel.jsx) owns buyer-chat loading/empty/list/Open Inbox with three original props. Parent retains slice ordering, state/effects/requests and formatLKR.

## Buyer KPI pilot

[BuyerKpiCards.jsx](../../frontend-react/src/components/dashboard/BuyerKpiCards.jsx) owns four Quick Pulse cards. BuyerDashboard retains all six original bindings, URL tab synchronization, data fetching, state/memo and mutations. Other Buyer owners are listed below.

## Buyer appointments/favorites/searches

[BuyerAppointmentsPanel.jsx](../../frontend-react/src/components/dashboard/BuyerAppointmentsPanel.jsx), [BuyerFavoritesPanel.jsx](../../frontend-react/src/components/dashboard/BuyerFavoritesPanel.jsx) and [BuyerSavedSearchesPanel.jsx](../../frontend-react/src/components/dashboard/BuyerSavedSearchesPanel.jsx) own three tab inner roots. Each takes original collection, navigate and corresponding mutation handler. Parent owns conditions/state/effects/URL tabs/mutations and calculations; full saved-search row still reaches map state.

## Buyer mortgage and checklist

[BuyerMortgagePanel.jsx](../../frontend-react/src/components/dashboard/BuyerMortgagePanel.jsx) owns planner presentation with nine original bindings. [BuyerDueDiligencePanel.jsx](../../frontend-react/src/components/dashboard/BuyerDueDiligencePanel.jsx) owns checklist content/cards with checkedItems/toggleCheckItem. BuyerDashboard retains all input state, original mortgage memo, checklist defaults/toggle and conditional mounts. Upgrade helper remains parent-owned.

## Admin reject dialog

[RejectModal.jsx](../../frontend-react/src/pages/admin/components/listings/RejectModal.jsx) owns original rejection textarea/reason state and confirm/cancel controls. ListingsPage retains mutation/query/cache logic and conditional mounting. Details/map remain unchanged.

## Final selected Admin/property seams

[ListingDetailsModal.jsx](../../frontend-react/src/pages/admin/components/listings/ListingDetailsModal.jsx) owns existing inspection state, audit/photo/map presentation and modal actions. [ListingsOverview.jsx](../../frontend-react/src/pages/admin/components/listings/ListingsOverview.jsx) owns header/filter/table presentation; page owns query/mutations/normalization/Leaflet initialization. [PropertyCriticalDetails.jsx](../../frontend-react/src/components/property/details/PropertyCriticalDetails.jsx) owns title/price/features/owner-contact-favorite-share presentation; [PropertyComparisonSidebar.jsx](../../frontend-react/src/components/property/details/PropertyComparisonSidebar.jsx) owns compare/mortgage presentation. PropertyDetails retains all state/effects/requests/handlers and gallery/map/tour/lightbox roots.
