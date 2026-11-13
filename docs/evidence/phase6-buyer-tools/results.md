# Buyer tools extraction evidence

2026-11-02. Snapshot: BuyerDashboard.before.jsx (current source after prior Buyer panels batch).

Original actual-parent characterization: 4/4 passed before extraction. Final focused tools/KPI/panels: 13/13 passed in 3 files. Command from frontend-react: `node node_modules/vitest/vitest.mjs run src/pages/BuyerDashboard.tools.test.jsx src/pages/BuyerDashboard.kpi.test.jsx src/pages/BuyerDashboard.panels.test.jsx --maxWorkers=1 --pool=threads`, process NODE_OPTIONS `--max-old-space-size=512 --max-semi-space-size=4`, RAYON_NUM_THREADS `1`. Final duration16.54s. Preliminary invocation had wrong cwd-relative edit path and unsupported --minWorkers; no test ran in that attempt, corrected before baseline.

Four bounded tests establish default mortgage output and stamp duty, native number/range/tenure updates and parent state retained across tabs without repeated reads, blank Number coercion to zero, six ordered checklist titles/descriptions/default checked cards and toggle retention. The native interest range minimum8 prevents reaching zero interest via normal UI; no artificial parent state injection was added. Existing zero-interest memo branch is unchanged by strict source proof.

`python docs/evidence/phase6-buyer-tools/verify-preservation.py` passes. It requires exact module scaffolding/free-variable props and reconstructs the whole original page. Comparison strips line edges and normalizes newline differences only; it does NOT claim byte identity for extracted JSX indentation. Original imports, all parent statements before loading return (including state/memo/effects/handlers), and entire upgrade helper are separately compared without indentation normalization. No original import was removed, including Check which remains used by the upgrade helper.

No reuse of Profile modules, behavior fixes, browser/live changes, dependencies, backend or git mutations. Browser appearance/focus acceptance, aggregate verification and independent review remain the root coordinator's pending work.
