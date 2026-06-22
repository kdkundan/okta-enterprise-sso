# Okta RBAC Setup — Groups, Attributes & Role Mapping

Complete guide for configuring Okta groups, SAML attribute statements, and role mapping for this application.

---

## Overview

This app uses Okta group membership to assign application roles at login. The SAML assertion carries the user's groups; the backend maps them to roles. No role data is stored in Okta — only group membership.

```
Okta Group → SAML assertion (groups attribute) → backend resolveRole() → JWT role claim
```

---

## Step 1 — Create the Okta SAML Application

1. Log in to Okta Admin Console (`https://your-org-admin.okta.com`)
2. Navigate to **Applications → Applications → Create App Integration**
3. Select **SAML 2.0** → click **Next**
4. Set **App name**: `Enterprise SSO - Node React` → click **Next**

### SAML Settings

| Field | Value |
|---|---|
| **Single sign-on URL (ACS URL)** | `http://localhost:9000/api/v1/auth/saml/acs` |
| **Audience URI (SP Entity ID)** | `urn:enterprise:sso:local` |
| **Name ID format** | `EmailAddress` |
| **Application username** | `Email` |
| **Response** | Signed |
| **Assertion Signature** | Signed |
| **Signature Algorithm** | RSA-SHA256 |
| **Digest Algorithm** | SHA256 |

> **Production**: Replace `http://localhost:9000` with your actual API domain and update `SAML_CALLBACK_URL` and `SAML_ISSUER` in `.env` accordingly.

---

## Step 2 — Configure Attribute Statements

In the SAML settings screen, scroll to **Attribute Statements** and add:

| Name | Name Format | Value |
|---|---|---|
| `email` | Unspecified | `user.email` |
| `firstName` | Unspecified | `user.firstName` |
| `lastName` | Unspecified | `user.lastName` |
| `username` | Unspecified | `user.login` |

### Notes

- `email` is the primary key — used to upsert the user document on every login
- `username` typically matches `email` but may differ in federated/AD scenarios
- Missing `firstName`/`lastName` will not block login but will show blank display name

---

## Step 3 — Configure Group Attribute Statement

Scroll to **Group Attribute Statements** and add:

| Name | Name Format | Filter Type | Filter Value |
|---|---|---|---|
| `groups` | Unspecified | Starts with | `sso_` |

### Why the filter matters

- Includes only application-relevant groups — keeps assertion size small
- Prevents leaking unrelated group memberships (department groups, other apps)
- Users with no matching `sso_*` group are denied at the ACS step

Click **Next → Finish** to save the app.

---

## Step 4 — Create Application Groups in Okta

Navigate to **Directory → Groups → Add Group** and create these groups:

| Group Name | Description |
|---|---|
| `sso_admin` | Full access — all features and user management |
| `sso_operator` | Standard access — own entries only |

> Group names must start with `sso_` to match the attribute filter above.

---

## Step 5 — Assign Groups to the Application

1. Go to your app → **Assignments** tab
2. Click **Assign → Assign to Groups**
3. Assign each `sso_*` group you created
4. Click **Done**

Users must be members of an assigned group to log in. Users assigned directly without an `sso_*` group will be denied at the ACS step and redirected to `/access-denied`.

---

## Step 6 — Assign Users to Groups

1. Navigate to **Directory → Groups → `sso_<role>`**
2. Click **Manage People → Add Members**
3. Search and add users

Each user should belong to exactly one `sso_*` group. If a user belongs to multiple, the backend assigns the highest-priority role (see `backend/src/auth/groupMapper.js`).

### Role priority (highest → lowest)

```
sso_admin > sso_operator
```

---

## Step 7 — Retrieve SAML Metadata

1. Go to your app → **Sign On** tab
2. Click **View SAML setup instructions** or find the **Metadata URL**
3. Copy the **Metadata URL** and set it in `backend/.env`:

```env
SAML_METADATA_URL=https://your-org.okta.com/app/<app-id>/sso/saml/metadata
```

The backend fetches `entryPoint` and the signing certificate from this URL at startup — no manual cert copy needed.

---

## Step 8 — Backend `.env` Reference

```env
SAML_METADATA_URL=https://your-org.okta.com/app/<app-id>/sso/saml/metadata
SAML_ISSUER=urn:enterprise:sso:local
SAML_CALLBACK_URL=http://localhost:9000/api/v1/auth/saml/acs
```

`SAML_ISSUER` must exactly match the **Audience URI** configured in Okta.  
`SAML_CALLBACK_URL` must exactly match the **ACS URL** configured in Okta.

---

## Step 9 — Test the Integration

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173/login`
4. Click **Sign in with Okta**
5. Authenticate with an assigned Okta user
6. Verify Dashboard shows correct name, role, and group

---

## Role Override (Admin Feature)

To temporarily change a user's role without touching Okta group membership, set `roleOverride` directly in MongoDB:

```js
db.users.updateOne(
  { email: 'user@example.com' },
  { $set: { roleOverride: 'admin' } }
)
```

Remove it to revert to the Okta-derived role:

```js
db.users.updateOne(
  { email: 'user@example.com' },
  { $unset: { roleOverride: '' } }
)
```

---

## Adding a New Role

1. Create Okta group: `sso_<new_role>`
2. Assign the group to the application
3. Add entry to `GROUP_ROLE_MAP` in `backend/src/auth/groupMapper.js`
4. Insert into `ROLE_PRIORITY` at the appropriate position
5. Add `badge-<new_role>` CSS class in `frontend/src/index.css`
6. Assign users to the new group

---

## Access Denied Scenarios

| Scenario | Outcome |
|---|---|
| User authenticated, no `sso_*` group in assertion | Redirected to `/access-denied?reason=no_valid_group` |
| User not assigned to app in Okta | Okta blocks login before SAML assertion is sent |
| Authenticated but accessing a higher-role route | Redirected to `/access-denied?reason=insufficient_role` |
