# Phase 6 Profile appointments/favorites implementation plan

> For agentic workers: execute the bounded approved Phase 6B design inline with executing-plans; root coordinates independent review. No git mutation.

**Goal:** Make appointments/favorites presentation discoverable while preserving every existing rendered and action contract.

**Architecture:** ProfileSettings retains all state, effects, initial requests, handlers and navigation. AppointmentsPanel/AppointmentCard and FavoritesPanel/FavoritePropertyCard own source-derived stateless JSX only. Parent direct keyed motion wrappers remain unchanged.

**Tech Stack:** Existing React, lucide-react, framer-motion, Vitest/Testing Library; no dependencies.

## Constraints and exact contracts

- Existing uncommitted saved-search pilot and tests remain intact. No backend/auth/env/db/config/global CSS/token/git changes. Private baseline source is docs/evidence/phase6-profile-appointments-favorites/ProfileSettings.before.jsx.
- AppointmentsPanel({appointments,onFindAgent,onViewAgent,onCancel,onMessage}); AppointmentCard({appointment,onViewAgent,onCancel,onMessage}). Parent onFindAgent() navigates /agents; onViewAgent(id) navigates /agent/id; onCancel(lead_id) calls unchanged handleCancelAppointment; onMessage() navigates /messages.
- FavoritesPanel({favorites,onExplore,onRemove,onViewDetails}); FavoritePropertyCard({property,onRemove,onViewDetails}). Parent onExplore() navigates /buy; onRemove(id) calls unchanged handleRemoveFavorite; onViewDetails(id) navigates /property/id.
- Appointment agent/agency/license derivations remain exact: assigned_agent; agent?.agent_profiles?.agency_name || 'Apex Realty Prime Lanka'; agent?.agent_profiles?.license_number || 'CEA-SL-2026'. Active or Attempted Contact => Confirmed by Agent; Closed => Tour Completed; every other status => Awaiting Agent Confirmation. Keep current badges/classes and animated dot. Date remains new Date(created_at).toLocaleDateString().
- Preserve agent avatar URL/encoded-name fallback, optional agent snippet/profile/phone link and absent-agent empty div. Keep lead_source fallback 'Scheduled Property Tour & Consultation', optional properties section and Number(price || 0).toLocaleString(). All appointment buttons keep type=button.
- Cancellation asks exact existing confirmation; false sends no request; true DELETE /agents/my-appointments/lead_id. Remove only after success and toast 'Appointment cancelled successfully'; failure retains row and uses response message || 'Failed to cancel appointment'.
- Favorite retains images?.[0] || 'https://via.placeholder.com/400x300'; price Number(price || 0).toLocaleString(); bedrooms/bathrooms || 0; land_size || 'N/A'; title/city/district text unchanged. Remove/details buttons keep omitted native type. Removal POST /favorites/id retains pending/failed row, removes after success with exact existing toasts.
- Keep card divs and original grid classes; move React keys from original card div to card component, lead_id/id unchanged. No new DOM wrappers or array defaults, no normalization, memoization or hooks.

## Task 1: Characterize original parent

- [x] Preserve source and inventory original JSX/handlers; run existing two profile files before edits.
- [x] Add only ProfileSettings.panels.test.jsx using actual parent and actual new modules when created; mock network/auth/layout/unrelated panels and motion as existing integration tests do.
- [x] Cover empty/existing CTA navigation, read failures, every appointment status/defaults/date/optional agent and property/actions, confirmation decline and pending success/rejection cancellation, favorite data/defaults/details and pending success/rejection removal. Check original button type attributes and no request from navigation.
- [x] Run new file and both old profile files before extraction; characterization must pass original behavior without product changes.

## Task 2: Source-derived extraction

- [x] Extract exact appointment/favorite inner panels/card JSX from preserved source, replacing only callbacks with declared props. Pure view derivations move with card; all parent non-render statements stay identical.
- [x] Wire parent under unchanged direct m.div keys appointments/favorites. Remove only newly unused lucide imports.
- [x] Run three focused profile files using node --max-old-space-size=512 --max-semi-space-size=4 node_modules/vitest/vitest.mjs run src/pages/ProfileSettings.test.jsx src/pages/ProfileSettings.integration.test.jsx src/pages/ProfileSettings.panels.test.jsx --maxWorkers=1 --pool=threads from frontend-react.
- [x] Run focused ESLint for parent/new test/four modules sequentially; compare parent AST non-render statements with preserved source, record exact count/result privately. Run git -c core.fsmonitor=false diff --check.

## Task 3: Root validation and handoff

- [x] Root reviewed implementation/spec with two independent reviewers;16 synthetic before/after base states and14 hover/16 focus comparisons matched. Maps/checkpoint record actual evidence and limits.
- [x] Root aggregate174/174 across27 files, full lint exit0, production build exit0. Owner retains all staging/commit/push; whole Phase6 remains in progress.

Approved design already covers this next bounded Phase 6B batch. Source-derived extraction was selected over moving state or redesigning markup to retain current contracts. New characterization tests intentionally pass before extraction; no artificial red test or renewed approval is required.

## Implementation evidence

Existing two-file baseline passed13/13 (9.72s). The24 new scenarios passed alongside the13 existing cases on original source:3 files37/37 (12.57s), then after extraction37/37 (12.54s). Focused six-file ESLint exited0. Babel parse/generate comparison confirms37 parent non-render statements before/after, identical; private result is docs/evidence/phase6-profile-appointments-favorites/parent-nonrender-ast.json. Final whitespace check uses git -c core.fsmonitor=false diff --check. Browser/full aggregate validation remains root-owned and pending at this implementation handoff.
