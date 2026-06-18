import React, { useState, useEffect } from "react";
import { fetchDashboardStats, fetchRevenueData, fetchUserGrowth } from "../api/adminApi";
import "../styles/global.css";
import "../styles/Dashboard.css";

// Simple bar chart using pure CSS/SVG
const BarChart = ({ data = [], color = "var(--gold)" }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value || 0), 1);
  return (
    <div className="bar-chart">
      {data.map((d, i) => (
        <div key={i} className="bar-col">
          <div
            className="bar-fill"
            style={{ height: `${(d.value / max) * 100}%`, background: color }}
          />
          <span className="bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

// Mini line spark
const Spark = ({ values = [], color = "var(--gold)" }) => {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const W = 80; const H = 30;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - ((v - min) / range) * H;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ overflow: "visible" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
};

const MOCK_STATS = {
  totalListings: 148,
  pendingApproval: 12,
  activeListings: 124,
  totalUsers: 893,
  buyerCount: 741,
  sellerCount: 152,
  totalRevenue: 287500,
  monthRevenue: 42000,
  rejectedListings: 12,
};

const MOCK_REVENUE = [
  { label: "Nov", value: 28000 }, { label: "Dec", value: 35000 },
  { label: "Jan", value: 31000 }, { label: "Feb", value: 38000 },
  { label: "Mar", value: 41000 }, { label: "Apr", value: 42000 },
];

const MOCK_USER_GROWTH = [
  { label: "Nov", value: 640 }, { label: "Dec", value: 710 },
  { label: "Jan", value: 740 }, { label: "Feb", value: 800 },
  { label: "Mar", value: 855 }, { label: "Apr", value: 893 },
];

const MOCK_PENDING = [
  { id: "LST-1041", title: "3.5 Perches Land, Kandy", seller: "Chaminda Perera", date: "2026-04-25", price: "LKR 4.2M" },
  { id: "LST-1042", title: "10 Acres Farm, Nuwara Eliya", seller: "Nimal Silva", date: "2026-04-26", price: "LKR 18M" },
  { id: "LST-1043", title: "Commercial Plot, Colombo 7", seller: "Yasith Fernando", date: "2026-04-27", price: "LKR 28M" },
];

const DashboardPage = () => {
  const [stats, setStats] = useState(MOCK_STATS);
  const [revenue, setRevenue] = useState(MOCK_REVENUE);
  const [userGrowth, setUserGrowth] = useState(MOCK_USER_GROWTH);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Attempt live data; fall back to mock on failure
    const load = async () => {
      setLoading(true);
      try {
        const [s, r, u] = await Promise.all([
          fetchDashboardStats(),
          fetchRevenueData("monthly"),
          fetchUserGrowth(),
        ]);
        if (s) setStats(s);
        if (r?.data) setRevenue(r.data);
        if (u?.data) setUserGrowth(u.data);
      } catch {
        // use mock data silently
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmt = (n) => new Intl.NumberFormat("en-LK").format(n);
  const fmtCur = (n) => `LKR ${new Intl.NumberFormat("en-LK").format(n)}`;

  return (
    <div className="dashboard-page">
      {/* Stats Row */}
      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        {/* Listings */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--gold-dim)", color: "var(--gold)" }}>🏠</div>
          <div className="stat-label">Total Listings</div>
          <div className="stat-value">{fmt(stats.totalListings)}</div>
          <div className="stat-change up">▲ 8 this month</div>
        </div>

        {/* Pending */}
        <div className="stat-card" style={{ "--accent": "var(--warning)" }}>
          <div className="stat-icon" style={{ background: "var(--warning-dim)", color: "var(--warning)" }}>⏳</div>
          <div className="stat-label">Pending Approval</div>
          <div className="stat-value" style={{ color: "var(--warning)" }}>{fmt(stats.pendingApproval)}</div>
          <div className="stat-change" style={{ color: "var(--text-secondary)" }}>Requires action</div>
        </div>

        {/* Users */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--info-dim)", color: "var(--info)" }}>👥</div>
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{fmt(stats.totalUsers)}</div>
          <div className="stat-change up">▲ 38 this month</div>
        </div>

        {/* Revenue */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--success-dim)", color: "var(--success)" }}>💰</div>
          <div className="stat-label">Monthly Revenue</div>
          <div className="stat-value" style={{ fontSize: "1.4rem" }}>{fmtCur(stats.monthRevenue)}</div>
          <div className="stat-change up">▲ 2.4% vs last month</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-2" style={{ marginBottom: 28 }}>
        {/* Revenue Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Revenue (6 Months)</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Listing fees — LKR</span>
          </div>
          <BarChart data={revenue} color="var(--gold)" />
        </div>

        {/* User Growth */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">User Growth</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Registered accounts</span>
          </div>
          <BarChart data={userGrowth} color="var(--info)" />
        </div>
      </div>

      {/* User Split + Pending Listings */}
      <div className="grid grid-2">
        {/* Breakdown */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Platform Overview</span>
          </div>
          <div className="overview-rows">
            {[
              { label: "Active Listings", value: fmt(stats.activeListings), color: "var(--success)" },
              { label: "Pending Approval", value: fmt(stats.pendingApproval), color: "var(--warning)" },
              { label: "Rejected / Removed", value: fmt(stats.rejectedListings), color: "var(--danger)" },
              { label: "Buyers Registered", value: fmt(stats.buyerCount), color: "var(--info)" },
              { label: "Sellers Registered", value: fmt(stats.sellerCount), color: "var(--gold)" },
              { label: "Total Revenue", value: fmtCur(stats.totalRevenue), color: "var(--success)" },
            ].map(({ label, value, color }) => (
              <div className="overview-row" key={label}>
                <span className="overview-label">{label}</span>
                <span className="overview-val" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Listings */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pending Listings</span>
            <a href="/listings?status=pending" className="btn btn-secondary btn-sm">View All</a>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_PENDING.map((p) => (
                  <tr key={p.id}>
                    <td><code style={{ fontSize: "0.75rem", color: "var(--gold)" }}>{p.id}</code></td>
                    <td>
                      <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{p.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{p.seller}</div>
                    </td>
                    <td style={{ fontSize: "0.8rem" }}>{p.price}</td>
                    <td style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
