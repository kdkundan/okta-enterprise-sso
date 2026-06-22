# Backend — Okta SAML Enterprise SSO

Node.js + Express API handling SAML authentication, JWT issuance, and MongoDB persistence.

## Stack
- **Express 4.18** — HTTP server
- **passport-saml 3.2** — SAML 2.0 SP implementation
- **jsonwebtoken 9** — JWT sign/verify
- **Mongoose 8** — MongoDB ODM
- **Helmet 7** — security headers
- **express-session** — SAML round-trip state

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in all values in .env
npm run dev
```

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /auth/saml/login | — | Initiates SAML SSO |
| POST | /auth/saml/callback | — | ACS — Okta posts SAMLResponse here |
| GET | /auth/me | JWT cookie | Returns current user |
| POST | /auth/logout | JWT cookie | Clears cookie + revokes session |
| GET | /health | — | Health + DB status |

## Environment Variables

See `.env.example` for full documentation of every variable.

## MongoDB Collections

| Collection | Purpose |
|---|---|
| `users` | User profiles, upserted on login |
| `auditlogs` | Immutable login/logout/deny events (90-day TTL) |
| `sessions` | Active JWT sessions — supports server-side revocation |
