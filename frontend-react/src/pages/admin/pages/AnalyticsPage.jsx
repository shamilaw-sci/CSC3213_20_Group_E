import React, { useState, useEffect } from "react";
import { fetchDashboardStats, fetchRevenueData, fetchUserGrowth } from "../api/adminApi";
import "../styles/admin-global.css";

// Simple SVG Donut Chart
const DonutChart = ({ segments, size = 120 }) => {
  if (!segments || segments.length === 0) return null;
  const r = 46; const cx = 60; const cy = 60;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, g) => s + g.value, 0) || 1;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--admin-border)" strokeWidth="20" />
      {segments.map((seg, i) => {
        if (seg.value === 0) return null;
        const dash = (seg.value / total) * circ;
        const gap = circ - dash;
        const el = (
          <circle
            key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={seg.color} strokeWidth="20"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px", transition: "stroke-dasharray 1s ease" }}
          />
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--admin-text-secondary)" fontSize="9">TOTAL</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--admin-text-primary)" fontSize="14" fontWeight="600">
        {total}
      </text>
    </svg>
  );
};

const AnalyticsPage = () => {
  const [period, setPeriod] = useState("monthly");
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async (p) => {
    setLoading(true);
    try {
      const [s, r, u] = await Promise.all([
        fetchDashboardStats(),
        fetchRevenueData(p),
        fetchUserGrowth(p)
      ]);
      if (s) setStats(s);
      if (r?.data) setRevenue(r.data);
      if (u?.data) setUserGrowth(u.data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics(period);
  }, []); // Only run on mount

  const maxRevenue = Math.max(...revenue.map((d) => d.value), 1);
  const maxGrowth = Math.max(...userGrowth.map((d) => d.value), 1);

  const listingTypeSegments = stats?.listingTypes?.map((t, i) => ({
    label: t.label,
    value: t.value,
    color: ["var(--admin-gold)", "var(--admin-info)", "var(--admin-success)", "var(--admin-warning)"][i % 4]
  })) || [];

  const roleSegments = [
    { label: "Buyers", value: stats?.buyerCount || 0, color: "var(--admin-info)" },
    { label: "Sellers", value: stats?.sellerCount || 0, color: "var(--admin-gold)" },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Analytics & Reports</h1>
          <p>Real-time platform statistics from your database</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["monthly"].map((p) => (
            <button aria-label="Accessible interactive control" type="button"
              key={p}
              className={`admin-btn admin-btn-sm ${period === p ? "admin-btn-primary" : "admin-btn-secondary"}`}
              onClick={() => {
                setPeriod(p);
                loadAnalytics(p);
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--admin-text-secondary)" }}>
          Loading real-time analytics...
        </div>
      ) : (
        <>
          <div className="admin-grid admin-grid-4" style={{ marginBottom: 28 }}>
            {[
              { label: "Total Properties", value: stats?.totalProperties || 0, icon: "🏠", color: "var(--admin-gold)" },
              { label: "Total Users", value: stats?.totalUsers || 0, icon: "👥", color: "var(--admin-info)" },
              { label: "Active Listings", value: stats?.activeListings || 0, icon: "✅", color: "var(--admin-success)" },
              { label: "Total Revenue", value: `LKR ${(stats?.revenue || 0).toLocaleString()}`, icon: "💰", color: "var(--admin-warning)" },
            ].map(({ label, value, icon, color }) => (
              <div className="admin-stat-card" key={label}>
                <div className="admin-stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
                <div className="admin-stat-label">{label}</div>
                <div className="admin-stat-value" style={{ fontSize: "1.5rem", color }}>{value}</div>
              </div>
            ))}
          </div>

          <div className="admin-grid admin-grid-2" style={{ marginBottom: 24 }}>
            <div className="admin-card">
              <div className="admin-card-header">
                <span className="admin-card-title">Revenue Trends</span>
                <span style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)" }}>Monthly Revenue (LKR)</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
                {revenue.map(({ label, value }) => (
                  <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "0.6rem", color: "var(--admin-text-secondary)" }}>{value > 0 ? (value/1000).toFixed(1)+'k' : '0'}</span>
                    <div style={{
                      width: "100%", borderRadius: "4px 4px 0 0",
                      background: "var(--admin-gold)", height: `${(value / maxRevenue) * 100}%`,
                      minHeight: 4, transition: "height 0.5s ease"
                    }} />
                    <span style={{ fontSize: "0.7rem", color: "var(--admin-text-secondary)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <span className="admin-card-title">User Growth</span>
                <span style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)" }}>Cumulative registrations</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
                {userGrowth.map(({ label, value }) => (
                  <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--admin-text-secondary)" }}>{value}</span>
                    <div style={{
                      width: "100%", borderRadius: "4px 4px 0 0",
                      background: "var(--admin-info)", height: `${(value / maxGrowth) * 100}%`,
                      minHeight: 4, transition: "height 0.5s ease"
                    }} />
                    <span style={{ fontSize: "0.7rem", color: "var(--admin-text-secondary)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-grid admin-grid-2">
            <div className="admin-card">
              <div className="admin-card-header">
                <span className="admin-card-title">Listing Types</span>
                <span style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)" }}>By property category</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                <DonutChart segments={listingTypeSegments} />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {listingTypeSegments.map(({ label, value, color }) => {
                    const total = listingTypeSegments.reduce((s, g) => s + g.value, 0) || 1;
                    const pct = Math.round((value / total) * 100);
                    return (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                        <span style={{ fontSize: "0.85rem" }}>{label}</span>
                        <span style={{ marginLeft: "auto", fontWeight: 600, fontSize: "0.85rem", color }}>{pct}% ({value})</span>
                      </div>
                    );
                  })}
                  {listingTypeSegments.length === 0 && <span style={{fontSize:"0.85rem", color:"var(--admin-text-muted)"}}>No properties yet.</span>}
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <span className="admin-card-title">User Roles</span>
                <span style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)" }}>Buyers vs Sellers</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                <DonutChart segments={roleSegments} />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {roleSegments.map(({ label, value, color }) => {
                    const total = roleSegments.reduce((s, g) => s + g.value, 0) || 1;
                    const pct = Math.round((value / total) * 100);
                    return (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                        <span style={{ fontSize: "0.85rem" }}>{label}</span>
                        <span style={{ marginLeft: "auto", fontWeight: 600, fontSize: "0.85rem", color }}>{pct}% ({value})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
