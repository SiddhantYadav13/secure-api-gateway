// RiskCenter — visualizes the gateway's risk scoring as a dial + breakdowns.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gauge, ShieldCheck, AlertTriangle, ShieldX } from "lucide-react";
import api from "../services/api";
import { Card, Badge, Skeleton, SectionHeading, statusTone } from "../components/ui";
import type { DashboardSummary, LogEntry } from "../types";

interface RiskSlice { label: string; value: number; }

function RiskDial({ score }: { score: number }) {
  const radius = 80;
  const circumference = Math.PI * radius; // semicircle
  const pct = Math.min(score, 100) / 100;
  const color = score >= 70 ? "#ef4444" : score >= 30 ? "#f59e0b" : "#10b981";

  return (
    <div className="relative flex flex-col items-center">
      <svg width="220" height="130" viewBox="0 0 220 130">
        <path d="M 20 120 A 90 90 0 0 1 200 120" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="16" strokeLinecap="round" />
        <motion.path
          d="M 20 120 A 90 90 0 0 1 200 120"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute top-14 flex flex-col items-center">
        <span className="text-4xl font-bold text-white">{Math.round(score)}</span>
        <span className="text-xs text-slate-400">avg risk / 100</span>
      </div>
    </div>
  );
}

export default function RiskCenter() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dist, setDist] = useState<RiskSlice[]>([]);
  const [highRisk, setHighRisk] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/summary"),
      api.get("/dashboard/risk-distribution"),
      api.get("/logs", { params: { per_page: 8 } }),
    ])
      .then(([s, d, l]) => {
        setSummary(s.data);
        setDist(d.data.distribution);
        setHighRisk(
          (l.data.logs as LogEntry[]).filter((x) => x.risk_score > 0).slice(0, 8)
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const slices = [
    { key: "safe", label: "Safe", icon: ShieldCheck, color: "text-success", tone: "success" as const },
    { key: "suspicious", label: "Suspicious", icon: AlertTriangle, color: "text-warning", tone: "warning" as const },
    { key: "blocked", label: "Blocked", icon: ShieldX, color: "text-danger", tone: "danger" as const },
  ];

  return (
    <div>
      <SectionHeading
        icon={<Gauge size={22} />}
        title="Risk Center"
        subtitle="How the gateway scores and classifies every request."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="flex flex-col items-center justify-center">
          {loading ? <Skeleton className="h-40 w-full" /> : <RiskDial score={summary?.average_risk || 0} />}
          <p className="text-sm text-slate-400 mt-2">Average across all requests</p>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {slices.map((s) => {
            const Icon = s.icon;
            const value = dist.find((d) => d.label === s.key)?.value ?? 0;
            return (
              <Card key={s.key} hover className="flex flex-col justify-between">
                <div className={`p-3 rounded-xl bg-white/5 w-fit ${s.color}`}>
                  <Icon size={22} />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-white">{loading ? "…" : value}</p>
                  <p className="text-sm text-slate-400">{s.label} requests</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Scoring model explainer */}
      <Card className="mt-4">
        <h3 className="font-semibold text-white mb-3">Scoring Model</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { f: "Expired / Invalid JWT", p: 40 },
            { f: "Wrong Role", p: 30 },
            { f: "Tampered Hash", p: 50 },
            { f: "Replay Attack", p: 50 },
            { f: "Rate Limit Exceeded", p: 30 },
            { f: "Blocked User", p: 100 },
          ].map((x) => (
            <div key={x.f} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
              <span className="text-slate-300 text-xs">{x.f}</span>
              <span className="text-danger font-semibold">+{x.p}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Safe: &lt; 30</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> Suspicious: 30–69</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" /> Blocked: ≥ 70</span>
        </div>
      </Card>

      {/* Recent scored requests */}
      <Card className="mt-4">
        <h3 className="font-semibold text-white mb-3">Recent Scored Requests</h3>
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)
          ) : highRisk.length === 0 ? (
            <p className="text-slate-500 text-sm">No scored requests yet.</p>
          ) : (
            highRisk.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-white font-mono truncate">{log.endpoint}</p>
                  <p className="text-xs text-slate-500">{log.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${log.risk_score >= 70 ? "text-danger" : log.risk_score >= 30 ? "text-warning" : "text-success"}`}>
                    {log.risk_score}
                  </span>
                  <Badge tone={statusTone(log.risk_label)}>{log.risk_label}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
