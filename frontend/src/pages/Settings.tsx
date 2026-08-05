// Settings — runtime security controls (admin can edit; others read-only).

import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Save, CheckCircle2, Lock } from "lucide-react";
import api from "../services/api";
import { Card, Spinner, SectionHeading, Skeleton } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import type { GatewaySettings } from "../types";

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-primary" : "bg-white/10"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [settings, setSettings] = useState<GatewaySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    api.get("/settings").then((r) => setSettings(r.data.settings)).finally(() => setLoading(false));
  }, []);

  const update = (key: keyof GatewaySettings, value: number | boolean) =>
    setSettings((s) => (s ? { ...s, [key]: value } : s));

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const { data } = await api.put("/settings", settings);
      setSettings(data.settings);
      setToast("Settings saved");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setSaving(false);
    }
  };

  const numberFields: { key: keyof GatewaySettings; label: string; hint: string; min: number; max: number }[] = [
    { key: "jwt_expiry_minutes", label: "JWT Expiry (minutes)", hint: "How long access tokens stay valid", min: 1, max: 1440 },
    { key: "rate_limit_max_requests", label: "Rate Limit — Max Requests", hint: "Requests allowed per window", min: 1, max: 1000 },
    { key: "rate_limit_window_seconds", label: "Rate Limit — Window (seconds)", hint: "Sliding window size", min: 1, max: 3600 },
    { key: "replay_window_seconds", label: "Replay Window (seconds)", hint: "Nonce/timestamp freshness window", min: 1, max: 3600 },
    { key: "max_failed_logins", label: "Max Failed Logins", hint: "Attempts before an account is locked", min: 1, max: 20 },
  ];

  const toggles: { key: keyof GatewaySettings; label: string; hint: string }[] = [
    { key: "replay_protection_enabled", label: "Replay Protection", hint: "Reject duplicated nonces & stale timestamps" },
    { key: "risk_scoring_enabled", label: "Risk Scoring", hint: "Score every request and drive the gateway decision" },
  ];

  return (
    <div>
      <SectionHeading
        icon={<SettingsIcon size={22} />}
        title="Security Settings"
        subtitle="Tune the gateway's security controls at runtime."
      />

      {!isAdmin && (
        <div className="mb-4 rounded-xl bg-warning/10 border border-warning/30 text-warning text-sm px-4 py-2.5 flex items-center gap-2">
          <Lock size={16} /> Read-only — only administrators can change settings.
        </div>
      )}
      {toast && (
        <div className="mb-4 rounded-xl bg-success/10 border border-success/30 text-success text-sm px-4 py-2.5 flex items-center gap-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {loading || !settings ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {numberFields.map((f) => (
              <Card key={f.key}>
                <label className="text-sm text-white font-medium">{f.label}</label>
                <p className="text-xs text-slate-400 mb-2">{f.hint}</p>
                <input
                  type="number"
                  min={f.min}
                  max={f.max}
                  disabled={!isAdmin}
                  className="input-field disabled:opacity-60"
                  value={settings[f.key] as number}
                  onChange={(e) => update(f.key, Number(e.target.value))}
                />
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {toggles.map((t) => (
              <Card key={t.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">{t.label}</p>
                  <p className="text-xs text-slate-400">{t.hint}</p>
                </div>
                <Toggle
                  checked={settings[t.key] as boolean}
                  disabled={!isAdmin}
                  onChange={(v) => update(t.key, v)}
                />
              </Card>
            ))}
          </div>

          {isAdmin && (
            <button onClick={save} disabled={saving} className="btn-primary mt-6 flex items-center gap-2">
              {saving ? <Spinner /> : <><Save size={16} /> Save Settings</>}
            </button>
          )}
        </>
      )}
    </div>
  );
}
