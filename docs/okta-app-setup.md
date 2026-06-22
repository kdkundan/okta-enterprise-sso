# Okta Application Setup Guide

Complete step-by-step instructions for configuring an Okta SAML 2.0 application for this project.

---

## Prerequisites

- Okta Developer or Workforce Identity account
- Admin access to your Okta organization
- Backend running (or planned ACS URL ready)

---

## Step 1 — Create a New SAML Application

1. Log in to your Okta Admin Console (`https://your-org-admin.okta.com`)
2. Navigate to **Applications → Applications**
3. Click **Create App Integration**
4. Select **SAML 2.0** → click **Next**
5. Set **App name**: `Enterprise SSO - Node React`
6. (Optional) Upload a logo
7. Click **Next**

---

## Step 2 — Configure SAML Settings

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

> **Production**: Replace `localhost:9000` with your actual domain (e.g. `https://api.yourcompany.com`)

---

## Step 3 — Attribute Statements

Add the following attribute statements (see `attribute-statements.md` for full details):

| Name | Name Format | Value |
|---|---|---|
| `email` | Unspecified | `user.email` |
| `firstName` | Unspecified | `user.firstName` |
| `lastName` | Unspecified | `user.lastName` |
| `username` | Unspecified | `user.login` |

---

## Step 4 — Group Attribute Statement

Add one Group Attribute Statement:

| Name | Name Format | Filter | Value |
|---|---|---|---|
| `groups` | Unspecified | Starts with | `sso_` |

This ensures only application-relevant groups are included in the SAML assertion.

---

## Step 5 — Retrieve SAML Metadata

After saving, go to **Sign On** tab → **View Setup Instructions**. Copy:

1. **Identity Provider Single Sign-On URL** → paste into `SAML_ENTRY_POINT` in `.env`
2. **Identity Provider Issuer** (your Okta domain)
3. **X.509 Certificate** → paste into `SAML_CERT` in `.env` (remove `-----BEGIN/END CERTIFICATE-----` headers)

---

## Step 6 — Assign Users and Groups

1. Go to **Assignments** tab
2. Click **Assign → Assign to Groups**
3. Assign the relevant `sso_*` groups (e.g. `sso_admin`, `sso_operator`)
4. Users in these groups will receive the correct role upon login

> Users assigned to the app but with no `sso_*` group will be denied at the ACS step.

---

## Step 7 — Test the Integration

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Navigate to `http://localhost:5173/login`
4. Click **Sign in with Okta**
5. Authenticate with an assigned Okta user
6. Verify you land on the Dashboard with correct name, role, and groups
