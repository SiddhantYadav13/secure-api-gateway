// Reusable UI primitives used across every page. Building these once keeps the
// app consistent and DRY (the "reusable components" project rule).

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/* --------------------------------- Card ---------------------------------- */
export function Card({
  children,
  className = "",
  hover = false,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`glass ${hover ? "glass-hover" : ""} p-5 ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------- Badge ---------------------------------- */
type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const toneStyles: Record<Tone, string> = {
  success: "bg-success/15 text-success border border-success/30",
  warning: "bg-warning/15 text-warning border border-warning/30",
  danger: "bg-danger/15 text-danger border border-danger/30",
  info: "bg-primary/15 text-primary border border-primary/30",
  neutral: "bg-white/5 text-slate-300 border border-white/10",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return <span className={`badge ${toneStyles[tone]}`}>{children}</span>;
}

// Map common status strings to a badge tone.
export function statusTone(status?: string): Tone {
  switch (status) {
    case "allowed":
    case "valid":
    case "ok":
    case "match":
    case "allowed ":
    case "safe":
    case "active":
    case "success":
      return "success";
    case "flagged":
    case "suspicious":
    case "warning":
    case "expired":
      return "warning";
    case "blocked":
    case "invalid":
    case "replay":
    case "mismatch":
    case "denied":
    case "exceeded":
    case "missing":
    case "danger":
      return "danger";
    default:
      return "neutral";
  }
}

/* ------------------------------- StatCard -------------------------------- */
export function StatCard({
  label,
  value,
  icon,
  accent = "text-primary",
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: string;
  delay?: number;
}) {
  return (
    <Card hover delay={delay} className="flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-white/5 ${accent}`}>{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </Card>
  );
}

/* ------------------------------- Skeleton -------------------------------- */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/5 ${className}`}
      style={{ minHeight: "1rem" }}
    />
  );
}

/* ------------------------------- Spinner --------------------------------- */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white ${className}`}
    />
  );
}

/* ---------------------------- SectionHeading ----------------------------- */
export function SectionHeading({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        {icon && <span className="text-accent">{icon}</span>}
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>
      {subtitle && <p className="text-slate-400 mt-1 text-sm">{subtitle}</p>}
    </div>
  );
}
