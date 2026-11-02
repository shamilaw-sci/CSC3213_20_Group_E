# Property specification fields extraction design

Status: owner approved; fields-only implementation and structural review complete. Browser appearance/native-focus acceptance remains pending because the previously used browser tool is unavailable. This is the first bounded part of Step3; it does not complete Specs & Photos.

## Decision and alternatives

Recommended: extract only bedrooms, bathrooms, house size, land size and description into one stateless PropertySpecificationFields module under components/property/create. This localizes specification inputs while keeping HD/360 rendering, URL creation, handlers and effects in their exact current owner.

Alternative: extract the entire Step3 immediately. That reduces the page faster but combines field conditions with async compression and render-time360 URL lifecycle risk. Defer media presentation until its missing characterization is present.

Alternative: change media lifecycle while extracting. That changes observable behavior and is excluded from this phase's preservation constraint; record defects separately.

## Exact scope

Create frontend-react/src/components/property/create/PropertySpecificationFields.jsx. Modify only AddProperty imports and the Step3 field block preceding HD photographs. Keep original conditional currentStep===3 and its motion root. The module returns a fragment; no extra DOM, key, state, effect, ref or memoization.

Four props: formData (same hook object), isLandType and isHouseType (existing parent booleans), onChange (original handleChange with raw native event). Copy original conditions, labels, icons, names/types/values/placeholders/classes and textarea rows exactly. No numeric conversion, min/max/required/default or new validation. No generic field registry or shared input primitive.

Preserve all31 parent non-render statements, retained top-level declarations, hook bytes, Steps1/2/4 and the complete Step3 media/navigation subtree. Move only newly unused field icon imports; keep icons still used elsewhere. Parent media render-time URL creation and all compression/removal/cleanup logic stay unchanged.

## Acceptance

Add actual-parent characterization against the original first: four categories' visible fields, raw values/description retention through previous and stepper navigation, and category-dependent clearing already controlled by the parent. Use real hook/unmocked module and controlled existing dependencies. Existing media/submission suites stay intact.

Prove exact field markup with approved prop substitutions,31 parent statement equality, hook byte equality and untouched media/map/other-step JSX. Run focused tests, lint, full frontend/build sequentially. Review independently and compare field appearance/native focus across themes/viewports with available browser tooling before acceptance; record limitations rather than claiming unperformed checks. Update actual module/UI owners only after implementation. No git/service/environment/dependency changes; private evidence stays untracked.

Self-review: four props and five native fields are explicit; fragment preserves direct-child spacing; no media lifecycle ownership is changed. HD/360 extraction and defect fixes remain excluded. Owner controls staging/commit/push.
