# Thirasara manual localhost E2E plan

## Setup

- [ ] ENV-01 Record branch, commit, browser and date. Confirm Node API and Go map service both target the existing hosted ThirasaraDB before any write. Confirm appointment-owner schema and role-request RPC prerequisites from the Phase 7 rollout docs.
- [ ] ENV-02 Start the Node API and React frontend with npm run dev in their respective directories. Start Go with go run . in go-map-service. Follow README Development for dependencies and configuration.
- [ ] ENV-03 Open http://localhost:5000/health/ready and http://localhost:5173. Confirm backend readiness and map data through the UI (Go default port 8080).
- [ ] ENV-04 Use fresh identities U1 (registration then Buyer and Seller upgrade), B2 (independent Buyer), G1 (fresh Agent applicant), and an authorized test Admin A1. Keep separate browser profiles for concurrent handoffs. Use additional disposable applicants for rejection tests. Record aliases and fixture IDs only.
- [ ] ENV-05 Check availability of test email, OAuth, private Storage, AI and PayHere sandbox with callback. Mark affected cases Blocked if their dependency is unavailable.

## Common User and guest

- [ ] CU-01 Visit home, navigate header/footer, check theme and mobile menu. Refresh and check the selected theme.
- [ ] CU-02 Search and filter public listings, visit Buy/Rent, open map, move/zoom and select a pin. Compare card, pin and listing details. Clear filters and check empty results.
- [ ] CU-03 Open a public property and exercise photos, HD gallery, tour and available contact/compare actions. Confirm the right property remains selected.
- [ ] CU-04 Search agents, open a profile and check listed properties and contact/booking entry points. Confirm guest prompts where sign-in is required.
- [ ] CU-05 Register U1. Check required fields, invalid input, duplicate email and successful completion with the expected role and landing page.
- [ ] CU-06 Check invalid and valid login, refresh, sign-out and return to a signed-in page. Verify session and visible navigation match the current account.
- [ ] CU-07 Request a password reset using the test inbox. Check invalid/expired link, successful reset and sign-in with the new password. Verify older test sessions are revoked.
- [ ] CU-08 Test each configured social provider shown on login, including cancel and return. Verify the correct identity and role.
- [ ] CU-09 Open profile and test personal details, avatar upload/replacement, invalid inputs and persistence after refresh.

## Buyer

- [ ] BY-01 Check dashboard overview/KPIs against the actual shortlist, searches and appointments. Exercise each dashboard and profile entry point.
- [ ] BY-02 Add/remove favorites and compare multiple properties. Verify shortlist, detail and dashboard agree after refresh. Recheck after Seller/Admin unpublishes a fixture.
- [ ] BY-03 Save a filtered search, reopen it and compare filters/results. Exercise visible edit, alert and delete controls and check persistence.
- [ ] BY-04 Run mortgage/EMI and map feasibility tools with valid, boundary and invalid inputs. Verify results update with inputs. Save/reopen where offered.
- [ ] BY-05 Use due-diligence checklist, toggle items and reopen the view to check persistence. Exercise AI and price analytics wherever exposed and verify results match inputs or a clear unavailable state.
- [ ] BY-06 Send a property inquiry and a message as B2. Verify correct thread, unread state, attachment delivery and reply after refresh on both sides.
- [ ] BY-07 Book an agent appointment and check duplicate/conflicting slot behavior. Verify buyer and agent agree on property, slot and status through confirmation, any reschedule offered and cancellation.
- [ ] BY-08 Submit Seller upgrade as U1, check pending state and duplicate submission behavior. Hand off to AD-03, then verify Seller access after the app refreshes role state.

## Seller

- [ ] SE-01 Check Seller dashboard overview, panels and KPI totals with empty and populated fixtures.
- [ ] SE-02 Walk all Add Property steps. Exercise category-specific pricing, location/map pin, specifications, media (including HD/360 where offered), back/next and Review & Publish. Verify validation and that review matches entered values.
- [ ] SE-03 Exercise PayHere sandbox success, cancel and decline. Check retry and payment/order state after refresh. Verify Paid only follows backend confirmation and check receipt delivery when configured.
- [ ] SE-04 Follow the listing through submission, Admin moderation and public discovery. Compare title, location, price, media and status in My Properties, Admin, search, map and listing detail.
- [ ] SE-05 Edit a listing and update/remove media. Exercise available listing status controls and deletion on disposable records. Verify persistence and public visibility at each state.
- [ ] SE-06 Check inquiries/messages from B2, reply and verify updates on both accounts. Check dashboard counts after each operation.

## Agent

- [ ] AG-01 Create G1, complete the Agent application and check pending behavior. Hand off to AD-03 and verify the expected access after approval or rejection.
- [ ] AG-02 Update Agent profile and verify public directory/profile content, visible property associations and saved changes after refresh.
- [ ] AG-03 Compare Overview & Pulse counts with actual fixtures. Exercise Properties Command controls exposed to the Agent.
- [ ] AG-04 Receive B2's inquiry/booking in Client Pipeline & CRM. Move a disposable lead through New, Contacted, Showing, Offer and Closed. Verify status persistence, counts and available lead detail/notes controls.
- [ ] AG-05 Work through the booking actions shown in the Agent UI and verify the matching Buyer state after each action.
- [ ] AG-06 Open Unified Live Chat, reply with text and allowed media, switch conversations and return. Check correct recipient, unread state and persistence on both accounts.

## Admin

- [ ] AD-01 Sign in through /admin/login. Check invalid login, sign-out and normal-user access to the Admin route through the browser.
- [ ] AD-02 Compare Dashboard cards and Analytics filters/totals with known fixtures.
- [ ] AD-03 Review Seller and Agent applications. Exercise approve/reject with separate fixtures and verify persisted status and the resulting user navigation/access.
- [ ] AD-04 Use Listings search/filter and open the Seller fixture. Exercise moderation actions shown, refresh and confirm that the matching public and owner views reflect the new state.
- [ ] AD-05 Use Users search/filter/detail and supported account actions with test accounts. Check the affected account and audit record after each action.
- [ ] AD-06 Inspect Messages and Inquiries with B2 fixtures. Verify filters, details and available actions reflect the right conversation or inquiry.
- [ ] AD-07 Exercise Reports filters and export. Open the file and compare headers, values and row counts with the chosen filters.
- [ ] AD-08 Inspect Settings and verify current values. Record shared settings write cases separately for a controlled run.
- [ ] AD-09 Check Audit Logs filters and confirm expected entries for tested Admin writes.

## Coverage and exit

- Walk every menu, tab, dialog, form, state and action in each role before closing it. Split grouped cases into suffixed cases as controls are inspected and append cases for uncovered features before marking the role complete.
- For each write check the saved state after reload and the receiving role's view where applicable. Exercise empty, validation, cancel and retry states when the UI exposes them.
- Record Pass, Fail, Blocked or Needs change per case in the run log. Capture the user's observed result separately from requested behavior. Keep testing through all roles before implementing feedback.
- Final acceptance includes rechecking fixes and verifying a repeatable localhost startup. Carry outstanding Phase 7 setup or integration blockers explicitly into the handoff.
