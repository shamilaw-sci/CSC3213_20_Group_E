# AddProperty Spatial Location Implementation Plan

> For agentic workers: use subagent-driven-development or executing-plans task by task. Owner controls git; do not stage/commit/push.

**Goal:** Extract approved Step2 presentation while retaining the original parent-owned map and all existing behavior.

**Architecture:** Fragment-returning LocationStep, ten named props plus children. AddProperty passes the literal original MapContainer subtree as children, retaining its original motion root,31 non-render statements and all top-level declarations. Hook and other steps remain unchanged.

**Tech Stack:** Installed React, react-leaflet5/Leaflet, lucide, motion, Vitest/Vite. No dependencies or CSS migration.

## Global constraints

Owner approved [the exact design](../specs/2026-11-01-add-property-location-design.md). Work in the existing owner-managed version-3.0 checkout; preserve all prior uncommitted work. No git mutations, real API/account/GPS/tile/payment/DB/email/upload actions, provider/environment/backend/schema changes. Private docs/evidence remains untracked. Heavy tests run sequentially, Node512MB/semi-space4MB and one worker/Rayon thread.

## Task 1: Characterize and extract

Files: create frontend-react/src/pages/AddProperty.location.test.jsx and frontend-react/src/components/property/create/LocationStep.jsx; modify only AddProperty.jsx imports/Step2 inner markup. Private evidence/report goes in docs/evidence/phase6-spatial-location. Existing page/hook/Step1 tests remain intact.

- [ ] Check preserved page/hook bytes and existing fresh24/24 inventory baseline. Add actual-parent tests using the real hook and controlled map/API/payment/GPS/compression boundaries. New module must remain unmocked.
- [ ] Capture current map click handler via useMapEvents; instrument map/event component mount/unmount and rendered marker/circle/polygon props. Calls use React act, e.g. act(() => map.click({latlng:{lat:8,lng:81}})); no product helper export or fabricated test-only DOM in product code.
- [ ] Protect: address-only success and blank/whitespace rejection; raw city/address retention; point click latest-state preservation and GPS reset; repeated batched boundary clicks append in order; mode buttons preserve GPS flag and clear/retain boundary exactly; conditional Clear visibility/count; GPS success/failure/unsupported paths; closed-endpoint count validation without full deduplication; numeric-zero marker/center guards; stable in-step identity and actual exit/remount with retained hook data. No create/payment in new scenarios.
- [ ] Run strengthened tests on original product source, record outcomes, then extract. These are characterization tests; no artificial failing product implementation is required.
- [ ] Copy original Step2 inner markup into a fragment-returning LocationStep. Replace original map JSX with children; replace only handleChange→onChange, setLocationMode→onModeChange, setBoundaryCoordinates→onBoundaryChange, boundaryCoordinates.length→boundaryCount, handleGetGPS→onGetGPS, prevStep→onPrevious, nextStep→onContinue.
- [ ] Exact destructured interface: formData,onChange,locationMode,onModeChange,onBoundaryChange,boundaryCount,gpsActive,onGetGPS,onPrevious,onContinue,children. No new state/effect/key/ref/wrapper/normalization/style.
- [ ] Parent original m.div stays. Literal original MapContainer goes directly inside LocationStep. Bind formData={formData}, onChange={handleChange}, locationMode={locationMode}, onModeChange={setLocationMode}, onBoundaryChange={setBoundaryCoordinates}, boundaryCount={boundaryCoordinates.length}, gpsActive={gpsActive}, onGetGPS={handleGetGPS}, onPrevious={prevStep}, onContinue={nextStep}. Do not create mapElement variable/helper/component.
- [ ] Preserve every map/helper/constant and other step. Remove only newly unused UI icon imports. Retain map imports/Leaflet CSS. Keep native events, labels/classes/types/values and direct three-child DOM structure.
- [ ] Run focused tests/ESLint. Produce executable source proof for31 parent AST statements, retained top-level declarations, unchanged literal map subtree, hook bytes and exact moved presentation with listed substitutions. Include direct source diff and full new files in a private review package. Report focused command/count/timing, original/post evidence, self-review and limitations.

Focused command from frontend-react:

```powershell
$env:RAYON_NUM_THREADS='1'
node --max-old-space-size=512 --max-semi-space-size=4 node_modules/vitest/vitest.mjs run src/pages/AddProperty.integration.test.jsx src/hooks/usePropertyForm.integration.test.jsx src/pages/AddProperty.categoryPrice.test.jsx src/pages/AddProperty.location.test.jsx --maxWorkers=1 --pool=threads
```

Expected: existing24 plus actual new scenarios pass before/after. If a test assumption is wrong, document/correct the test, never fix legacy behavior during extraction.

