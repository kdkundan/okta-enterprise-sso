# Troubleshooting Guide

Real-world enterprise SAML SSO issues, root causes, and resolutions.

---

## 1. Access Denied — No Valid Group

**Symptom**: User successfully logs in to Okta but is redirected to `/access-denied?reason=no_valid_group`.

**Root Cause**: The user's Okta account is assigned to the application but does not belong to any `sso_*` group, or the Group Attribute Statement filter is misconfigured.

**Resolution**:
1. In Okta Admin → Directory → Groups, verify the user is a member of at least one `sso_*` group
2. Verify the Okta app's Group Attribute Statement has filter: **Starts with** = `sso_`
3. Check the audit log: `db.auditlogs.find({ event: 'LOGIN_DENIED', email: 'user@example.com' })`
4. Add the user to the appropriate group and test again

---

## 2. User Assigned to App but Role Not Mapped

**Symptom**: User is in an Okta group but the group name doesn't match any entry in `GROUP_ROLE_MAP`.

**Root Cause**: Okta group name does not match the expected naming convention (e.g. `App_Admin` vs `sso_admin`).

**Resolution**:
1. Check the raw SAML assertion — use a browser SAML debugger extension (e.g. SAML-tracer for Firefox)
2. Look for the `groups` attribute value in the assertion
3. Either rename the Okta group to match `sso_*` convention OR add the group name variant to `GROUP_ROLE_MAP`

---

## 3. Missing firstName / lastName

**Symptom**: Dashboard shows blank name. Backend logs show `firstName: ''`.

**Root Cause**: Attribute Statement for `firstName` or `lastName` is not configured in Okta, or the user's Okta profile has empty fields.

**Resolution**:
1. In Okta Admin → App → General → SAML Settings → Attribute Statements, verify `firstName` maps to `user.firstName`
2. In Okta Admin → Directory → People → select user → Edit Profile, fill in First Name and Last Name
3. Use a SAML tracer to verify the attributes appear in the assertion

---

## 4. Certificate Mismatch

**Symptom**: ACS callback returns 500 or redirects to access-denied. Backend logs show: `Invalid signature on samlp:Response`.

**Root Cause**: The `SAML_CERT` in `.env` does not match the certificate currently active in Okta (e.g. Okta rotated the certificate).

**Resolution**:
1. In Okta Admin → App → Sign On → SAML Signing Certificates, find the **Active** certificate
2. Click **Actions → Download certificate**
3. Open the `.cert` file, copy the content between `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`
4. Update `SAML_CERT` in `.env` with the new value (no headers, no line breaks — or with line breaks as Okta provides)
5. Restart the backend

---

## 5. Invalid or Unreachable Metadata URL

**Symptom**: `SAML_ENTRY_POINT` produces a connection error; users never reach Okta login.

**Root Cause**: Wrong Okta SSO URL, typo in domain name, or network firewall blocking outbound to Okta.

**Resolution**:
1. In Okta Admin → App → Sign On → View Setup Instructions, copy the **Identity Provider Single Sign-On URL** exactly
2. Test reachability: `curl -I https://your-org.okta.com/app/your-app-id/sso/saml`
3. Ensure the backend server can reach Okta (check outbound firewall rules)
4. Update `SAML_ENTRY_POINT` in `.env`

---

## 6. Incorrect ACS URL

**Symptom**: After Okta login, Okta shows error: `The SAML response destination is invalid`.

**Root Cause**: The ACS URL in the Okta app configuration does not match `SAML_CALLBACK_URL` in `.env`.

**Resolution**:
1. In Okta Admin → App → General → SAML Settings, check **Single sign-on URL**
2. Ensure it exactly matches your `SAML_CALLBACK_URL` env variable (including protocol, port, and path)
3. In production, update both the Okta app and `.env` to use the production domain
4. Note: Okta allows multiple ACS URLs — add both dev and prod URLs if needed

---

## 7. Session Expiration Issues

**Symptom**: User is logged in but after 8 hours gets redirected to `/login?reason=session_expired`.

**Root Cause**: Expected behavior — JWT expires after `JWT_EXPIRES_IN` (default 8h).

**Resolution (if too short)**:
1. Increase `JWT_EXPIRES_IN` in `.env` (e.g. `24h`)
2. Also increase `maxAge` in `setTokenCookie` in `routes/auth.js` to match
3. Consider implementing refresh tokens for longer sessions

**Resolution (if expiring too early)**:
1. Check server clock sync — JWT validation is time-sensitive
2. Verify `acceptedClockSkewMs` in `config/saml.js` is set to 300000 (5 min) to handle minor drift

---

## 8. JWT Validation Failure

**Symptom**: `/auth/me` returns `401 TOKEN_INVALID` immediately after login.

**Root Cause**: `JWT_SECRET` changed between signing and verification, or cookie is being blocked cross-origin.

**Resolution**:
1. Ensure `JWT_SECRET` is consistent across restarts (store in `.env`, not hardcoded)
2. Verify `withCredentials: true` is set in the Axios instance (`frontend/src/auth/api.js`)
3. Verify `CORS` allows credentials from the frontend origin
4. Verify `COOKIE_SECURE=false` in development (cookies require HTTPS when `secure: true`)

---

## Useful Debug Commands

```bash
# View recent audit events
mongosh okta_sso --eval "db.auditlogs.find().sort({createdAt:-1}).limit(10).pretty()"

# Check active sessions
mongosh okta_sso --eval "db.sessions.find({revoked:false}).pretty()"

# Check user record
mongosh okta_sso --eval "db.users.findOne({email:'user@example.com'})"

# Decode a JWT cookie manually (for debugging)
node -e "const jwt=require('jsonwebtoken'); console.log(jwt.decode('<token>'))"
```
