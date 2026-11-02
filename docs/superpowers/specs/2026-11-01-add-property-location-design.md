# AddProperty Spatial Location extraction design

Status: owner approved2026-11-01; Step2 is implemented and locally verified. Step1 remains verified; this design covers only Step2 presentation. [Inventory](../../architecture/add-property-location-inventory.md) records contracts and acceptance; [implementation plan](../plans/2026-11-01-add-property-location.md) tracks execution. Owner retains all git actions.

## Goal and alternatives

Recommended: one stateless LocationStep presentation module, with the original map JSX supplied as children by AddProperty. It makes town/address, mode/GPS buttons, hint/clear and navigation easy to find while preserving the map's current code owner, component types, icon, event helper and handlers.

Alternative: move the entire map subtree/helper/icon into LocationStep now. That produces a shorter page but combines presentation extraction with map ownership/import/lifecycle changes. Defer that responsibility migration.

Alternative: reuse existing LocationPicker. Its actual behavior and styles differ (inventory lists them), so it cannot satisfy unchanged behavior/appearance without a separate redesign. It remains untouched.

## Exact scope and interface

Create frontend-react/src/components/property/create/LocationStep.jsx. Modify AddProperty imports and Step2 inner markup only. Add frontend-react/src/pages/AddProperty.location.test.jsx for actual-parent characterization before product extraction. Update inventories/maps/checkpoint after acceptance. No new options/helper/context/stylesheet files are needed.

LocationStep receives ten named props plus children:

| Prop | Parent value / contract |
| --- | --- |
| formData | Original hook-owned object, read-only; city/address native values unchanged |
| onChange | Existing handleChange, same raw native event |
| locationMode | Original mode string |
| onModeChange | Original setLocationMode setter; no wrapper/normalization |
| onBoundaryChange | Original setBoundaryCoordinates setter; existing inline clear actions call it with [] |
| boundaryCount | boundaryCoordinates.length, raw count including a closing endpoint |
| gpsActive | Original parent boolean |
| onGetGPS | Existing handleGetGPS, same native click event |
| onPrevious | Existing prevStep, same native click event |
| onContinue | Existing nextStep, same native click event |
| children | Entire original MapContainer JSX, unchanged, directly nested by the parent |

Keep the original currentStep===2 conditional and m.div initial/animate/space-y-6 attributes in AddProperty. LocationStep returns a fragment containing exactly the original three direct element children. Insert children at the original MapContainer position inside the existing h-80 wrapper, before its hint/Clear overlays. No extra DOM wrapper, key, ref, render callback or state/effect is introduced. The parent literally nests its existing MapContainer JSX under LocationStep; do not add a mapElement variable or another component type just to pass it.

The parent retains all31 non-render statements, every top-level helper/constant, MapClickEvents, customIcon, all map/layer JSX and map imports/Leaflet CSS. usePropertyForm stays byte-identical. Existing Step1 modules and Steps3–4 remain unchanged. LocationStep imports only React and the original UI icons needed by the moved markup. Keep other parent icon imports wherever still used.

## Preserved behavior and error handling

Only these presentation substitutions are allowed: raw change/GPS/navigation handler aliases, mode/boundary setter aliases, boundaryCoordinates.length→boundaryCount and original MapContainer JSX→children. Inline mode/clear handlers keep their original call order and values. Keep all native input/button types, names, placeholders, labels, classes, selected/GPS colors, disabled semantics (including absence), conditions, icon sizes and event propagation.

Keep current city-or-address validation and feedback; closed-endpoint count behavior; zero/truthiness guards; point/boundary selection, clear and GPS interactions; previous/stepper retention; layer keys/props and coordinate order. Do not add recentering, new coordinate validation, deduplication, GPS cancellation, GPS flag cleanup or map memoization. No new business behavior, dependency, environment, backend, route, payment or upload changes.

## Protection and acceptance

1. Preserve page/hook and map subtree privately. Add missing actual-parent map-event/mode/GPS/validation/retention/lifecycle cases against the existing implementation first. Use real usePropertyForm, controlled API/payment/geolocation/compression and map-boundary instrumentation; new LocationStep stays unmocked after extraction. Existing tests stay intact. No test-only product exports.
2. Keep in-step MapContainer and event-component mount identities stable through city/address, point/boundary, clicks, clear and GPS changes. Leaving Step2 should clean up, and returning should mount a new map with retained hook state. Verify latest-value functional updates and numeric-zero guards. Controlled mount counts are mock evidence, not actual Leaflet identity.
3. Run a separate isolated check using installed real MapContainer/useMapEvents with local/controlled imagery and synthetic GPS. Observe actual map identity/cleanup and native map/control interaction across unchanged-source and extracted cases without real account/API/GPS/tile services. Do not claim real-map coverage from a stub. If this acceptance evidence cannot be obtained, keep Step2 extraction unaccepted and record the gap.
4. Prove all31 parent non-render statements, retained top-level declarations, literal MapContainer subtree and hook bytes unchanged. Compare the new fragment to original presentation with only the listed substitutions. No conditional key or helper relocation.
5. Browser compare original/extracted presentation at desktop1440x900/mobile390x844 in light/dark: point/GPS, empty boundary, partial/closed/valid boundary, field values, error/clear visibility, keyboard focus and relevant hover. Record actual cases and stable screenshot differences; use controlled imagery consistently and state its limits.
6. Run strengthened focused tests, ESLint, full frontend and production build sequentially with existing bounded-memory settings. Independent spec/quality review, maps/hygiene/cleanup and owner-controlled checkpoint follow.

No real location permission, hosted writes, payment/DB/email/upload or git mutation is needed. Evidence stays untracked. Roll back only this bounded extraction if identity/state/request/style differences are unexplained; never reset the branch or delete evidence.

## Self-review

The ten named props plus children, original map insertion point, unchanged state/map owners, allowed substitutions and separate mock/real-map evidence are explicit. Owner approval was followed by characterization, extraction, independent reviews and acceptance. The module has one presentation consumer; no generic map API is introduced. Scope excludes Step3/4 and all map/GPS behavior fixes. Actual counts, capture diagnostics and limits are in the checkpoint.
