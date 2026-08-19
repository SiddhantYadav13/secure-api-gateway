// RequestPipeline — an animated visualization of a request flowing through the
// gateway's security gates. Sequentially "processes" each gate on a loop, with
// a glowing pulse travelling down the rail. On-theme hero visual for Landing.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Laptop,
  KeyRound,
  Repeat,
  Hash,
  Gauge,
  ShieldCheck,
} from "lucide-react";

const gates = [
  { icon: Laptop, label: "Client request", tag: "POST /api", tone: "neutral" },
  { icon: KeyRound, label: "JWT verification", tag: "valid", tone: "ok" },
  { icon: Repeat, label: "Replay detection", tag: "fresh", tone: "ok" },
  { icon: Hash, label: "SHA-256 integrity", tag: "match", tone: "ok" },
  { icon: Gauge, label: "Risk engine", tag: "score 8", tone: "ok" },
  { icon: ShieldCheck, label: "Signed response", tag: "allowed", tone: "pass" },
];

export default function RequestPipeline() {
  const [step, setStep] = useState(0);

  // Advance through the gates on a loop, pausing on the final decision.
  useEffect(() => {
    const isLast = step >= gates.length - 1;
    const delay = isLast ? 1600 : 700;
    const timer = setTimeout(() => {
      setStep((s) => (s >= gates.length - 1 ? 0 : s + 1));
    }, delay);
    return () => clearTimeout(timer);
  }, [step]);

  const railPct = (step / (gates.length - 1)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="glass p-6 w-full max-w-md relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-xs font-medium text-slate-300">
            Live gateway inspection
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">realtime</span>
      </div>

      {/* Pipeline */}
      <div className="relative pl-8">
        {/* Rail (background line) */}
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-white/10" />
        {/* Rail (filled progress) */}
        <motion.div
          className="absolute left-[11px] top-3 w-px bg-gradient-to-b from-blue-400 to-violet-400"
          animate={{ height: `calc(${railPct}% * 0.86)` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        {/* Travelling pulse */}
        <motion.div
          className="absolute left-[6px] h-3 w-3 rounded-full bg-violet-400 shadow-[0_0_12px_3px_rgba(167,139,250,0.9)]"
          animate={{ top: `calc(${railPct}% * 0.86 + 6px)` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        <div className="space-y-4">
          {gates.map((gate, i) => {
            const Icon = gate.icon;
            const active = i === step;
            const done = i <= step;
            return (
              <div key={gate.label} className="flex items-center gap-3 relative">
                {/* Node dot on the rail */}
                <span
                  className={`absolute -left-[26px] h-2.5 w-2.5 rounded-full border transition-colors duration-300 ${
                    done
                      ? "bg-violet-400 border-violet-400"
                      : "bg-bg border-white/20"
                  }`}
                />
                {/* Gate card */}
                <motion.div
                  animate={{
                    scale: active ? 1.03 : 1,
                    borderColor: done
                      ? "rgba(139,92,246,0.5)"
                      : "rgba(255,255,255,0.08)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-1 items-center gap-3 rounded-xl border bg-white/[0.03] px-3 py-2.5"
                >
                  <div
                    className={`p-2 rounded-lg transition-colors duration-300 ${
                      done
                        ? "bg-violet-500/15 text-violet-300"
                        : "bg-white/5 text-slate-500"
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <span
                    className={`text-sm flex-1 transition-colors duration-300 ${
                      done ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {gate.label}
                  </span>
                  {/* Result chip appears once processed */}
                  <motion.span
                    initial={false}
                    animate={{ opacity: done ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      gate.tone === "pass"
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        : gate.tone === "ok"
                          ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                          : "bg-white/5 text-slate-400 border border-white/10"
                    }`}
                  >
                    {gate.tag}
                  </motion.span>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer status */}
      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">Gateway decision</span>
        <motion.span
          key={step >= gates.length - 1 ? "allowed" : "processing"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-xs font-semibold ${
            step >= gates.length - 1 ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          {step >= gates.length - 1 ? "● Request allowed" : "○ Inspecting…"}
        </motion.span>
      </div>
    </motion.div>
  );
}
