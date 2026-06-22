# Security Considerations

Documents the security decisions made in this implementation and why they matter.

---

## Why SAML 2.0?

SAML 2.0 is the enterprise standard for federated identity. Key advantages over username/password:

- **No password storage** — the application never handles or stores user credentials
- **Centralized identity management** — IT controls access via Okta without touching the application
- **Tamper-proof assertions** — assertions are signed with Okta's X.509 certificate; forged assertions are rejected
- **Auditable** — every login event is traceable in both Okta and the application audit log
- **MFA enforcement** — Okta can enforce hardware key, TOTP, or push MFA transparently

---

## Assertion Validation

Every SAML assertion received at the ACS endpoint is validated by `passport-saml`:

| Check | Mechanism |
|---|---|
| Signature validity | RSA-SHA256 signature verified against Okta X.509 cert |
| Assertion expiry | `NotOnOrAfter` checked with 5-minute clock skew allowance |
| Audience restriction | Must match `SAML_ISSUER` (SP Entity ID) |
| Destination | ACS URL must match `SAML_CALLBACK_URL` |
| Replay attack | `InResponseTo` nonce tracked via express-session |

---

## Certificate Verification

The Okta X.509 certificate in `SAML_CERT`:
- Is loaded at startup from the environment (never hardcoded)
- Must match the active signing certificate in Okta
- Should be rotated using Okta's certificate rotation procedure when it expires
- Only the specific app certificate is trusted — no system CA store trust

---

## HttpOnly JWT Cookie

After SAML validation, a JWT is issued and stored in an `HttpOnly` cookie:

- **HttpOnly**: JavaScript cannot read it — prevents XSS-based token theft
- **Secure**: Cookie is only sent over HTTPS in production
- **SameSite=Lax**: Blocks CSRF from cross-site POST requests while allowing top-level navigation
- **Path=/**: Sent with all API requests automatically

This is more secure than storing the JWT in `localStorage` (XSS-readable) or `sessionStorage`.

---

## JWT Expiration & Session Revocation

- JWT expires after 8 hours by default (configurable via `JWT_EXPIRES_IN`)
- Each JWT contains a unique `sessionId` embedded at issuance
- The `Session` MongoDB collection tracks all active session IDs
- On logout, the session is marked `revoked: true`
- Every authenticated request checks that `sessionId` exists and is not revoked
- This enables **instant session invalidation** — even before JWT expiry

---

## Role-Based Access Control (RBAC)

- Roles are derived from Okta group membership — not user-supplied input
- The `resolveRole()` function applies a priority order — highest privilege wins
- `roleOverride` in MongoDB allows emergency role changes without touching Okta
- Frontend routes enforce role checks via `useAuthGuard(requiredRole)`
- Backend routes enforce role checks via the `authenticate` middleware

---

## Least Privilege Principle

- Okta Group Attribute Statement uses `Starts with: elog_` filter — only app-relevant groups are shared
- MongoDB users and the application DB user should have minimal permissions
- The backend service account should not have write access to the `auditlogs` collection beyond inserts
- In production, use a read-only DB user for health check queries

---

## Production Deployment

- Deploy behind a reverse proxy (nginx, AWS ALB) that terminates TLS
- Set `trust proxy` in Express if behind a reverse proxy to get real client IPs: `app.set('trust proxy', 1)`
- Use `connect-mongo` to store express-session in MongoDB instead of in-memory
- Rotate `JWT_SECRET` and `SESSION_SECRET` if they may have been compromised — this invalidates all sessions
- Scan dependencies regularly: `npm audit --production`
