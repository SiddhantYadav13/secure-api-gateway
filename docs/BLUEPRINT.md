# SentinelX — Secure API Gateway & Security Operations Dashboard

**Refined Blueprint (v3) — Final-Year B.Tech (Information Technology) Project**

> A modern Secure API Gateway that sits between clients and a backend and
> inspects every request: authenticates it, authorizes it, checks its integrity,
> scores its risk, logs it, and returns a digitally signed response — all
> visualized through a premium security operations dashboard.

---

## 0. Architect's Review Notes (what changed in v3 and why)

This version is a **refinement**, not a redesign. The v2 build (Flask backend +
React dashboard) stays intact. The changes below tighten scope to what is
genuinely valuable for a B.Tech project and easy to explain in an interview.

**Guiding rule applied to every feature:** *Why does it exist? What security
problem does it solve? Is it realistic for a B.Tech project?* If a feature failed
that test, it was removed.

| Decision | Rationale |
|---|---|
| **Removed** key rotation, refresh tokens, live-session monitoring, WebSockets, AI threat detection, compliance reporting, distributed logging, microservices, Kubernetes, complex Docker | Enterprise-scale plumbing that adds complexity without improving the learning story. |
| **Replay detection → MySQL** (nonce + timestamp table) instead of Redis | One less moving part; trivially explainable ("we store used nonces in a table and reject repeats"). |
| **Rate limiting → in-memory counter** (per user/IP, sliding window) | No NGINX/Redis. Simple, demo-appropriate, and the logic is visible in Python. |
| **RSA keys generated once at startup** (no rotation) | Digital signatures still fully demonstrated; we just don't rotate keys. |
| **No Docker** | Project will be hosted directly on a PaaS (see §12). |
| **Trimmed Admin + Settings** | Admin keeps only the four essential actions; Settings keeps only three controls. |
| **Added** API Playground, Request Flow Visualizer, API Documentation, Security Health Score, Endpoint Management | Each is educational, visual, and directly tied to the gateway's security model. |

**One overlap flagged for the architect's attention:** *Request Analyzer* and
*API Playground* are close cousins. To keep the product cohesive and avoid two
pages that feel redundant, they are given **distinct jobs** (see §7): the
Analyzer is a **security X-ray** of a crafted request; the Playground is a
**real API client** that calls actual protected endpoints and shows the signed
response. Same engine underneath, two clearly different lenses.

---

## 1. Scope

**What it is:** a security layer for APIs that demonstrates modern API-security
concepts end to end, with a polished dashboard to observe them.

**What it is NOT:** an enterprise, horizontally-scaled, multi-service platform.
No clustering, no service mesh, no distributed anything.

**Target audience:** a final-year B.Tech IT student using it for placements,
internships, and technical interviews — impressive UI, real security concepts,
explainable in five minutes.

---

## 2. Tech Stack

**Frontend**
- React 19 + Vite + TypeScript
- Tailwind CSS (dark theme, glassmorphism)
- Framer Motion (animations)
- Recharts (charts)
- Lucide React (icons)
- React Router, Axios, React Hook Form

**Backend**
- Python + Flask
- Flask-JWT-Extended (JWT)
- Flask-SQLAlchemy (ORM)
- PyCryptodome (AES-256, RSA-2048, SHA-256, digital signatures)
- bcrypt (password hashing)

**Database**
- MySQL (production) — via SQLAlchemy. SQLite is used for zero-setup local dev;
  the ORM makes the switch a one-line change.

**Deployment**
- Hosted online on a PaaS (no Docker). See §12.

**Explicitly not used:** Redis, NGINX, WebSockets, Kubernetes, Docker.

---

## 3. Feature Set (final)

### 3.1 Kept exactly as-is
- **Authentication** — Login, Register, JWT issuance, bcrypt password hashing,
  token expiry, brute-force lockout on repeated failures.
- **Authorization** — Role-Based Access Control (admin / client).
- **Cryptography** — AES-256 (payload), RSA-2048 (key exchange), SHA-256
  (integrity), Digital Signatures (RSA-PSS on responses).
- **Logging** — Request logs, audit logs, security-event logs.
- **Dashboard** — Security dashboard, charts, timeline, security cards, search,
  filters, CSV export.
- **Premium** — Request Analyzer, Encryption Visualizer, Attack Simulator,
  Security Timeline, Risk Score, animated alerts, theme toggle.

### 3.2 Modified
- **Replay Detection** — nonce + timestamp, persisted and checked in **MySQL**
  (a `nonces` table). No Redis.
- **Rate Limiting** — simple **in-memory** per-user/per-IP sliding-window counter
  in Flask. No NGINX/Redis.
- **Admin Console** — only: View Users · View Logs · Export Logs ·
  Block/Unblock User · (plus the new Endpoint Management, §3.3.5).
- **Settings** — only: JWT Expiry · Rate Limit Threshold · Theme Toggle.

### 3.3 New features
1. **API Playground** — send real requests to protected gateway endpoints and
   see Request, Response, JWT status, Risk Score, and the log entry generated.
2. **Request Flow Visualizer** — an animated pipeline diagram of a request
   travelling through each security gate (educational + visually impressive).
3. **API Documentation** — a Swagger-style page listing endpoints, methods,
   parameters, and sample request/response.
4. **Security Health Score** — a rolled-up gateway health indicator (JWT ✔,
   Encryption ✔, Replay Protection ✔, Logging ✔) with an overall health %.
5. **Endpoint Management** — admins can enable/disable individual API endpoints;
   the gateway rejects requests to disabled endpoints.

### 3.4 Removed (do not build)
Key Rotation · Refresh Tokens · Live Session Monitoring · WebSocket real-time
updates · AI threat detection · Compliance reporting · Distributed logging ·
Microservices · Kubernetes · Complex Docker architecture.

---

## 4. Security Model & Gateway Pipeline

Every request that reaches the gateway passes through these gates **in order**.
Each gate can add points to the request's risk score.

```
        Client request
              │
   ┌──────────▼───────────┐
   │ 1. JWT Verification   │  valid / invalid / expired / missing
   ├──────────────────────┤
   │ 2. Role Check (RBAC)  │  allowed / denied
   ├──────────────────────┤
   │ 3. Endpoint Enabled?  │  enabled / disabled   (NEW)
   ├──────────────────────┤
   │ 4. Replay Detection   │  nonce+timestamp checked in MySQL
   ├──────────────────────┤
   │ 5. Rate Limiting      │  in-memory sliding window
   ├──────────────────────┤
   │ 6. SHA-256 Integrity  │  hash match / mismatch (tamper detection)
   ├──────────────────────┤
   │ 7. Risk Engine        │  score 0–100 → safe / suspicious / blocked
   ├──────────────────────┤
   │ 8. Decision           │  allow / flag / reject
   ├──────────────────────┤
   │ 9. Log everything     │  api_logs + risk_scores + (blocked_requests)
   ├──────────────────────┤
   │ 10. Signed Response   │  RSA-PSS digital signature over the decision
   └──────────────────────┘
```

**Cryptography flow (Encryption Visualizer & Playground):** hybrid encryption —
data is encrypted with a one-time **AES-256** key; that key is wrapped with
**RSA-2048** (key exchange); a **SHA-256** hash proves integrity; the ciphertext
is **digitally signed**. This mirrors how TLS works.

---

## 5. Risk Scoring

Each triggered problem adds points; the total (capped at 100) maps to a label
that drives the decision.

| Factor | Points |
|---|---|
| Invalid / Expired / Missing JWT | 40 |
| Wrong Role | 30 |
| Endpoint Disabled | 30 |
| Tampered Hash | 50 |
| Replay Attack | 50 |
| Rate Limit Exceeded | 30 |
| Blocked User | 100 |

| Score | Label | Decision |
|---|---|---|
| < 30 | **Safe** | allow |
| 30–69 | **Suspicious** | flag (allowed but recorded) |
| ≥ 70 | **Blocked** | reject (HTTP 403) |

---

## 6. Database Schema (MySQL via SQLAlchemy)

| Table | Purpose |
|---|---|
| `users` | accounts: username, email, bcrypt password hash, role, is_blocked, failed_login_attempts |
| `roles` | `admin`, `client` |
| `api_logs` | one row per analyzed request: endpoint, method, per-gate results, status, risk, reason, timestamp |
| `security_events` | notable events for the timeline (login success/failure, blocked, tamper, etc.) |
| `risk_scores` | per-request risk breakdown (score, label, contributing factors) |
| `blocked_requests` | focused record of rejected requests |
| `nonces` | **(NEW)** used nonces + timestamps for MySQL-based replay detection |
| `endpoints` | **(NEW)** registered API endpoints with an `enabled` flag for Endpoint Management |

**Removed table:** `refresh_tokens` (refresh tokens dropped entirely).

---

## 7. Pages & Navigation

**Public:** Landing · Login · Register

**App (protected, inside the dashboard shell):**

| Page | Purpose | Security problem it demonstrates |
|---|---|---|
| **Dashboard** | Summary cards, activity charts, timeline, **Security Health Score** | At-a-glance security posture |
| **API Playground** *(new)* | Call real protected endpoints; see request, response, JWT status, risk, generated log | How a client actually talks to a protected gateway |
| **Request Analyzer** | Security **X-ray** of a crafted request — each gate's pass/fail + risk | Makes the invisible pipeline visible |
| **Flow Visualizer** *(new)* | Animated request-through-gates pipeline | Educational: *how* a request is inspected |
| **Encryption** | AES + RSA + SHA-256 + signature, step by step | Applied cryptography / key exchange |
| **Attack Simulator** | One-click attacks (invalid/expired JWT, replay, tamper, wrong role, rate-limit) | How defenses respond to real attacks |
| **Risk Center** | Score dial, distribution, scoring model, recent scored requests | How risk is quantified |
| **Logs** | Searchable, filterable, paginated audit table + CSV export | Audit & monitoring |
| **API Docs** *(new)* | Swagger-style endpoint reference with samples | Professionalism & usability |
| **Admin Console** *(admin)* | View Users, View/Export Logs, Block/Unblock, **Endpoint Management** | Administration & access control |
| **Settings** | JWT Expiry, Rate Limit Threshold, Theme Toggle | Runtime security configuration |

> **Analyzer vs. Playground** (architect's note): the Analyzer lets you *forge*
> any field (bad token, stale nonce, wrong hash) to study the gates; the
> Playground behaves like a *real client* hitting live endpoints with your
> session. Different intent, shared backend pipeline — no redundancy.

---

## 8. Backend Modules

```
backend/app/
├── config.py              # env-based settings (dev/test/prod)
├── extensions.py          # db, jwt singletons
├── models/                # users, roles, api_logs, security_events,
│                          #   risk_scores, blocked_requests, nonces, endpoints
├── services/
│   ├── crypto_service.py  # AES-256, RSA-2048, SHA-256, signatures
│   ├── replay_service.py  # nonce+timestamp checks against MySQL   (MODIFIED)
│   ├── rate_limiter.py    # in-memory sliding-window counter
│   ├── risk_engine.py     # scoring → label → decision
│   ├── security_state.py  # runtime settings + static RSA keypair  (no rotation)
│   └── logging_service.py # writes the audit trail
├── middleware/
│   └── auth_guard.py      # @admin_required, RBAC checks
└── routes/
    ├── auth.py            # register, login, me, logout  (NO refresh)
    ├── gateway.py         # /analyze, /simulate, /playground
    ├── crypto.py          # encryption visualizer + public key
    ├── dashboard.py       # summary, timeline, risk distribution, health score
    ├── logs.py            # list + CSV export
    ├── admin.py           # users, block/unblock, endpoint management
    ├── docs.py            # API documentation data                 (NEW)
    └── settings.py        # jwt expiry, rate-limit threshold
```

---

## 9. API Surface (representative)

**Auth**
- `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` ·
  `POST /api/auth/logout`  *(no `/refresh`)*

**Gateway**
- `POST /api/gateway/analyze` — run a crafted request through all gates
- `POST /api/gateway/simulate` — server-crafted attack scenarios
- `POST /api/gateway/playground` — call a real protected endpoint *(new)*

**Crypto** — `GET /api/crypto/public-key` · `POST /api/crypto/demo`

**Dashboard** — `/summary` · `/timeline` · `/risk-distribution` ·
`/recent-events` · `/security-status` · `/health-score` *(new)*

**Logs** — `GET /api/logs` (search/filter/paginate) · `GET /api/logs/export`

**Admin** — `GET /api/admin/users` · `POST /api/admin/users/<id>/block` ·
`POST /api/admin/users/<id>/unblock` · `GET/POST /api/admin/endpoints` ·
`POST /api/admin/endpoints/<id>/toggle` *(new)*  *(no key-rotation route)*

**Docs** — `GET /api/docs` — machine-readable endpoint catalogue *(new)*

**Settings** — `GET /api/settings` · `PUT /api/settings`
(only `jwt_expiry_minutes`, `rate_limit_max_requests`, `rate_limit_window_seconds`)

---

## 10. Design System

- **Background:** deep navy `#0B1120` with faint dual radial glow.
- **Cards:** glassmorphism (blur + translucent border).
- **Accents:** primary `#3B82F6`, accent `#06B6D4`, success `#10B981`,
  warning `#F59E0B`, danger `#EF4444`, violet `#8B5CF6`.
- **Type:** clean sans-serif UI; monospace only for keys / hashes / ciphertext.
- **Motion:** subtle fade/slide/hover via Framer Motion; loading skeletons.
- **Theme:** dark by default with a light/dark **theme toggle**.

---

## 11. Build Order (roadmap)

1. ✅ Foundation — Flask app factory, config, health check.
2. ✅ Database layer — models (now incl. `nonces`, `endpoints`; `refresh_tokens` removed).
3. ✅ Authentication — register/login/JWT/bcrypt (refresh removed).
4. ✅ Authorization + gateway pipeline.
5. ✅ Crypto engine — AES/RSA/SHA-256/signatures.
6. 🔄 Anti-abuse — **replay via MySQL**, in-memory rate limit.
7. ✅ Risk engine + logging.
8. 🔄 Dashboard APIs + **Security Health Score**.
9. 🔄 Frontend pages — incl. **API Playground, Flow Visualizer, API Docs**.
10. 🔄 Admin **Endpoint Management** + trimmed Settings + **Theme Toggle**.
11. ⏭ Deploy online (§12).

*(✅ built in v2 · 🔄 to adjust/add for v3 · ⏭ final step)*

---

## 12. Hosting Plan (no Docker)

- **Database:** a managed MySQL instance (e.g., Railway / PlanetScale / Render
  MySQL). Connection string supplied via `DATABASE_URL`.
- **Backend (Flask):** deploy to Render / Railway as a Python web service, run
  under a production WSGI server (gunicorn). Secrets via environment variables.
- **Frontend (React):** build with Vite and host the static bundle on
  Vercel / Netlify, pointing API calls at the backend URL.
- **CORS:** locked to the deployed frontend origin in production.

---

## 13. Final Identity

> **SentinelX** — a modern secure API gateway with JWT authentication, RBAC,
> AES/RSA encryption, SHA-256 integrity, digital signatures, MySQL-backed replay
> protection, rate limiting, risk scoring, secure logging, and a professional
> security operations dashboard.

One cohesive product — modern, clean, and explainable in an interview.
