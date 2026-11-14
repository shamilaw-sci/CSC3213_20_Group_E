# Task 1: spatial location presentation extraction

Extracted the existing Step 2 markup into `LocationStep`, with the parent retaining the motion element and literal map subtree. The component has the approved ten named props plus children. No hook, map behavior, navigation logic, other step or product styling was intentionally changed.

## Characterization and verification

- Existing inventory confirms 24 baseline tests passed and preserved page and hook snapshots matched before work.
- Added five tests using the actual parent and hook, with controlled API, payment, geolocation, compression and Leaflet boundaries. They cover address and whitespace validation, raw value retention, point updates and GPS reset, zero-coordinate guards, batched ordered boundary clicks, mode and clear behavior, GPS paths, closed-endpoint counting and duplicate points, and map/event identity across updates and remounts. New scenarios do not submit or pay.
- The prescribed focused Vitest command, with 512 MB heap, 4 MB semi-space, one worker and one Rayon thread, passed **29/29 tests in 4 files** on the original source (16.19 s), and again after extraction (16.10 s).
- `npx eslint src/pages/AddProperty.jsx src/pages/AddProperty.location.test.jsx src/components/property/create/LocationStep.jsx` passed with exit 0 and no output.
- `node docs/evidence/phase6-spatial-location/task-1-proof.cjs` passed. It compares the 31 non-render parent statements and top-level declarations; verifies the literal MapContainer subtree, unchanged hook bytes, exact moved presentation substitutions and component interface. Source text comparisons normalize CRLF/LF, because the preserved snapshot contains mixed line endings.
- `review-package.private.md` contains a bounded parent diff against the preserved snapshot and full new component, tests and proof script.

## Self-review and limits

No characterization assumptions required correction. Existing zero-coordinate fallback, GPS mode behavior and incomplete duplicate-point validation are retained as observed. Controlled Leaflet components record rendered props and lifecycle but cannot verify actual browser rendering, tiles or GPS; full suite and browser acceptance are delegated to the owner. No git mutations were made. Original line endings were retained on unchanged lines; the proof normalizes line endings for source comparisons.

## Review follow-up

Strengthened lifecycle coverage asserts map and event components remain mounted through boundary changes, mode changes and Clear, and verifies actual remount retains raw city and address, GPS flag, boundary mode and ordered points, plus GPS coordinates when switching back to point mode. The focused command passed 29/29 against the preserved original (17.81 s) and restored final source (16.13 s). ESLint passed again. No production logic changed in this follow-up.

## Address-only coverage correction

Review caught that the earlier retention extension accidentally removed the successful address-only assertion. The test now explicitly advances with a whitespace-only city and a nonblank address, returns, then exercises the richer retained-state roundtrip. Focused tests passed 29/29 on preserved original (15.11 s) and final source (14.22 s); ESLint passed. No product change was made.
