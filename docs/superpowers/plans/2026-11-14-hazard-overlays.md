# Verified hazard overlays implementation plan

Goal: replace unsourced disaster blobs with published Sri Lanka NSDI geography.
Architecture: a Leaflet tile adapter uses ArcGIS export with Web Mercator bounds and dynamic renderers. A React lifecycle component mounts enabled layers and reports tile status to an accessible control panel.
Tech stack: existing React, Leaflet, Vitest; no new dependencies.

- [x] Add failing tests for correct tile bounds, service layer filtering, published classes, tile errors and cleanup.
- [x] Add hazard service configuration and tile URL builder; use layer 6 for historical floods and layer 8 for landslides. Preserve unknown source dates.
- [x] Add map layer lifecycle and control panel with loading, failure, retry, legend, attribution and coverage caveat.
- [x] Remove obsolete GeoJSON fetching, blobs and unsupported casualty popups; integrate controls into MapSearch.
- [x] Validate official image response, run targeted tests, lint changed files and production build; inspect resulting source diff.

Constraints: no inferred geometry, no invented risk levels or current-condition claims, no edits to unrelated evidence logs, no automatic deployment or commits. Work in the user's current version-3.0 checkout.
