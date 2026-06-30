import React, { useState, useEffect } from "react";
import { fetchAuditLogs } from "../api/adminApi";
import "../styles/admin-global.css";

const MOCK_LOGS = [
  { id: "LOG-001", actor: "Admin", action: "LISTING_APPROVED", target: "LST-1041 (3.5 Perches, Kandy)", timestamp: "2026-04-28 10:32:14", ip: "192.168.1.10", severity: "info" },
  { id: "LOG-002", actor: "Admin", action: "USER_BANNED", target: "Yasith Fernando (yasith@mail.com)", timestamp: "2026-04-28 09:18:05", ip: "192.168.1.10", severity: "warning" },
  { id: "LOG-003", actor: "Admin", action: "LISTING_REJECTED", target: "LST-1038 (Commercial Plot)", timestamp: "2026-04-27 16:44:22", ip: "192.168.1.10", severity: "warning" },
  { id: "LOG-004", actor: "System", action: "PAYMENT_RECEIVED", target: "TXN-9006 (LKR 5,000)", timestamp: "2026-04-27 14:02:51", ip: "PayHere-Webhook", severity: "info" },
  { id: "LOG-005", actor: "Admin", action: "SETTINGS_UPDATED", target: "Loan interest rate → 14%", timestamp: "2026-04-26 11:30:00", ip: "192.168.1.10", severity: "info" },
  { id: "LOG-006", actor: "System", action: "BACKUP_COMPLETED", target: "MongoDB Atlas snapshot", timestamp: "2026-04-26 02:00:00", ip: "Cron Job", severity: "success" },
  { id: "LOG-007", actor: "chaminda@mail.com", action: "LISTING_CREATED", target: "LST-1041", timestamp: "2026-04-25 18:15:33", ip: "203.94.12.55", severity: "info" },
  { id: "LOG-008", actor: "System", action: "RATE_LIMIT_HIT", target: "IP: 45.33.12.201 — /api/search", timestamp: "2026-04-25 17:55:10", ip: "45.33.12.201", severity: "danger" },
  { id: "LOG-009", actor: "Admin", action: "USER_UNBANNED", target: "saman@mail.com", timestamp: "2026-04-24 13:22:00", ip: "192.168.1.10", severity: "success" },
  { id: "LOG-010", actor: "System", action: "EMAIL_SENT", target: "ListingApproved → chaminda@mail.com", timestamp: "2026-04-24 12:05:44", ip: "SMTP-Service", severity: "info" },
];

const SEV_CLASSES = {
  info: "admin-badge-active",
  warning: "admin-badge-pending",
  danger: "admin-badge-rejected",
  success: "admin-badge-approved",
};

const AuditLogsPage = () => {
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");

  useEffect(() => {
    fetchAuditLogs()
      .then((d) => { if (d?.logs?.length) setLogs(d.logs); })
      .catch(() => {});
  }, []);

  const filtered = logs.filter((l) => {
    const matchSev = sevFilter === "all" || l.severity === sevFilter;
    const matchActor = actorFilter === "all" ||
      (actorFilter === "admin" && l.actor === "Admin") ||
      (actorFilter === "system" && l.actor === "System") ||
      (actorFilter === "user" && l.actor !== "Admin" && l.actor !== "System");
    const matchSearch = !search ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase());
    return matchSev && matchActor && matchSearch;
  });

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Audit Logs</h1>
          <p>Tamper-proof record of all system and admin actions</p>
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--admin-text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
          <span className="admin-badge admin-badge-approved">Read-Only</span>
          {filtered.length} entries
        </div>
      </div>

      <div className="admin-filters-row">
        <div className="admin-search-bar" style={{ flex: 1, maxWidth: 360 }}>
          <span style={{ color: "var(--admin-text-muted)" }}>🔍</span>
          <input
            placeholder="Search actions, targets, actors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="admin-filter-select" value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}>
          <option value="all">All Severity</option>
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="danger">Danger</option>
        </select>
        <select className="admin-filter-select" value={actorFilter} onChange={(e) => setActorFilter(e.target.value)}>
          <option value="all">All Actors</option>
          <option value="admin">Admin</option>
          <option value="system">System</option>
          <option value="user">Users</option>
        </select>
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        <div className="admin-data-table-wrap">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target / Detail</th>
                <th>IP</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty-state">
                      <div className="admin-empty-state-icon">📋</div>
                      <h3>No log entries match your filters</h3>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td><code style={{ fontSize: "0.72rem", color: "var(--admin-text-muted)" }}>{l.id}</code></td>
                  <td style={{ fontSize: "0.78rem", color: "var(--admin-text-secondary)", whiteSpace: "nowrap" }}>{l.timestamp}</td>
                  <td>
                    <span style={{
                      fontSize: "0.8rem", fontWeight: 600,
                      color: l.actor === "System" ? "var(--admin-info)" : l.actor === "Admin" ? "var(--admin-gold)" : "var(--admin-text-primary)"
                    }}>
                      {l.actor}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: "0.78rem", color: "var(--admin-text-primary)", background: "var(--admin-bg-secondary)", padding: "2px 6px", borderRadius: 4 }}>
                      {l.action}
                    </code>
                  </td>
                  <td style={{ fontSize: "0.825rem", maxWidth: 280 }}>{l.target}</td>
                  <td><code style={{ fontSize: "0.72rem", color: "var(--admin-text-muted)" }}>{l.ip}</code></td>
                  <td>
                    <span className={`admin-badge ${SEV_CLASSES[l.severity]}`}>{l.severity}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
