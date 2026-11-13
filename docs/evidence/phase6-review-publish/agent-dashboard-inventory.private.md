# Agent dashboard inventory (private)

Read-only source review, 2026-11-01. No implementation, tests, server, git, or real API actions performed. Complete `frontend-react/src/pages/agent/Dashboard.jsx` reviewed; coverage below is source inventory, not a passing-test claim.

## Ownership and callers

`AgentDashboard` is the sole dashboard owner: no dashboard-specific child modules currently exist. It imports shared Navbar/Footer, auth, router navigation, API adapter, toast and lucide icons. `PIPELINE_STAGES` is a file-local five-stage constant (New, Contacted, Showing, Offer, Closed).

`App.jsx:45,93` lazy-loads it at `/agent-dashboard` inside ProtectedRoute allowing AGENT/PENDING_AGENT/REJECTED_AGENT. The page's own effect allows AGENT/ADMIN and sends all others to `/profile`. Therefore pending/rejected agents reach the page then redirect, while ADMIN is stopped by the real outer route. Preserve this existing mismatch during presentation extraction. ProtectedRoute separately owns auth loading, unauthenticated `/login`, and denied-role `/` navigation.

Navigation callers found: Login password/social success, shared layout Navbar desktop/mobile, legacy `components/Navbar.jsx`, AgentProfile own-profile action, profile AgentProfileSettings/SecuritySettings, PropertyDetails agent management action, and usePayhere delayed outcome navigation. They link to the route; none supplies dashboard props. Login integration tests use a placeholder destination, not this dashboard.

| Region | Controls and owner dependencies |
| --- | --- |
| Always-visible shell | Dashboard owns loading spinner; identity/license/agency header; Add Listing (`/add-property`), Public Profile (`/agent/${user.id}`), refresh (`fetchDashboardData(true)`, disabled by refreshing); Navbar/Footer remain shared modules. |
| Alert ribbon | Pending count opens properties AND sets pending filter; pipeline.New opens CRM. |
| Four KPI cards | Pure display of portfolio value, active/pending counts, properties.length, total leads/conversion, pipeline.Closed and total impressions. |
| Tab bar | overview, pipeline, properties, messages; dashboard owns activeTab (initial overview); labels use totalLeads and properties.length. |
| Overview | Stage distribution (pipeline/totalLeads) opens CRM; first four properties in server order (no local ranking), View All opens properties, empty state adds listing; reputation avgRating/reviewCount; activity list. |
| Pipeline | Dashboard owns hideArchivedClosed; hides Closed cards but retains column/count and can restore history. Filters leads by status (missing status means New). Lead cards open dossier via identity/detail/source/note/property; delete; confirm appointment (New + lead_source => Showing); stage select; tel link; open chat sets selectedLead and messages tab. |
| Properties | Dashboard owns all/approved/pending filter; counts combine properties.length and stats counts; filtered property cards navigate to `/property/:id`; empty state adds property. Non-approved cards display pending styling. |
| Messages | Every lead becomes a selectable conversation, including direct bookings; dashboard owns selectedLead, messages, draft and send flag. Header/contact, sender alignment via msg.sender_id === user.id, messagesEndRef and form all live here. |
| Dossier modal | Dashboard owns selectedLeadDetail; close, tel/mail, source/date/notes fallbacks, property navigation, stage update (handler plus immediate modal state update), delete, Direct Chat (select lead, close dossier, switch tab). Not a separate route. |

## State, requests and lifecycle risks to preserve

- UI state: activeTab, propertyFilter, selectedLeadDetail, hideArchivedClosed. Chat state: selectedLead, chatMessages, messageInput, sendingMsg plus messagesEndRef. Data state: stats, leads, properties, loading, refreshing. Derived defaults/filtering remain in render; no memoized selectors or independent stores.
- Mount/user/navigation effect validates role then invokes dashboard fetch. Fetch starts three concurrent GETs: `/agents/dashboard-stats`, `/agents/leads`, `/properties/my-listings`. Promise.all is all-or-nothing; success commits stats, leads, refreshes the open dossier by id (or closes it), then properties. Failure toasts/logs; finally clears both flags. No abort, generation guard, or request serialization; overlapping refresh/mutation refreshes can settle out of order and an older request can clear flags early. Non-silent fetch hides the whole loaded UI; silent refresh preserves it.
- selectedLead effect immediately GETs `/conversations/${id}/messages` and polls every 4 seconds, independent of activeTab. Each success replaces messages and schedules smooth scroll after 100ms. Cleanup clears interval and only the latest recorded timeout. In-flight responses are not cancelled/guarded; old lead responses can populate a newly selected conversation, and post-cleanup responses can schedule scrolls. SelectedLead object is not refreshed/reconciled after dashboard refresh or deletion. Leaving the messages tab retains selection, draft, messages, and polling.
- Send prevents default, ignores empty/no-selection/already-sending, trims and clears draft before POSTing FormData body; then GETs that captured conversation's messages, replaces messages and schedules an untracked 100ms scroll. Failure toasts without restoring draft; finally unlocks. Lead switching/polling may race with send GET; send timeout has no cleanup.
- Stage change snapshots prior status, optimistically updates leads, PUTs `/agents/leads/:id`, toasts and launches an unawaited silent dashboard refresh. Failure rolls back leads and matching open dossier then also refreshes. Modal separately optimistically changes its own snapshot. No per-lead mutation lock; concurrent operations and refreshes can overwrite newer state. Extraction must retain event ordering/arguments and dossier reconciliation.
- Delete first asks window.confirm, DELETEs `/agents/leads/:id`, filters local leads, closes matching dossier, toasts and launches silent refresh. Failure preserves current state and uses response message fallback. It does not clear selectedLead/chat. Confirmation, mutations, toasts and navigation should remain dashboard-owned.
- Existing rendering assumptions include numeric avgRating for toFixed, locale formatting, exact server property order, absent pipeline defaults vs partial pipeline objects, and dynamic stage color classes. Do not normalize, sort, alter defaults or fix these in a structural slice.

## Existing coverage and limits

`Dashboard.integration.test.jsx` mocks auth/API/toast/Navbar/Footer and mounts the page directly in MemoryRouter (bypasses real ProtectedRoute). Source covers both direct and conversation lead fixtures, successful card stage updates plus reload and dossier visibility, failed card stage rollback, failed modal stage rollback, mutation+refresh rejection rollback, delete cancellation/failure/success with dossier closure, unauthorized null/BUYER/PENDING_AGENT/REJECTED_AGENT/BANNED redirects without API requests, and initial load failure recoverable with refresh. Fixtures have empty listings and minimal stats; no API post mock or conversation success fixture. Its first test title mentions source notes/contact details more broadly than its explicit assertions (buyer names, property titles, stage values and guest dossier note).

No direct assertions cover overview/KPI data formatting, populated properties/filtering, tab persistence, alert actions, reputation/activity, chat send/poll/scroll cleanup/races, direct-booking chat viability, overlapping dashboard fetches/mutations, route/page role mismatch, ADMIN page mount, or full Navbar/Footer integration. `Login.integration.test.jsx` covers auth route allowances/session restoration with placeholder destinations, not dashboard effects; `usePayhere.test.jsx` checks dashboard navigation outcomes, not dashboard rendering. These tests cannot establish backend authorization or real endpoint correctness. No tests run for this inventory.

## Lowest-risk first presentation seam (candidate only)

Extract only the always-visible four-card KPI strip (current Tier 1 region, approximately Dashboard.jsx:315-415) into one stateless presentation module. This is a small internal seam, not a proposed new deep orchestration module: it earns locality for the repeated card markup while avoiding tabs, async ownership, event composition, timer/ref lifecycle and modal state. It provides more useful structural scope than extracting a single reputation card, while remaining lower risk than a whole tab.

Exact candidate props, passed from existing dashboard-derived values without new normalization:

- `totalPortfolioValue` = existing `stats?.totalPortfolioValue || 0`
- `activeListingsCount` = existing `stats?.activeListingsCount || 0`
- `pendingListingsCount` = existing `stats?.pendingListingsCount || 0`
- `propertiesCount` = existing `properties.length`
- `totalLeads` = existing `stats?.totalLeads || 0`
- `conversionRate` = existing `stats?.conversionRate || 0`
- `closedDealsCount` = existing `pipeline.Closed || 0`
- `totalImpressions` = existing `stats?.totalImpressions || 0`

Module-local imports would be React as required by project JSX convention and DollarSign/Home/Users/Eye icons. Keep existing text, class strings, wrappers, conditional pending badge, formatting and placement exactly. No callbacks, hooks, API/auth/router/toast imports, raw stats object, lead objects, timer or refs needed. Parent retains all derivations, state, requests, handlers, effects, stage constant and loading branch. Existing tests offer indirect smoke coverage only for this region; any future verification must specifically check representative KPI values/zero defaults and pending visibility without claiming the present tests already do so.
