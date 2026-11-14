# Admin visual refresh implementation plan

Approved direction: restrained premium enterprise interface with light and charcoal themes.

- Preserve every existing page, field, action, API call, validation and authorization rule.
- Scope shared visual tokens to AdminLayout; refine navigation, typography, tables, filters and dialogs.
- Replace dashboard decorative columns with accessible revenue bars and cumulative account line charts using installed Recharts. Preserve API data and error states; zero values remain zero.
- Preserve inventory and moderation sections; use compact KPI strip and asymmetric chart layout.
- Improve narrow-screen layout without removing navigation or actions.
- Verification: source review; user runs frontend tests with maxWorkers=1 and lint/build, then manually reviews themes and key actions. Do not run tests autonomously per user instruction.
