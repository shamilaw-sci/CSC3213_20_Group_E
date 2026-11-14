import { useEffect, useRef, useState } from 'react';
import { fetchBoosts, toggleBoost } from '../api/adminApi';

export default function BoostsPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('');
    const [query, setQuery] = useState({ page: 1, search: '', enabled: '' });
    const [data, setData] = useState(null);
    const [phase, setPhase] = useState('loading');
    const [reload, setReload] = useState(0);
    const [busy, setBusy] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const lock = useRef(false);
    const generation = useRef(0);
    useEffect(() => {
        let cancelled = false;
        generation.current += 1;
        setPhase('loading');
        fetchBoosts({ page: query.page, limit: 20, search: query.search, ...(query.enabled ? { enabled: query.enabled } : {}) })
            .then(result => {
                if (!Array.isArray(result.boosts) || !Number.isFinite(result.total)) throw new Error('Invalid listing response.');
                if (!cancelled) { setData(result); setPhase('ready'); }
            }).catch(() => { if (!cancelled) setPhase('error'); });
        return () => { cancelled = true; generation.current += 1; };
    }, [query, reload]);
    const change = async row => {
        if (lock.current) return;
        lock.current = true; setBusy(row.id); setFeedback(null);
        const version = generation.current;
        try {
            const result = await toggleBoost(row.id, !row.enabled);
            if (generation.current !== version) return;
            setFeedback({ text: result.warning || result.message, warning: Boolean(result.warning) });
            setReload(value => value + 1);
        } catch (error) {
            if (generation.current === version) setFeedback({ text: error.response?.data?.message || 'Placement update could not be confirmed. Refresh before retrying.', warning: true });
        } finally { lock.current = false; setBusy(null); }
    };
    return <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Featured placements</h1>
            <p className="text-sm text-slate-500 mt-2">Prioritize approved, paid, nonarchived listings on Home. This does not purchase advertising or change search filters. Only eligible listings appear below.</p></div>
        <form className="flex flex-wrap gap-3" onSubmit={event => { event.preventDefault(); if (!lock.current) setQuery({ page: 1, search: search.trim(), enabled: filter }); }}>
            <label className="text-sm">Search listings<input className="block border rounded px-3 py-2 bg-transparent" value={search} maxLength={120} onChange={event => setSearch(event.target.value)} /></label>
            <label className="text-sm">Placement<select className="block border rounded px-3 py-2 bg-transparent" value={filter} onChange={event => setFilter(event.target.value)}><option value="">All eligible</option><option value="true">Enabled</option><option value="false">Disabled</option></select></label>
            <button className="border rounded px-4 self-end py-2 disabled:opacity-50" disabled={busy !== null} type="submit">Apply filters</button>
        </form>
        {feedback && <p role="status" className={feedback.warning ? 'text-amber-600' : 'text-emerald-600'}>{feedback.text}</p>}
        {phase === 'loading' && <p role="status">Loading eligible listings…</p>}
        {phase === 'error' && <div role="alert">Listings could not be loaded. <button className="underline" onClick={() => setReload(value => value + 1)}>Retry</button></div>}
        {phase === 'ready' && <>
            <p className="text-sm text-slate-500">{data.total} eligible listings match these filters.</p>
            {data.boosts.length === 0 ? <p>No eligible listings match. Approve a paid listing or change the filters.</p> : <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr className="border-b"><th className="p-3">Listing</th><th className="p-3">Location</th><th className="p-3">Placement</th><th className="p-3">Last changed</th><th className="p-3">Action</th></tr></thead><tbody>{data.boosts.map(row => <tr key={row.id} className="border-b"><td className="p-3">{row.title || 'Title unavailable'}<small className="block text-slate-500">{row.id}</small></td><td className="p-3">{[row.city, row.district].filter(Boolean).join(', ') || 'Location unavailable'}</td><td className="p-3">{row.enabled ? 'Enabled' : 'Disabled'}</td><td className="p-3">{row.changed_at ? new Date(row.changed_at).toLocaleString() : 'Never changed'}</td><td className="p-3"><button className="border rounded px-3 py-2 disabled:opacity-50" disabled={busy !== null} onClick={() => change(row)} aria-label={`${row.enabled ? 'Disable' : 'Enable'} featured placement for ${row.title || row.id}`}>{busy === row.id ? 'Saving…' : row.enabled ? 'Disable' : 'Enable'}</button></td></tr>)}</tbody></table></div>}
            <div className="flex items-center gap-4"><button className="border rounded px-3 py-2 disabled:opacity-50" disabled={query.page === 1 || busy !== null} onClick={() => setQuery(value => ({ ...value, page: value.page - 1 }))}>Previous</button><span>Page {query.page} of {Math.max(1, Math.ceil(data.total / 20))}</span><button className="border rounded px-3 py-2 disabled:opacity-50" disabled={query.page * 20 >= data.total || busy !== null} onClick={() => setQuery(value => ({ ...value, page: value.page + 1 }))}>Next</button></div>
        </>}
    </div>;
}
