# Phase 6 refactoring roadmap

Status: owner approved the incremental roadmap and current-behavior/current-appearance constraints, then continued the bounded Profile batches on2026-11-01. Nov8 structural freeze and Nov10 last editable day remain approved. Baseline branch version-3.0, commit72feb0c; owner confirmed BackendCI43, FrontendCI50 and general pipeline65 green for that baseline. Current local acceptance/results are in [phase6-checkpoint.md](phase6-checkpoint.md). New work remains uncommitted and has no remote CI result. Private docs/evidence remains untracked.

This document was restored during the shell closeout after an encoding write error truncated it. Approved objectives, constraints, sequence, deadline and remaining scope are retained below; the checkpoint and individual implementation plans retain the detailed execution history.

## Purpose and chosen approach

Make the codebase easy to explain during code review and easy to modify afterward. A maintainer should find a visible button, panel, dialog, color or backend operation by its domain/name without scrolling through a thousand-line page. Preserve current logic, contracts, appearance and observable behavior. Small changes, characterization evidence, independent review and reversible checkpoints control regression risk; this is not a zero-regression guarantee.

The approved approach is feature-by-feature extraction within the existing architecture, with code/UI maps and gradual semantic styling. Routes, state owners and public imports stay stable. Documentation/names alone was the lower-risk alternative but leaves mixed-responsibility pages. A whole-application folder/framework rewrite was rejected because of import/CSS/mock/lifecycle churn before the deadline.

The goal is useful separation that can be verified, not the maximum number of files or the smallest possible functions. Do not create a file for every icon, label, trivial expression or pass-through function.

## Current progress and remaining scope

| Workstream | Current position |
| --- | --- |
|6A Maps/baseline |Navigation-map seed delivered; each later feature still needs its own inventory/map entries |
|6B Profile |Five panels, header/summary/tabs and first Start Searching token pilot locally verified. Existing settings modules retained; other color variants remain explicit exceptions |
|6C AddProperty |All four step presentation seams implemented. Parent map/tour rows,31 statements and hook retained. Focused45/45, full240/240 and reviews/proofs pass; later browser checks remain deferred |
|6D Agent Dashboard |All planned presentation groups implemented, including chat. Focused30/30 and full259/259; independent reviews and whole-parent preservation pass. Orchestration stays parent-owned; browser checks deferred |
|6E Selected other pages |Selected Seller/Buyer panels, Admin inspection/filter/table and PropertyDetails critical card/sidebar implemented. Gallery/map/animation/upgrade/state owners retained intentionally; final acceptance tracked separately |
|6F Backend |Agent/property/Admin responsibility modules implemented; auth/placeholders retained intentionally. Independent bounded reviews passed; final backend585/585 |
|6G Optional |Capacity-dependent map/message presentation or safe duplication only |
|6H Final acceptance |Pending: whole-phase regression, maps walkthrough, review and owner-pushed CI |

Structural implementation groups are complete within the recorded selected scope. Final acceptance remains: broad review, browser/native-focus checks, affected isolated integration profiles and owner-pushed CI. Optional6G/application-wide token rollout and additional unselected page redesigns are not part of completion claims.

Local acceptance: sampled browser84/84, guarded integration104/104 and final code suites passed. Remaining release gate: owner commit/push and new-commit CI. Exhaustive browser paths outside recorded samples remain unclaimed; no deployment/production-readiness claim.

## Verified candidate inventory

| Source | Original lines | Visible separations and protected contracts |
| --- | ---: | --- |
| frontend-react/src/pages/ProfileSettings.jsx |1071|Appointments, favorites, searches, calculator, due diligence, existing settings; preserve state, queries, mutations and calculations |
| frontend-react/src/pages/AddProperty.jsx |1264|Category/price, spatial location, specs/media, review/publish, constants; retain usePropertyForm, map/media/timers/draft/payment handoff |
| frontend-react/src/pages/agent/Dashboard.jsx |1273|Overview, CRM pipeline, properties, conversations, lead detail; protect polling/scroll/timers and selected-lead state |
| frontend-react/src/pages/BuyerDashboard.jsx |918|Dashboard sections/actions; inventory interactions before splitting |
| frontend-react/src/pages/admin/pages/ListingsPage.jsx |778|Filters, table/cards, detail/actions; exact permissions/moderation contracts |
| frontend-react/src/pages/AgentProfile.jsx |761|Profile sections, reviews/booking/customization; existing booking tests cover only their stated scope |
| frontend-react/src/pages/PropertyDetails.jsx |678|Gallery, details/actions and existing property modules; retain property regressions |
| frontend-react/src/pages/SellerDashboard.jsx |552|Dashboard panels/listing actions; retain payment hook and status authority |
| frontend-react/src/pages/Messages.jsx |510|Conversation list/view/composer; participants, read isolation, polling and request timing |
| backend-node/controllers/adminController.js |511|Admin domain operations behind existing route/controller/repository architecture |
| backend-node/controllers/agentController.js |429|Profiles/dashboard/CRM/booking; stage/source mapping, authorization and payloads |
| backend-node/controllers/propertyController.js |418|Writes/media, reads/search/insights; uploads, numeric parsing, privacy and cleanup |

Inventory line counts prioritize inspection; they are not complexity measures or acceptance limits. Test-file presence is not proof of coverage. Go already separates handlers/routes/repository/search query and is not restructured just to broaden Phase6.

## Rules every batch preserves

- Exact routes, methods and middleware order, payload fields, statuses, exported names and import entry points. Specific property routes remain before /:id.
- Existing auth/session/role/ownership behavior, checkout fee/hash/signature/settlement rules, receipt and Storage semantics. No schema/dependency/runtime/framework migration, real environment edits or hosted writes.
- UI text, layout, sizing, icons, animations, responsive/light/dark appearance and hover/focus/disabled/loading/error/keyboard/form behavior.
- Native element/button type, implicit/explicit submit behavior, propagation, refs and accessible names. No blind replacement with BaseUI/shadcn controls.
- State ownership/defaults, effect dependencies/order, mounting identity/keys, timer cleanup, request count/order/concurrency and loading/error/retry semantics. Extract rendered panels before moving state/effects to hooks.
- Numeric zero/blank/default behavior, calculations, polygon/WKT ordering, payload formatting and URL/search-state replay. Sharing similar calculations requires equivalence evidence.
- No incidental fixes, redesign, polling optimization, API normalization or behavior cleanup inside refactoring. Record defects separately.
- No automatic stage/commit/push/PR/deploy. Owner retains git control on version-3.0. Evidence stays untracked. Tests run sequentially on this memory-constrained machine.

## Module boundaries and navigation

Extend current domain folders; keep route-facing page paths stable. Existing helpers/components remain authoritative. Avoid duplicate helpers, blanket barrel exports, circular imports and new service/repository layers without a concrete need.

Profile modules belong in frontend-react/src/components/profile; the route page remains the coordinator. Existing PreferencesSettings, AgentProfileSettings and SecuritySettings remain in place. AddProperty candidates belong under components/property/create: CategoryPriceStep, LocationStep, MediaDetailsStep, ReviewPublishStep and propertyFormOptions. Agent Dashboard candidates belong under its existing components/dashboard folder: OverviewPanel, LeadPipelinePanel, AgentPropertiesPanel, LeadConversationPanel and LeadDetailsDialog. Names are proposed responsibilities, not a mandate to create unused modules.

Backend responsibility files can sit behind existing controller exports. Configuration/query/SQL changes are outside this phase. Each batch inspects the whole source and callers, then records exact files/props/exports/contracts in its own design and executable plan. The roadmap is not permission to execute every proposed candidate at once or waive high-risk scope review.

[Code map](architecture/code-map.md) records feature → browser route → page → backend route/controller/repository → verification. [UI map](architecture/ui-map.md) records visible label/action → module → handler → local style/token owner. README links both and identifies App.jsx, backend server.js and Go main.go entry points. Every batch updates its own entries.

Examples: Run Search Radar maps to SavedSearchCard and full-row /map replay; Publish & Pay should map to ReviewPublishStep/usePropertyForm/usePayhere/server checkout; CRM Offer should map to pipeline/current update handler/repository stage mapping. Document the actual callback owner. Do not add a runtime route registry or DOM IDs/data attributes just for documentation.

## Colors and shared UI

Existing shadcn/BaseUI variants and semantic variables coexist with Tailwind palette utilities and broad dark-mode overrides. Reuse that system; do not install another UI kit, change preset or replace toast/motion libraries.

First inventory actual computed colors for representative migrated panels in light/dark and interaction states. Identify authoritative existing variables. Introduce only missing named tokens with exact current values; keep separate variants when existing designs differ. Changing --primary currently affects existing semantic controls while many custom blue controls keep their local colors.

After a feature extraction is verified, migrate only equivalent repeated styles in a separate approved token/variant batch. Preserve CSS import/layer/specificity order and hover-capability media guards. Never combine JSX extraction and global CSS replacement, or merge distinct buttons only because both look blue. UI map records migrated controls and explicit exceptions. The first6B pilot covers Start Searching only; it does not complete application-wide color centralization.

## Sequence and evidence gates

| Batch | Deliverable | Gate |
| --- | --- | --- |
|6A|Contract/baseline seed, code/UI maps, button/color inventory; record owner-confirmed72feb0c CI and historical436/144 local results|Read-only inventory and bounded pilot; synthetic representative visual states |
|6B pilot|Saved-search panel/card only, parent fetch/state/handlers/routes unchanged|Existing tests retained; missing empty/error/delete/replay characterization, focused lint/build/visual parity |
|6B expansion|Other Profile presentation, then separate equivalent token pilot|Tab/query synchronization, calculations, theme/settings requests and state retention |
|6C|AddProperty four presentational steps/constants, one step per batch|Wizard/usePropertyForm checks, retained step values, file/preview cleanup, map identity, validation, draft/payment handoff |
|6D|Agent overview/properties, then pipeline/detail, messaging last|CRM success/failure/reload, selected-lead synchronization/request traces; polling/cleanup characterization before chat extraction |
|6E|Selected Buyer/Seller/admin listing/detail panels|Individual interaction inventory/protection; do not expand on file size alone |
|6F|Property, agent, admin backend responsibilities behind unchanged exports|HTTP contracts and relevant isolated Phase5 profiles; exact methods/statuses/payloads/auth/side-effect order. Auth/payment/receipt internals remain intact |
|6G|Optional map/message presentation or bounded duplication|No state architecture, sockets/polling, SQL rewrites or unsafe shared helpers. Defer candidates without evidence |
|6H|Whole-phase review/map walkthrough/regression/build/CI/checkpoint|No unexplained regression or visual drift; maps match actual modules; owner controls commit/push |

Characterization should pass on existing behavior before extraction; no artificial red test is required. Keep UI/HTTP interface tests and existing suites. Test only the relevant scope while implementing; complete aggregate checks at acceptance. Backend/Go/real isolated suites are chosen by the actual affected contracts rather than rerun for frontend-only JSX.

Visual checks use source-derived originals and actual extracted presentation with synthetic data. Record exact viewports/themes/states, interactions, capture differences and limits. Missing visual/request/lifecycle evidence defers a risky candidate. No real account, live database, payment or email is introduced solely for verification.

## Deadline, completion and rollback

Priority runs6B→6C→6D→6E→6F, with6G only if capacity remains. Stop new structural work Nov8; Nov9 is whole-phase verification and review; Nov10 is fixes only and the last editable day. This is not a promise that all candidates fit available hours/usage. Do not compress verification to claim broader scope. An owner-changed freeze must record its effect on final verification.

A batch is complete when responsibilities are discoverable, behavior/appearance evidence passes, imports/tests are coherent and request/lifecycle/style differences are explained. Line counts are an aid, not acceptance. Cohesive modules may be100–250 lines and coordinators200–400; do not split merely to hit a target.

Use independent spec/quality review and bounded diffs. Keep extraction, styling and behavior fixes separate. Owner creates reversible commits at agreed checkpoints; never reset the branch or delete private evidence. If owner prefers one phase commit, keep that choice and bounded evidence. Final Phase6 summary states accepted candidates, deferred oversized/untested modules and style exceptions. It does not claim Phases7–9, a security audit or production readiness.

## Verified local batch ledger — 2026-11-01

- Saved-search pilot: panel/card and map seed; aggregate150/150 after separately reviewed pre-existing loading-test synchronization correction. Exact failure history is in the checkpoint.
- Appointments/Favorites: four stateless modules,24 new scenarios; aggregate174/174, lint/build and two reviews passed.
- Mortgage: stateless panel, original formula/defaults/state retained,13 new scenarios; aggregate187/187;24 base/keyboard screenshot pairs matched; lint/build and two reviews passed.
- Due-Diligence: exact static content plus stateless panel,8 new scenarios; aggregate195/195;24 base/click screenshot pairs matched; lint/build and two reviews passed.
- Header/Summary/Tabs: three stateless modules,16 new scenarios; parent37 non-render statements retained and597→461 lines; aggregate211/211, lint/build and two reviews passed.16 settled base screenshot pairs,20 focus/tab and12 hover/click comparisons matched; initial shadow differences retained in evidence.

Profile structural presentation and the first scoped token pilot are locally complete with existing settings modules retained. Token pilot acceptance:211/211 final frontend tests, lint/build, two reviews after hover-guard correction,12 pixel-identical responsive states,30 unchanged negative-control states and fixture-only token ownership/false-condition proofs.

AddProperty Step1 is locally complete: one stateless fragment module and one exact category-data module;31 parent statements and hook bytes retained. Eight pre-extraction scenarios strengthen the focused suite to24/24; full frontend219/219, lint/build and independent spec/quality reviews passed. Browser acceptance covers26 DOM/value/geometry/selected-style states,20 interaction observations and28 settled exact screenshot pairs. The initial one-icon capture mismatch and unchanged-source repeat are retained; no application fix was made. Steps2–4 and the other core workstreams remain pending. All new work remains owner-controlled for stage/commit/push and remote CI. Individual plans under docs/superpowers/plans and the checkpoint preserve detailed commands, failures, evidence and scope limits.

Step3 fields-only implementation: PropertySpecificationFields and actual-parent characterization are implemented;34 focused and229 full frontend tests, lint/build, structural proof and independent review passed. Browser appearance/native-focus acceptance is pending due unavailable tooling. This does not complete Step3 or reduce the remaining wizard-step count; media/navigation ownership stays in AddProperty.

HD photo presentation is implemented with exact parent/hook reconstruction and independent spec/quality review. Current focused40/40, full235/235; fields/HD browser acceptance remains pending after native window interruption.360 presentation and Review & Publish remain. No product lifecycle fixes or git mutations.

Step3 fields, HD and360 shell presentation are now implemented; tour rows intentionally remain parent-owned for URL lifecycle preservation. User accepted prior fields/HD work with the recorded visual gap. Latest focused40/40 and full235/235; browser appearance/focus evidence remains deferred. Next structural candidate is Step4 Review & Publish; remaining acceptance work is still tracked, not counted as complete.

Agent KPI pilot: original3/3, post14/14, full243/243, independent review and36-statement byte/AST proof passed. Visual appearance remains unperformed. The three Agent planning groups remain partially/not completed; no remaining-group reduction is inferred from this strip.
