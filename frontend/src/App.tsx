// App.tsx — the route map for the whole application.
//
// Structure:
//   public:    /            landing
//              /login       /register
//   protected: /app/*       dashboard shell + nested feature pages

import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import RequestAnalyzer from "./pages/RequestAnalyzer";
import EncryptionVisualizer from "./pages/EncryptionVisualizer";
import AttackSimulator from "./pages/AttackSimulator";
import Logs from "./pages/Logs";
import RiskCenter from "./pages/RiskCenter";
import AdminConsole from "./pages/AdminConsole";
import Settings from "./pages/Settings";

export default function App() {
  const location = useLocation();

  return (
    <>
      {/* Global gradient used by the shield logo's SVG stroke everywhere. */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <linearGradient
            id="sentinel-logo-gradient"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="24"
            y2="24"
          >
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
        </defs>
      </svg>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected app shell */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analyzer" element={<RequestAnalyzer />} />
          <Route path="encryption" element={<EncryptionVisualizer />} />
          <Route path="attack-simulator" element={<AttackSimulator />} />
          <Route path="logs" element={<Logs />} />
          <Route path="risk" element={<RiskCenter />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminConsole />
              </ProtectedRoute>
            }
          />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}
