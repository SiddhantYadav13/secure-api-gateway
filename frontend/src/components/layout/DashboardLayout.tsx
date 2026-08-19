// DashboardLayout — the shell (sidebar + topbar) wrapping every app page.
// <Outlet /> renders whichever nested route is active.

import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Subtle static dot-grid texture — adds depth without motion or clutter.
          Fades out toward the bottom so tables/forms sit on a clean surface. */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(139,92,246,0.16) 1.2px, transparent 1.2px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse 120% 75% at 50% 0%, black, transparent 88%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 120% 75% at 50% 0%, black, transparent 88%)",
        }}
      />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
