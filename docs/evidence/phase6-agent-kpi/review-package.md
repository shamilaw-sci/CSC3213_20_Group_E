# Agent KPI extraction review package

Scope: `frontend-react/src/pages/agent/Dashboard.jsx` imports and KPI strip; `frontend-react/src/components/dashboard/AgentKpiCards.jsx`; actual-parent characterization `frontend-react/src/pages/agent/Dashboard.kpi.test.jsx`.

The original dashboard is retained as `Dashboard.before.jsx`. Run `node docs/evidence/phase6-agent-kpi/source-proof.cjs` from the repository root to reconstruct the entire parent and child byte-for-byte using only the approved import/strip and two expression substitutions. The proof also compares the parent non-return AST statements: 36 before and after. Original SHA-256: `235dc491c9abf4f636497522d7776f0bf59d4e8ea3016a7ffdb427a84372be5d`.

Original characterization: `npm test -- --run src/pages/agent/Dashboard.kpi.test.jsx` from `frontend-react`: 3 passed before extraction. It exercises the actual parent with controlled auth, API and toast; populated values, defaults, zero values, pending badge, formatting, refresh, and exact API request counts/order.

After extraction: `npm test -- --run src/pages/agent/Dashboard.kpi.test.jsx src/pages/agent/Dashboard.integration.test.jsx`: 2 files, 14 tests passed. `npx eslint src/pages/agent/Dashboard.jsx src/components/dashboard/AgentKpiCards.jsx src/pages/agent/Dashboard.kpi.test.jsx`: exit 0. Proof: exit 0.

The extracted component is stateless and accepts exactly the eight planned props. The original `properties.length` and `pipeline.Closed || 0` expressions are evaluated in the parent. No browser or real API checks were performed.
