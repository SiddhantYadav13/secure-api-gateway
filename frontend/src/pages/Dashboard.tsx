// Dashboard — the central security operations overview.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ShieldX,
  AlertTriangle,
  UserX,
  Repeat,
  Gauge,
  CheckCircle2,
  ArrowRight,
  Lock,
  ScrollText,
  ScanSearch,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import api from "../services/api";
import { Card, StatCard, Skeleton, Badge, statusTone } from "../components/ui";
import type { DashboardSummary, SecurityEvent } from "../types";

interface TimelinePoint {
  time: string;
  allowed: number;
  blocked: number;
  flagged: number;
}
interface RiskSlice {
  label: string;
  value: number;
}
type StatusMap = Record<string, string>;

const RISK_COLORS: Record<string, string> = {
  safe: "#10b981",
  suspicious: "#f59e0b",
  blocked: "#ef4444",
};

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [risk, setRisk] = useState<RiskSlice[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [status, setStatus] = useState<StatusMap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/summary"),
      api.get("/dashboard/timeline"),
      api.get("/dashboard/risk-distribution"),
      api.get("/dashboard/recent-events"),
      api.get("/dashboard/security-status"),
    ])
      .then(([s, t, r, e, st]) => {
        setSummary(s.data);
        setTimeline(t.data.timeline);
        setRisk(r.data.distribution);
        setEvents(e.data.events);
        setStatus(st.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = summary
    ? [
        { label: "Total Requests", value: summary.total_requests, icon: <Activity size={20} />, accent: "text-primary" },
        { label: "Successful", value: summary.successful_requests, icon: <CheckCircle2 size={20} />, accent: "text-success" },
        { label: "Blocked", value: summary.blocked_requests, icon: <ShieldX size={20} />, accent: "text-danger" },
        { label: "Suspicious", value: summary.suspicious_requests, icon: <AlertTriangle size={20} />, accent: "text-warning" },
        { label: "Failed Logins", value: summary.failed_logins, icon: <UserX size={20} />, accent: "text-violet" },
        { label: "Replay Attacks", value: summary.replay_attacks, icon: <Repeat size={20} />, accent: "text-accent" },
      ]
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Security Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Real-time overview of your API gateway
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))
          : stats.map((s, i) => (
              <StatCard key={s.label} {...s} delay={i * 0.05} />
            ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2" delay={0.1}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Request Activity (24h)</h3>
            <Badge tone="info">allowed · flagged · blocked</Badge>
          </div>
          {loading ? (
            <Skeleton className="h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="gAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gFlagged" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} interval={3} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.75rem",
                    color: "#e2e8f0",
                  }}
                />
                <Area type="monotone" dataKey="allowed" stroke="#10b981" fill="url(#gAllowed)" strokeWidth={2} />
                <Area type="monotone" dataKey="flagged" stroke="#f59e0b" fill="url(#gFlagged)" strokeWidth={2} />
                <Area type="monotone" dataKey="blocked" stroke="#ef4444" fill="url(#gBlocked)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card delay={0.15}>
          <h3 className="font-semibold text-white mb-4">Risk Distribution</h3>
          {loading ? (
            <Skeleton className="h-64" />
          ) : risk.every((r) => r.value === 0) ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              No requests analyzed yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={risk}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {risk.map((r) => (
                    <Cell key={r.label} fill={RISK_COLORS[r.label]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.75rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex justify-center gap-4 mt-2">
            {risk.map((r) => (
              <div key={r.label} className="flex items-center gap-1.5 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: RISK_COLORS[r.label] }}
                />
                <span className="text-slate-400 capitalize">{r.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row: events + status + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2" delay={0.2}>
          <h3 className="font-semibold text-white mb-4">Recent Security Events</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))
            ) : events.length === 0 ? (
              <p className="text-slate-500 text-sm">No events yet.</p>
            ) : (
              events.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">
                      {e.description}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(e.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge tone={statusTone(e.severity)}>{e.event_type}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card delay={0.25}>
            <h3 className="font-semibold text-white mb-4">Security Status</h3>
            <div className="space-y-2.5">
              {status &&
                Object.entries(status).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-400 capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <Badge tone={statusTone(val)}>{val}</Badge>
                  </div>
                ))}
            </div>
          </Card>

          <Card delay={0.3}>
            <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { to: "/app/analyzer", label: "Analyze a request", icon: ScanSearch },
                { to: "/app/encryption", label: "Encryption demo", icon: Lock },
                { to: "/app/logs", label: "View audit logs", icon: ScrollText },
                { to: "/app/risk", label: "Risk center", icon: Gauge },
              ].map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.to}
                    to={a.to}
                    className="flex items-center justify-between rounded-xl bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm text-slate-300 transition-colors group"
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon size={16} className="text-accent" />
                      {a.label}
                    </span>
                    <ArrowRight
                      size={15}
                      className="text-slate-500 group-hover:translate-x-0.5 transition-transform"
                    />
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
