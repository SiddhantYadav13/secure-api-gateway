// api.ts — a single configured Axios instance used by the whole app.
//
// WHY centralize: every request should automatically attach the JWT and every
// 401 should log the user out. Doing that here (via interceptors) means no
// component has to remember to do it.

import axios from "axios";

const api = axios.create({
  baseURL: "/api", // Vite proxies /api -> Flask backend (see vite.config.ts)
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach the access token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: on 401 (expired/invalid token), clear session and
// bounce to login — unless we're already on an auth page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      if (!path.startsWith("/login") && !path.startsWith("/register")) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
