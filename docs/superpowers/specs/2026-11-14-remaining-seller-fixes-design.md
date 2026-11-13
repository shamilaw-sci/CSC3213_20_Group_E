# Remaining Seller E2E fixes

## Existing behavior corrections

Require a valid Sri Lankan contact number before leaving Category & Price and at final submission. Reject negative/non-integer bedroom/bathroom counts and invalid area values in both browser and server validation. Preserve valid optional empty and zero values where supported.

Center the Leaflet map on returned GPS position immediately. Clear obsolete upload-specific errors after successful photo or panorama upload. Replace panorama count alerts and listing delete confirmation with consistent in-app feedback/dialog controls. Keep cancel, saving lock and error recovery behavior. Use readable price-overlay contrast across photos/themes.

## Weekly engagement data

Current storage has cumulative views, with no historical per-day view records. Recommended design records view events from rollout onward without visitor identifiers. A Seller-scoped endpoint aggregates daily views and new property inquiries for the last seven Sri Lankan calendar days and compares the preceding seven days. Show zero/no-data states and truthful comparison when a prior period is zero. Replace fixed growth and High Demand text with recorded counts/calculated summaries. Exclude archived listings from active inventory analytics. No historical per-day values are invented from cumulative counts.

Alternative is removing the mock chart and showing an unavailable-history state until time-series tracking is introduced. This avoids schema work but does not provide weekly analytics.

## Rollout and verification

Tracking requires owner-applied additive SQL. Finish implementation/tests and provide reviewed SQL before manual acceptance. Reuse existing view increment path atomically with event recording, ensure it only counts visible listings, and keep event writes server-controlled. Do not include account/contact/IP/card data in events. Test ownership isolation, date boundaries, zero comparison periods and invalid form/upload recovery. Mobile remains deferred.

## Approval

User approved weekly tracking schema and semantics on 2026-11-14. Existing bug corrections follow observed expected test behavior.

