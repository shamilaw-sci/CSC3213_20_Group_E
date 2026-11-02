# Buyer tools preservation extraction

Approved Phase 6 scope: move only the calculator and due-diligence conditional inner JSX roots into BuyerMortgagePanel and BuyerDueDiligencePanel. Keep route conditions, all original imports, parent state/defaults, mortgage memo, effects, handlers, checklist toggle and UpgradeToSellerTab byte-identical. Pass original free variables as props; preserve native elements, event coercion, content, keys and classes. Do not share Profile presentation without identity evidence.

1. Read the entire BuyerDashboard, roadmap and Buyer inventory. Snapshot the current source in private evidence.
2. Add bounded actual-parent characterization and run against the original source: calculator defaults, native inputs and repayment output, blank/zero purchase value, tenure and tab retention; checklist initial state, content and toggle retention. Zero-interest cannot be reached through the native range minimum of 8; preserve the memo branch by source proof.
3. Mechanically transplant only the two inner JSX roots. No git, environment, dependency, backend or live/browser changes.
4. Run strict reconstruction, requiring original imports, pre-render statements and upgrade helper unchanged. Compare all JSX with indentation/newline normalization only (line edges stripped; internal text retained).
5. Run the new tests and existing Buyer KPI/panels tests with Node heap512/4, RAYON1 and one Vitest worker. Root coordinator owns aggregate tests, lint/build, review and map/checkpoint updates. Browser appearance/focus acceptance remains deferred.

Execution: original4/4 and post focused13/13 (tools/KPI/panels) pass. Strict reconstruction passes; no original imports or non-return parent statements changed, upgrade helper unchanged. See private docs/evidence/phase6-buyer-tools/results.md for commands, limits and corrected preliminary command failure. Root owns aggregate/review/maps. Browser appearance/focus acceptance remains deferred.
