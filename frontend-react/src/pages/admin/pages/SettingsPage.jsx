import { useEffect, useRef, useState } from "react";
import { fetchSettings, updateSettings } from "../api/adminApi";
import { useTheme } from "../../../context/ThemeProvider";
import { DollarSign, Save, Sun, Moon, Laptop, Palette } from "lucide-react";
import { cn } from "../../../lib/utils";
import "../styles/admin-global.css";

function canonicalFee(value) {
  if (typeof value !== "string" || value.length > 64) return null;
  const match = value.trim().match(/^(\d{1,10})(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const cents = BigInt(match[1]) * 100n + BigInt((match[2] || "").padEnd(2, "0"));
  if (cents <= 0n || cents > 999999999999n) return null;
  return `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
}
const themes = [
  { value: "light", label: "Light Mode", Icon: Sun, detail: "A light workspace" },
  { value: "dark", label: "Dark Mode", Icon: Moon, detail: "A dark workspace" },
  { value: "system", label: "System Preference", Icon: Laptop, detail: "Follow your device settings" },
];

export default function SettingsPage() {
  const { theme, changeTheme } = useTheme();
  const [draft, setDraft] = useState("");
  const [feeSource, setFeeSource] = useState('database');
  const [saved, setSaved] = useState("");
  const [phase, setPhase] = useState("loading");
  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const mounted = useRef(false);
  const saveLock = useRef(false);
  const fee = canonicalFee(draft);
  const dirty = draft !== saved;

  useEffect(() => {
    let cancelled = false;
    mounted.current = true;
    fetchSettings().then(result => {
      if (cancelled) return;
      const value = canonicalFee(result?.settings?.listing_fee);
      if (value === null) throw new Error("Unconfirmed settings.");
      setDraft(value); setSaved(value); setFeeSource(result.source || 'database'); setPhase("ready");
    }).catch(() => {
      if (!cancelled) setPhase("error");
    });
    return () => { cancelled = true; mounted.current = false; };
  }, [reload]);

  const handleSave = async () => {
    if (phase !== "ready" || saveLock.current || !dirty || fee === null) return;
    saveLock.current = true;
    setSaving(true); setFeedback(null);
    try {
      const result = await updateSettings({ listing_fee: fee });
      if (!mounted.current) return;
      if (result?.settings?.listing_fee !== fee) throw new Error("Unconfirmed settings.");
      setDraft(fee); setSaved(fee); setFeeSource('database'); setFeedback({ error: Boolean(result.warning), message: result.warning || "Listing fee saved." });
    } catch {
      if (mounted.current) setFeedback({ error: true, message: "Listing fee could not be confirmed. Refresh before retrying." });
    } finally {
      saveLock.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="admin-page-header">
        <div>
          <h1>System Parameters &amp; Configuration</h1>
          <p>Manage the listing fee and your interface theme.</p>
        </div>
        <button type="button" onClick={handleSave} disabled={phase !== "ready" || saving || !dirty || fee === null}
          aria-busy={saving} className="admin-btn admin-btn-primary disabled:opacity-50">
          <Save className="size-4" /><span>Save listing fee</span>
        </button>
      </div>
      {feedback && <p role={feedback.error ? "alert" : "status"}>{feedback.message}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-card lg:col-span-2">
          <div className="admin-card-header">
            <h3 className="admin-card-title flex items-center gap-2"><Palette className="size-5" />Admin Interface Theme &amp; Display Mode</h3>
          </div>
          <p className="text-sm mb-5">Choose your workspace theme. This preference is independent of the listing fee.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themes.map(({ value, label, Icon, detail }) => (
              <button type="button" key={value} aria-pressed={theme === value} onClick={() => changeTheme(value)}
                className={cn("p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col gap-3 text-left",
                  theme === value ? "border-primary bg-primary/10" : "border-border bg-background")}>
                <Icon className="size-5" /><span className="font-bold text-sm">{label}</span><span className="text-xs">{detail}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-card-header"><h3 className="admin-card-title flex items-center gap-2"><DollarSign className="size-5" />Listing Fee</h3></div>
          {phase === "loading" && <p role="status">Loading settings...</p>}
          {phase === "error" && <div role="alert">
            <p>Settings could not be loaded.</p>
            <button type="button" className="admin-btn" onClick={() => { setPhase("loading"); setFeedback(null); setReload(n => n + 1); }}>Retry loading settings</button>
          </div>}
          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="listing-fee">Listing fee (LKR)</label>
            <input id="listing-fee" type="text" inputMode="decimal" maxLength={64} className="admin-form-control"
              value={draft} disabled={phase !== "ready" || saving} aria-invalid={dirty && fee === null}
              aria-describedby="listing-fee-help" onChange={event => { setDraft(event.target.value); setFeedback(null); }} />
            <p id="listing-fee-help" className="text-xs mt-2">{feeSource === 'configured_default' ? 'Showing the configured default; no saved fee record exists. ' : ''}Enter a positive amount with at most two decimal places, up to 9,999,999,999.99 LKR.</p>
            {dirty && fee === null && <p role="alert">Enter a valid listing fee.</p>}
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-card-header"><h3 className="admin-card-title">Available settings</h3></div>
          <p>Only the listing fee and interface theme are configurable here. Payment gateway mode is managed separately.</p>
        </div>
      </div>
    </div>
  );
}
