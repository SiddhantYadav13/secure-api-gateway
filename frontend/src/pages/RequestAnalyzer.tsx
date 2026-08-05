// RequestAnalyzer — submit a crafted request and watch every gateway gate run.

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ScanSearch,
  KeyRound,
  UserCheck,
  Repeat,
  Gauge,
  Hash,
  Wand2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import api from "../services/api";
import {
  Card,
  Badge,
  Spinner,
  SectionHeading,
  statusTone,
} from "../components/ui";
import type { AnalyzeResult } from "../types";

export default function RequestAnalyzer() {
  const [endpoint, setEndpoint] = useState("/api/resource");
  const [payload, setPayload] = useState('{"amount": 100}');
  const [token, setToken] = useState("");
  const [nonce, setNonce] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const autofill = () => {
    setToken(localStorage.getItem("access_token") || "");
    setNonce("nonce-" + Math.random().toString(36).slice(2, 10));
    setTimestamp(String(Math.floor(Date.now() / 1000)));
  };

  const analyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post("/gateway/analyze", {
        endpoint,
        method: "POST",
        payload,
        token: token || undefined,
        nonce: nonce || undefined,
        timestamp: timestamp ? Number(timestamp) : undefined,
      });
      setResult(data);
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  };

  const gates = result
    ? [
        { icon: KeyRound, label: "JWT Verification", value: result.gates.jwt },
        { icon: UserCheck, label: "Role Check", value: result.gates.role },
        { icon: Repeat, label: "Replay Detection", value: result.gates.replay },
        { icon: Gauge, label: "Rate Limit", value: result.gates.rate_limit },
        { icon: Hash, label: "Hash Integrity", value: result.gates.hash },
      ]
    : [];

  const decisionMeta = {
    allow: { tone: "success" as const, icon: CheckCircle2, text: "ALLOWED" },
    flag: { tone: "warning" as const, icon: AlertTriangle, text: "FLAGGED" },
    reject: { tone: "danger" as const, icon: XCircle, text: "REJECTED" },
  };

  return (
    <div>
      <SectionHeading
        icon={<ScanSearch size={22} />}
        title="Secure Request Analyzer"
        subtitle="Run a request through the full gateway pipeline and inspect each security gate."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Request Builder</h3>
            <button onClick={autofill} className="btn-ghost text-xs flex items-center gap-1.5">
              <Wand2 size={14} /> Auto-fill valid
            </button>
          </div>

          <div className="space-y-3">
            <Field label="Endpoint">
              <input className="input-field" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="/api/resource" />
            </Field>
            <Field label="Payload">
              <textarea className="input-field font-mono text-xs h-24 resize-none" value={payload} onChange={(e) => setPayload(e.target.value)} />
            </Field>
            <Field label="JWT Token">
              <textarea className="input-field font-mono text-xs h-20 resize-none" value={token} onChange={(e) => setToken(e.target.value)} placeholder="paste a token or use auto-fill" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nonce">
                <input className="input-field font-mono text-xs" value={nonce} onChange={(e) => setNonce(e.target.value)} placeholder="unique id" />
              </Field>
              <Field label="Timestamp">
                <input className="input-field font-mono text-xs" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} placeholder="unix seconds" />
              </Field>
            </div>
          </div>

          <button onClick={analyze} disabled={loading} className="btn-primary w-full mt-5 flex items-center justify-center gap-2">
            {loading ? <Spinner /> : <><ScanSearch size={18} /> Analyze Request</>}
          </button>
        </Card>

        {/* Result */}
        <Card>
          <h3 className="font-semibold text-white mb-4">Gateway Analysis</h3>
          {!result ? (
            <div className="h-full min-h-80 flex flex-col items-center justify-center text-slate-500 text-sm">
              <ScanSearch size={40} className="mb-3 opacity-40" />
              Submit a request to see the security breakdown.
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Decision banner */}
              {(() => {
                const meta = decisionMeta[result.action];
                const Icon = meta.icon;
                return (
                  <div className={`rounded-xl p-4 flex items-center gap-3 border ${
                    meta.tone === "success" ? "bg-success/10 border-success/30" :
                    meta.tone === "warning" ? "bg-warning/10 border-warning/30" :
                    "bg-danger/10 border-danger/30"}`}>
                    <Icon className={`${meta.tone === "success" ? "text-success" : meta.tone === "warning" ? "text-warning" : "text-danger"}`} size={28} />
                    <div>
                      <p className="text-white font-bold">Gateway Decision: {meta.text}</p>
                      <p className="text-xs text-slate-400">{result.reason}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Gates */}
              <div className="space-y-2">
                {gates.map((g) => {
                  const Icon = g.icon;
                  return (
                    <div key={g.label} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <span className="flex items-center gap-2 text-sm text-slate-300">
                        <Icon size={16} className="text-slate-400" /> {g.label}
                      </span>
                      <Badge tone={statusTone(g.value)}>{g.value}</Badge>
                    </div>
                  );
                })}
              </div>

              {/* Risk */}
              <div className="rounded-xl bg-white/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Risk Score</span>
                  <span className="text-2xl font-bold text-white">{result.risk.score}<span className="text-sm text-slate-500">/100</span></span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.risk.score}%` }}
                    className={`h-full ${result.risk.score >= 70 ? "bg-danger" : result.risk.score >= 30 ? "bg-warning" : "bg-success"}`}
                  />
                </div>
                {result.risk.factors.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {result.risk.factors.map((f) => (
                      <li key={f.factor} className="flex items-center justify-between text-xs text-slate-400">
                        <span>{f.label}</span>
                        <span className="text-danger">+{f.points}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Signature */}
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-slate-400 mb-1">Signed response (RSA-PSS)</p>
                <p className="font-mono text-[10px] text-accent break-all line-clamp-2">
                  {result.security.signature}
                </p>
              </div>
            </motion.div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1 block">{label}</label>
      {children}
    </div>
  );
}
