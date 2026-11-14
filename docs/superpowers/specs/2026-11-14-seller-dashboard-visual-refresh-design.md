# Seller Dashboard visual refresh — 2026-11-14

## Approved functional scope
Preserve every existing detail, label, count, chart series, date range, loading/empty/error state, conversation, listing, button destination, unread behavior and permission check. No new features, API calls, dependencies, component replacements or data changes. Keep existing React component boundaries and props. Changes are limited to presentation classes and a dashboard-scoped stylesheet. Shared Navbar behavior and global styling remain intact.

## Recommended direction: restrained property workspace
Warm off-white canvas, white surfaces, charcoal typography, fine neutral borders and a single restrained brand-blue action accent. Semantic green/amber/red stay limited to actual status indicators. Remove decorative rainbow icon containers and gradients. Use the existing locally hosted Geist font with tabular metric figures. Modest corners and almost-flat shadows replace inflated card styling.

Header retains its current content and actions but participates in normal document flow so it cannot cover KPI details. Five existing KPI cards read as a coordinated summary strip with larger values and quieter labels. Preserve current grid breakpoints. Weekly activity remains the dominant left column, with existing dates, bars, legends and summaries. The right column retains both posting shortcuts, Buyer Conversations, checklist and review information. Give shortcuts neutral surfaces and clear hover/focus feedback. Listing rows remain compact and readable.

Dark mode receives equivalent charcoal surfaces, legible neutral text and visible borders. Existing responsive content remains usable; a broader mobile redesign is outside this task.

## Alternatives considered
- Brand-blue workspace: retain more blue-tinted surfaces and buttons; familiar but less restrained.
- Dark editorial dashboard: charcoal-led presentation in both themes; stronger visual impact but a larger departure from the current product.

## Verification and finish
Run existing dashboard and Navbar regression tests, ESLint, production build and diff checks. Verify that code changes contain no data, handler, conditional, endpoint or calculation changes. Inspect rendered light/dark desktop layouts where runtime access permits, including empty and populated states. Record limitations honestly. Provide explicit staging and commit commands for the user to run after review; include the completed UI refresh, pending authorized Seller fixes and run log. Exclude private runtime evidence. The user performs the commit. Do not push.

## Design review
No new functionality, labels or fabricated metrics. No component restructuring. User approved this design on 2026-11-14.

