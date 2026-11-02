# Buyer Dashboard presentation inventory

2026-11-02. KPI strip implemented separately. Route page retains URL tab synchronization, four parallel initial reads with per-request empty fallbacks, favorites/appointments/search mutations, refresh flags, mortgage memo and due-diligence state.

Remaining conditional panels: appointments (lead_id keys/cancellation/contact/source formatting), favorites (property id/removal/navigation), saved searches (search id/deletion/map replay), calculator (four inputs and existing memo outputs), due diligence (controlled checklist), upgrade (navigation). Preserve original parent conditions and motion identity; avoid sharing Profile components until equivalence is established. This inventory is source inspection only, not implementation or test coverage. Next bounded candidate is appointments/favorites/searches presentation, with all mutation handlers remaining in BuyerDashboard. Browser appearance/focus acceptance remains outstanding.

Update: appointments/favorites/searches now extracted into three presentation modules. All parent conditions/handlers/state/URL ownership retained. Original/extracted focused9/9, source lint and indentation/newline-normalized reconstruction pass. Independent review and browser acceptance remain pending; root aggregate documented in phase6-checkpoint.md. Calculator/due-diligence/upgrade remain parent-owned.

Update: planner/checklist presentation extracted into BuyerMortgagePanel/BuyerDueDiligencePanel. Original state/memo/defaults and toggle remain in parent. Upgrade helper intentionally remains parent-owned. Latest focused13/13; pending independent reviews/browser acceptance are explicit in checkpoint.
