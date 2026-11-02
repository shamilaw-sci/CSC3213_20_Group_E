# Agent overview and properties presentation

Owner continued discussed structural refactoring. Extract only overview and properties tab markup into components/dashboard/AgentOverviewPanel.jsx and AgentPropertiesPanel.jsx. Preserve parent tab conditionals, all36 non-return statements, derivations/filtering/defaults, request/state/auth/effects/timers/handlers, KPI/pipeline/messages/modal and other markup. No sorting, normalization, dynamic class conversion, service/env/dependency or git actions.

Use exact original free render variables/functions as props; inspect and record interfaces before extraction. Keep parent-derived values and original expression formatting. Retain original root elements/keys/native handlers/classes/conditions, navigation arguments and server property order; stateless modules only, no extra wrappers/effects/memoization/shared-card abstraction. Callback expressions remain copied original; actual setter/navigation owners stay parent.

- [x] Preserve current parent privately. Add actual-parent characterization against original first for populated/empty overview, first-four server order, View All/Add Listing/stage actions, reputation/activity values and populated properties filters/navigation/status conditions. Keep controlled auth/API/toast; no real service mutations. Existing KPI/integration tests remain.
- [x] Extract the two tab branches only and needed imports. Executable proof reconstructs complete parent outside approved imports/branch replacement and exact child markup, confirms36 parent statements and untouched other regions.
- [x] Focused new plus existing Dashboard/KPI tests and changed-source lint; independent spec/quality review/fixes before aggregate.
- [x] One full frontend run then lint/build, maps/checkpoint/hygiene. Record browser visual checks as unperformed if unavailable; no visual parity claim. Evidence stays untracked; owner controls git.

Verified closeout: full frontend 248/248 across 37 files; full lint exit 0; production build exit 0 (2.46s, existing bundle/Lottie warnings). Browser appearance/focus checks remain unperformed and deferred. No commit or push.
