# Admin real-data completion plan

**Status:** Proposed; implementation has not started.
**Goal:** Remove misleading Admin defaults/claims and complete heatmap, boosts and reported-content flows with persistent data and usable UI.
**Architecture:** Existing Express Admin authorization -> validated controller -> focused repository -> Supabase. React consumes explicit data/loading/empty/error states. Successful mutations use existing audit recorder.
**Execution:** Inline, incremental phases. No commit/push or hosted mutations by assistant without existing authorization. Preserve current uncommitted Audit/Users/role-restoration fixes. User applies reviewed SQL. User requested manual testing rather than assistant-run tests: do not run automated tests/builds unless subsequently authorized. Manual acceptance is not inferred from source changes.

## Decisions proposed for approval

- Heatmap means aggregate search demand by district, not precise household/device locations. Show real recorded search counts and recording-start date; no fabricated historical demand.
- Boost means an Admin-controlled featured placement, not a payment, guaranteed exposure or relevance override. Only approved, paid, nonarchived listings are eligible. Preserve explicit user search filters.
- Reported content initially means property-listing reports submitted by authenticated users. Supported decisions: dismiss, or archive listing using existing soft-delete semantics. Do not invent support for chat/user complaints or irreversible deletion.
- New public submission and public featured placement are necessary to make Admin endpoints functional end to end. These are the only proposed extensions outside Admin.

## Phase 0: Confirm schema/contracts and preserve work

Files: existing Admin routes/API; docs/database baseline; current property/search controllers and Go routes; existing soft-delete SQL.

- [ ] Record git status; leave private runtime logs out of staging.
- [ ] Inspect hosted schema read-only to confirm actual property/user fields and existing search/promotion/report tables. Baseline alone does not prove hosted absence.
- [ ] Trace Home featured-listing and every Node/Go search entry point before selecting recording hooks. Identify duplicate search requests and cache behavior.
- [ ] Capture current response contracts for /admin/analytics/heatmap, /admin/boosts and /admin/reported. Extend explicitly; update callers together.
- [ ] Finalize separate additive SQL files per feature; include restricted grants/RLS and indexes. Do not expose service keys or internal notes publicly.

Acceptance: documented contracts, no existing unrelated data migration, user approves the business decisions above before feature implementation.

## Phase 1: Correct Reports and neutral fallback content

Modify backend-node/repositories/adminRepository.js getTransactionsDetailed; frontend-react/src/pages/admin/pages/ReportsPage.jsx and DashboardPage.jsx; relevant listing detail component.

- [ ] Add explicit property title and payer identity joins with narrow fields. Retained/archived transactions must remain visible; do not filter history out because the listing is archived.
- [ ] Normalize actual relation object/array shape and use stored payer data where available. Missing identity/title becomes Unavailable or Archived listing, never Verified Seller or an invented premium title.
- [ ] Remove fabricated TXN-AUTO identifier. Label transaction UUID separately from gateway payment ID.
- [ ] Empty average fee becomes unavailable (or zero with an explicit no-completed-transactions explanation). Divide completed revenue by completed count, not all attempts.
- [ ] Replace 100% Settled via Gateway with a description of recorded successful payment status; do not infer bank settlement from SUCCESS.
- [ ] Remove Standard Moderation Tier unless a real saved tier exists. Show actual currency rather than silently treating mixed currencies as LKR.
- [ ] Distinguish fetch failure from no transaction records; avoid displaying error as valid zero revenue.
- [ ] Dashboard missing location becomes Location unavailable. Remove unused invented seller fallback.

Manual acceptance: existing CSV/JSON totals remain matching; rows show actual linked titles/payers or honest unavailable state; archived paid fixture retained; empty/error states do not fabricate values.

## Phase 2: Truthful health, verification and analytics

Modify Topbar.jsx, DashboardPage.jsx, AnalyticsPage.jsx, adminAnalyticsController.js and relevant repository reads.

- [ ] Remove static System Online/Verified security badge, or replace with actual readiness state including unknown/unavailable and checked-at time. A ready API is not proof of immutable logs or overall security.
- [ ] Replace Verified Platform Users with Registered Users unless verified-account counts are explicitly queried.
- [ ] Remove survey-map automatic verification claim; describe actual submitted location information and manual moderation. Do not build an unrequested survey-government integration.
- [ ] Replace Live Sync with accurate refresh wording; current page loads once, not continuous synchronization.
- [ ] Separate donut arithmetic denominator from displayed total: zero stays zero and shows no-data state.
- [ ] Preserve explicit unavailable states on Analytics fetch failure instead of rendering credible zero metrics.
- [ ] Correct monthly revenue grouping to YYYY-MM keys so years do not merge. Normalize month boundary to Sri Lanka business timezone; cumulative user growth includes each registration exactly once.
- [ ] Check repository query errors before presenting Dashboard counts; query failure must not silently produce zeros.
- [ ] Document Settings missing-row 500.00 default as a configured default, matching checkout behavior; distinguish missing record from query error.

Manual acceptance: zero donut displays zero/no-data; month labels/totals reconcile to real transactions, including year boundary fixture where available; absent data is honest; no unsupported health/legal-verification claim remains.

## Phase 3: Complete search-demand heatmap

Create focused searchDemandRepository/controller/validator; replace getSearchHeatmap stub; extend AnalyticsPage and adminApi. Add reviewed schema only if no suitable table exists.

- [ ] Store aggregate daily district demand with date/district index. Recording uses valid submitted searches, not page-load views or replayed polling.
- [ ] Use server normalization and supported district allowlist. Avoid raw free-text queries, email, IP or precise coordinates in analytics storage.
- [ ] Integrate recording across actual Node/Go search pathways using one agreed event boundary and deduplication. Keep cache hits and normal search results functional; analytics failure must not break search.
- [ ] Bound date range (default last30 days, maximum366), normalize timezone, return district/count/window/tracking-start metadata. Missing data returns empty counts with explanation.
- [ ] Admin Analytics renders district demand with accessible table alongside visual density. Geo rendering must use known district geography, not fabricated coordinates.
- [ ] Apply Admin-only access to aggregate endpoint; protect recording against spam/double counting with appropriate rate limit/deduplication.

Manual acceptance: known test district search changes correct aggregate once, other districts unaffected, date filter works, no-data honest, ordinary searches unaffected and nonadmin cannot read Admin analytics.

## Phase 4: Complete boosts / featured placements

Create adminPromotionController/repository/validator; replace getBoosts/toggleBoost stubs; add BoostsPage, navigation and API contracts; extend public featured query.

- [ ] Persist property_id primary key, enabled, changed_by, changed_at in a restricted promotion table (or reuse verified equivalent). No synthetic revenue or new payment flow.
- [ ] GET supports bounded pagination, search and enabled filter; returns actual listing, eligibility and current persisted state.
- [ ] PATCH validates UUID and strict boolean; checks eligible property and confirms affected row. Missing/ineligible records return404/409, not success.
- [ ] Serialize eligibility checks with update where required. Repeating same desired enabled state is idempotent.
- [ ] Featured Home endpoint prioritizes enabled eligible records; normal ordering handles remaining real listings. Empty/error public featured state never falls back to fictional residences.
- [ ] Archived/rejected/unpaid listings never appear featured even if a historical boost row remains. Preserve listing ownership and financial history.
- [ ] Audit successful enabled-state changes with property target, and expose clear mutation errors/warnings in new UI.

Manual acceptance: enable eligible disposable listing, refresh persistence, verify real public featured placement, disable and verify removal of priority; reject/archive eligibility is enforced; unrelated listings/search filters unchanged; actor/target audit entry correct.

## Phase 5: Complete reported-content workflow

Create listingReportController/repository/validator, Admin ReportedContentPage and navigation; replace getReportedContent/resolveReport stubs; add authenticated Report listing action to property detail.

- [ ] Restricted persistent table: id, property_id, reporter_id, reason, status(open/dismissed/actioned), created_at, resolved_at, resolved_by, resolution_note. Index open reports/date and property. Reporter identity/internal note are Admin-only.
- [ ] Validate category/reason/length, reject unavailable targets and rate-limit submissions. Prevent duplicate open reports by same reporter/property.
- [ ] Submission is a complaint, not an automatic finding. Never automatically unpublish on submission.
- [ ] GET supports status/date/search/pagination with correct empty/error behavior and actual property context.
- [ ] Resolve accepts allowlisted dismiss or archive_listing decision, required bounded note, and expected open status. Reject unsupported action values.
- [ ] Archive action and report resolution commit atomically with existing soft-delete rules, preserving payment/chat history. Concurrent/double resolution returns confirmed existing outcome or409, never a second conflicting action.
- [ ] Dismiss leaves listing publication unchanged. Record resolver/time/decision and audit event; no fake success message before confirmed persistence.
- [ ] Detail UI requires explicit decision confirmation; cancel leaves both report and listing unchanged. Show already-resolved state after refresh.

Manual acceptance: submit one identified disposable report, Admin receives it, cancel preserves open state, dismiss preserves listing, second separate fixture archive removes public listing and retains history; invalid/double actions fail clearly; public/other users cannot inspect internal report data.

## Phase 6: Integration and handover

- [ ] Add truthful route titles, sidebar links and actionable empty states for new Admin pages.
- [ ] Ensure new mutation UI surfaces audit recording warnings; generic success must not hide a completed-write/audit-failure warning.
- [ ] Expand audit labels for new boost/report decisions, with real actor and target IDs; do not record credentials/full request bodies.
- [ ] Recheck role preservation after Ban/Unban and retain previously accepted Buyer/Seller/Agent flows. No purchase or unrelated record changes required.
- [ ] Perform source-wide follow-up search for mock/dummy/sample/fallback/success stubs; inspect matches rather than deleting legitimate defaults or form placeholders.
- [ ] User applies SQL then backend restart; guide manual cases one at a time and record actual evidence separately from proposed expectations.
- [ ] Document remaining limitations; offer automated regressions/build only if user changes the current no-assistant-tests instruction.
- [ ] Stage reviewed source/docs/SQL only; user handles commit/push as requested. Exclude runtime/private logs.

## Exit criteria

No fabricated Admin metrics or success-only stub mutations remain in scoped routes. New features are persistent, authorized, visible in UI and meaningful end to end. Every scoped manual acceptance passes or has an explicit unresolved status. No claim of exhaustive production/security verification without corresponding evidence.

## Scope boundary

Inspection found additional simulated property-history/AI labels in backend-node/controllers/analyticsController.js outside Admin, and fictional Home featured-residence fallback. The featured fallback is included only because boosts must drive genuine public placements. Broader Buyer AI/history cleanup is a separate follow-up, not silently marked complete here.
