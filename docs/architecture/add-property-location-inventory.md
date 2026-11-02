# AddProperty Spatial Location inventory — 2026-11-01

Initial read-only Step2 inventory followed the verified Category & Price extraction. The approved LocationStep extraction is now locally verified. See [overall wizard inventory](add-property-inventory.md), [approved design](../superpowers/specs/2026-11-01-add-property-location-design.md) and [implementation plan](../superpowers/plans/2026-11-01-add-property-location.md).

## Actual owners and controls

| Item | Current owner / contract |
| --- | --- |
| Nearby Town / City; Full Address | [LocationStep.jsx](../../frontend-react/src/components/property/create/LocationStep.jsx); raw native name/value events go to [usePropertyForm.handleChange](../../frontend-react/src/hooks/usePropertyForm.js) |
| Single Pin Location | LocationStep inline click forwards parent setters: set mode point, then clear boundary; does not clear gpsActive |
| Draw Boundary Polygon | LocationStep inline click forwards mode setter only; retains current boundary and gpsActive |
| My GPS | Parent handleGetGPS; success stores coordinates, sets GPS active, switches to point and clears boundary; failure alerts and clears GPS active only; unsupported browser alerts without another state change |
| Map, tiles, marker and geometry | Parent MapContainer JSX; top-level MapClickEvents and customIcon |
| Point map click | Functional form update of latitude/longitude, then clears GPS active; preserves other form values |
| Boundary map click | Functional append of [latitude, longitude]; no deduplication or GPS flag update |
| Hint and Clear Boundary | LocationStep; boundaryCount is parent raw array length; Clear appears only in boundary mode with at least one point and clears only the array |
| Previous Step; Continue to Specs & Photos | LocationStep markup forwards parent prevStep/nextStep, unchanged native click event, validation and scroll behavior |
| Mode, boundary, coordinates and form values | Existing usePropertyForm state; gpsActive and currentStep stay parent-owned |

The original motion root has three direct element children: address fields, mapping panel and navigation. All styles/labels/native types remain local. The map wrapper is h-80 with its existing overflow, overlays and z-index; no shared-button/token conversion is included.

## Behavior that must not be normalized

- City is visually marked required, but either trimmed city or trimmed full address satisfies the current location validation. Both blank/whitespace fails first.
- Boundary validation discounts a duplicate closing endpoint once, then requires a count of three. It is not a full unique-vertex/area validator; do not replace it with Set-based validation or geometric repair.
- Map center uses latitude ||6.9271 and longitude ||79.8612 independently. Point marker rendering requires both coordinates truthy. Numeric zero and string zero therefore differ; preserve their current display and payload behavior.
- Polygon renders at raw length three, independently of the later closed-endpoint validation. Circle keys remain indices and coordinates remain [lat,lng]. WKT conversion/closure and submission remain in the unchanged hook.
- Mode buttons do not reset GPS highlighting. Switching to boundary can leave GPS active; selecting point clears boundary but keeps GPS active. A point map click clears it. Preserve these current rules.
- Installed react-leaflet5.0.0 MapContainer creates the Leaflet map in its stable ref callback and applies center/zoom on initialization. It removes the map on unmount. No recenter helper, changing key, dynamic component definition or new effect may be introduced. Prop changes must not be described as proof that the actual map pans.
- Leaving Step2 currently unmounts the map; returning mounts it again while hook-held field/boundary state persists. Preserve both in-step identity and normal step-navigation cleanup.

## Why the existing LocationPicker is not reused

[LocationPicker.jsx](../../frontend-react/src/components/property/LocationPicker.jsx) is a different implementation: zoom7 rather than14, different wrapper/controls/labels, GPS flag resets on mode changes, different marker zero checks and polygon rules/styles. Its point click also does not clear the GPS flag as this wizard does. Its current identity test covers that component only. Replacing the wizard map with it would change behavior; neither this component nor its test is modified by this inventory.

## Baseline and accepted protection

Fresh three-file wizard/hook/CategoryPrice baseline:24/24 pass,13.31s. Existing tests cover ordered town/boundary feedback, GPS success reaching mocked multipart submission, retained fields/district coordinates and hook WKT/zero/draft behavior. Their map boundary is mocked; useMapEvents does not dispatch clicks. They do not establish actual wizard map-event lifecycle, marker/circle/polygon updates, GPS failure/unsupported behavior, raw closing-endpoint counts or real Leaflet identity.

Before extraction, [AddProperty.location.test.jsx](../../frontend-react/src/pages/AddProperty.location.test.jsx) added five actual-parent scenarios with real hook/unmocked presentation and controlled map/API/payment/GPS boundaries. Strengthened final characterization passed29/29 on original and extracted source, including address-only success, richer remount retention and boundary/mode/Clear identity assertions after review corrections. Existing submission tests remain unchanged. Final aggregate224/224 across32 files, lint/build and both reviews passed.

Separate browser evidence used installed real MapContainer/useMapEvents with source-derived original/current panels, local imagery/icons and synthetic GPS. Thirty-two DOM/value/geometry/36-selected-style comparisons, four banner checks,24 native map/lifecycle observations and26 keyboard/hover comparisons matched. Actual map identity stayed stable through in-step changes, unload occurred on exit, and a new instance initialized from retained coordinates on return. No recenter behavior was added.

Final36 settled native JPEG panel pairs have identical decoded pixels. Initial mobile raster differences and all diagnostic reports remain private; the last two mobile states were recaptured after the same native map focus/blur interaction in each version. Imagery changed from local SVG to PNG during diagnosis, and no product/CSS/animation masking or tolerance was used. This is isolated real-map/presentation evidence, not authenticated wizard E2E or live geolocation/tile/API/payment verification.

Private original source/hash/AST/proofs/test JSON and browser artifacts: docs/evidence/phase6-spatial-location. Parent31 statements, top-level helpers/constants, literal map subtree and hook bytes remain unchanged. No dependency/environment/git mutation occurred. Specs & Photos and Review & Publish remain separate later batches.
