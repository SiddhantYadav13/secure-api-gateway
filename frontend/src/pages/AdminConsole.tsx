// AdminConsole — user management, threat overview, key rotation (admin only).

import { useEffect, useState } from "react";
import {
  Users,
  ShieldX,
  UserX,
  Repeat,
  FileWarning,
  KeyRound,
  Ban,
  CheckCircle2,
} from "lucide-react";
import api from "../services/api";
import { Card, Badge, Skeleton, StatCard, SectionHeading, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types";

interface Threats {
  blocked_requests: number;
  failed_logins: number;
  replay_attacks: number;
  tamper_attempts: number;
  blocked_users: number;
  recent_blocked: {
    id: number;
    timestamp: string;
    username: string;
    endpoint: string;
    reason: string;
    risk_score: number;
  }[];
}

export default function AdminConsole() {
  const { user: current } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [threats, setThreats] = useState<Threats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [toast, setToast] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([api.get("/admin/users"), api.get("/admin/threats")])
      .then(([u, t]) => {
        setUsers(u.data.users);
        setThreats(t.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const toggleBlock = async (u: User) => {
    const action = u.is_blocked ? "unblock" : "block";
    await api.post(`/admin/users/${u.id}/${action}`);
    flash(`User ${u.username} ${action}ed`);
    load();
  };

  const rotateKeys = async () => {
    setRotating(true);
    try {
      await api.post("/admin/rotate-keys");
      flash("RSA key pair rotated successfully");
    } finally {
      setRotating(false);
    }
  };

  const threatCards = threats
    ? [
        { label: "Blocked Requests", value: threats.blocked_requests, icon: <ShieldX size={20} />, accent: "text-danger" },
        { label: "Failed Logins", value: threats.failed_logins, icon: <UserX size={20} />, accent: "text-warning" },
        { label: "Replay Attacks", value: threats.replay_attacks, icon: <Repeat size={20} />, accent: "text-accent" },
        { label: "Tamper Attempts", value: threats.tamper_attempts, icon: <FileWarning size={20} />, accent: "text-violet" },
        { label: "Blocked Users", value: threats.blocked_users, icon: <Ban size={20} />, accent: "text-danger" },
      ]
    : [];

  return (
    <div>
      <SectionHeading
        icon={<Users size={22} />}
        title="Admin Security Console"
        subtitle="Manage users, monitor threats, and rotate keys."
      />

      {toast && (
        <div className="mb-4 rounded-xl bg-success/10 border border-success/30 text-success text-sm px-4 py-2.5 flex items-center gap-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* Threat overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          : threatCards.map((c, i) => <StatCard key={c.label} {...c} delay={i * 0.05} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* User management */}
        <Card className="lg:col-span-2 !p-0 overflow-hidden">
          <h3 className="font-semibold text-white p-4 pb-3">User Management</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-y border-white/5">
                  <th className="px-4 py-2.5 font-medium">User</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Fails</th>
                  <th className="px-4 py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-6"><Skeleton className="h-6" /></td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5">
                      <td className="px-4 py-3">
                        <p className="text-white">{u.username}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={u.role === "admin" ? "info" : "neutral"}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={u.is_blocked ? "danger" : "success"}>
                          {u.is_blocked ? "blocked" : "active"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{u.failed_login_attempts}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleBlock(u)}
                          disabled={u.id === current?.id}
                          className="btn-ghost !py-1 !px-3 text-xs disabled:opacity-30"
                        >
                          {u.is_blocked ? "Unblock" : "Block"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Key rotation + recent blocked */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <KeyRound size={18} className="text-accent" /> Key Management
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Rotate the RSA-2048 key pair used for key exchange and digital
              signatures.
            </p>
            <button onClick={rotateKeys} disabled={rotating} className="btn-primary w-full flex items-center justify-center gap-2">
              {rotating ? <Spinner /> : <><KeyRound size={16} /> Rotate Keys</>}
            </button>
          </Card>

          <Card>
            <h3 className="font-semibold text-white mb-3">Recent Blocked</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {threats?.recent_blocked.length === 0 ? (
                <p className="text-slate-500 text-sm">No blocked requests.</p>
              ) : (
                threats?.recent_blocked.map((b) => (
                  <div key={b.id} className="rounded-lg bg-white/5 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-300 truncate">{b.endpoint}</span>
                      <span className="text-danger font-semibold text-xs">{b.risk_score}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{b.reason}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
