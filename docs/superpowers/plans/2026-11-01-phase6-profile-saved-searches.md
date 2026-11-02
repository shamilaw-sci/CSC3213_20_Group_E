# Phase 6A/6B saved-search pilot implementation plan

> For agentic workers: use subagent-driven-development for bounded implementation and spec/quality review, or executing-plans inline. No git mutations; owner retains stage/commit/push.

**Goal:** Make Profile Search Radars controls easy to locate while preserving behavior, markup, styling and animation.

**Architecture:** Keep ProfileSettings as the route/state/effect/handler owner. Extract its existing inner Search Radars content into two stateless modules. Leave the original keyed m.div directly beneath AnimatePresence. Introduce navigation documentation, not a new runtime registry or style system.

**Tech stack:** Installed React/Vite/Vitest/Testing Library, lucide-react and existing framer-motion; no new dependencies.

## Approval and scope

Owner approved docs/phase6-refactoring-plan.md on 2026-11-01, including incremental scope and Nov8 freeze for new structural work; Nov10 is the last editable day. This is the first executable batch only. Approved roadmap status supersedes its original proposal wording. Current base72feb0c; owner supplied three passing CI run summaries. Historical local baseline436 backend/144 frontend is not a fresh run for this batch.

Pilot implementation and local acceptance are complete; see docs/phase6-checkpoint.md for actual results, the separately reviewed test-only synchronization correction and limitations. Code examples below record the approved extraction. Owner commit/push and remote CI remain pending.

## Global constraints

- Existing version-3.0 workspace and route-facing ProfileSettings import path remain stable. No commit/push/PR, worktree or branch changes without the owner's direction.
- No backend, schema, auth/payment, network, dotenv, global styles, theme-provider, dependencies or application configuration changes.
- Preserve DOM classes/text/icons, existing native button types (including omitted type on Delete/Run), event propagation, zero/blank truthiness, title fallback, legacy fields and full replay object.
- No hook/effect/state migration or new API adapter. Existing requests, optimistic rollback, deletion timing/toasts and tab query behavior stay in ProfileSettings.
- Existing animation wrapper and key stay at their original position. No React.memo, new useCallback or effect dependency changes.
- Private synthetic visual fixtures/evidence stay under untracked docs/evidence. No hosted data reads/writes are needed. Heavy checks run sequentially with bounded memory.

## Files and interfaces

Create frontend-react/src/components/profile/SavedSearchCard.jsx and SavedSearchesPanel.jsx. Modify only the searches branch/imports in frontend-react/src/pages/ProfileSettings.jsx, add missing characterization to ProfileSettings.integration.test.jsx, retain ProfileSettings.test.jsx as-is. Create docs/architecture/code-map.md and ui-map.md, add links to root README, and record results in docs/phase6-checkpoint.md. Existing docs/phase6-refactoring-plan.md receives its approved status.

Execution exception, separately reviewed: the first aggregate exposed a timing race in unchanged MyProperties.integration.test.jsx. A single waitFor resolver-assignment assertion was added before resolving its controlled request; existing loading assertions and all product code were retained. Original149-pass/1-fail and final150/150 results are recorded in the checkpoint. No broader MyProperties refactor/fix was included.

SavedSearchCard interface: search is the original persisted row; onDelete(id), onToggleAlerts(id, currentlyEnabled), onRun(originalRow). It owns no state or routing. SavedSearchesPanel interface: searches is the existing array and the same callbacks plus onStartSearching(). ProfileSettings passes its existing mutation handlers and current navigate function through callbacks. No cloning, field normalization, fallback array default or altered validation.

## Task 1: Contract baseline and navigation maps

- [x] Confirm branch/HEAD/index and preserve existing private evidence. Read complete parent, its callers and both existing profile tests before editing.

```powershell
git branch --show-current
git rev-parse --short HEAD
git status --short
git diff --cached --name-only
```

Expected initial branch version-3.0, HEAD72feb0c and no staged application changes. If the owner changed files meanwhile, inspect/adapt without overwriting them.

- [x] Run the two existing profile test files sequentially with one worker. Record the actual count and result; do not assume every phase5 test is relevant.

```powershell
Set-Location D:\CSC3213_20_Group_E\frontend-react
node --max-old-space-size=512 --max-semi-space-size=4 node_modules/vitest/vitest.mjs run src/pages/ProfileSettings.test.jsx src/pages/ProfileSettings.integration.test.jsx --maxWorkers=1 --pool=threads
```

Expected exit0 (currently seven scenarios across the two files); a baseline failure must be diagnosed before extraction. Use normal sandbox escalation only if temp/cache access fails. Do not install packages or rerun unrelated backend tests.

- [x] Create code-map.md with explicit scope: initial map covers entry points and the saved-search pilot, not all future Phase6 domains. Document frontend App.jsx, backend server.js and Go main.go, then /profile?tab=searches -> ProfileSettings -> SavedSearchesPanel -> SavedSearchCard -> current callback owner. Backend /api/saved-searches GET/DELETE/:id/PATCH/:id/alerts -> routes/savedSearchRoutes.js -> controllers/savedSearchController.js -> repositories/savedSearchRepository.js; /map replay -> hooks/useMapSearch.js. Link both profile tests and backend savedSearch.test.js/integration saved-searches profile. Mark proposed target files as planned until created.
- [x] Create ui-map.md rows for Search Radars tab, Start Searching, Delete search, Toggle email alerts, Run Search Radar, card title/criteria chips. Each row names page/module, event owner, exact endpoint/navigation, existing class/style owner and test. Current style owner is local JSX plus index.css dark overrides, not a new central token. Document exact visible wording, fallback rules and button types.
- [x] Add root README links to both maps. Do not alter runtime routes to create these documents.

## Task 2: Missing characterization before extraction

Existing tests already cover success toggle, both rollback directions, deletion success timing/failure, full replay payload and actual motion-backed rendering. Do not rewrite or weaken them. Add only these missing parent-level cases to ProfileSettings.integration.test.jsx, reusing its current imports/mocks and savedSearch fixture. These tests must pass on the original implementation; preserving existing behavior does not require an artificial red test.

```jsx
async function mountSearchesForCharacterization() {
    await act(async () => {
        render(<MemoryRouter initialEntries={['/profile?tab=searches']}>
            <ProfileSettings /><RouteEvidence />
        </MemoryRouter>);
    });
}

test.each([false, true])('empty/search-fetch-failure preserves Start Searching navigation (reject %s)', async reject => {
    api.get.mockImplementation(async url => {
        if (url === '/saved-searches' && reject) throw new Error('Controlled search read failure');
        return { data: url === '/saved-searches' ? { savedSearches: [] } : {} };
    });
    await mountSearchesForCharacterization();
    expect(api.get).toHaveBeenCalledWith('/saved-searches');
    expect(screen.getByText('No saved search alerts')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Run Search Radar' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Start Searching' }));
    expect(JSON.parse(screen.getByTestId('route').textContent).pathname).toBe('/buy');
    expect(api.patch).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
});

test.each([
    [{ title: 'Current title', name: 'Legacy name' }, 'Current title'],
    [{ title: '', name: 'Legacy name' }, 'Legacy name'],
    [{ title: '', name: '' }, 'Custom Search Alert'],
])('legacy title/default-alert contract remains unchanged (%j)', async (fields, expectedTitle) => {
    const row = { ...savedSearch, ...fields, email_alerts_enabled: undefined };
    api.get.mockImplementation(async url => ({ data: url === '/saved-searches' ? { savedSearches: [row] } : {} }));
    api.patch.mockResolvedValue({ data: {} });
    await mountSearchesForCharacterization();
    expect(screen.getByText(expectedTitle)).toBeTruthy();
    expect(screen.getByText('Email alerts on')).toBeTruthy();
    toggle();
    await waitFor(() => expect(api.patch).toHaveBeenCalledExactlyOnceWith('/saved-searches/s1/alerts', { emailAlertsEnabled: false }));
    expect(screen.getByText('Email alerts off')).toBeTruthy();
});

test('changing profile tabs preserves saved-search state without repeating initial requests', async () => {
    api.patch.mockResolvedValue({ data: {} });
    await renderSearches();
    toggle();
    await waitFor(() => expect(screen.getByText('Email alerts off')).toBeTruthy());
    const reads = api.get.mock.calls.map(([url]) => url);
    fireEvent.click(screen.getByRole('button', { name: 'Theme & Preferences' }));
    fireEvent.click(screen.getByRole('button', { name: /Search Radars/ }));
    await screen.findByText('Saved Kandy');
    expect(screen.getByText('Email alerts off')).toBeTruthy();
    expect(api.get.mock.calls.map(([url]) => url)).toEqual(reads);
    expect(JSON.parse(screen.getByTestId('route').textContent).pathname).toBe('/profile');
    expect(api.patch).toHaveBeenCalledTimes(1);
});
```

- [x] Run the same focused command after adding these six scenarios; expected exit0. If an expectation disagrees with current behavior, investigate and correct the characterization, not production behavior. Add narrowly justified coverage only if the inspection reveals another extraction-specific risk.

## Task 3: Exact stateless extraction

- [x] Create SavedSearchCard.jsx with this source-derived implementation. Preserve the original conditions and native elements; do not replace it with a new UI primitive.

```jsx
import { Bell, ChevronRight, Trash2 } from 'lucide-react';

export default function SavedSearchCard({ search, onDelete, onToggleAlerts, onRun }) {
    const s = search;
    return (
        <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:border-blue-500 transition"
        >
            <div>
                <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {s.title || s.name || 'Custom Search Alert'}
                    </span>
                    <button
                        onClick={() => onDelete(s.id)}
                        className="text-slate-400 hover:text-red-500 transition p-1"
                        title="Delete search"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                    {s.district && <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">{s.district}</span>}
                    {s.type && <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">{s.type}</span>}
                    {s.min_price && <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">Min: Rs. {Number(s.min_price).toLocaleString()}</span>}
                    {s.max_price && <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">Max: Rs. {Number(s.max_price).toLocaleString()}</span>}
                </div>
                <button aria-label="Toggle email alerts for this saved search" type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleAlerts(s.id, s.email_alerts_enabled !== false);
                    }}
                    className={`mt-3 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                        s.email_alerts_enabled !== false
                            ? 'text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400'
                            : 'text-gray-400 bg-gray-100 dark:bg-gray-800'
                    }`}
                >
                    <Bell className="h-3.5 w-3.5" />
                    {s.email_alerts_enabled !== false ? 'Email alerts on' : 'Email alerts off'}
                </button>
            </div>
            <button
                onClick={() => onRun(s)}
                className="w-full py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1"
            >
                <span>Run Search Radar</span>
                <ChevronRight className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

```

- [x] Create SavedSearchesPanel.jsx with this implementation. It introduces no DOM wrapper beyond the original inner panel div.

```jsx
import { Search } from 'lucide-react';
import SavedSearchCard from './SavedSearchCard';

export default function SavedSearchesPanel({ searches, onDelete, onToggleAlerts, onRun, onStartSearching }) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Smart Search Radars & Alerts</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your saved criteria for instantaneous 1-click market searches</p>
            </div>

            {searches.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <Search className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No saved search alerts</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        Use filters in the Buy or Rent page and click "Save Search" to receive updates when matching properties are listed.
                    </p>
                    <button
                        type="button"
                        onClick={() => onStartSearching()}
                        className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition"
                    >
                        Start Searching
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searches.map((s) => (
                        <SavedSearchCard
                            key={s.id}
                            search={s}
                            onDelete={onDelete}
                            onToggleAlerts={onToggleAlerts}
                            onRun={onRun}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

```

- [x] Add `import SavedSearchesPanel from '../components/profile/SavedSearchesPanel';` to ProfileSettings.jsx. Replace only the inner space-y-6 content in the searches branch so the whole branch reads:

```jsx
{activeTab === 'searches' && (
    <m.div key="searches" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
        <SavedSearchesPanel
            searches={savedSearches}
            onDelete={handleDeleteSearch}
            onToggleAlerts={handleToggleSearchAlerts}
            onRun={(search) => navigate('/map', { state: { savedSearch: search } })}
            onStartSearching={() => navigate('/buy')}
        />
    </m.div>
)}
```

- [x] Remove icon imports only if they have become unused after this extraction. Search remains used in the tabs/KPI. No state, mutation handler, initial fetching, tab handling, outer form/layout or unrelated rendering changes.
- [x] Run both profile tests again with the exact focused command. All old and added assertions must pass. Keep the existing tests on the actual parent/new modules; do not mock the new panel/card.
- [x] Compare DOM attributes/classes/text and callback arguments against the original source in HEAD. Card root remains the same div; map key is on SavedSearchCard, and animation key remains on the parent's direct m.div child. Re-rendering must not add API requests or reset optimistic state.

## Task 4: Visual preservation and review gate

- [x] Before removing the original JSX, retain its exact panel markup in an untracked synthetic visual fixture under docs/evidence/phase6-profile-visual. Capture the original and extracted panel with identical sample rows, empty state, current CSS and surrounding width. The original fixture is source-derived, not a recreated design.
- [x] Use a temporary local Vite fixture with configFile:false, an empty envDir and a free loopback-only port5174; do not start the normal app against hosted .env. Mount only the original/extracted presentation with synthetic data and inert callbacks. Preserve the parent's motion wrapper in both views and provide LazyMotion. Stop if the port is occupied; never kill an unrelated listener.
- [x] Capture matching light/dark desktop1440x900 and mobile390x844 views, populated/empty and alerts on/off. Record representative computed text/background/border/radius/padding values, plus hover/focus states for Start Searching, Delete, Toggle and Run. Use the same viewport/data/theme/font readiness and wait for existing entry motion to finish. Do not change application theme preferences or click mutations on hosted data. The fixture is private test tooling, not a product route or committed runtime module.
- [x] Compare screenshots/computed styles and inspect real animation-backed parent test. If any DOM/CSS/sizing/color/focus difference occurs, stop and restore equivalence before expanding. Screenshot evidence applies to this panel only; broader whole-page/performance claims are outside the pilot.
- [x] Review the bounded diff for spec and code quality. Check all preserved behaviors listed above, unchanged handlers/effects, no new wrappers and no unnecessary abstraction. No reviewer reruns heavy suites without a new concern. Resolve blockers and re-review.

## Task 5: Verification and handoff

Run these sequentially from frontend-react after the final semantic source/test change:

```powershell
node --max-old-space-size=512 --max-semi-space-size=4 node_modules/vitest/vitest.mjs run --maxWorkers=1 --pool=threads
npm run lint
$env:RAYON_NUM_THREADS='1'
$env:NODE_OPTIONS='--max-old-space-size=512 --max-semi-space-size=4'
npm run build
```

Expected all exit0, no failed tests and no new lint findings. Existing bundle/Lottie build warnings remain documented. Record actual test counts; no need to rerun backend/Go or real saved-search email/DB tests for a pure presentation-only frontend extraction.

- [x] Update the two maps to actual implemented paths. In ui-map identify which module owns each button/card/style and which parent owns state/handlers. Keep local style ownership explicit; no color-token migration in this pilot.
- [x] Write docs/phase6-checkpoint.md with base commit, exact changed files, characterization/focused/aggregate/lint/build/visual/review results, limitations, uncommitted state and next bounded batch. Update approved roadmap wording. Do not report all Phase6 complete from this pilot.
- [x] Check all changed/new non-evidence files for credential exposure and whitespace, confirm private docs/evidence remains unstaged and index matches owner's intent. Close only fixture tabs/listener. No database services are needed.

```powershell
Set-Location D:\CSC3213_20_Group_E
git diff --check
git status --short
git diff --cached --name-only
```

- [x] Prepared the verified pilot handoff for the owner; stage/commit/push remain owner actions at their chosen checkpoint. Remote CI is verified only after their push. Phase6 expansion remains pending its next exact design/evidence gate.

## Self-review and execution choice

Self-review: extracted code is derived from the current saved-search branch; no placeholder implementation or missing callback definition. Interfaces, parent wiring and tests use the same prop names. Legacy/empty/failure/default-alert and tab-preservation requirements are covered before extraction. DOM/motion/style preservation has its own browser gate; it is not inferred from jsdom. Documentation maps are scoped honestly and no new runtime registry, backend changes or theme migration are hidden in this batch.

The visual fixture is a throwaway source-derived observation tool; its exact local rendering setup should be reviewed before running, and must not use application .env or real accounts. This plan authorizes no broad visual-tool framework or new dependency. If local visual tooling is blocked, report that gate incomplete instead of claiming appearance preserved.

Recommended execution: subagent-driven implementation of the bounded pilot with independent read-only review; parent coordinates memory-heavy checks and synthetic browser evidence. Inline execution is also available. Owner approval of the Phase6 roadmap is retained; do not re-request authorization for the unchanged pilot scope. No automatic commit is permitted.
