// AuthContext — global auth state (current user + login/logout/register).
//
// WHY context: many pages need "who is logged in?" and "is this an admin?".
// A React Context provides that everywhere without prop-drilling.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import api from "../services/api";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    role: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On first load, restore the session from localStorage (if any).
  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("access_token");
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const persist = (u: User, accessToken: string, refreshToken?: string) => {
    localStorage.setItem("access_token", accessToken);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  };

  const login = async (username: string, password: string) => {
    const { data } = await api.post("/auth/login", { username, password });
    persist(data.user, data.access_token, data.refresh_token);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    role: string
  ) => {
    const { data } = await api.post("/auth/register", {
      username,
      email,
      password,
      role,
    });
    persist(data.user, data.access_token, data.refresh_token);
  };

  const logout = () => {
    api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
