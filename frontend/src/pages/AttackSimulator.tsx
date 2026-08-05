// AttackSimulator — one-click simulation of common API attacks.

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  KeyRound,
  Clock,
  Repeat,
  FileWarning,
  UserX,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import api from "../services/api";
import { Card, Badge, Spinner, SectionHeading, statusTone } from "../components/ui";
import type { AnalyzeResult } from "../types";

interface SimResult extends AnalyzeResult {
  expected: string;
  attack: string;
}

const attacks = [
  { id: "invalid_jwt", label: "Invalid JWT", icon: KeyRound, desc: "Forged / broken token", color: "text-danger" },
  { id: "expired_jwt", label: "Expired JWT", icon: Clock, desc: "Token past its expiry", color: "text-warning" },
  { id: "replay", label: "Replay Attack", icon: Repeat, desc: "Reused nonce", color: "text-accent" },
  { id: "tampered_payload", label: "Tampered Payload", icon: FileWarning, desc: "Hash mismatch", color: "text-violet" },
  { id: "wrong_role", label: "Wrong Role", icon: UserX, desc: "Client hits admin route", color: "text-primary" },
  { id: "rate_limit", label: "Rate Limit Burst", icon: Zap, desc: "Too many requests", color: "text-warning" },
];

export default function AttackSimulator() {
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState<string | null>(null);

  const simulate = async (attack: string) => {
    setRunning(attack);
    setResult(null);
    try {
      const { data } = await api.post("/gateway/simulate", { attack });
      setResult(data);
    } catch {
      /* interceptor */
    } finally {
      setRunning(null);
    }
  };

  const decisionMeta = {
    allow: { tone: "success" as const, icon: CheckCircle2, text: "ALLOWED" },
    flag: { tone: "warning" as const, icon: AlertTriangle, text: "FLAGGED" },
    reject: { tone: "danger" as const, icon: XCircle, text: "BLOCKED" },
  };

  return (
    <div>
      <SectionHeading
        icon={<ShieldAlert size={22} />}
        title="Attack Simulator"
        subtitle="Launch simulated attacks and watch the gateway defend in real time."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attack grid */}
        <div className="grid grid-cols-2 gap-3 h-fit">
          {attacks.map((a) => {
            const Icon = a.icon;
            const isRunning = running === a.id;
            return (
              <motion.button
                key={a.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => simulate(a.id)}
                disabled={!!running}
                className="glass glass-hover p-4 text-left disabled:opacity-60"
              >
                <div className={`p-2.5 rounded-lg bg-white/5 w-fit ${a.color}`}>
                  {isRunning ? <Spinner /> : <Icon size={20} />}
                </div>
                <p className="text-white font-semibold text-sm mt-3">{a.label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{a.desc}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Result panel */}
        <Card>
          <h3 className="font-semibold text-white mb-4">Simulation Result</h3>
          {!result ? (
            <div className="h-80 flex flex-col items-center justify-center text-slate-500 text-sm">
              <ShieldAlert size={40} className="mb-3 opacity-40" />
              Launch an attack to see how the gateway responds.
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {(() => {
                const meta = decisionMeta[result.action];
                const Icon = meta.icon;
                return (
                  <div className={`rounded-xl p-4 flex items-center gap-3 border ${
                    meta.tone === "success" ? "bg-success/10 border-success/30" :
                    meta.tone === "warning" ? "bg-warning/10 border-warning/30" :
                    "bg-danger/10 border-danger/30"}`}>
                    <Icon className={meta.tone === "success" ? "text-success" : meta.tone === "warning" ? "text-warning" : "text-danger"} size={28} />
                    <div>
                      <p className="text-white font-bold">Gateway Response: {meta.text}</p>
                      <p className="text-xs text-slate-400">{result.reason}</p>
                    </div>
                  </div>
                );
              })()}

              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-slate-400 mb-1">Attack description</p>
                <p className="text-sm text-slate-200">{result.expected}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.entries(result.gates).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-xs text-slate-400 capitalize">{k.replace(/_/g, " ")}</span>
                    <Badge tone={statusTone(v as string)}>{v as string}</Badge>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-white/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Risk Score</span>
                  <span className="text-2xl font-bold text-white">
                    {result.risk.score}<span className="text-sm text-slate-500">/100</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.risk.score}%` }}
                    className={`h-full ${result.risk.score >= 70 ? "bg-danger" : result.risk.score >= 30 ? "bg-warning" : "bg-success"}`}
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                A log entry was created (id #{result.log_id}). Check the Logs page.
              </p>
            </motion.div>
          )}
        </Card>
      </div>
    </div>
  );
}
