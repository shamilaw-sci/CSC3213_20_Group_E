import React, { useState, useEffect } from "react";
import { fetchDashboardStats, fetchRevenueData, fetchUserGrowth, fetchListings } from "../api/adminApi";
import "../styles/admin-global.css";
import "../styles/admin-dashboard.css";

// Simple bar chart using pure CSS/SVG
const BarChart = ({ data = [], color = "var(--admin-gold)" }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value || 0), 1);
  return (
    <div className="admin-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="admin-bar-col">
          <div
            className="admin-bar-fill"
            style={{ height: `${(d.value / max) * 100}%`, background: color }}
          />
          <span className="admin-bar-label">{d.label}</span>
        </div>
      ))}
    </div>
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
  const [pendingListings, setPendingListings] = useState(MOCK_PENDING);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, r, u, pending] = await Promise.all([
          fetchDashboardStats(),
          fetchRevenueData("monthly"),
          fetchUserGrowth(),
          fetchListings({ status: "pending" }),
        ]);
        if (s) setStats(s);
        if (r?.data) setRevenue(r.data);
        if (u?.data) setUserGrowth(u.data);
        if (pending?.listings) {
          setPendingListings(
            pending.listings.slice(0, 5).map((listing) => ({
              id: listing.id,
              title: listing.title,
              seller: listing.seller_id || "Seller",
              date: listing.created_at?.slice(0, 10) || "-",
              price: `LKR ${Number(listing.price || 0).toLocaleString("en-LK")}`,
            }))
          );
        }
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
    <div className="admin-dashboard-page">
      {/* Stats Row */}
      <div className="admin-grid admin-grid-4" style={{ marginBottom: 28 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: "var(--admin-gold-dim)", color: "var(--admin-gold)" }}>🏠</div>
          <div className="admin-stat-label">Total Listings</div>
          <div className="admin-stat-value">{fmt(stats.totalListings)}</div>
          <div className="admin-stat-change up">▲ 8 this month</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: "var(--admin-warning-dim)", color: "var(--admin-warning)" }}>⏳</div>
          <div className="admin-stat-label">Pending Approval</div>
          <div className="admin-stat-value" style={{ color: "var(--admin-warning)" }}>{fmt(stats.pendingApproval)}</div>
          <div className="admin-stat-change" style={{ color: "var(--admin-text-secondary)" }}>Requires action</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: "var(--admin-info-dim)", color: "var(--admin-info)" }}>👥</div>
          <div className="admin-stat-label">Total Users</div>
          <div className="admin-stat-value">{fmt(stats.totalUsers)}</div>
          <div className="admin-stat-change up">▲ 38 this month</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: "var(--admin-success-dim)", color: "var(--admin-success)" }}>💰</div>
          <div className="admin-stat-label">Monthly Revenue</div>
          <div className="admin-stat-value" style={{ fontSize: "1.4rem" }}>{fmtCur(stats.monthRevenue)}</div>
          <div className="admin-stat-change up">▲ 2.4% vs last month</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="admin-grid admin-grid-2" style={{ marginBottom: 28 }}>
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Revenue (6 Months)</span>
            <span style={{ fontSize: "0.8rem", color: "var(--admin-text-secondary)" }}>Listing fees — LKR</span>
          </div>
          <BarChart data={revenue} color="var(--admin-gold)" />
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">User Growth</span>
            <span style={{ fontSize: "0.8rem", color: "var(--admin-text-secondary)" }}>Registered accounts</span>
          </div>
          <BarChart data={userGrowth} color="var(--admin-info)" />
        </div>
      </div>

      {/* User Split + Pending Listings */}
      <div className="admin-grid admin-grid-2">
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Platform Overview</span>
          </div>
          <div className="admin-overview-rows">
            {[
              { label: "Active Listings", value: fmt(stats.activeListings), color: "var(--admin-success)" },
              { label: "Pending Approval", value: fmt(stats.pendingApproval), color: "var(--admin-warning)" },
              { label: "Rejected / Removed", value: fmt(stats.rejectedListings), color: "var(--admin-danger)" },
              { label: "Buyers Registered", value: fmt(stats.buyerCount), color: "var(--admin-info)" },
              { label: "Sellers Registered", value: fmt(stats.sellerCount), color: "var(--admin-gold)" },
              { label: "Total Revenue", value: fmtCur(stats.totalRevenue), color: "var(--admin-success)" },
            ].map(({ label, value, color }) => (
              <div className="admin-overview-row" key={label}>
                <span className="admin-overview-label">{label}</span>
                <span className="admin-overview-val" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Pending Listings</span>
            <a href="/admin/listings" className="admin-btn admin-btn-secondary admin-btn-sm">View All</a>
          </div>
          <div className="admin-data-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {pendingListings.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ color: "var(--admin-text-secondary)", textAlign: "center" }}>
                      No properties waiting for approval.
                    </td>
                  </tr>
                )}
                {pendingListings.map((p) => (
                  <tr key={p.id}>
                    <td><code style={{ fontSize: "0.75rem", color: "var(--admin-gold)" }}>{p.id}</code></td>
                    <td>
                      <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{p.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)" }}>{p.seller}</div>
                    </td>
                    <td style={{ fontSize: "0.8rem" }}>{p.price}</td>
                    <td style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)" }}>{p.date}</td>
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
