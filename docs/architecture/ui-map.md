# UI map

Scope: extracted Profile panels and header/summary/navigation shell, plus the first Start Searching color-token pilot. Use the visible label to find its presentation, handler and style owner. Other UI domains will be added in their own verified batches. Other controls retain their current local colors; no native control was replaced by a shared primitive.

| Visible control/object | Presentation | Behavior owner | Style owner |
| --- | --- | --- | --- |
| Search Radars tab/count | [ProfileSettings.jsx](../../frontend-react/src/pages/ProfileSettings.jsx), tabs array | Parent `handleTabChange('searches')` and existing query synchronization | Parent tab classes/active motion indicator |
| Smart Search Radars & Alerts heading | [SavedSearchesPanel.jsx](../../frontend-react/src/components/profile/SavedSearchesPanel.jsx) | Presentation only | Panel heading/subtitle classes |
| No saved search alerts / Start Searching | SavedSearchesPanel | `onStartSearching()` → parent `/buy` navigation | Panel layout/radius/shadow classes; colors use `profile-solid-action` in [profile-actions.css](../../frontend-react/src/components/profile/profile-actions.css) |
| Card title and criteria chips | [SavedSearchCard.jsx](../../frontend-react/src/components/profile/SavedSearchCard.jsx) | Original persisted row; title → legacy name → Custom Search Alert | Card root/title/chip classes, current slate surfaces/dark variants |
| Delete search (icon title) | SavedSearchCard | `onDelete(id)` → parent `handleDeleteSearch` → `DELETE /saved-searches/:id` | Card delete button/icon classes, red hover |
| Toggle email alerts for this saved search | SavedSearchCard | Stop propagation; `onToggleAlerts(id, currentlyEnabled)` → parent optimistic PATCH/rollback | Card on/off class branches; green enabled/gray disabled, dark variants |
| Run Search Radar | SavedSearchCard | `onRun(originalRow)` → parent `/map` navigation with entire savedSearch object | Card run button/chevron classes; blue background/text/hover variants |
| Panel entry/exit animation | ProfileSettings direct keyed `m.div` | Existing `AnimatePresence mode="wait"`, unchanged key/motion props | Parent animation props, no new animation owner |

## Appointments and shortlist controls

| Visible control/object | Presentation | Behavior owner | Style owner |
| --- | --- | --- | --- |
| Scheduled Viewings & Agent Appointments / empty state | [AppointmentsPanel.jsx](../../frontend-react/src/components/profile/AppointmentsPanel.jsx) | Parent passes current appointments | Panel heading/empty-state classes |
| Find & Book Certified Agent / Explore Certified Agents | AppointmentsPanel | `onFindAgent()` → parent `/agents` | Panel blue button/hover classes |
| Status badge, booking date, agent/property snippets | [AppointmentCard.jsx](../../frontend-react/src/components/profile/AppointmentCard.jsx) | Existing lifecycle/default/date/price expressions | Card status branches, surfaces and text classes |
| Agent Profile | AppointmentCard | `onViewAgent(agent.id)` → parent `/agent/:id`; existing ID condition | Card blue text/underline classes |
| Cancel Appointment | AppointmentCard | `onCancel(lead_id)` → parent confirm, `DELETE /agents/my-appointments/:leadId`, remove only after success | Card red hover/icon classes |
| Message / Call Agent | AppointmentCard | `onMessage()` → parent `/messages`; native `tel:` link when phone exists | Card blue message and emerald call classes |
| Saved Property Shortlist / empty state | [FavoritesPanel.jsx](../../frontend-react/src/components/profile/FavoritesPanel.jsx) | Parent passes current favorites | Panel heading/empty-state classes |
| Explore More Properties / Discover Properties | FavoritesPanel | `onExplore()` → parent `/buy` | Panel blue button/hover classes |
| Property image, title, price, location, beds/baths/land size | [FavoritePropertyCard.jsx](../../frontend-react/src/components/profile/FavoritePropertyCard.jsx) | Original row and display fallbacks | Card image/feature/price classes |
| Remove from favorites | FavoritePropertyCard | `onRemove(id)` → parent `POST /favorites/:id`; remove only after success | Card absolute remove button/red hover classes |
| View Details | FavoritePropertyCard | `onViewDetails(id)` → parent `/property/:id` | Card blue action/hover classes |

Appointment controls retain explicit `type="button"`; favorite card Remove/View Details retain omitted type. Panels retain explicit button types. Cancel preserves the original confirmation text; failures preserve the row and existing toast behavior. Status names/defaults, image fallback URLs and date/number locale behavior are unchanged. Animation keys remain on the parent's direct motion wrappers; row keys remain stable IDs.

## Mortgage controls and results

All presentation below belongs to [MortgageCalculatorPanel.jsx](../../frontend-react/src/components/profile/MortgageCalculatorPanel.jsx); state and `loanSummary` remain in ProfileSettings.

| Visible control/object | Behavior owner | Style owner |
| --- | --- | --- |
| Property Purchase Price (LKR): range and numeric input | `setCalcPrice(Number(value))`; range min5000000/max200000000/step1000000; number input retains no min/max/step | Panel price accent-blue and number-input classes |
| Downpayment Percentage | `setCalcDownpaymentPercent(Number(value))`; range min10/max50/step5 | Panel accent-emerald classes |
|10/15/20/25 Yrs buttons | `setCalcTenureYears(yr)`; explicit type=button and year key | Panel selected purple/unselected slate branches |
| Annual Interest Rate (%) | `setCalcInterestRate(Number(value))`; range min8.0/max18.0/step0.25 | Panel accent-amber classes |
| Monthly Loan Payment (EMI) and result rows | Parent summary and original locale display expressions | Panel gradient EMI card and metric-specific text/borders |
| Advisory text | Existing presentation only; no request or new recommendation | Panel advisory surface/text classes |

Input conversion, rounding, total-outflow expression and native range behavior are preserved. The numeric price field is not newly clamped or validated in this batch. The [calculator characterization tests](../../frontend-react/src/pages/ProfileSettings.calculator.test.jsx) protect the actual rendered parent and local interactions; the parent keeps the direct `key="calculator"` motion boundary and values across tabs.

## Due-diligence content and controls

| Visible control/object | Presentation/content owner | Behavior/style owner |
| --- | --- | --- |
| Sri Lanka Property Due-Diligence Checklist heading/subtitle | [DueDiligencePanel.jsx](../../frontend-react/src/components/profile/DueDiligencePanel.jsx) | Panel heading/subtitle classes |
| Six item titles/descriptions, including Sinhala text | [dueDiligenceItems.js](../../frontend-react/src/components/profile/dueDiligenceItems.js) | Original keys/order/literals |
| Clickable card, title, description and indicator area | DueDiligencePanel | `onToggleCheckItem(item.key)` → parent functional `toggleCheckItem`; original event bubbling |
| Checked card/indicator/Check icon | DueDiligencePanel | Existing checked classes: blue background/border/indicator and white icon |
| Unchecked card/indicator and hover border | DueDiligencePanel | Existing white/slate surfaces, empty bordered indicator and slate hover border; dark variants retained |

These controls remain the original clickable divs; no native checkbox/button, role, tabIndex or new keyboard behavior is introduced. Parent defaults check `extractSearch` and `surveyPlan`, retain all selections across tabs, and reset to the original defaults on a new page mount. There is no checklist persistence request. [Actual-parent characterization tests](../../frontend-react/src/pages/ProfileSettings.dueDiligence.test.jsx) protect these contracts.

## Profile header, summary and tabs

| Visible control/object | Presentation | Behavior/style owner |
| --- | --- | --- |
| Avatar/image fallback, verified role, name/email/optional phone | [ProfileHeader.jsx](../../frontend-react/src/components/profile/ProfileHeader.jsx) | Original user/value fallbacks and header/icon classes; no role/name normalization |
| Avatar upload label/hidden input | ProfileHeader | Same htmlFor/id=avatarUpload, file accept=image/*; parent `handleAvatarChange` uses FileReader for local preview; same group-hover classes |
| Explore Listings / Certified Agents | ProfileHeader | Parent `/buy` / `/agents` callbacks; original explicit button types and blue/translucent styles |
| Scheduled Tours / Saved Shortlist / Search Radars KPI cards | [ProfileSummaryCards.jsx](../../frontend-react/src/components/profile/ProfileSummaryCards.jsx) | Parent `handleTabChange` for appointments/favorites/searches; exact count displays and clickable-div styles |
| Conversations KPI | ProfileSummaryCards | Parent `/messages`; original unread>0 `${unreadMessagesCount} New` versus Active display, purple icon |
| Profile navigation labels/count badges | [ProfileTabs.jsx](../../frontend-react/src/components/profile/ProfileTabs.jsx) | Parent activeTab/query callback; badges only for defined count>0; original native button types and text classes |
| Agent Brand Settings | ProfileTabs | Original AGENT/PENDING_AGENT condition only; parent owns authorization/data |
| Active tab underline | ProfileTabs | Original m.div layoutId=activeProfileTab inside active button; original blue classes |

The [actual-parent shell tests](../../frontend-react/src/pages/ProfileSettings.shell.test.jsx) protect identity/default/role/count/action/preview/query behavior. File selection only previews; existing Profile & Security save remains parent-owned. Summary cards keep their original div semantics. Responsive and light/dark classes remain local in these modules; shared-token migration is still separate.

## Button and row contracts

- Start Searching and Toggle retain explicit `type="button"`. Delete and Run retain omitted native `type`; this refactor does not change implicit form behavior.
- The toggle passes `row.email_alerts_enabled !== false`, preserving the enabled default for missing legacy values. Only toggle stops propagation.
- Delete keeps the row until success; failure retains it and displays the existing error toast. Toggle is optimistic and restores its previous value on failure. No new disabled/loading states are introduced.
- Run passes the current original row, including full filters/polygon/zero values, without normalization or mutation.
- Title fallback and existing JSX truthiness for criteria chips are unchanged, including numeric-zero behavior. Display semantics are not corrected inside a structural refactor.
- Mapped card identity remains the row ID; the animation key remains on the parent's direct motion element. The new modules add no DOM wrapper or state.

## Where to change a color later

The [Profile color inventory](profile-color-inventory.md) records30 baseline normal/hover/focus observations and actual dark-mode exceptions. The approved [first token pilot](../superpowers/specs/2026-11-01-profile-action-token-pilot-design.md) migrates Start Searching only. Its colors are now owned by [profile-actions.css](../../frontend-react/src/components/profile/profile-actions.css): `--profile-solid-action-bg`, `--profile-solid-action-hover-bg`, `--profile-solid-action-fg`. Defaults alias existing blue600/blue700/white values; hover retains `@media (hover: hover)`. This is the edit location for that one consumer; other actions remain explicit exceptions.

For other controls, start with their exact class list above and inspect [index.css](../../frontend-react/src/index.css) for broad dark-mode overrides. The application also has semantic variables and [shared Button variants](../../frontend-react/src/components/ui/button.jsx); changing `--primary` does not recolor the scoped Start Searching tokens or other palette-based Search Radars controls.

Further semantic-token migration remains a separate verified styling batch. This map records actual owners rather than one global token for all buttons. Preserve hover capability, focus/theme states and CSS specificity in later changes.

## AddProperty controls — Steps1–2 implemented

The [wizard inventory](add-property-inventory.md) maps all four steps. Step1 now has these edit locations:

| Visible item / edit | Presentation/data owner | Logic/style owner |
| --- | --- | --- |
| Residential House, Land Only, Rent House, Rent Villa titles/descriptions/icons/order | [propertyCategoryOptions.js](../../frontend-react/src/components/property/create/propertyCategoryOptions.js) | Existing IDs are contracts; selection/reset logic remains parent handleTypeSelect |
| Category-card borders/backgrounds/icons, Property Headline Title, Price (Rs.), Month/Year, District, Contact Number, Listing Type | [CategoryPriceStep.jsx](../../frontend-react/src/components/property/create/CategoryPriceStep.jsx) | Exact local classes; raw fields go to usePropertyForm.handleChange, district to parent handleDistrictChange; placeholders/preview/district list remain parent-derived |
| Continue to Spatial Location | CategoryPriceStep.jsx navigation block | Parent nextStep; existing bg-blue-600/hover:bg-blue-500, not the Profile action token |
| Stepper, error banner, map subtree, tour rows, Step3 navigation | [AddProperty.jsx](../../frontend-react/src/pages/AddProperty.jsx) | Existing page handlers/hook; extracted controls are listed below |

No Step1 styling/token migration or shared-control replacement occurred. The [approved design](../superpowers/specs/2026-11-01-add-property-category-price-design.md) preserves the parent motion root, native events and current validation/stepper behavior. See [category/price tests](../../frontend-react/src/pages/AddProperty.categoryPrice.test.jsx) for controlled behavioral protection.

Step2 controls/styles now live in [LocationStep.jsx](../../frontend-react/src/components/property/create/LocationStep.jsx): Nearby Town / City, Full Address, Single Pin Location, Draw Boundary Polygon, My GPS, Clear Boundary, Previous Step and Continue to Specs & Photos. It also owns the h-80 map wrapper and hint/clear overlays. Actual MapContainer/layer markup and MapClickEvents/customIcon remain in AddProperty, supplied through children. GPS/validation/navigation stay parent-owned and form/mode/boundary state stays in the hook. See [exact handlers/legacy rules](add-property-location-inventory.md) and [approved design](../superpowers/specs/2026-11-01-add-property-location-design.md). No Step2 color-token/shared-button migration occurred; Continue still uses hover:bg-blue-500.

## AddProperty specification fields

Step3 specification inputs now live in [PropertySpecificationFields.jsx](../../frontend-react/src/components/property/create/PropertySpecificationFields.jsx): Bedrooms, Bathrooms, House Size, Land Size and Description, including their original local classes. Raw changes still call the hook's handleChange; category booleans/reset logic stay parent-owned. HD controls/previews/storage live in HDPhotosSection;360 shell lives in VirtualToursSection, while tour rows/navigation remain in AddProperty. Source/test review passed; this fields-only pilot still needs browser appearance/native-focus acceptance.

## Profile protection

The parent [saved-search integration tests](../../frontend-react/src/pages/ProfileSettings.integration.test.jsx) cover actions, exact payloads/replay, timing/rollback and tab-state retention. The [appointments/favorites characterization tests](../../frontend-react/src/pages/ProfileSettings.panels.test.jsx) cover original status/default/type/navigation contracts, cancellation confirmation and pending/success/failure removals with actual extracted modules. The existing [motion-backed test](../../frontend-react/src/pages/ProfileSettings.test.jsx) remains in use. Matching synthetic before/after panel screenshots and computed styles are private evidence; see the [checkpoint](../phase6-checkpoint.md) for actual results and limits.

## HD photo presentation

[HDPhotosSection.jsx](../../frontend-react/src/components/property/create/HDPhotosSection.jsx) owns High-Definition Photographs, hidden upload input/label, previews/PRIMARY/remove buttons and HD Storage Used/progress styles. Parent owns files/URLs, compression, upload/removal/cleanup and storage calculations; callbacks are forwarded unchanged. No shared-button/token or lifecycle changes. Browser appearance/focus acceptance is pending;360 rows and navigation remain parent-owned.

## 360 tour presentation

[VirtualToursSection.jsx](../../frontend-react/src/components/property/create/VirtualToursSection.jsx) owns the360 upload/heading/help text/storage meter and original outer styling. Parent AddProperty supplies original conditional rows as children:360 preview image URL creation, room label inputs and row remove buttons/styles remain there. Upload/state/metadata/removal/calculation logic remains parent/hook-owned. Browser appearance/focus has not been newly verified.

## Review & Publish

[ReviewPublishStep.jsx](../../frontend-react/src/components/property/create/ReviewPublishStep.jsx) owns Step4 summary/edit buttons, buyer card preview, activation fee display, Back to Specs & Photos and Proceed to Payment markup/classes/loading/disabled display. Parent goToStep/handleSubmit callbacks are forwarded unchanged; state, validation, actual submission/payment authority remain in parent/hook/backend. Display formatting and fallback expressions are copied exactly. No new browser/focus verification is claimed.

## Agent Dashboard KPI cards

[AgentKpiCards.jsx](../../frontend-react/src/components/dashboard/AgentKpiCards.jsx) is the local markup/color owner for Portfolio Value, Property Listings & Status, Client CRM Pipeline and Real Impressions & Views, including pending badge/formatting. Parent Dashboard owns data/defaults and refresh. No token migration or interaction behavior change. Other Agent owners are listed below; no browser appearance check was newly performed.

## Agent overview and property controls

[AgentOverviewPanel.jsx](../../frontend-react/src/components/dashboard/AgentOverviewPanel.jsx): Open Kanban Board, stage distribution, View All, showcase cards/Add action, reputation and recent activity; original local styles stay here. [AgentPropertiesPanel.jsx](../../frontend-react/src/components/dashboard/AgentPropertiesPanel.jsx): property status filters, listing cards/status/image/price/view counts and View/Add Property actions. Dashboard retains setActiveTab/setPropertyFilter/navigate and filteredProperties. No filter/count/status/order correction or token migration. Browser visual checks remain unperformed.

## Agent CRM controls

[AgentPipelinePanel.jsx](../../frontend-react/src/components/dashboard/AgentPipelinePanel.jsx) contains archive/history, View Details, delete, appointment confirmation, stage selection, phone and chat markup/local colors. [AgentLeadDetailsModal.jsx](../../frontend-react/src/components/dashboard/AgentLeadDetailsModal.jsx) contains close/contact/source/notes/property/stage/delete/Direct Chat markup/local colors. Dashboard remains callback/state/API owner; original event ordering and fallbacks are retained. Browser appearance/focus checks remain deferred.

## Agent messaging controls

[AgentMessagesPanel.jsx](../../frontend-react/src/components/dashboard/AgentMessagesPanel.jsx) owns buyer selection, Call Buyer, reply input and Send markup/local styles. Dashboard owns callbacks, polling, draft, sending state and scroll ref. No token migration or browser visual verification.

## Seller KPI display

[SellerKpiCards.jsx](../../frontend-react/src/components/dashboard/SellerKpiCards.jsx) owns Portfolio Value, Live Listings, In Review, Total Views and Shortlisted markup/local colors. It receives loading/stats/formatLKR directly; no token migration or new interaction. Browser checks deferred.

## Seller listing/chat controls

[SellerListingsPanel.jsx](../../frontend-react/src/components/dashboard/SellerListingsPanel.jsx): View all, first listing, card status badges and View controls/local colors. [SellerConversationsPanel.jsx](../../frontend-react/src/components/dashboard/SellerConversationsPanel.jsx): Open Inbox, buyer inquiry rows/default text/local colors. SellerDashboard retains navigate and API/state ownership. Browser appearance/focus checks remain deferred.

## Buyer Quick Pulse cards

[BuyerKpiCards.jsx](../../frontend-react/src/components/dashboard/BuyerKpiCards.jsx) owns Scheduled Tours, Saved Shortlist, Search Radars and Messages markup/local colors/click expressions. handleTabChange and navigate remain BuyerDashboard-owned. Native clickable divs are preserved; no accessibility redesign or token migration in this batch.

## Buyer tab controls

[BuyerAppointmentsPanel.jsx](../../frontend-react/src/components/dashboard/BuyerAppointmentsPanel.jsx): tours/details/contact and cancel controls. [BuyerFavoritesPanel.jsx](../../frontend-react/src/components/dashboard/BuyerFavoritesPanel.jsx): shortlist/removal/property actions. [BuyerSavedSearchesPanel.jsx](../../frontend-react/src/components/dashboard/BuyerSavedSearchesPanel.jsx): delete and Run Search Radar. Original markup/styles/status/fallbacks and event expressions retained; actual API mutations/routing remain BuyerDashboard-owned. Browser checks deferred.

## Buyer planner/checklist controls

[BuyerMortgagePanel.jsx](../../frontend-react/src/components/dashboard/BuyerMortgagePanel.jsx) owns price/downpayment/tenure/interest controls and loan outputs/local styles. Original Number event coercions and ranges preserved. [BuyerDueDiligencePanel.jsx](../../frontend-react/src/components/dashboard/BuyerDueDiligencePanel.jsx) owns checklist text/clickable cards/local styles. Parent owns setters/toggle and persisted tab state. No formula/content/accessibility redesign or style-token changes. Browser checks deferred.

## Admin rejection controls

[RejectModal.jsx](../../frontend-react/src/pages/admin/components/listings/RejectModal.jsx) owns rejection reason/Cancel/Confirm Rejection and local styling. Trim is only a validity gate; original raw reason is forwarded. Parent owns actual rejection request and notifications. Existing local state resets on conditional remount.

## Final Admin/property controls

Admin ListingDetailsModal owns photo/clipboard/inspection approval/rejection controls; ListingsOverview owns search/status filter/table/Inspect/Delete. Existing page handlers remain request authorities. PropertyCriticalDetails owns Manage/Contact/Save/Share and original local colors; PropertyComparisonSidebar owns Compare. Parent owns user/favorite/compare state and original callbacks. No new token migration or changed native controls. Browser appearance acceptance remains separately outstanding.
