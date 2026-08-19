import React, { useState, useEffect } from "react";
import { fetchTransactionHistory, exportReport } from "../api/adminApi";
import "../styles/admin-global.css";
import toast from 'react-hot-toast';

const ReportsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchTransactionHistory()
      .then((d) => { 
        if (d?.transactions) {
          const mapped = d.transactions.map((t) => ({
            id: `TXN-${t.id}`,
            listing: t.properties?.title || "Unknown Property",
            seller: t.properties?.users?.name || "Unknown Seller",
            amount: Number(t.amount || 0),
            type: "Listing Fee", // Future enhancement: differentiate fees
            status: t.status === "SUCCESS" ? "Completed" : t.status,
            date: t.created_at?.slice(0, 10) || "Unknown",
            paymentId: t.transaction_id || "N/A",
          }));
          setTransactions(mapped);
        }
      })
      .catch((err) => (toast.error("Failed to load transactions"), console.error("Failed to load transactions", err)));
  }, []);

  const handleExport = async (type) => {
    setExporting(true);
    try {
      await exportReport(type, { dateFrom, dateTo });
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const filtered = transactions.filter((t) => {
    const matchType = typeFilter === "all" || t.type === typeFilter;
    const matchStatus = statusFilter === "all" || t.status.toLowerCase() === statusFilter;
    return matchType && matchStatus;
  });

  const totalRevenue = filtered
    .filter((t) => t.status === "Completed")
    .reduce((s, t) => s + t.amount, 0);

  const fmtCur = (n) => `LKR ${new Intl.NumberFormat("en-LK").format(n)}`;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Reports</h1>
          <p>Transaction history, financial summaries, and CSV/PDF exports</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button aria-label="Accessible interactive control" type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => handleExport("transactions")}
            disabled={exporting}
          >
            {exporting ? <span className="admin-spinner" /> : "⬇"} Export CSV
          </button>
          <button aria-label="Accessible interactive control" type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => handleExport("financial")}
            disabled={exporting}
          >
            {exporting ? <span className="admin-spinner" /> : "📄"} Export PDF
          </button>
        </div>
      </div>

      <div className="admin-grid admin-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Transactions", value: filtered.length, color: "var(--admin-text-primary)" },
          { label: "Revenue (Filtered)", value: fmtCur(totalRevenue), color: "var(--admin-success)" },
          { label: "Listing Fees", value: filtered.filter((t) => t.type === "Listing Fee").length, color: "var(--admin-gold)" },
          { label: "Boost Fees", value: filtered.filter((t) => t.type === "Boost Fee").length, color: "var(--admin-info)" },
        ].map(({ label, value, color }) => (
          <div className="admin-stat-card" key={label}>
            <div className="admin-stat-label">{label}</div>
            <div className="admin-stat-value" style={{ fontSize: "1.4rem", color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="admin-filters-row">
        <select aria-label="Accessible interactive control" className="admin-filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="Listing Fee">Listing Fee</option>
          <option value="Boost Fee">Boost Fee</option>
        </select>
        <select aria-label="Accessible interactive control" className="admin-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
        </select>
        <input aria-label="Accessible interactive control" type="date" className="admin-filter-select" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <span style={{ color: "var(--admin-text-muted)" }}>to</span>
        <input aria-label="Accessible interactive control" type="date" className="admin-filter-select" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        <div className="admin-data-table-wrap">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>TXN ID</th>
                <th>Listing</th>
                <th>Seller</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>PayHere ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-empty-state">
                      <div className="admin-empty-state-icon">📄</div>
                      <h3>No transactions found</h3>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td><code style={{ fontSize: "0.75rem", color: "var(--admin-gold)" }}>{t.id}</code></td>
                  <td style={{ fontSize: "0.85rem", maxWidth: 200 }}>{t.listing}</td>
                  <td style={{ fontSize: "0.85rem" }}>{t.seller}</td>
                  <td>
                    <span className={`admin-badge ${t.type === "Boost Fee" ? "admin-badge-active" : "admin-badge-approved"}`}>
                      {t.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: "0.875rem" }}>{fmtCur(t.amount)}</td>
                  <td>
                    <div className="admin-status-badge" style={{
                      color: t.status.toLowerCase() === "completed" ? "var(--admin-success)" : t.status.toLowerCase() === "pending" ? "var(--admin-warning)" : "var(--admin-error)",
                      background: t.status.toLowerCase() === "completed" ? "var(--admin-bg-success)" : t.status.toLowerCase() === "pending" ? "var(--admin-bg-warning)" : "var(--admin-bg-error)"
                    }}>
                      {t.status}
                    </div>
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "var(--admin-text-secondary)" }}>{t.date}</td>
                  <td><code style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)" }}>{t.paymentId}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
