# Agent panel extraction review

Baseline: `Dashboard.before.jsx` was captured before extraction. All five final actual-parent characterization tests passed against that baseline. The extracted parent was restored byte for byte afterward (SHA-256: `3bb2cba79060104682a93d6ab0ffd5b3ee20d6c11a597e49efd0176dafe4f00f`).

Overview free render props: `PIPELINE_STAGES`, `pipeline`, `totalLeads`, `setActiveTab`, `properties`, `navigate`, `reviewCount`, `avgRating`, `recentActivity`.

Properties free render props: `properties`, `activeListingsCount`, `pendingListingsCount`, `setPropertyFilter`, `propertyFilter`, `filteredProperties`, `navigate`.

`python docs/evidence/phase6-agent-panels/proof.py` reconstructs the complete original parent using the current child markup, asserting exact text equality after removal of the two new imports. `node docs/evidence/phase6-agent-panels/statements.cjs` asserts 36 non-return parent statements in both versions.

Focused Vitest: 3 files, 19 tests passed (panels, integration, KPI). ESLint on the changed source and test files passed. Browser visual checks were not performed. Full frontend run, lint, and build are assigned to the owner.
