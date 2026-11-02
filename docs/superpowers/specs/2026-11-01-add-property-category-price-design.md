# AddProperty Category & Price extraction design

Status: owner approved2026-11-01; the bounded Step1 extraction is implemented and locally verified. This is the first6C wizard batch, not a four-step rewrite. Owner retains all staging/commit/push. See the [implementation plan](../plans/2026-11-01-add-property-category-price.md) and [acceptance checkpoint](../../phase6-checkpoint.md).

## Goal and decision

Make Step1 inputs, category objects and Continue action easy to locate while preserving existing logic, values and appearance.

Recommended: one stateless CategoryPriceStep module plus one exact static category-options module. It localizes the visible step while retaining the existing parent/hook control flow.

Alternative: extract all four steps/constants at once. It reduces the page faster but combines map/media/payment/lifecycle risks and makes regression attribution harder; defer those steps to their own batches.

Alternative: keep code as-is and add maps only. Lowest code churn but leaves the1264-line page difficult to navigate. The existing roadmap chose verified presentation extraction instead.

## Exact files and interface

Create frontend-react/src/components/property/create/CategoryPriceStep.jsx and propertyCategoryOptions.js. Modify AddProperty.jsx imports and only the Step1 inner render branch. Add a focused actual-parent characterization test file; retain all existing suites. Update code/UI maps and checkpoint after acceptance.

CategoryPriceStep receives exactly nine props:

| Prop | Parent value/contract |
| --- | --- |
| formData | Original hook-owned object, read only; no defaults/normalization |
| isRentType | Existing parent boolean |
| titlePlaceholder | getTitlePlaceholder(), evaluated inside the Step1 conditional |
| pricePreview | formData.price && formatLKRPreview(formData.price, isRentType ? formData.pricePeriod : null) |
| districts | Existing sriLankaDistricts constant, same reference/order |
| onChange | handleChange, raw native change event |
| onTypeSelect | handleTypeSelect(categoryId) |
| onDistrictChange | handleDistrictChange, raw native select event |
| onContinue | nextStep, same native click event |

The parent keeps this original root unchanged:

```jsx
{currentStep === 1 && (
  <m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <CategoryPriceStep
      formData={formData}
      isRentType={isRentType}
      titlePlaceholder={getTitlePlaceholder()}
      pricePreview={formData.price && formatLKRPreview(formData.price, isRentType ? formData.pricePeriod : null)}
      districts={sriLankaDistricts}
      onChange={handleChange}
      onTypeSelect={handleTypeSelect}
      onDistrictChange={handleDistrictChange}
      onContinue={nextStep}
    />
  </m.div>
)}
```

The new module returns a fragment containing the exact original inner nodes, not a new div. This preserves direct-child space-y selectors, DOM ancestry and the parent motion root. No new key, wrapper, form, ref, effect or state is introduced.

propertyCategoryOptions.js exports the four original objects in the original order with direct lucide icon imports. Preserve IDs, titles, descriptions, icon references and mapped keys. Do not freeze, normalize, sort or merge them with unrelated property-type schemas. The new module has one presentation consumer. Keep districtLocations, sriLankaDistricts, STEPS and formatLKRPreview in AddProperty for this batch; constants migration beyond the four category objects is deferred.

## Invariants

- All31 parent non-render statements and all usePropertyForm source stay unchanged. Existing top-level map helper/icon, district coordinates, step configuration and price formatter remain unchanged apart from imports newly made unused by extracting category markup.
- Parent retains category field resets, district coordinates/GPS, validation/order/messages, next/previous/stepper/scroll, media handlers/cleanup, selected step and direct motion roots. The hook retains data, draft, WKT, multipart fields, loading and HTTP/payment order.
- Preserve every class, label/placeholder, native type/name/value, select option/default, clickable-div semantics, event bubbling and button callback. Do not add required/min/max/step/role/tabIndex or shared UI primitives.
- Keep the original child price truthiness condition as well as the proposed guarded preview value. Preserve zero/string-zero/blank and raw period behavior; no new formatting logic moves into the module.
- Existing first-step validation checks title, then positive price, then district. Do not add contact validation or change the stepper's ability to jump after validating only its current step.
- No styling/token migration. Continue's current hover blue500 differs from Profile's token pilot. Preserve all hover/focus/light/dark/responsive/animation behavior.
- No dependency, environment, schema, backend, auth/role, payment/receipt, real upload/account/DB/email or deployment action. Existing guard/fee/advisory text is preserved rather than factually revised.

## Protection before extraction

Existing two-file baseline is16/16 pass (8.36s); private sources/hashes and AST inventory are preserved. Before editing product code, add missing actual-parent scenarios using the real usePropertyForm and unmocked new modules, with HTTP/payment/map/compression controlled as existing tests do:

1. Four category choices preserve title placeholder, listing-type display and rental period visibility/options/defaults.
2. Sale/rent/Land switches preserve the exact field clearing/retention rules, including values entered in later steps and retained on back navigation.
3. Empty/zero/negative and representative Thousand/Million/Billion previews retain formatter/validation behavior; Month/Year text remains exact.
4. District selection reaches existing Step2 coordinates; raw title/price/contact values persist through previous navigation.
5. Continue and stepper retain current validation/event/query-independent navigation without a create or payment call. Retain existing full save/retry/media tests unchanged.

Test through rendered values/actions, not a mocked form hook or expected values imported from the new options array. Do not export private helpers just to test them. Characterization should pass on original behavior before extraction; no artificial failing product tests.

## Acceptance and rollback

- Compare parent non-render ASTs (31 identical), the hook's exact source hash, retained top-level constants/helpers and exact category-data literals. Module adds presentation imports only; no new import side effects.
- Run original and strengthened page/hook tests before and after extraction, relevant lint, aggregate frontend tests and production build sequentially with bounded memory.
- Source-derived original/current browser comparison: four categories × light/dark × desktop1440x900/mobile390x844, plus focused blank/zero/validation/hover/focus states. Original wrapper and native controls stay intact. Record actual captures and limits; no live services are needed.
- Independent spec/quality review; update actual module/control/style owners in maps. Do not represent later steps as refactored.
- Owner controls git checkpoints. Undo only this bounded extraction if unexplained state/request/DOM/style differences appear; never reset the branch or remove private evidence.

## Self-review

The seam, nine props, two files, wrapper strategy, unchanged owners, legacy edge cases and acceptance are explicit. Owner approval was followed by pre-extraction characterization, implementation, independent spec/quality reviews and local acceptance. Other three steps and broader constant/style/lifecycle work remain excluded. The checkpoint records actual results and the synthetic-browser/mocked-service limits.
