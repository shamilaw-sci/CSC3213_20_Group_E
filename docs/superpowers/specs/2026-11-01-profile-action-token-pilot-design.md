# Profile solid-action token pilot design

Status: owner approved this concrete scope2026-11-01; implementation locally verified. Review clarified the existing Tailwind hover-capability media guard, which is retained below to satisfy the approved behavior-preservation requirement. Owner retains all staging/commit/push and remote CI remains pending.

## Goal and exact scope

Make one Profile action's colors editable in a documented owner while preserving current appearance and behavior. First consumer: Start Searching in the empty SavedSearchesPanel. Three semantic color aliases and one native-button class; no new React primitive.

The [measured inventory](../../architecture/profile-color-inventory.md) contains30 existing style observations. Start Searching normal/focused background is oklch(0.546 0.245 262.881), hover is oklch(0.488 0.243 264.376), text is white in both themes. Native focus, shadow, radius, typography, dimensions and transition styles remain as measured.

## Options and decision

Recommended: domain-scoped CSS aliases and an opt-in class, starting with one consumer. It gives an explicit edit location without changing unrelated global semantic colors or native control behavior. Expansion requires another equivalence inventory.

Alternative: keep all palette utilities and only document their locations. Lowest migration risk, but shared action colors still have no domain owner.

Alternative: replace the control with shared Button/use --primary. Existing --primary is neutral and shared Button adds its own sizing/focus/active/disabled semantics. It would require broader behavior/style work, so it is outside this preservation pilot.

## Proposed file/interface changes

1. Added frontend-react/src/components/profile/profile-actions.css with these three aliases and preservation rules:

```css
:root {
  --profile-solid-action-bg: var(--color-blue-600);
  --profile-solid-action-hover-bg: var(--color-blue-700);
  --profile-solid-action-fg: var(--color-white);
}

@layer components {
  .profile-solid-action {
    background-color: var(--profile-solid-action-bg);
    color: var(--profile-solid-action-fg);
  }

  @media (hover: hover) {
    .profile-solid-action:hover {
      background-color: var(--profile-solid-action-hover-bg);
    }
  }
}
```

2. Import that file once in index.css after its existing CSS imports and before @theme. Preserve the existing import order and Tailwind theme/base/components/utilities layer ordering. The new token declarations add names only; --primary, palette definitions and existing dark overrides stay untouched.
3. In SavedSearchesPanel.jsx, replace only Start Searching's bg-blue-600, text-white and hover:bg-blue-700 classes with profile-solid-action. Retain every spacing/radius/font/shadow/transition class and native button type/onClick/label. No inline styles, data attributes, wrappers, disabled/loading state or routing change.
4. Update code/UI maps and inventory status to identify this one migrated consumer, its token owner and all remaining exceptions.

The palette aliases exist in the measured current CSS and remain used elsewhere in the application. Both themes intentionally use the same aliases in this pilot; no new .dark rule is required. The components-layer class is opt-in and controls only background/foreground. Its hover rule retains the installed Tailwind hover: hover media condition, preserving touch-capability behavior. It does not replace layout utilities or add focus/active/disabled rules.

## Preserved exceptions

Run Search Radar remains unchanged. Its unlayered dark bg-blue-50/text-blue-600 overrides currently win even while hovered; normal/hover both resolve to rgba(30,58,138,0.35) and rgb(96,165,250). This pilot does not fix or normalize that behavior.

Delete, alert on/off, other Profile actions and the shared Button remain untouched. Alerts off is still an enabled clickable button. A similar blue appearance alone does not qualify another button for migration. All state/effects/requests/handlers stay in their existing owners.

## Acceptance and rollback

- Preserve original current SavedSearchesPanel and stylesheet privately before implementation. Record existing focused Profile and aggregate results as baseline; run applicable tests/lint/build after migration. No new implementation-mirroring CSS unit tests are needed.
- Compare original and migrated controls at desktop1440x900/mobile390x844, light/dark, normal/hover/native keyboard-focus:12 pairs. Compare standard computed properties, geometry, native attributes/events and settled screenshots. Expected class-name changes and added inherited custom properties must not be mistaken for rendered drift.
- Original native Start Searching navigation still invokes the existing parent /buy callback. No actual account/API/database is needed for visual evidence; actual-parent navigation tests remain unmocked at the new presentation seam.
- Verify unchanged Run/toggle/delete controls and shared --primary values as negative controls. The existing Profile suites and full frontend checks remain acceptance gates.
- In an isolated fixture only, override the three new aliases to prove Start Searching responds and non-consumers keep their standard computed styles. Never write test colors to application configuration.
- Inspect CSS cascade/layer output in the installed build. Any unexplained focus/color/layout or unrelated-style drift blocks expansion; do not normalize it as a refactor.
- Rollback only the added CSS/import and three class replacements. No git reset, evidence deletion or owner git mutation.

The first inventory is scoped to current Profile index/Navbar styles and synthetic state. It does not claim every browser, font or stylesheet-history combination. Existing behavior defects and legal/financial content are separate work.

## Self-review

Scope is one existing enabled control, not a full color-system migration. Names/values, files, layer, consumer, exceptions and evidence are explicit. No new dependency, shadcn preset, global primary/radius/font, theme provider, auth/payment, environment, backend or database change is proposed. Owner approval was followed by the [implementation plan](../plans/2026-11-01-profile-action-token-pilot.md); actual acceptance is recorded in the checkpoint.
