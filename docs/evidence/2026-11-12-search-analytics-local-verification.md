# Search and analytics local verification - 2026-11-12

Scope: VIS01, VIS02, VIS03 from the approved User/Buyer fixes design. Existing unrelated dirty changes preserved; no commits, pushes, hosted SQL or deployment.

## Diagnosis and changes
- Place searches could be narrowed by the mount viewport before their first response, and a subsequent place query could retain the previous viewport/results. New place queries now reset to country bounds, ignore premature viewport updates, discard stale results and focus only the current query. Saved polygon searches retain their own boundary/viewport.
- Empty coordinate strings previously focused the map at zero degrees. They are excluded.
- Building price comparisons could substitute land area for missing building floor area; coercion accepted booleans/tiny floor sizes. Building comparisons now require numeric floor area of at least 100 sqft. Land area uses the stored perches contract (272.25 sqft/perch). Malformed structured values are unavailable rather than guessed from free text.
- A single extreme price-per-area ratio could dominate the mean. A median ratio fence retains comparable values between one third and three times their median, with at least three retained samples required. Self comparisons are excluded. Existing same-type/listing-type matching remains.
- Both target and comparable per-sqft values are now visible without hovering over bars. Existing explicit illustrative-history wording and unavailable-data behavior retained.
- Apple sign-in already used an inline SVG in the existing dirty checkout; preserved without further changes.

## Evidence
- Watched four new analytics regressions fail before fixes, then backend priceInsightEngine + priceInsightValidation: 23/23 passed.
- Watched stale map bounds, premature mount bounds, empty coordinates and missing visible target-value regressions fail before fixes.
- Frontend useMapSearch + MapSearch.viewport + PriceAnalyticsDashboard: 16/16 passed.
- Focused ESLint for all six touched frontend source/test files: passed.
- Final frontend production build: passed; existing large-chunk and Lottie dependency eval warnings remain.
- git diff --check: passed (line-ending warnings only).

## Acceptance boundaries
Automated checks use fixture data and mocked map methods. Live map rendering/zoom, real stored floor-area quality, price cohort representativeness, Apple icon appearance and the reported example property still require the user's browser retest. A missing or invalid floor area may now correctly make price comparison unavailable. Median fencing is an explicit defensive heuristic, not a sale valuation model or a correction of stored records. Existing candidate selection ranks at most 200 approved rows before a 15-row similarity shortlist; this change does not establish geographically representative market coverage.

## Follow-up: save-search integration compatibility
- Replaced obsolete native prompt/alert assertions with the existing controlled dialog flow. Covered exact saved filters and cap, persistence-gated success, pending duplicate prevention, empty names, cancel, retained drafts and actionable errors.
- Removed generic aria-label overrides on map top buttons so their visible action labels are accessible names. Watched the accessible-name regression fail before the fix.
- MapTopBar integration: 7/7 passed; focused ESLint passed.

## Final follow-up: notification accessibility and remaining unit test
- Updated the remaining MapTopBar unit test to enter and submit the save dialog.
- After coordinated handoff, made Navbar notifications an actual button toggle with expanded state, closed popup visibility, Escape focus restoration and focus-leave dismissal. Appointment selection closes the popup. Tests now open the popup before selecting a real appointment.
- Watched two missing-toggle regressions fail before implementation.
- Final changed-tests run: MapTopBar unit + integration and Navbar bookings, 11/11 passed with maxWorkers=2.
- Focused ESLint passed; production build passed with existing chunk/Lottie warnings; final git diff --check passed (line-ending notices only).
