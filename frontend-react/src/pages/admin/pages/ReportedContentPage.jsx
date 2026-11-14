import { useEffect, useRef, useState } from 'react';
import { fetchReportedContent, resolveReport } from '../api/adminApi';
import '../styles/admin-global.css';

function DecisionDialog({ report, onClose, onSaved }) {
  const dialog = useRef(null);
  const lock = useRef(false);
  const [action, setAction] = useState('dismiss');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { dialog.current?.showModal(); }, []);
  const save = async event => {
    event.preventDefault(); if (lock.current) return;
    lock.current = true; setSaving(true); setError('');
    try {
      const result = await resolveReport(report.id, { action, note: note.trim(), expectedStatus: 'open' });
      if (!result?.report?.id || result.report.status === 'open') throw new Error('Unconfirmed decision');
      onSaved(result.warning || 'Report decision saved.');
    } catch (err) { setError(err.response?.data?.message || 'Decision could not be saved. Refresh to check the current report state before retrying.'); }
    finally { lock.current = false; setSaving(false); }
  };
  return <dialog ref={dialog} onCancel={event => { if (saving) event.preventDefault(); else onClose(); }} aria-labelledby="report-decision-title" className="w-full max-w-xl rounded-xl p-6 backdrop:bg-black/50">
    <h2 id="report-decision-title" className="text-xl font-bold">Review report</h2>
    <p className="my-3">{report.property?.title || 'Listing title unavailable'}</p><p className="whitespace-pre-wrap break-words">{report.reason}</p>
    <form onSubmit={save} className="mt-4"><label className="block">Decision<select disabled={saving} value={action} onChange={e => setAction(e.target.value)} className="block border rounded p-2 w-full mt-1"><option value="dismiss">Dismiss report</option><option value="archive_listing">Archive listing</option></select></label>
      <p className="text-sm my-3">{action === 'dismiss' ? 'Dismissal leaves the listing publication unchanged.' : 'Confirm archival: the listing will leave public discovery. Payment and conversation history remain.'}</p>
      <label className="block">Internal resolution note<textarea required minLength={10} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} disabled={saving} rows={4} className="block border rounded p-2 w-full mt-1" /></label><p className="text-sm">10–2,000 characters. Admin only.</p>
      {error && <p role="alert" className="text-red-700 mt-3">{error}</p>}
      <div className="flex justify-end gap-4 mt-5"><button type="button" disabled={saving} onClick={onClose}>Cancel</button><button disabled={saving || note.trim().length < 10} className="bg-gray-900 text-white rounded px-4 py-2 disabled:opacity-50">{saving ? 'Saving…' : action === 'dismiss' ? 'Confirm dismissal' : 'Confirm archive'}</button></div>
    </form>
  </dialog>;
}

export default function ReportedContentPage() {
  const [filters, setFilters] = useState({ status: 'open', search: '', from: '', to: '' });
  const [query, setQuery] = useState({ status: 'open', page: 1, limit: 20 });
  const [reload, setReload] = useState(0);
  const [data, setData] = useState(null);
  const [phase, setPhase] = useState('loading');
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    let cancelled = false; setPhase('loading');
    fetchReportedContent(query).then(result => {
      if (!Array.isArray(result?.reports) || !Number.isInteger(result.total)) throw new Error('Invalid report response');
      if (!cancelled) { setData(result); setPhase('ready'); }
    }).catch(() => { if (!cancelled) setPhase('error'); });
    return () => { cancelled = true; };
  }, [query, reload]);
  const date = value => value ? new Date(value).toLocaleString('en-LK', { timeZone: 'Asia/Colombo' }) : 'Unavailable';
  return <div className="p-6 space-y-6">
    <div><h1 className="text-2xl font-bold">Reported content</h1><p className="text-gray-500 mt-1">Listing complaints submitted by signed-in users. Reports are concerns for review, not findings.</p></div>
    <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); setQuery({ ...filters, from: filters.from || undefined, to: filters.to || undefined, page: 1, limit: 20 }); }}>
      <label>Status<select className="block border rounded p-2" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>{['open', 'dismissed', 'actioned', 'all'].map(s => <option key={s} value={s}>{s}</option>)}</select></label>
      <label>Listing title<input className="block border rounded p-2" maxLength={100} value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} /></label>
      <label>From<input className="block border rounded p-2" type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} /></label>
      <label>To<input className="block border rounded p-2" type="date" min={filters.from || undefined} value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} /></label>
      <button className="border rounded px-4 py-2">Apply filters</button><button type="button" className="border rounded px-4 py-2" onClick={() => setReload(v => v + 1)}>Refresh</button>
    </form>
    <p className="text-sm text-gray-500">Dates and times use Sri Lanka time.</p>
    {feedback && <p role="status" className="border rounded p-3">{feedback}</p>}
    {phase === 'loading' && <p role="status">Loading reports…</p>}
    {phase === 'error' && <p role="alert">Reports could not be loaded. Use Refresh to try again.</p>}
    {phase === 'ready' && <>{data.reports.length === 0 ? <p>No reports match these filters.</p> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{['Listing / report', 'Reporter (Admin only)', 'Concern', 'Status / decision', 'Action'].map(h => <th className="p-3 border-b" key={h}>{h}</th>)}</tr></thead><tbody>{data.reports.map(report => <tr key={report.id}>
      <td className="p-3 border-b align-top"><p>{report.property?.title || 'Listing title unavailable'}</p><p className="text-xs break-all">{report.property_id}</p><p className="text-xs">{report.property?.deleted_at ? 'Archived' : report.property?.status || 'Unavailable'}</p><p className="text-xs">{date(report.created_at)}</p></td>
      <td className="p-3 border-b align-top"><p>{report.reporter?.name || 'Name unavailable'}</p><p>{report.reporter?.email || 'Email unavailable'}</p><p className="text-xs break-all">{report.reporter_id}</p></td>
      <td className="p-3 border-b align-top max-w-sm"><p>{report.category}</p><p className="whitespace-pre-wrap break-words">{report.reason}</p></td>
      <td className="p-3 border-b align-top max-w-sm"><p>{report.status}</p>{report.status !== 'open' && <><p className="whitespace-pre-wrap break-words">{report.resolution_note}</p><p className="text-xs">{date(report.resolved_at)}</p><p className="text-xs break-all">Resolver: {report.resolved_by}</p></>}</td>
      <td className="p-3 border-b align-top">{report.status === 'open' ? <button className="border rounded px-3 py-2" onClick={() => setSelected(report)}>Review</button> : 'Resolved'}</td>
    </tr>)}</tbody></table></div>}
      <div className="flex gap-4 items-center"><button disabled={query.page <= 1} onClick={() => setQuery({ ...query, page: query.page - 1 })}>Previous</button><span>Page {query.page} · {data.total} reports</span><button disabled={query.page * query.limit >= data.total} onClick={() => setQuery({ ...query, page: query.page + 1 })}>Next</button></div>
    </>}
    {selected && <DecisionDialog report={selected} onClose={() => setSelected(null)} onSaved={message => { setFeedback(message); setSelected(null); setReload(v => v + 1); }} />}
  </div>;
}
