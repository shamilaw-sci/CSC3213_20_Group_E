import React, { useEffect, useState } from 'react';
import { MapContainer, GeoJSON, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import districtGeography from '../../../assets/sri-lanka-districts.json';
import { fetchSearchHeatmap } from '../api/adminApi';

export default function SearchDemandPanel() {
  const [range, setRange] = useState({ from: '', to: '' });
  const [requestedRange, setRequestedRange] = useState({});
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetchSearchHeatmap(requestedRange).then(response => {
      if (active) setData(response);
    }).catch(err => {
      if (active) { setData(null); setError(err.response?.data?.message || 'Search demand could not be loaded.'); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [requestedRange]);
  const rows = data?.districts || [];
  const counts = Object.fromEntries(rows.map(row => [row.district.toLowerCase(), row.count]));
  const max = Math.max(1, ...rows.map(row => row.count));
  const countFor = feature => counts[String(feature.properties.shapeName || feature.properties.name || '').replace(/ District$/i, '').toLowerCase()] || 0;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5" aria-labelledby="district-search-title">
      <div>
        <h2 id="district-search-title" className="text-lg font-bold text-slate-900">District search demand</h2>
        <p className="text-sm text-slate-500">Recorded submissions by district, using Sri Lanka calendar days.</p>
      </div>
      <form className="flex flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault(); setRequestedRange({ ...range }); }}>
        <label className="text-sm text-slate-700">From<input type="date" value={range.from} onChange={event => setRange(value => ({ ...value, from: event.target.value }))} className="block rounded border p-2" /></label>
        <label className="text-sm text-slate-700">To<input type="date" value={range.to} onChange={event => setRange(value => ({ ...value, to: event.target.value }))} className="block rounded border p-2" /></label>
        <button disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">{loading ? 'Loading…' : 'Refresh demand'}</button>
        <span className="text-xs text-slate-500">Default: last 30 days. Maximum: 366 days.</span>
      </form>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {loading && <p role="status" className="text-sm text-slate-500">Loading recorded searches…</p>}
      {!loading && data && <>
        <p className="text-sm text-slate-600">{data.total.toLocaleString()} recorded searches · {data.window.from} to {data.window.to}. Tracking started {data.trackingStartedAt ? new Date(data.trackingStartedAt).toLocaleString('en-LK', { timeZone: 'Asia/Colombo' }) : 'unavailable'} (Sri Lanka).</p>
        <p className="text-xs text-slate-500">{data.explanation}</p>
        {rows.length === 0 ? <p className="text-sm text-slate-600">No district searches were recorded in this window. Earlier searches are not reconstructed.</p> : <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="h-80 overflow-hidden rounded-lg" aria-label="District demand map; exact counts are in the adjacent table">
              <MapContainer center={[7.9, 80.7]} zoom={7} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <GeoJSON key={`${data.window.from}-${data.window.to}-${data.total}`} data={districtGeography}
                  style={feature => ({ color: '#475569', weight: 1, fillColor: '#2563eb', fillOpacity: countFor(feature) ? 0.15 + 0.7 * countFor(feature) / max : 0 })}
                  onEachFeature={(feature, layer) => {
                    // Leaflet strings are HTML. Use textContent for geography labels.
                    const label = document.createElement('span');
                    label.textContent = `${feature.properties.shapeName || feature.properties.name}: ${countFor(feature)} searches`;
                    layer.bindTooltip(label);
                  }} />
              </MapContainer>
            </div>
            <p className="mt-2 text-xs text-slate-500">Darker blue indicates more recorded searches. Unfilled districts have no recorded searches in this window.</p>
          </div>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Recorded district searches for the selected date window</caption>
              <thead><tr><th scope="col" className="p-2">District</th><th scope="col" className="p-2 text-right">Searches</th></tr></thead>
              <tbody>{rows.map(row => <tr key={row.district} className="border-t"><th scope="row" className="p-2 font-medium">{row.district}</th><td className="p-2 text-right tabular-nums">{row.count.toLocaleString()}</td></tr>)}</tbody>
            </table>
          </div>
        </div>}
      </>}
    </section>
  );
}
