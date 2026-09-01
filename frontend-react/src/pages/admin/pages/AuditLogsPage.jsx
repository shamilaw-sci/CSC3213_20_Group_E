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

const MOCK_LOGS = [
  { id: "LOG-001", actor: "Super Admin", action: "LISTING_APPROVED", target: "REF: 41769d4f (Luxury Villa Colombo 03)", timestamp: "2026-08-21 16:40:14", ip: "192.168.1.10", severity: "info" },
  { id: "LOG-002", actor: "Super Admin", action: "USER_BANNED", target: "Fraudulent Seller (user_9402)", timestamp: "2026-08-21 15:18:05", ip: "192.168.1.10", severity: "warning" },
  { id: "LOG-003", actor: "Super Admin", action: "LISTING_REJECTED", target: "REF: 2e05f6a7 (Invalid Survey Boundary)", timestamp: "2026-08-21 14:44:22", ip: "192.168.1.10", severity: "warning" },
  { id: "LOG-004", actor: "System Gateway", action: "PAYMENT_SETTLED", target: "TXN-15000 (LKR 15,000 Listing Fee)", timestamp: "2026-08-21 12:02:51", ip: "Webhook-TLS1.3", severity: "success" },
  { id: "LOG-005", actor: "Super Admin", action: "SETTINGS_UPDATED", target: "Base Listing Fee → LKR 1,500", timestamp: "2026-08-21 10:30:00", ip: "192.168.1.10", severity: "info" },
  { id: "LOG-006", actor: "System Cron", action: "DATABASE_INTEGRITY_CHECK", target: "PostGIS Spatial R-Tree Index Verified", timestamp: "2026-08-21 02:00:00", ip: "Internal-Cron", severity: "success" },
  { id: "LOG-007", actor: "RateLimiter Guard", action: "RATE_LIMIT_BLOCKED", target: "IP: 45.33.12.201 — Threshold Exceeded", timestamp: "2026-08-20 17:55:10", ip: "45.33.12.201", severity: "danger" },
  { id: "LOG-008", actor: "Auth Daemon", action: "ADMIN_LOGIN_SUCCESS", target: "admin@gmail.com (Session Initialized)", timestamp: "2026-08-20 13:22:00", ip: "127.0.0.1", severity: "success" },
];

const AuditLogsPage = () => {
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("all");

  useEffect(() => {
    fetchAuditLogs()
      .then((d) => { if (d?.logs?.length) setLogs(d.logs); })
      .catch((err) => { toast.error("Failed to fetch audit logs"); console.error(err); });
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
          <h1>Security & Immutable Audit Trail</h1>
          <p>Cryptographically timestamped telemetry of all administrative and security actions</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Immutable Append-Only
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="admin-search-bar w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400" />
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
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
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
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No log entries matched your filter.
                </td>
              </tr>
            )}
            {filtered.map((l) => (
              <tr key={l.id}>
                <td>
                  <span className="font-mono text-xs font-bold text-slate-400">{l.id}</span>
                </td>
                <td>
                  <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    {l.action}
                  </span>
                </td>
                <td className="text-xs font-semibold text-blue-400">{l.actor}</td>
                <td>
                  <span className="text-xs text-slate-300 line-clamp-1 max-w-[240px]">{l.target}</span>
                </td>
                <td>
                  <span className="font-mono text-[11px] text-slate-400">{l.ip}</span>
                </td>
                <td className="text-xs text-slate-400 font-mono">{l.timestamp}</td>
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
