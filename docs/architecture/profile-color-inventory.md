# Profile color inventory — 2026-11-01

Baseline measured before the first6B styling pilot. Owner subsequently approved the scoped design; Start Searching now consumes three aliases in [profile-actions.css](../../frontend-react/src/components/profile/profile-actions.css). Recorded color values remain the acceptance baseline. All other controls remain unmigrated exceptions; see checkpoint for acceptance evidence.

Measured current actual SavedSearchesPanel/SavedSearchCard under index.css plus the Profile Navbar stylesheet, using synthetic rows and inert callbacks. Existing main.jsx imports index.css; App.css is not imported by the inspected main/App entry points. components.json selects base-nova/neutral CSS variables, and shared Button uses --primary. The native Profile controls retain palette utilities.

| Control | Theme | Normal background / foreground | Hover background / foreground | Focus color pair |
| --- | --- | --- | --- | --- |
| start | light | oklch(0.546 0.245 262.881) / rgb(255, 255, 255) | oklch(0.488 0.243 264.376) / rgb(255, 255, 255) | Same as normal |
| start | dark | oklch(0.546 0.245 262.881) / rgb(255, 255, 255) | oklch(0.488 0.243 264.376) / rgb(255, 255, 255) | Same as normal |
| run | light | oklch(0.97 0.014 254.604) / oklch(0.546 0.245 262.881) | oklch(0.546 0.245 262.881) / rgb(255, 255, 255) | Same as normal |
| run | dark | rgba(30, 58, 138, 0.35) / rgb(96, 165, 250) | rgba(30, 58, 138, 0.35) / rgb(96, 165, 250) | Same as normal |
| alerts-on | light | oklch(0.982 0.018 155.826) / oklch(0.527 0.154 150.069) | oklch(0.982 0.018 155.826) / oklch(0.527 0.154 150.069) | Same as normal |
| alerts-on | dark | rgba(20, 83, 45, 0.35) / rgb(74, 222, 128) | rgba(20, 83, 45, 0.35) / rgb(74, 222, 128) | Same as normal |
| alerts-off | light | oklch(0.967 0.003 264.542) / oklch(0.707 0.022 261.325) | oklch(0.967 0.003 264.542) / oklch(0.707 0.022 261.325) | Same as normal |
| alerts-off | dark | rgb(31, 41, 55) / rgb(156, 163, 175) | rgb(31, 41, 55) / rgb(156, 163, 175) | Same as normal |
| delete | light | rgba(0, 0, 0, 0) / oklch(0.704 0.04 256.788) | rgba(0, 0, 0, 0) / oklch(0.637 0.237 25.331) | Same as normal |
| delete | dark | rgba(0, 0, 0, 0) / oklch(0.704 0.04 256.788) | rgba(0, 0, 0, 0) / oklch(0.637 0.237 25.331) | Same as normal |

All10 hover targets matched :hover and all10 keyboard targets matched :focus-visible. Native outline, shadow, radius, font, padding and transition values plus screenshots are recorded privately under docs/evidence/phase6-profile-color-inventory. There are30 observations total.

## Cascade findings

- Shared --primary is neutral: root oklch(0.205 0 0), dark oklch(0.922 0 0). It is not the native blue action color.
- index.css has unlayered .dark .bg-blue-50 and .dark .text-blue-600 overrides. Run Search Radar therefore retains rgba(30,58,138,0.35) background/rgb(96,165,250) text even while hovered. Preserve that behavior in this phase.
- Start Searching has no matching blue-50 override. Its normal and focused blue600/white and hovered blue700/white pairs match in both themes. This makes it the recommended first token consumer.
- Alerts off is a clickable enabled button, not disabled behavior. Delete, alert toggle, soft Run Search Radar and other solid-looking actions are not automatically equivalent variants.

## Scope limits

Desktop1440x900 inventory only; synthetic current presentation, not a full signed-in page or every navigation-history stylesheet combination. No provider preference change, API, database or real identity was used. No layout/font/token migration is inferred from this inventory. The approved implementation must add mobile and before/after comparisons and retain native focus/form behavior.

See approved pilot design (development document archived locally). The installed Tailwind hover utility uses a hover-capability media guard; the new opt-in class retains it. Viewport width does not emulate touch capability.
