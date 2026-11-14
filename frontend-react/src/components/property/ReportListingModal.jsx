import { useEffect, useRef, useState } from 'react';
import api from '../../context/api';

export default function ReportListingModal({ propertyId, onClose }) {
  const dialog = useRef(null);
  const [category, setCategory] = useState('misleading');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const lock = useRef(false);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const submit = async event => {
    event.preventDefault(); if (lock.current) return;
    lock.current = true; setSaving(true); setError('');
    try {
      const { data } = await api.post('/reports/listings', { propertyId, category, reason: reason.trim() });
      if (!data?.report?.id) throw new Error('Submission was not confirmed.');
      setSent(true);
    } catch (err) { setError(err.response?.data?.message || 'Report could not be submitted. Please try again.'); }
    finally { lock.current = false; setSaving(false); }
  };
  return <dialog ref={dialog} onCancel={event => { if (saving) event.preventDefault(); else onClose(); }} aria-labelledby="report-listing-title" className="w-full max-w-lg rounded-2xl p-6 backdrop:bg-black/50">
    <h2 id="report-listing-title" className="text-xl font-bold mb-3">Report this listing</h2>
    {sent ? <><p role="status">Your report was submitted for review. A report does not automatically remove a listing.</p><button type="button" onClick={onClose} className="mt-5 px-4 py-2 rounded-lg bg-gray-900 text-white">Close</button></> : <form onSubmit={submit}>
      <p className="text-sm text-gray-600 mb-4">Describe your concern for the moderation team. Avoid including sensitive personal information.</p>
      <label className="block mb-3">Category<select value={category} onChange={e => setCategory(e.target.value)} disabled={saving} className="block w-full rounded-lg border p-2 mt-1">{['misleading', 'fraud', 'duplicate', 'unavailable', 'inappropriate', 'other'].map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
      <label className="block">Reason<textarea value={reason} onChange={e => setReason(e.target.value)} minLength={10} maxLength={2000} required disabled={saving} rows={5} className="block w-full rounded-lg border p-2 mt-1" /></label>
      <p className="text-sm text-gray-500">10–2,000 characters</p>
      {error && <p role="alert" className="text-red-700 mt-3">{error}</p>}
      <div className="flex justify-end gap-3 mt-5"><button type="button" disabled={saving} onClick={onClose}>Cancel</button><button disabled={saving || reason.trim().length < 10} className="rounded-lg bg-gray-900 text-white px-4 py-2 disabled:opacity-50">{saving ? 'Submitting…' : 'Submit report'}</button></div>
    </form>}
  </dialog>;
}
