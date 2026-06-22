# Enterprise Okta SAML SSO — Node.js + React + MongoDB

A production-grade reference implementation of Okta SAML 2.0 Single Sign-On demonstrating enterprise authentication patterns including group-based role mapping, JWT session management, MongoDB audit logging, and server-side session revocation.

> **Portfolio project** — built to demonstrate enterprise-level SSO implementation to recruiters, architects, and engineering teams.

---

## Features

- **SAML 2.0 SP-Initiated SSO** via Okta using `passport-saml`
- **Group-based role mapping** — Okta groups automatically resolve to application roles
- **Role override** — DB-level role override per user (no Okta changes needed)
- **HttpOnly JWT cookie** — XSS-resistant session management
- **Server-side session revocation** — instant logout via MongoDB session tracking
- **MongoDB audit log** — immutable record of all login, logout, and access denied events (90-day TTL)
- **User upsert** — user profiles created/updated in MongoDB on every login
- **Protected React routes** — unauthenticated/unauthorized users redirected automatically
- **Access denied handling** — user-friendly page with root cause and admin guidance
- **Health endpoint** — load balancer and k8s probe ready

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 5, React Router 6, Axios 1.6 |
| Backend | Node.js ≥18, Express 4.18, passport-saml 3.2 |
| Auth | SAML 2.0 (Okta IdP), JWT (jsonwebtoken 9) |
| Database | MongoDB (Mongoose 8) |
| Security | Helmet 7, HttpOnly cookies, CORS, express-session |

---

## Architecture

```
Browser (React SPA)
    │
    │  HTTPS + HttpOnly Cookie
    ▼
Express Backend (Node.js)
    │                    │
    │ SAML AuthnRequest  │ upsert / audit / sessions
    ▼                    ▼
Okta (SAML IdP)      MongoDB
    │
    │ SAMLResponse POST → ACS
    ▼
Express (validates assertion, maps role, issues JWT)
    │
    │ Redirect with cookie
    ▼
Browser (React Dashboard)
```

See `diagrams/` for full Mermaid diagrams and AI image generation prompts.

---

## Authentication Flow

1. User clicks **Sign in with Okta** on the React login page
2. React redirects to `GET /api/v1/auth/saml/login` on the backend
3. Backend generates a SAML `AuthnRequest` and redirects to Okta
4. User authenticates at Okta (password + MFA)
5. Okta signs the SAML assertion and POSTs it to `POST /api/v1/auth/saml/acs` (ACS)
6. `passport-saml` validates the signature, expiry, and audience
7. `normalizeUser()` extracts `email`, `firstName`, `lastName`, `username`, `groups`
8. `resolveRole()` maps Okta groups → application role (deny if no valid group)
9. User document is upserted in MongoDB; session + audit records are created
10. JWT is signed and set as an `HttpOnly` cookie
11. User is redirected to `/dashboard`
12. React's `AuthContext` calls `GET /auth/me` to load user state

---

## Repository Structure

```
okta-saml-node-react-enterprise-sso/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   │   ├── groupMapper.js       # GROUP_ROLE_MAP + resolveRole()
│   │   │   └── passport.js          # SAML strategy + user upsert
│   │   ├── config/
│   │   │   ├── database.js          # MongoDB connection with retry
│   │   │   ├── jwt.js               # signToken / verifyToken
│   │   │   └── saml.js              # passport-saml config
│   │   ├── middleware/
│   │   │   ├── authenticate.js      # JWT cookie validation + session check
│   │   │   └── errorHandler.js      # Centralized error handling
│   │   ├── models/
│   │   │   ├── AuditLog.js          # Login/logout events (90-day TTL)
│   │   │   ├── Session.js           # Active sessions (revocation support)
│   │   │   └── User.js              # User profile with role override
│   │   ├── routes/
│   │   │   ├── auth.js              # /auth/* routes
│   │   │   └── health.js            # /health
│   │   ├── utils/
│   │   │   ├── auditLogger.js       # Write audit events to MongoDB
│   │   │   ├── logger.js            # Structured JSON logger
│   │   │   └── normalizeUser.js     # SAML attribute extraction
│   │   └── server.js                # Express app entry point
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── auth/
│   │   │   ├── api.js               # Axios instance (withCredentials)
│   │   │   ├── AuthContext.jsx      # Global auth state + useAuth hook
│   │   │   └── useAuthGuard.js      # Redirect unauthenticated users
│   │   ├── components/
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── AccessDenied.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Profile.jsx
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx   # Auth guard wrapper
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
├── docs/
│   ├── okta-app-setup.md
│   ├── attribute-statements.md
│   ├── group-mapping.md
│   ├── troubleshooting.md
│   ├── production-checklist.md
│   └── security-considerations.md
├── diagrams/
│   ├── auth-flow.md                 # High-level architecture + AI prompt
│   ├── login-sequence.md            # SAML sequence diagram + AI prompt
│   └── architecture.md             # Component + role mapping diagrams + AI prompt
└── README.md
```

---

## Setup Instructions

### Prerequisites

- Node.js ≥ 18.x
- MongoDB (local or Atlas)
- Okta Developer account

### 1. Clone and install

```bash
git clone https://github.com/your-username/okta-saml-node-react-enterprise-sso.git
cd okta-saml-node-react-enterprise-sso

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure backend

```bash
cd backend
cp .env.example .env
# Edit .env with your Okta and MongoDB values
```

### 3. Configure frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:9000/api/v1
```

### 4. Configure Okta

Follow the step-by-step guide in `docs/okta-app-setup.md`.

### 5. Run

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 9000) |
| `MONGODB_URI` | MongoDB connection string |
| `SESSION_SECRET` | express-session secret (random, 64+ chars) |
| `JWT_SECRET` | JWT signing secret (random, 64+ chars) |
| `JWT_EXPIRES_IN` | JWT expiry (default: `8h`) |
| `OKTA_DOMAIN` | Your Okta org URL |
| `SAML_ENTRY_POINT` | Okta SSO URL (from Setup Instructions) |
| `SAML_ISSUER` | SP Entity ID (must match Okta) |
| `SAML_CALLBACK_URL` | ACS URL (must match Okta) |
| `SAML_CERT` | Okta X.509 certificate (no headers) |
| `FRONTEND_URL` | React app URL (for CORS + redirects) |
| `COOKIE_SECURE` | `true` in production (requires HTTPS) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL |

---

## Group-Based RBAC

Okta groups map to application roles at login. Full setup instructions — including how to create groups, configure the group attribute statement, and assign users — are in [`docs/okta-rbac-setup.md`](docs/okta-rbac-setup.md).

---

## Troubleshooting

See `docs/troubleshooting.md` for 8 detailed enterprise scenarios covering:
- Access denied / no valid group
- Certificate mismatch
- Missing attributes
- Session expiration
- ACS URL mismatch
- and more

---

## Security Notes

- JWT stored in `HttpOnly` cookie — not accessible to JavaScript
- SAML assertions validated for signature, expiry, audience, and destination
- Server-side session revocation via MongoDB `sessions` collection
- All auth events written to immutable `auditlogs` collection
- Group filter on Okta prevents group enumeration
- See `docs/security-considerations.md` for full details

---

## Documentation

| Document | Description |
|---|---|
| `docs/okta-app-setup.md` | Step-by-step Okta SAML app creation |
| `docs/okta-rbac-setup.md` | Groups, SAML attributes, and role mapping setup |
| `docs/attribute-statements.md` | SAML attribute mapping reference |
| `docs/group-mapping.md` | Group-to-role mapping and access control |
| `docs/troubleshooting.md` | 8 real-world enterprise issue scenarios |
| `docs/production-checklist.md` | Pre-launch security and infra checklist |
| `docs/security-considerations.md` | Security architecture decisions |
| `diagrams/auth-flow.md` | High-level architecture diagram |
| `diagrams/login-sequence.md` | Full SAML login sequence diagram |
| `diagrams/architecture.md` | System components + role mapping flow |

---

## License

MIT
