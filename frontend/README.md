# Frontend — Okta SAML Enterprise SSO

React 19 + Vite SPA that consumes the backend SAML auth API.

## Stack
- **React 19** — UI
- **Vite 5** — build tool + dev server with API proxy
- **React Router 6** — client-side routing
- **Axios 1.6** — HTTP client with credential support

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Pages

| Route | Auth Required | Description |
|-------|--------------|-------------|
| /login | No | Okta SSO entry point |
| /dashboard | Yes | User info + role + groups |
| /profile | Yes | Full attribute view |
| /access-denied | No | Denial reason + help text |

## Auth Flow

1. User visits `/login`, clicks "Sign in with Okta"
2. Full-page redirect to `GET /auth/saml/login` (backend)
3. Backend redirects to Okta
4. Okta authenticates, POSTs SAMLResponse to backend ACS
5. Backend validates, creates JWT cookie, redirects to `/dashboard`
6. `AuthContext` calls `GET /auth/me` to load user into React state
7. `ProtectedRoute` guards all authenticated pages
