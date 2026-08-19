// ApiDocs — a clean, Swagger-style reference for the gateway's REST API.
// Static content (the API surface rarely changes), grouped by feature, with
// expandable rows showing sample request/response for the key endpoints.

import { useState } from "react";
import { ChevronDown, BookOpen } from "lucide-react";
import { Card, SectionHeading } from "../components/ui";

type Method = "GET" | "POST" | "PUT";

interface Endpoint {
  method: Method;
  path: string;
  auth?: "JWT" | "Admin";
  desc: string;
  request?: string;
  response?: string;
}

interface Group {
  tag: string;
  blurb: string;
  endpoints: Endpoint[];
}

const API: Group[] = [
  {
    tag: "Authentication",
    blurb: "Register, log in, and manage the current session.",
    endpoints: [
      {
        method: "POST",
        path: "/api/auth/register",
        desc: "Create an account (password is bcrypt-hashed) and receive tokens.",
        request: `{
  "username": "jane",
  "email": "jane@example.com",
  "password": "secret123",
  "role": "client"
}`,
        response: `{
  "message": "registered",
  "user": { "id": 3, "username": "jane", "role": "client" },
  "access_token": "eyJhbGciOi...",
  "refresh_token": "eyJhbGciOi..."
}`,
      },
      {
        method: "POST",
        path: "/api/auth/login",
        desc: "Verify credentials and issue a JWT. Locks out after repeated failures.",
        request: `{ "username": "admin", "password": "admin123" }`,
        response: `{
  "message": "logged in",
  "user": { "id": 1, "username": "admin", "role": "admin" },
  "access_token": "eyJhbGciOi..."
}`,
      },
      { method: "GET", path: "/api/auth/me", auth: "JWT", desc: "Return the current user's profile." },
      { method: "POST", path: "/api/auth/logout", auth: "JWT", desc: "Record a logout event for the audit trail." },
      { method: "POST", path: "/api/auth/refresh", auth: "JWT", desc: "Exchange a refresh token for a new access token." },
    ],
  },
  {
    tag: "Gateway",
    blurb: "The core pipeline — run a request through every security gate.",
    endpoints: [
      {
        method: "POST",
        path: "/api/gateway/analyze",
        desc: "Run a request through JWT, role, replay, rate-limit, integrity, and risk checks. Returns a signed decision.",
        request: `{
  "endpoint": "/api/resource",
  "payload": "{\\"amount\\": 100}",
  "token": "eyJhbGciOi...",
  "nonce": "nonce-8f3a",
  "timestamp": 1783956399
}`,
        response: `{
  "action": "allow",
  "status": "allowed",
  "gates": { "jwt": "valid", "role": "allowed",
             "replay": "ok", "rate_limit": "ok", "hash": "n/a" },
  "risk": { "score": 0, "label": "safe", "factors": [] },
  "security": { "signature": "eL+353qh..." }
}`,
      },
      {
        method: "POST",
        path: "/api/gateway/simulate",
        desc: "Craft a known attack server-side (invalid/expired JWT, replay, tamper, wrong role, rate limit) and run the pipeline.",
        request: `{ "attack": "replay" }`,
        response: `{
  "attack": "replay",
  "action": "flag",
  "risk": { "score": 50, "label": "suspicious" },
  "reason": "Replay attack detected"
}`,
      },
    ],
  },
  {
    tag: "Cryptography",
    blurb: "Public key and the full AES + RSA + SHA-256 + signature demo.",
    endpoints: [
      { method: "GET", path: "/api/crypto/public-key", desc: "Return the gateway's RSA-2048 public key (PEM)." },
      {
        method: "POST",
        path: "/api/crypto/demo",
        auth: "JWT",
        desc: "Encrypt plaintext with AES, wrap the key with RSA, hash it, sign it, then decrypt — returning every step.",
        request: `{ "plaintext": "Transfer $5000" }`,
        response: `{
  "ciphertext": "7fJfZYx7...",
  "wrapped_key": "Qm8x...",
  "sha256": "2cf24dba...",
  "signature": "eL+353qh...",
  "decrypted": "Transfer $5000",
  "signature_valid": true,
  "hash_valid": true
}`,
      },
    ],
  },
  {
    tag: "Dashboard",
    blurb: "Aggregated analytics for the dashboard and risk center.",
    endpoints: [
      { method: "GET", path: "/api/dashboard/summary", auth: "JWT", desc: "Total / allowed / blocked / suspicious counts + average risk." },
      { method: "GET", path: "/api/dashboard/timeline", auth: "JWT", desc: "Requests grouped by hour for the last 24h (activity chart)." },
      { method: "GET", path: "/api/dashboard/risk-distribution", auth: "JWT", desc: "Safe / suspicious / blocked breakdown (pie chart)." },
      { method: "GET", path: "/api/dashboard/recent-events", auth: "JWT", desc: "Latest security events for the timeline feed." },
      { method: "GET", path: "/api/dashboard/security-status", auth: "JWT", desc: "Current status of JWT, encryption, logging, replay, risk scoring." },
    ],
  },
  {
    tag: "Logs",
    blurb: "Searchable, filterable audit trail with CSV export.",
    endpoints: [
      { method: "GET", path: "/api/logs", auth: "JWT", desc: "Paginated logs. Query: page, per_page, search, status, risk." },
      { method: "GET", path: "/api/logs/export", auth: "JWT", desc: "Download the audit log as a CSV file." },
    ],
  },
  {
    tag: "Admin",
    blurb: "Administrator-only user management and threat overview.",
    endpoints: [
      { method: "GET", path: "/api/admin/users", auth: "Admin", desc: "List all users." },
      { method: "POST", path: "/api/admin/users/{id}/block", auth: "Admin", desc: "Block a user." },
      { method: "POST", path: "/api/admin/users/{id}/unblock", auth: "Admin", desc: "Unblock a user and reset failure count." },
      { method: "GET", path: "/api/admin/threats", auth: "Admin", desc: "Blocked-request / failed-login / replay / tamper counts." },
    ],
  },
  {
    tag: "Settings",
    blurb: "Read and tune the runtime security controls.",
    endpoints: [
      { method: "GET", path: "/api/settings", desc: "Current gateway settings (JWT expiry, rate limit, windows, toggles)." },
      { method: "PUT", path: "/api/settings", auth: "Admin", desc: "Update security settings at runtime." },
    ],
  },
];

const methodColor: Record<Method, string> = {
  GET: "bg-primary/15 text-primary border-primary/30",
  POST: "bg-violet/15 text-violet-300 border-violet-500/30",
  PUT: "bg-warning/15 text-warning border-warning/30",
};

function EndpointRow({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false);
  const hasDetail = ep.request || ep.response;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => hasDetail && setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left ${
          hasDetail ? "hover:bg-white/[0.03]" : "cursor-default"
        }`}
      >
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border w-14 text-center shrink-0 ${methodColor[ep.method]}`}
        >
          {ep.method}
        </span>
        <code className="text-sm text-slate-200 font-mono truncate">{ep.path}</code>
        {ep.auth && (
          <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10 shrink-0">
            {ep.auth === "Admin" ? "admin only" : "auth required"}
          </span>
        )}
        {hasDetail && (
          <ChevronDown
            size={16}
            className={`text-slate-500 shrink-0 transition-transform ${ep.auth ? "" : "ml-auto"} ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      <div className="px-4 pb-3 -mt-1">
        <p className="text-sm text-slate-400">{ep.desc}</p>
      </div>

      {open && hasDetail && (
        <div className="px-4 pb-4 grid md:grid-cols-2 gap-3">
          {ep.request && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                Request
              </p>
              <pre className="text-[11px] font-mono text-accent bg-black/30 rounded-lg p-3 overflow-x-auto">
                {ep.request}
              </pre>
            </div>
          )}
          {ep.response && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                Response
              </p>
              <pre className="text-[11px] font-mono text-emerald-300 bg-black/30 rounded-lg p-3 overflow-x-auto">
                {ep.response}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApiDocs() {
  return (
    <div>
      <SectionHeading
        icon={<BookOpen size={22} />}
        title="API Documentation"
        subtitle="The gateway's REST API — endpoints, auth, and sample payloads."
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-slate-500">Base URL: </span>
            <code className="font-mono text-slate-200">http://localhost:5001</code>
          </div>
          <div>
            <span className="text-slate-500">Auth: </span>
            <span className="text-slate-300">
              Bearer JWT in the{" "}
              <code className="font-mono text-accent">Authorization</code> header
            </span>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {API.map((group) => (
          <div key={group.tag}>
            <div className="mb-2">
              <h2 className="text-lg font-semibold text-white">{group.tag}</h2>
              <p className="text-sm text-slate-400">{group.blurb}</p>
            </div>
            <div className="space-y-2">
              {group.endpoints.map((ep) => (
                <EndpointRow key={ep.method + ep.path} ep={ep} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
