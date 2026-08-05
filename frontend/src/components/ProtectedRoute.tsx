// ProtectedRoute — guards app pages. Redirects to /login if not authenticated,
// and optionally enforces an admin-only requirement.

import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading) return null; // brief flash-prevention while restoring session

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin")
    return <Navigate to="/app/dashboard" replace />;

  return <>{children}</>;
}
