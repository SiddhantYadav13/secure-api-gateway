// Sidebar — the fixed left navigation of the security console.

import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ScanSearch,
  LockKeyhole,
  ShieldAlert,
  ScrollText,
  Gauge,
  Users,
  BookOpen,
  Settings as SettingsIcon,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import GradientText from "../GradientText";

const links = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/analyzer", label: "Request Analyzer", icon: ScanSearch },
  { to: "/app/encryption", label: "Encryption", icon: LockKeyhole },
  { to: "/app/attack-simulator", label: "Attack Simulator", icon: ShieldAlert },
  { to: "/app/logs", label: "Logs", icon: ScrollText },
  { to: "/app/risk", label: "Risk Center", icon: Gauge },
  { to: "/app/docs", label: "API Docs", icon: BookOpen },
  { to: "/app/admin", label: "Admin Console", icon: Users, adminOnly: true },
  { to: "/app/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside
      className="w-64 shrink-0 h-screen sticky top-0 hidden md:flex flex-col border-r border-white/5 bg-bg-soft/40 backdrop-blur-xl"
      style={{
        backgroundImage:
          "radial-gradient(90% 30% at 30% 0%, rgba(139,92,246,0.14), transparent 70%), radial-gradient(80% 25% at 50% 100%, rgba(59,130,246,0.08), transparent 70%)",
      }}
    >
      <div className="flex items-center gap-2 px-6 h-16 border-b border-white/5">
        <ShieldCheck
          size={30}
          stroke="url(#sentinel-logo-gradient)"
          className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.35)]"
        />
        <div className="leading-tight">
          <GradientText
            colors={["#3B82F6", "#8B5CF6", "#C084FC", "#3B82F6"]}
            animationSpeed={6}
            className="font-bold text-lg"
          >
            SentinelX
          </GradientText>
          <p className="text-[10px] text-slate-400 tracking-wide">
            SECURE API GATEWAY
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          if (link.adminOnly && user?.role !== "admin") return null;
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "text-white bg-violet-500/15 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.25)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]"
                    />
                  )}
                  <Icon size={18} />
                  {link.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-white/5 text-[10px] text-slate-500">
        v2 · Secure Gateway Platform
      </div>
    </aside>
  );
}
