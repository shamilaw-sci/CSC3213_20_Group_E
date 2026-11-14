# AddProperty wizard inventory — 2026-11-01

Initial6C inventory recorded a1264-line page with31 non-render statements. All four presentation seams are now implemented; parent retains map/tour rows, state/handlers and motion roots. Later browser checks remain deferred. Detailed implementation evidence is linked below.

## Entry points and ownership

| Responsibility | Current owner |
| --- | --- |
| /add-property route | [App.jsx](../../frontend-react/src/App.jsx), ProtectedRoute allows SELLER/AGENT |
| Current step, progress/navigation, validation and message placement | [AddProperty.jsx](../../frontend-react/src/pages/AddProperty.jsx) |
| Step1 inputs, category-card rendering, listing-type display and Continue presentation | [CategoryPriceStep.jsx](../../frontend-react/src/components/property/create/CategoryPriceStep.jsx), stateless fragment under the original parent motion root |
| Four category IDs/titles/descriptions/icons and order | [propertyCategoryOptions.js](../../frontend-react/src/components/property/create/propertyCategoryOptions.js) |
| Form values, location/boundary/media/draft/loading/message state | [usePropertyForm.js](../../frontend-react/src/hooks/usePropertyForm.js) |
| Category field resets, district→coordinates, GPS | AddProperty handleTypeSelect/handleDistrictChange/handleGetGPS |
| Image compression/object URLs/removal/unmount cleanup | AddProperty handleImageUpload/removeImage/previewUrlsRef effects |
| Tour validation/files/room metadata/removal | AddProperty tour handlers; hook owns state |
| WKT/multipart/create/draft retry/payment invocation | usePropertyForm handleSubmit; existing [usePayhere.js](../../frontend-react/src/hooks/usePayhere.js) |
| HTTP create | POST /properties via api → [server.js](../../backend-node/server.js) /api/properties mount → [propertyRoutes.js](../../backend-node/routes/propertyRoutes.js) → existing upload/validation/controller chain |

The create route retains protect, multipart upload fields, validation and controller order. This inventory does not modify or exercise a real backend, account, upload or payment.

## Four existing steps

| Step | Source area at inventory | Visible controls | Protected contracts |
| --- | --- | --- | --- |
|1 Category & Price |468–626|Four asset cards; title, price, optional Month/Year, district, phone, listing-type display, Continue|Type-dependent resets/placeholder/period/preview; title→price→district validation order; district coordinates |
|2 Spatial Location |633–773|City/address; point/boundary modes; GPS; Leaflet map/markers/polygon; boundary clearing; previous/next|Map mounting/identity, coordinate ordering/zero behavior, mode and boundary updates, distinct-point checks |
|3 Specs & Photos |780–1020|Type-dependent beds/baths/areas, description, HD images/previews/removal,360 files/room labels/removal, progress/previous/review|Limits, compression concurrency, object URLs/cleanup, aligned metadata, field retention |
|4 Review & Publish |1027–1254|Edit links, data/media summary, listing preview, fee, back/payment button|Existing fee display fallback, loading/disabled semantics, exact hook handoff; no draft/create/payment reordering |

These line positions are inventory references; named owners and maps are authoritative after extraction. All four motion roots and the outer container/stepper currently belong to the parent.

## Step1 contracts for the first pilot

- Exact categories/order/IDs: House, Land, Rent House, Rent Villa. Titles, descriptions and Home/Crosshair/Building2/Palmtree icons remain source-derived; cards remain clickable divs with existing keys/group-hover styles.
- handleTypeSelect sets listingType Rent only for Rent House/Rent Villa. Land clears bedrooms/bathrooms/houseSize; rental types clear landSize. Sale clears pricePeriod; rent keeps a truthy previous period or defaults Month. Unrelated fields remain intact.
- Title placeholders remain the original four type-specific strings and fallback. Hook handleChange preserves raw name/value strings; no coercion or validation moves into presentation.
- Price number input has no new min/max/step/required attributes. Preview retains original truthiness and formatter thresholds/rounding/locale/period behavior. Numeric0 and string0 are not normalized into one case.
- District list/order remains the existing25-item parent constant. Parent handler changes district plus mapped latitude/longitude, with its existing fallback.
- Contact is visually marked required but is not added to Step1 validation by this refactor. Continue keeps type=button and passes the original click event to nextStep; no disabled/loading behavior is added.
- Stepper validates the current step, not all intervening steps, and can jump ahead after current validation. Preserve its existing semantics and parent-owned messages/scrollTo.
- Continue uses hover:bg-blue-500, distinct from the Profile solid-action pilot's hover blue700. Do not reuse the new Profile class or migrate colors during JSX extraction.

## Existing coverage and gaps

Fresh existing tests:2 files16/16 pass in8.36s (wizard8, hook8). [AddProperty.integration.test.jsx](../../frontend-react/src/pages/AddProperty.integration.test.jsx) renders the actual page and usePropertyForm with controlled HTTP/payment/compression/map/GPS/auth dependencies. It covers ordered required-field checks, previous-value retention, photo handling/rejection/compression failure, a successful mocked multipart/payment handoff, create failure, draft retry and ordinary-photo unmount cleanup.

[usePropertyForm.integration.test.jsx](../../frontend-react/src/hooks/usePropertyForm.integration.test.jsx) covers missing-image/incomplete-boundary rejection, numeric-zero multipart fields/point WKT, polygon closure/lng-lat order, create failure and draft retry through the actual hook with mocked HTTP/payment boundaries.

Before extraction, [AddProperty.categoryPrice.test.jsx](../../frontend-react/src/pages/AddProperty.categoryPrice.test.jsx) added8 actual-parent scenarios using the real hook and unmocked presentation/options modules. They cover categories/placeholders/periods, field resets and retention through later steps/back navigation, representative previews and invalid prices, district coordinate handoff, raw field retention and existing Continue/stepper semantics without create/payment. The strengthened three-file suite passed24/24 before and after extraction. Full frontend acceptance passed219/219 across31 files; lint and production build passed.

Browser acceptance compared original-source and extracted presentation in a synthetic fixture:16 category/theme/viewport states plus10 desktop blank/zero/validation states;20 controlled-change/focus/hover observations;28 settled screenshot pairs matched exactly. The initial single-icon raster mismatch and its unchanged-source repeat are retained privately. This is presentation evidence, not a full authenticated wizard E2E test. HTTP/payment/map/GPS/compression remain controlled in tests; real Leaflet identity, SDK/payment behavior and App's role guard are not newly exercised. Motion is mocked in unit/integration tests and real in the isolated browser fixture.

Later Step3 needs explicit360 object-URL lifecycle characterization: current tour previews create URLs during render, while existing cleanup assertions target ordinary photos. Do not silently fix or generalize lifecycle behavior in this pilot.

## Implemented first extraction and remaining work

The first pilot moved Step1 inner markup and its static category objects. CategoryPriceStep returns a fragment under the unchanged parent m.div; propertyCategoryOptions owns the four exact objects. Source proofs confirm all31 parent non-render statements, retained top-level helpers/constants, exact category data and original inner markup with approved substitutions. The hook is byte-identical. See the approved design (development document archived locally) and implementation plan (development document archived locally). Step2 acceptance is recorded below; Specs & Photos inventory is next, with Steps3–4 still pending.

Step2 acceptance: [Spatial Location inventory](add-property-location-inventory.md) identifies [LocationStep.jsx](../../frontend-react/src/components/property/create/LocationStep.jsx) as the implemented controls/presentation owner, passing the unchanged parent map subtree as children. The approved design (development document archived locally) preserves31 parent statements/helpers and hook bytes. Focused29/29, full224/224, lint/build, reviews and isolated actual-map/visual checks passed. Specs & Photos and Review & Publish remain pending;360 URL lifecycle characterization belongs to the next Step3 inventory.

Step4 presentation now lives in [ReviewPublishStep.jsx](../../frontend-react/src/components/property/create/ReviewPublishStep.jsx), with original edit/submit callback owners and copied fee formatting. All four step presentation seams are implemented; map/tour rows intentionally remain parent-owned. New five-case original-parent characterization passed before extraction; focused45/45 and full240/240 pass. Later browser appearance/focus checks remain deferred rather than claimed.
