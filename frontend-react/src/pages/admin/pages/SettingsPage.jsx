import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { fetchSettings, updateSettings } from "../api/adminApi";
import { useTheme } from "../../../context/ThemeProvider";
import "../styles/admin-global.css";
import { 
  Settings, 
  DollarSign, 
  Percent, 
  ShieldCheck, 
  Bell, 
  Save, 
  CreditCard, 
  Plus, 
  Trash2,
  CheckCircle2,
  Sun,
  Moon,
  Laptop,
  Palette
} from "lucide-react";

const DEFAULT_SETTINGS = {
  listingFee: 1500,
  boostFee: 5000,
  loanInterestRate: 13.5,
  maxRepaymentTenure: 30,
  maxImagesPerListing: 8,
  maxInquiriesPerDay: 20,
  sessionTimeoutMinutes: 60,
  categories: ["Residential Villa", "Commercial Plot", "Agricultural Estate", "Luxury Apartment"],
  maintenanceMode: false,
  emailNotificationsEnabled: true,
  payhereMode: "live",
};

const SettingsPage = () => {
  const { theme, isDark, changeTheme } = useTheme();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    fetchSettings()
      .then((d) => { 
        if (d) {
          setSettings({ ...DEFAULT_SETTINGS, ...d, listingFee: d.listing_fee || 1500 });
        }
      })
      .catch((err) => { toast.error("Failed to load settings"); console.error(err); });
  }, []);

  const showToast = (msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
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
      showToast("Platform parameters saved and committed to audit trail.");
    } catch {
      showToast("Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    if (settings.categories.includes(newCategory.trim())) return;
    update("categories", [...settings.categories, newCategory.trim()]);
    setNewCategory("");
  };

  const removeCategory = (cat) => {
    update("categories", settings.categories.filter((c) => c !== cat));
  };

  const handleThemeChange = (newTheme) => {
    changeTheme(newTheme);
    showToast(`Interface theme switched to ${newTheme.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast */}
      {toastMsg && (
        <div className="admin-toast-container">
          <div className={`admin-toast ${toastMsg.type}`}>
            <span>{toastMsg.msg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1>System Parameters & Configuration</h1>
          <p>Manage platform monetization fees, admin theme appearance, and gateway rules</p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="admin-btn admin-btn-primary disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving Changes..." : "Save Parameters"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 0: Theme & Appearance (Admin Theme Switcher) */}
        <div className="admin-card lg:col-span-2">
          <div className="admin-card-header">
            <h3 className="admin-card-title flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-500" /> Admin Interface Theme & Display Mode
            </h3>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Choose your preferred workspace theme. Dark Mode provides high-contrast executive telemetry, while Light Mode offers a crisp clean studio look.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* 1. Light Mode */}
            <div
              onClick={() => handleThemeChange("light")}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                theme === "light"
                  ? "border-blue-600 bg-blue-50/60 dark:bg-blue-900/20 text-slate-900 shadow-md ring-2 ring-blue-500/20"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                  <Sun className="w-5 h-5" />
                </div>
                {theme === "light" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                    Active
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Light Mode</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Crisp high-contrast day studio with clean borders</p>
              </div>
            </div>

            {/* 2. Dark Mode */}
            <div
              onClick={() => handleThemeChange("dark")}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                theme === "dark"
                  ? "border-blue-600 bg-blue-50/60 dark:bg-blue-900/20 text-slate-900 shadow-md ring-2 ring-blue-500/20"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Moon className="w-5 h-5" />
                </div>
                {theme === "dark" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                    Active
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Dark Mode (Executive)</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Obsidian command center with glowing indicators</p>
              </div>
            </div>

            {/* 3. System Sync */}
            <div
              onClick={() => handleThemeChange("system")}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                theme === "system"
                  ? "border-blue-600 bg-blue-50/60 dark:bg-blue-900/20 text-slate-900 shadow-md ring-2 ring-blue-500/20"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-500/20 text-slate-400 flex items-center justify-center font-bold">
                  <Laptop className="w-5 h-5" />
                </div>
                {theme === "system" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                    Active
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">System Preference</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Automatically synchronize with your OS settings</p>
              </div>
            </div>

          </div>
        </div>

        {/* Card 1: Monetization & Fee Rules */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" /> Monetization & Listing Fees
            </h3>
          </div>

          <div className="space-y-4">
            <div className="admin-form-group">
              <label className="admin-form-label">Base Listing Moderation Fee (LKR)</label>
              <input
                type="number"
                className="admin-form-control"
                value={settings.listingFee}
                onChange={(e) => update("listingFee", Number(e.target.value))}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Featured Spotlight Boost Fee (LKR)</label>
              <input
                type="number"
                className="admin-form-control"
                value={settings.boostFee}
                onChange={(e) => update("boostFee", Number(e.target.value))}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Payment Gateway Mode</label>
              <select
                className="admin-form-control cursor-pointer"
                value={settings.payhereMode}
                onChange={(e) => update("payhereMode", e.target.value)}
              >
                <option value="live">PayHere Production (Live)</option>
                <option value="sandbox">PayHere Sandbox (Test Mode)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Property & Moderation Parameters */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" /> Moderation & Upload Limits
            </h3>
          </div>

          <div className="space-y-4">
            <div className="admin-form-group">
              <label className="admin-form-label">Max HD Photos per Listing</label>
              <input
                type="number"
                className="admin-form-control"
                value={settings.maxImagesPerListing}
                onChange={(e) => update("maxImagesPerListing", Number(e.target.value))}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Max Buyer Inquiries Allowed per Day</label>
              <input
                type="number"
                className="admin-form-control"
                value={settings.maxInquiriesPerDay}
                onChange={(e) => update("maxInquiriesPerDay", Number(e.target.value))}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Admin JWT Session Timeout (Minutes)</label>
              <input
                type="number"
                className="admin-form-control"
                value={settings.sessionTimeoutMinutes}
                onChange={(e) => update("sessionTimeoutMinutes", Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Approved Property Categories */}
        <div className="admin-card lg:col-span-2">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Supported Property Categories</h3>
          </div>

          <div className="flex flex-wrap gap-2.5 mb-5">
            {settings.categories.map((cat) => (
              <span
                key={cat}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2"
              >
                <span>{cat}</span>
                <button
                  type="button"
                  onClick={() => removeCategory(cat)}
                  className="text-slate-400 hover:text-red-500 transition cursor-pointer"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-3 max-w-md">
            <input
              type="text"
              placeholder="Add new category (e.g. Tea Estate, Luxury Penthouse)..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="admin-form-control"
            />
            <button
              type="button"
              onClick={addCategory}
              className="admin-btn admin-btn-primary shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default SettingsPage;
