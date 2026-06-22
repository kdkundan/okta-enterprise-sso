# SAML Attribute Statements

Documents every SAML attribute this application expects, where it comes from in Okta, and how it is used.

---

## User Attribute Statements

Configure these in Okta: **App → General → SAML Settings → Attribute Statements**

| Attribute Name | Name Format | Okta Expression | Application Usage |
|---|---|---|---|
| `email` | Unspecified | `user.email` | Primary identifier, stored in `users.email` |
| `firstName` | Unspecified | `user.firstName` | Display name, stored in `users.firstName` |
| `lastName` | Unspecified | `user.lastName` | Display name, stored in `users.lastName` |
| `username` | Unspecified | `user.login` | Username, stored in `users.username` |

### Notes

- `email` is the **primary key** — used to upsert the user on every login
- If `firstName` or `lastName` is missing, the application will proceed but display a blank name
- `username` typically matches `email` but may differ in federated scenarios

---

## Group Attribute Statement

Configure in Okta: **App → General → SAML Settings → Group Attribute Statements**

| Attribute Name | Name Format | Filter Type | Filter Value |
|---|---|---|---|
| `groups` | Unspecified | Starts with | `elog_` |

### Why the Filter Matters

Okta users typically belong to dozens of groups (e.g. `Everyone`, department groups, other app groups). The `Starts with: elog_` filter ensures:

1. Only application-relevant groups appear in the SAML assertion
2. The assertion size stays small (faster, more reliable)
3. Group enumeration is prevented — other group memberships are not leaked

### Expected Values

```
elog_admin
elog_shift_manager
elog_supervisor
elog_operator
```

---

## NameID

| Field | Value |
|---|---|
| Format | `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress` |
| Okta Value | `user.email` |
| Usage | Fallback identifier if `email` attribute is missing |

---

## Attribute Extraction Code Reference

See `backend/src/utils/normalizeUser.js` for how these attributes are extracted from the raw SAML profile.
The extractor handles both short-form names (`email`) and full SAML URI claim names for compatibility.
