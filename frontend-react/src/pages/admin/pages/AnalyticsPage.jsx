import SearchDemandPanel from '../components/SearchDemandPanel';
import { logClientError } from '../../../utils/clientLog';
import React, { useCallback, useEffect, useState } from "react";
import { fetchDashboardStats, fetchRevenueData, fetchUserGrowth } from "../api/adminApi";
import "../styles/admin-global.css";

// Simple SVG Donut Chart
const DonutChart = ({ segments, size = 120 }) => {
  if (!segments || segments.length === 0) return <p>No data (0).</p>;
  const r = 46; const cx = 60; const cy = 60;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, g) => s + (g.value || 0), 0);
  if (total === 0) return <p>No data (0).</p>;
  const arcs = segments.reduce((items, seg, i) => {
    if (!seg.value) return items;
    const dash = (seg.value / total) * circ;
    const gap = circ - dash;
    const previousOffset = items.reduce((sum, item) => sum + item.dash, 0);
    return [...items, { seg, i, dash, gap, strokeDashoffset: -previousOffset }];
  }, []);

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="20" />
      {arcs.map((arc) => {
        if (!arc) return null;
        const { seg, i, dash, gap, strokeDashoffset } = arc;
        return (
          <circle
            key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={seg.color} strokeWidth="20"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={strokeDashoffset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px", transition: "stroke-dasharray 1s ease" }}
          />
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="9">TOTAL</text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-slate-900 dark:fill-white" fontSize="14" fontWeight="600">
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
  const [loadError, setLoadError] = useState(false);

  const loadAnalytics = useCallback(async (p) => {
    setLoading(true);
    setLoadError(false);
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
      setLoadError(true);
      logClientError('admin_analytics_load_failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(period);
  }, [period, loadAnalytics]);

  const maxRevenue = Math.max(...revenue.map((d) => Number(d.value || 0)), 1);
  const maxGrowth = Math.max(...userGrowth.map((d) => Number(d.value ?? d.users ?? 0)), 1);

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
          <p>Recorded platform statistics, loaded from your database</p>
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
        <div className="text-slate-500 dark:text-slate-400" style={{ padding: "40px 0", textAlign: "center",  }}>
          Loading recorded analytics...
        </div>
      ) : loadError ? <p role="alert">Analytics unavailable. Refresh to retry.</p> : (
        <>
          <SearchDemandPanel />
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
                <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: "0.75rem"}}>Monthly Revenue (LKR)</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
                {revenue.map(({ label, value }) => {
                  const num = Number(value || 0);
                  return (
                    <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                      <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: "0.6rem"}}>{num > 0 ? (num/1000).toFixed(1)+'k' : '0'}</span>
                      <div style={{
                        width: "100%", borderRadius: "4px 4px 0 0",
                        background: "var(--admin-gold)", height: `${(num / maxRevenue) * 100}%`,
                        minHeight: 4, transition: "height 0.5s ease"
                      }} />
                      <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: "0.7rem"}}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <span className="admin-card-title">User Growth</span>
                <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: "0.75rem"}}>Cumulative registrations</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
                {userGrowth.map((d) => {
                  const label = d.label;
                  const val = Number(d.value ?? d.users ?? 0);
                  return (
                    <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                      <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: "0.7rem"}}>{val}</span>
                      <div style={{
                        width: "100%", borderRadius: "4px 4px 0 0",
                        background: "var(--admin-info)", height: `${(val / maxGrowth) * 100}%`,
                        minHeight: 4, transition: "height 0.5s ease"
                      }} />
                      <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: "0.7rem"}}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="admin-grid admin-grid-2">
            <div className="admin-card">
              <div className="admin-card-header">
                <span className="admin-card-title">Listing Types</span>
                <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: "0.75rem"}}>By property category</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                <DonutChart segments={listingTypeSegments} />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {listingTypeSegments.map(({ label, value, color }) => {
                    const total = listingTypeSegments.reduce((s, g) => s + (g.value || 0), 0) || 1;
                    const pct = Math.round(((value || 0) / total) * 100);
                    return (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                        <span style={{ fontSize: "0.85rem" }}>{label}</span>
                        <span style={{ marginLeft: "auto", fontWeight: 600, fontSize: "0.85rem", color }}>{pct}% ({value})</span>
                      </div>
                    );
                  })}
                  {listingTypeSegments.length === 0 && <span className="text-slate-400 dark:text-slate-500" style={{fontSize:"0.85rem"}}>No properties yet.</span>}
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <span className="admin-card-title">User Roles</span>
                <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: "0.75rem"}}>Buyers vs Sellers</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                <DonutChart segments={roleSegments} />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {roleSegments.map(({ label, value, color }) => {
                    const total = roleSegments.reduce((s, g) => s + (g.value || 0), 0) || 1;
                    const pct = Math.round(((value || 0) / total) * 100);
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
