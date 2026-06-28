import React, { useState, useEffect } from "react";
import { fetchTransactionHistory, exportReport } from "../api/adminApi";
import "../styles/global.css";

const MOCK_TRANSACTIONS = [
  { id: "TXN-9001", listing: "3.5 Perches Land, Kandy", seller: "Chaminda Perera", amount: 3500, type: "Listing Fee", status: "Completed", date: "2026-04-25", paymentId: "PH-88001" },
  { id: "TXN-9002", listing: "Commercial Plot, Colombo 7", seller: "Yasith Fernando", amount: 5000, type: "Boost Fee", status: "Completed", date: "2026-04-23", paymentId: "PH-88002" },
  { id: "TXN-9003", listing: "10 Acres Farm, Nuwara Eliya", seller: "Nimal Silva", amount: 3500, type: "Listing Fee", status: "Completed", date: "2026-04-20", paymentId: "PH-88003" },
  { id: "TXN-9004", listing: "Residential Land, Gampaha", seller: "Priya Kumari", amount: 3500, type: "Listing Fee", status: "Refunded", date: "2026-04-18", paymentId: "PH-88004" },
  { id: "TXN-9005", listing: "Paddy Field, Anuradhapura", seller: "Bandula Ratne", amount: 3500, type: "Listing Fee", status: "Completed", date: "2026-04-15", paymentId: "PH-88005" },
  { id: "TXN-9006", listing: "Highland Land, Badulla", seller: "Saman Herath", amount: 5000, type: "Boost Fee", status: "Pending", date: "2026-04-28", paymentId: "PH-88006" },
];

const ReportsPage = () => {
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchTransactionHistory()
      .then((d) => { if (d?.transactions?.length) setTransactions(d.transactions); })
      .catch(() => {});
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
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Transaction history, financial summaries, and CSV/PDF exports</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-secondary"
            onClick={() => handleExport("transactions")}
            disabled={exporting}
          >
            {exporting ? <span className="spinner" /> : "⬇"} Export CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleExport("financial")}
            disabled={exporting}
          >
            {exporting ? <span className="spinner" /> : "📄"} Export PDF
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Transactions", value: filtered.length, color: "var(--text-primary)" },
          { label: "Revenue (Filtered)", value: fmtCur(totalRevenue), color: "var(--success)" },
          { label: "Listing Fees", value: filtered.filter((t) => t.type === "Listing Fee").length, color: "var(--gold)" },
          { label: "Boost Fees", value: filtered.filter((t) => t.type === "Boost Fee").length, color: "var(--info)" },
        ].map(({ label, value, color }) => (
          <div className="stat-card" key={label}>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ fontSize: "1.4rem", color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-row">
        <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="Listing Fee">Listing Fee</option>
          <option value="Boost Fee">Boost Fee</option>
        </select>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
        </select>
        <input type="date" className="filter-select" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <span style={{ color: "var(--text-muted)" }}>to</span>
        <input type="date" className="filter-select" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="data-table-wrap">
          <table className="data-table">
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
                    <div className="empty-state">
                      <div className="empty-state-icon">📄</div>
                      <h3>No transactions found</h3>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td><code style={{ fontSize: "0.75rem", color: "var(--gold)" }}>{t.id}</code></td>
                  <td style={{ fontSize: "0.85rem", maxWidth: 200 }}>{t.listing}</td>
                  <td style={{ fontSize: "0.85rem" }}>{t.seller}</td>
                  <td>
                    <span className={`badge ${t.type === "Boost Fee" ? "badge-active" : "badge-approved"}`}>
                      {t.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: "0.875rem" }}>{fmtCur(t.amount)}</td>
                  <td>
                    <span className={`badge ${
                      t.status === "Completed" ? "badge-approved" :
                      t.status === "Pending" ? "badge-pending" : "badge-rejected"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{t.date}</td>
                  <td><code style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{t.paymentId}</code></td>
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
