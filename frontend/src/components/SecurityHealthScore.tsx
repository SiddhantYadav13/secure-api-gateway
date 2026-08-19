// SecurityHealthScore — a dashboard tile that rolls the gateway's security
// components (JWT, encryption, replay protection, logging, risk scoring) into a
// single "health %" with a ring gauge and a per-component checklist.
//
// It reads the same data the dashboard already fetches (security-status), so
// there's no extra network call or backend change.

import { motion } from "framer-motion";
import {
  KeyRound,
  Lock,
  Repeat,
  ScrollText,
  Gauge,
  Check,
  X,
} from "lucide-react";
import { Card, Skeleton } from "./ui";

type StatusMap = Record<string, string>;

// Which status keys make up the health score, and how to label/icon them.
const COMPONENTS = [
  { key: "jwt", label: "JWT authentication", icon: KeyRound },
  { key: "encryption", label: "Encryption (AES/RSA)", icon: Lock },
  { key: "replay_protection", label: "Replay protection", icon: Repeat },
  { key: "logging", label: "Audit logging", icon: ScrollText },
  { key: "risk_scoring", label: "Risk scoring", icon: Gauge },
];

function isActive(value?: string) {
  return value === "active";
}

function HealthRing({ pct }: { pct: number }) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" className="shrink-0">
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="9"
      />
      <motion.circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
        transition={{ duration: 1, ease: "easeOut" }}
        transform="rotate(-90 64 64)"
      />
      <text
        x="64"
        y="60"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="26"
        fontWeight="700"
      >
        {pct}%
      </text>
      <text x="64" y="80" textAnchor="middle" fill="#94a3b8" fontSize="10">
        healthy
      </text>
    </svg>
  );
}

export default function SecurityHealthScore({
  status,
  delay = 0,
}: {
  status: StatusMap | null;
  delay?: number;
}) {
  if (!status) {
    return (
      <Card delay={delay}>
        <h3 className="font-semibold text-white mb-4">Security Health</h3>
        <Skeleton className="h-40" />
      </Card>
    );
  }

  const activeCount = COMPONENTS.filter((c) => isActive(status[c.key])).length;
  const pct = Math.round((activeCount / COMPONENTS.length) * 100);

  return (
    <Card delay={delay}>
      <h3 className="font-semibold text-white mb-2">Security Health</h3>
      <div className="flex flex-col items-center">
        <HealthRing pct={pct} />
        <p className="text-xs text-slate-400 -mt-1">
          {activeCount}/{COMPONENTS.length} defenses active
        </p>
      </div>

      <div className="space-y-2 mt-4">
        {COMPONENTS.map((c) => {
          const Icon = c.icon;
          const active = isActive(status[c.key]);
          return (
            <div
              key={c.key}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2 text-slate-300">
                <Icon size={15} className="text-slate-500" />
                {c.label}
              </span>
              {active ? (
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                  <Check size={14} /> on
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                  <X size={14} /> off
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
