import React, { useState, useEffect } from "react";
import { fetchSettings, updateSettings } from "../api/adminApi";
import { useAdminTheme } from "../context/AdminThemeContext";
import { Sun, Moon, Monitor } from "lucide-react";
import "../styles/admin-global.css";

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
  const { theme, changeTheme } = useAdminTheme();

  useEffect(() => {
    fetchSettings()
      .then((d) => { 
          if (d) {
              setSettings({ ...DEFAULT_SETTINGS, ...d, listingFee: d.listing_fee || 500 });
          }
      })
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
      await updateSettings({ ...settings, listing_fee: settings.listingFee });
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
      <div className="admin-page-header">
        <div>
          <h1>Platform Settings</h1>
          <p>Configure financial parameters, categories, and system behaviour</p>
        </div>
        <button aria-label="Accessible interactive control" type="button"
          className="admin-btn admin-btn-primary"
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? <span className="admin-spinner" /> : "💾"} Save Changes
        </button>
      </div>

      <div className="admin-grid admin-grid-2" style={{ gap: 24 }}>
        {/* Appearance */}
        <div className="admin-card" style={{ gridColumn: "1 / -1" }}>
          <div className="admin-card-header">
            <span className="admin-card-title">Appearance</span>
            <span className="admin-badge admin-badge-active">Theme</span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--admin-text-secondary)", marginBottom: 16 }}>
            Choose how the admin panel looks. System follows your device preference.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {[
              { key: "light", label: "Light", icon: Sun, desc: "Bright, clean interface" },
              { key: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes" },
              { key: "system", label: "System", icon: Monitor, desc: "Follow device setting" },
            ].map(({ key, label, icon: Icon, desc }) => (
              <button aria-label="Accessible interactive control" type="button" key={key} onClick={() => changeTheme(key)}
                style={{
                  flex: "1 1 180px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  padding: "20px 16px",
                  borderRadius: 16,
                  cursor: "pointer",
                  border: theme === key ? "2px solid #2563eb" : "1px solid var(--admin-border)",
                  background: theme === key ? "rgba(37, 99, 235, 0.08)" : "transparent",
                  color: "var(--admin-text-primary)",
                  transition: "0.2s ease",
                  fontFamily: "inherit",
                }}
              >
                <Icon className="w-6 h-6" style={{ color: theme === key ? "#2563eb" : "var(--admin-text-secondary)" }} />
                <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{label}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)" }}>{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Financial Parameters */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Financial Parameters</span>
            <span className="admin-badge admin-badge-pending">ADM-007</span>
          </div>

          <div className="admin-form-group">
            <label htmlFor="6l0gat" className="admin-form-label">Listing Fee (LKR)</label>
            <input aria-label="Accessible interactive control" type="number" className="admin-form-control" value={settings.listingFee} onChange={(e) => update("listingFee", Number(e.target.value))} />
          </div>

          <div className="admin-form-group">
            <label htmlFor="cmb6kq" className="admin-form-label">Boost / Promotion Fee (LKR)</label>
            <input aria-label="Accessible interactive control" type="number" className="admin-form-control" value={settings.boostFee} onChange={(e) => update("boostFee", Number(e.target.value))} />
          </div>

          <div className="admin-form-group">
            <label htmlFor="7ddvwz" className="admin-form-label">Bank Loan Interest Rate (%)</label>
            <input aria-label="Accessible interactive control" type="number" step="0.1" className="admin-form-control" value={settings.loanInterestRate} onChange={(e) => update("loanInterestRate", Number(e.target.value))} />
            <small style={{ color: "var(--admin-text-muted)", fontSize: "0.75rem" }}>
              Used by the Financial Feasibility Engine (FR-REQ-5.3)
            </small>
          </div>

          <div className="admin-form-group">
            <label htmlFor="2f9m7a" className="admin-form-label">Max Repayment Tenure (Years)</label>
            <input aria-label="Accessible interactive control" type="number" className="admin-form-control" value={settings.maxRepaymentTenure} onChange={(e) => update("maxRepaymentTenure", Number(e.target.value))} />
          </div>

          <div className="admin-form-group">
            <label htmlFor="v7mzkh" className="admin-form-label">PayHere Mode</label>
            <select aria-label="Accessible interactive control" className="admin-form-control" value={settings.payhereMode} onChange={(e) => update("payhereMode", e.target.value)}>
              <option value="sandbox">Sandbox (Testing)</option>
              <option value="live">Live (Production)</option>
            </select>
          </div>
        </div>

        {/* Platform Limits */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Platform Limits</span>
          </div>

          <div className="admin-form-group">
            <label htmlFor="z3a3va" className="admin-form-label">Max Images Per Listing</label>
            <input aria-label="Accessible interactive control" type="number" className="admin-form-control" value={settings.maxImagesPerListing} onChange={(e) => update("maxImagesPerListing", Number(e.target.value))} />
          </div>

          <div className="admin-form-group">
            <label htmlFor="pm5xpo" className="admin-form-label">Max Buyer Inquiries Per Day (Rate Limit)</label>
            <input aria-label="Accessible interactive control" type="number" className="admin-form-control" value={settings.maxInquiriesPerDay} onChange={(e) => update("maxInquiriesPerDay", Number(e.target.value))} />
          </div>

          <div className="admin-form-group">
            <label htmlFor="7h7jog" className="admin-form-label">Session Timeout (Minutes)</label>
            <input aria-label="Accessible interactive control" type="number" className="admin-form-control" value={settings.sessionTimeoutMinutes} onChange={(e) => update("sessionTimeoutMinutes", Number(e.target.value))} />
            <small style={{ color: "var(--admin-text-muted)", fontSize: "0.75rem" }}>SEC-003: Auto-logout inactive users</small>
          </div>

          {/* Toggle Switches */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {[
              { key: "maintenanceMode", label: "Maintenance Mode", desc: "Disable public access temporarily", danger: true },
              { key: "emailNotificationsEnabled", label: "Email Notifications", desc: "SMTP alerts for approvals, registrations" },
            ].map(({ key, label, desc, danger }) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid var(--admin-border-light)" }}>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 500, color: danger && settings[key] ? "var(--admin-danger)" : "var(--admin-text-primary)" }}>{label}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)" }}>{desc}</div>
                </div>
                <button type="button" aria-label="Accessible interactive control"
                  onClick={() => update(key, !settings[key])}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: "none",
                    background: settings[key] ? (danger ? "var(--admin-danger)" : "var(--admin-gold)") : "var(--admin-border)",
                    cursor: "pointer", position: "relative", transition: "0.2s ease"
                  }}
                >
                  <span style={{
                    position: "absolute", top: 3, left: settings[key] ? 23 : 3,
                    width: 18, height: 18, borderRadius: "50%",
                    background: "#fff", transition: "0.2s ease"
                  }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Property Categories */}
        <div className="admin-card" style={{ gridColumn: "1 / -1" }}>
          <div className="admin-card-header">
            <span className="admin-card-title">Property Categories</span>
            <span style={{ fontSize: "0.8rem", color: "var(--admin-text-secondary)" }}>
              {settings.categories.length} categories
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {settings.categories.map((cat) => (
              <div key={cat} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "var(--admin-gold-dim)", border: "1px solid var(--admin-gold-border)",
                color: "var(--admin-gold)", padding: "5px 12px", borderRadius: 100, fontSize: "0.85rem"
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
              className="admin-form-control"
              placeholder="Add new category…"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
              style={{ maxWidth: 300 }}
            />
            <button aria-label="Accessible interactive control" type="button" className="admin-btn admin-btn-secondary" onClick={addCategory}>+ Add</button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="admin-toast-container">
          <div className={`admin-toast ${toast.type}`}>
            <span>{toast.type === "success" ? "✓" : "✕"}</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
