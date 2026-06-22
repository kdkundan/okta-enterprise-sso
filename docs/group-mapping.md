# Group-Based Authorization & Role Mapping

Explains how Okta groups map to application roles and how access decisions are enforced.

---

## Group-to-Role Map

Defined in `backend/src/auth/groupMapper.js`:

| Okta Group | Application Role | Permissions |
|---|---|---|
| `elog_admin` | `admin` | Full access — all features, user management |
| `elog_shift_manager` | `shift_manager` | Manage shift logs, view reports |
| `elog_supervisor` | `supervisor` | Approve entries, view team data |
| `elog_operator` | `operator` | Create and edit own log entries |

---

## Role Priority

When a user belongs to multiple `elog_*` groups (e.g. `elog_admin` and `elog_operator`), the highest-privilege role wins:

```
Priority (highest → lowest):
  1. elog_admin
  2. elog_shift_manager
  3. elog_supervisor
  4. elog_operator
```

This is controlled by `ROLE_PRIORITY` array in `groupMapper.js`. Adjust order to match your privilege model.

---

## Role Override (DB Feature)

Administrators can set a `roleOverride` on any user document in MongoDB:

```js
// MongoDB — manually promote a user
db.users.updateOne(
  { email: 'user@example.com' },
  { $set: { roleOverride: 'admin' } }
)
```

When `roleOverride` is set, it takes precedence over the SAML group-derived role. Useful for:
- Temporary privilege escalation
- Testing without changing Okta group membership
- Emergency access grants

---

## Access Denied Scenarios

| Scenario | Outcome |
|---|---|
| User in app, no `elog_*` group | Redirected to `/access-denied?reason=no_valid_group` |
| User in `elog_*` group but not assigned to Okta app | Okta blocks login before SAML assertion is sent |
| Authenticated but accessing wrong-role route | Redirected to `/access-denied?reason=insufficient_role` |

---

## Adding a New Role

1. Create the Okta group: `elog_<new_role>`
2. Add entry to `GROUP_ROLE_MAP` in `groupMapper.js`
3. Add to `ROLE_PRIORITY` at the appropriate position
4. Add `badge-<new_role>` CSS class in `frontend/src/index.css`
5. Update Okta group attribute statement filter if needed
6. Assign users to the new Okta group
