import React, { useState, useEffect } from "react";
import { fetchSettings, updateSettings } from "../api/adminApi";
import "../styles/global.css";

const DEFAULT_SETTINGS = {
  listingFee: 3500,
  boostFee: 5000,
  loanInterestRate: 13.5,
  maxRepaymentTenure: 30,
  maxImagesPerListing: 5,
  maxInquiriesPerDay: 10,
  sessionTimeoutMinutes: 15,
  categories: ["Residential", "Commercial", "Agricultural", "Industrial"],
  maintenanceMode: false,
  emailNotificationsEnabled: true,
  payhereMode: "sandbox",
};

const SettingsPage = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    fetchSettings()
      .then((d) => { if (d) setSettings(d); })
      .catch(() => {});
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const update = (key, val) => {
    setSettings((p) => ({ ...p, [key]: val }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      setDirty(false);
      showToast("Settings saved and logged to audit trail.");
    } catch {
      showToast("Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    update("categories", [...settings.categories, newCategory.trim()]);
    setNewCategory("");
  };

  const removeCategory = (cat) => {
    update("categories", settings.categories.filter((c) => c !== cat));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Platform Settings</h1>
          <p>Configure financial parameters, categories, and system behaviour</p>
        </div>
        <button aria-label="Accessible interactive control" type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? <span className="spinner" /> : "💾"} Save Changes
        </button>
      </div>

      <div className="grid grid-2" style={{ gap: 24 }}>
        {/* Financial Parameters */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Financial Parameters</span>
            <span className="badge badge-pending">ADM-007</span>
          </div>

          <div className="form-group">
            <label htmlFor="gn5f6o" className="form-label">Listing Fee (LKR)</label>
            <input aria-label="Accessible interactive control"
              type="number"
              className="form-control"
              value={settings.listingFee}
              onChange={(e) => update("listingFee", Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="lk9sg6" className="form-label">Boost / Promotion Fee (LKR)</label>
            <input aria-label="Accessible interactive control"
              type="number"
              className="form-control"
              value={settings.boostFee}
              onChange={(e) => update("boostFee", Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="47udwy" className="form-label">Bank Loan Interest Rate (%)</label>
            <input aria-label="Accessible interactive control"
              type="number"
              step="0.1"
              className="form-control"
              value={settings.loanInterestRate}
              onChange={(e) => update("loanInterestRate", Number(e.target.value))}
            />
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              Used by the Financial Feasibility Engine (FR-REQ-5.3)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="9mfi0q" className="form-label">Max Repayment Tenure (Years)</label>
            <input aria-label="Accessible interactive control"
              type="number"
              className="form-control"
              value={settings.maxRepaymentTenure}
              onChange={(e) => update("maxRepaymentTenure", Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="lc1acl" className="form-label">PayHere Mode</label>
            <select aria-label="Accessible interactive control"
              className="form-control"
              value={settings.payhereMode}
              onChange={(e) => update("payhereMode", e.target.value)}
            >
              <option value="sandbox">Sandbox (Testing)</option>
              <option value="live">Live (Production)</option>
            </select>
          </div>
        </div>

        {/* Platform Limits */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Platform Limits</span>
          </div>

          <div className="form-group">
            <label htmlFor="z3lk7t" className="form-label">Max Images Per Listing</label>
            <input aria-label="Accessible interactive control"
              type="number"
              className="form-control"
              value={settings.maxImagesPerListing}
              onChange={(e) => update("maxImagesPerListing", Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="45xofx" className="form-label">Max Buyer Inquiries Per Day (Rate Limit)</label>
            <input aria-label="Accessible interactive control"
              type="number"
              className="form-control"
              value={settings.maxInquiriesPerDay}
              onChange={(e) => update("maxInquiriesPerDay", Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="05848b" className="form-label">Session Timeout (Minutes)</label>
            <input aria-label="Accessible interactive control"
              type="number"
              className="form-control"
              value={settings.sessionTimeoutMinutes}
              onChange={(e) => update("sessionTimeoutMinutes", Number(e.target.value))}
            />
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>SEC-003: Auto-logout inactive users</small>
          </div>

          {/* Toggle Switches */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {[
              { key: "maintenanceMode", label: "Maintenance Mode", desc: "Disable public access temporarily", danger: true },
              { key: "emailNotificationsEnabled", label: "Email Notifications", desc: "SMTP alerts for approvals, registrations" },
            ].map(({ key, label, desc, danger }) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid var(--border-light)" }}>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 500, color: danger && settings[key] ? "var(--danger)" : "var(--text-primary)" }}>{label}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{desc}</div>
                </div>
                <button type="button" aria-label="Accessible interactive control"
                  onClick={() => update(key, !settings[key])}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: "none",
                    background: settings[key] ? (danger ? "var(--danger)" : "var(--gold)") : "var(--border)",
                    cursor: "pointer", position: "relative", transition: "var(--transition)"
                  }}
                >
                  <span style={{
                    position: "absolute", top: 3, left: settings[key] ? 23 : 3,
                    width: 18, height: 18, borderRadius: "50%",
                    background: "#fff", transition: "var(--transition)"
                  }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Property Categories */}
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="card-header">
            <span className="card-title">Property Categories</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              {settings.categories.length} categories
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {settings.categories.map((cat) => (
              <div key={cat} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "var(--gold-dim)", border: "1px solid var(--gold-border)",
                color: "var(--gold)", padding: "5px 12px", borderRadius: 100, fontSize: "0.85rem"
              }}>
                {cat}
                <button aria-label="Accessible interactive control" type="button"
                  onClick={() => removeCategory(cat)}
                  style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, fontSize: "0.9rem", lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input aria-label="Accessible interactive control"
              className="form-control"
              placeholder="Add new category…"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
              style={{ maxWidth: 300 }}
            />
            <button aria-label="Accessible interactive control" type="button" className="btn btn-secondary" onClick={addCategory}>+ Add</button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <span>{toast.type === "success" ? "✓" : "✕"}</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
