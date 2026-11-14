# Seller Dashboard Visual Refresh Implementation Plan

**Goal:** Apply the approved restrained property-workspace design without functional changes.
**Architecture:** Preserve React component boundaries, props and rendered content. Add semantic styling hooks and a stylesheet scoped to SellerDashboard.
**Tech Stack:** React 19, existing Tailwind 4, locally installed Geist.

## Constraints
No logic, API, calculations, handlers, conditionals, copy, component replacements or new dependencies. Preserve dark mode and existing responsive breakpoints. Exclude private evidence from commits; no push.

- [x] Add scoped presentation classes to dashboard/header/grid and existing panel roots.
- [x] Style neutral surfaces, metrics, shortcuts, chart and conversation rows; retain semantic status distinctions.
- [x] Run existing dashboard/Navbar/activity tests, lint and production build; inspect JSX diff for functional changes.
- [ ] Inspect rendered desktop light/dark presentation if available.
- [x] Record acceptance/limitations and provide the user with commands to commit authorized pending Seller changes, excluding evidence.

Browser inspection blocked: browser access host and native pipe unavailable on two connection checks. Independent code review found no blocking findings. User performs commit.
