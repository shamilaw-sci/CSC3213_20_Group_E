import { logClientError } from '../../../utils/clientLog';
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { fetchAuditLogs } from "../api/adminApi";
import "../styles/admin-global.css";
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Lock, 
  Terminal,
  Activity
} from "lucide-react";

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("all");

  useEffect(() => {
    fetchAuditLogs()
      .then((d) => { setLogs(d?.logs || []); setLoadError(false); })
      .catch(() => { setLogs([]); setLoadError(true); toast.error("Failed to fetch audit logs"); logClientError('admin_audit_logs_load_failed'); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => {
    const matchSev = sevFilter === "all" || l.severity === sevFilter;
    const matchSearch = !search ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase());
    return matchSev && matchSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1>Admin Audit Trail</h1>
          <p>Latest 500 recorded Admin changes. Search by action, Admin name or target ID.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Recorded Admin Changes
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="admin-search-bar w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Search action, actor or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {["all", "info", "success", "warning", "danger"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSevFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${
                sevFilter === s
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="admin-data-table-wrap">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Event ID</th>
              <th>Action Triggered</th>
              <th>Actor (Initiator)</th>
              <th>Target / Resource</th>
              <th>IP Origin</th>
              <th>Timestamp</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400">
                  {loading ? 'Loading audit records?' : loadError ? 'Audit records could not be loaded. Refresh to retry.' : logs.length === 0 ? 'No recorded Admin changes yet.' : 'No log entries matched your filter.'}
                </td>
              </tr>
            )}
            {filtered.map((l) => (
              <tr key={l.id}>
                <td>
                  <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">{l.id}</span>
                </td>
                <td>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700">
                    {l.action}
                  </span>
                </td>
                <td className="text-xs font-semibold text-slate-900 dark:text-blue-400">{l.actor}</td>
                <td>
                  <span className="text-xs text-slate-500 dark:text-slate-300 line-clamp-1 max-w-[240px]">{l.target}</span>
                </td>
                <td>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{l.ip}</span>
                </td>
                <td className="text-xs text-slate-600 dark:text-slate-400 font-mono">{new Date(l.timestamp).toLocaleString('en-LK')}</td>
                <td>
                  <span className={`admin-badge ${
                    l.severity === 'success' ? 'admin-badge-approved' :
                    l.severity === 'danger' ? 'admin-badge-rejected' :
                    l.severity === 'warning' ? 'admin-badge-pending' :
                    'admin-badge-active'
                  }`}>
                    {l.severity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AuditLogsPage;
