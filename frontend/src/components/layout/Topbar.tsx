// Topbar — shows current user, role badge, and logout.

import { useNavigate } from "react-router-dom";
import { LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../ui";
import GradientText from "../GradientText";

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-16 sticky top-0 z-20 flex items-center justify-between px-6 border-b border-white/5 bg-bg/60 backdrop-blur-xl">
      <div className="flex items-center gap-2 md:hidden">
        <ShieldCheck
          size={26}
          stroke="url(#sentinel-logo-gradient)"
          className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.35)]"
        />
        <GradientText
          colors={["#3B82F6", "#8B5CF6", "#C084FC", "#3B82F6"]}
          animationSpeed={6}
          className="font-bold text-lg"
        >
          SentinelX
        </GradientText>
      </div>

      <div className="hidden md:flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-60 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
        </span>
        <span className="text-sm font-medium tracking-wide bg-gradient-to-r from-slate-200 to-violet-300 bg-clip-text text-transparent">
          Security Operations Console
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right leading-tight hidden sm:block">
          <p className="text-sm font-semibold text-white">{user?.username}</p>
          <p className="text-[11px] text-slate-400">{user?.email}</p>
        </div>
        <Badge tone={user?.role === "admin" ? "info" : "neutral"}>
          {user?.role?.toUpperCase()}
        </Badge>
        <button
          onClick={handleLogout}
          className="btn-ghost flex items-center gap-2 !py-1.5 !px-3 text-sm"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
