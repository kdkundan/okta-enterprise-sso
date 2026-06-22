# Production Deployment Checklist

Review every item before deploying to production.

---

## Environment & Configuration

- [ ] All `.env` variables are set — no defaults remain
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` is a cryptographically random string (≥ 64 chars): `openssl rand -hex 64`
- [ ] `SESSION_SECRET` is a separate random string: `openssl rand -hex 64`
- [ ] `COOKIE_SECURE=true` (requires HTTPS)
- [ ] `COOKIE_SAME_SITE=strict` (or `lax` for cross-origin flows)
- [ ] `FRONTEND_URL` matches your actual production frontend domain
- [ ] `SAML_CALLBACK_URL` matches your production ACS URL (registered in Okta)
- [ ] `SAML_ISSUER` matches the SP Entity ID registered in Okta

---

## Okta Configuration

- [ ] Okta app ACS URL updated to production URL
- [ ] Okta app SP Entity ID updated to production value
- [ ] Okta SAML certificate matches `SAML_CERT` in production `.env`
- [ ] Group Attribute Statement filter is correctly set (`Starts with: elog_`)
- [ ] All production users are assigned to the Okta app and relevant `elog_*` groups
- [ ] Okta MFA is enabled for all users (recommended)

---

## Infrastructure

- [ ] Backend is running behind HTTPS (TLS terminated at load balancer or nginx)
- [ ] MongoDB is in a private network / VPC — not publicly accessible
- [ ] MongoDB authentication is enabled (username + password)
- [ ] MongoDB connection string uses TLS: `mongodb+srv://...`
- [ ] Session store replaced: swap `MemoryStore` → `connect-mongo` (prevents session loss on restart)
- [ ] Reverse proxy (nginx/ALB) is configured to forward `X-Forwarded-For` headers

---

## Security

- [ ] `helmet` is enabled (already configured)
- [ ] CORS origin is locked to the exact production frontend domain
- [ ] JWT `expiresIn` is appropriate for your security policy (8h recommended)
- [ ] Audit logs are being persisted to MongoDB (TTL set to your retention requirement)
- [ ] No secrets are committed to version control (`.env` is in `.gitignore`)
- [ ] Dependencies are pinned and scanned: `npm audit`

---

## Monitoring & Observability

- [ ] `/health` endpoint is connected to your load balancer health checks
- [ ] Structured logs are routed to a log aggregator (Datadog, CloudWatch, ELK)
- [ ] Alerts are configured for `LOGIN_DENIED` spikes and `AUTH_FAILURE` events
- [ ] MongoDB Atlas monitoring (or equivalent) is set up

---

## Testing

- [ ] Full SAML flow tested end-to-end in a staging environment with production Okta app
- [ ] Access denied flow tested with a user who has no `elog_*` group
- [ ] Logout flow tested — cookie is cleared and session is revoked in DB
- [ ] Session expiration tested — user is redirected to login after JWT expires
- [ ] Certificate rotation procedure documented and tested
