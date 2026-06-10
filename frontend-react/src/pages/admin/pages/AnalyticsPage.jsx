import React, { useState } from "react";
import "../styles/admin-global.css";

// Simple SVG Donut Chart
const DonutChart = ({ segments, size = 120 }) => {
  const r = 46; const cx = 60; const cy = 60;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, g) => s + g.value, 0) || 1;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--admin-border)" strokeWidth="20" />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const gap = circ - dash;
        const el = (
          <circle
            key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={seg.color} strokeWidth="20"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }}
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

const MOCK_SEARCH_TRENDS = [
  { city: "Kandy", searches: 342, pct: 28 },
  { city: "Colombo", searches: 298, pct: 24 },
  { city: "Gampaha", searches: 187, pct: 15 },
  { city: "Matara", searches: 143, pct: 12 },
  { city: "Negombo", searches: 112, pct: 9 },
  { city: "Badulla", searches: 98, pct: 8 },
  { city: "Other", searches: 52, pct: 4 },
];

const MOCK_LISTING_TYPES = [
  { label: "Residential", value: 68, color: "var(--admin-gold)" },
  { label: "Commercial", value: 22, color: "var(--admin-info)" },
  { label: "Agricultural", value: 10, color: "var(--admin-success)" },
];

const MOCK_DEVICES = [
  { label: "Desktop", value: 58, color: "var(--admin-gold)" },
  { label: "Mobile", value: 35, color: "var(--admin-info)" },
  { label: "Tablet", value: 7, color: "var(--admin-success)" },
];

const WEEKLY_INQUIRIES = [
  { day: "Mon", count: 12 }, { day: "Tue", count: 19 }, { day: "Wed", count: 14 },
  { day: "Thu", count: 22 }, { day: "Fri", count: 28 }, { day: "Sat", count: 31 }, { day: "Sun", count: 17 },
];

const AnalyticsPage = () => {
  const [period, setPeriod] = useState("monthly");
  const maxInq = Math.max(...WEEKLY_INQUIRIES.map((d) => d.count));

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Analytics</h1>
          <p>Search trends, listing distribution, and user behaviour</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["weekly", "monthly", "yearly"].map((p) => (
            <button
              key={p}
              className={`admin-btn admin-btn-sm ${period === p ? "admin-btn-primary" : "admin-btn-secondary"}`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-grid admin-grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: "Avg. Time on Site", value: "4m 32s", icon: "⏱", color: "var(--admin-gold)" },
          { label: "Property Views (Month)", value: "12,841", icon: "👁", color: "var(--admin-info)" },
          { label: "Polygon Searches", value: "847", icon: "🗺", color: "var(--admin-success)" },
          { label: "Financial Calc. Used", value: "1,293", icon: "🧮", color: "var(--admin-warning)" },
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
            <span className="admin-card-title">Top Search Locations</span>
            <span style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)" }}>By number of searches</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {MOCK_SEARCH_TRENDS.map(({ city, searches, pct }) => (
              <div key={city}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "0.85rem" }}>
                  <span>{city}</span>
                  <span style={{ color: "var(--admin-text-secondary)" }}>{searches} searches ({pct}%)</span>
                </div>
                <div style={{
                  height: 6, background: "var(--admin-bg-secondary)", borderRadius: 3, overflow: "hidden"
                }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: "var(--admin-gold)", borderRadius: 3,
                    transition: "width 0.5s ease"
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Weekly Buyer Inquiries</span>
            <span style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)" }}>Contact-seller requests</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
            {WEEKLY_INQUIRIES.map(({ day, count }) => (
              <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--admin-text-secondary)" }}>{count}</span>
                <div style={{
                  width: "100%", borderRadius: "4px 4px 0 0",
                  background: "var(--admin-info)", height: `${(count / maxInq) * 100}%`,
                  minHeight: 4, transition: "height 0.5s ease"
                }} />
                <span style={{ fontSize: "0.7rem", color: "var(--admin-text-secondary)" }}>{day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-grid admin-grid-2">
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Listing Types</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <DonutChart segments={MOCK_LISTING_TYPES} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {MOCK_LISTING_TYPES.map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                  <span style={{ fontSize: "0.85rem" }}>{label}</span>
                  <span style={{ marginLeft: "auto", fontWeight: 600, fontSize: "0.85rem", color }}>{value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">User Device Split</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <DonutChart segments={MOCK_DEVICES} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {MOCK_DEVICES.map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                  <span style={{ fontSize: "0.85rem" }}>{label}</span>
                  <span style={{ marginLeft: "auto", fontWeight: 600, fontSize: "0.85rem", color }}>{value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
