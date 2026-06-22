# System Architecture & Group-to-Role Mapping

## System Component Diagram

```mermaid
graph LR
    subgraph "Frontend (React 19 / Vite)"
        AC["AuthContext\n(session state)"]
        PR["ProtectedRoute\n(auth guard)"]
        PAGES["Pages\nLogin · Dashboard\nProfile · AccessDenied"]
        AX["Axios Instance\n(withCredentials)"]
        AC --> PR --> PAGES
        PAGES --> AX
    end

    subgraph "Backend (Express 4)"
        AUTH["/auth routes\nlogin · callback · me · logout"]
        MW["authenticate middleware\n(JWT verify + session check)"]
        PS["passport-saml\n(SAML strategy)"]
        GM["groupMapper\n(role resolution)"]
        JW["JWT utils\n(sign · verify)"]
        AU["auditLogger\n(write events)"]
        AUTH --> MW --> JW
        AUTH --> PS --> GM --> JW
        AUTH --> AU
    end

    subgraph "MongoDB"
        MU[("users")]
        ML[("auditlogs")]
        MS[("sessions")]
    end

    subgraph "Okta (SAML IdP)"
        OIDP["Okta SSO\nSAML 2.0"]
    end

    AX -- "HTTPS + Cookie" --> AUTH
    PS -- "SAMLResponse" --> OIDP
    AUTH -- "upsert" --> MU
    AU -- "insert" --> ML
    AUTH -- "create/revoke" --> MS
```

---

## Group-to-Role Mapping Flow

```mermaid
flowchart TD
    START([SAML Assertion Received]) --> EXTRACT[Extract groups attribute]
    EXTRACT --> CHECK{Contains elog_* group?}
    CHECK -- No --> DENY[Deny Login\nRedirect to /access-denied]
    CHECK -- Yes --> PRIORITY[Apply Role Priority Order]
    PRIORITY --> P1{elog_admin?}
    P1 -- Yes --> R1[role = admin]
    P1 -- No --> P2{elog_shift_manager?}
    P2 -- Yes --> R2[role = shift_manager]
    P2 -- No --> P3{elog_supervisor?}
    P3 -- Yes --> R3[role = supervisor]
    P3 -- No --> P4{elog_operator?}
    P4 -- Yes --> R4[role = operator]
    P4 -- No --> DENY
    R1 & R2 & R3 & R4 --> OVERRIDE{DB roleOverride set?}
    OVERRIDE -- Yes --> ROVERRIDE[Use DB override role]
    OVERRIDE -- No --> FINAL[Use SAML-derived role]
    ROVERRIDE & FINAL --> JWT[Issue JWT + Create Session]
```

## AI Image Generation Prompt

> "A software system component architecture diagram for an enterprise SSO application. Left panel: React 19 SPA components — AuthContext, ProtectedRoute, Pages (Login, Dashboard, Profile, AccessDenied), Axios HTTP client. Center panel: Node.js Express API components — auth routes, JWT middleware, passport-saml strategy, group-to-role mapper, audit logger. Right panel: external services — Okta SAML IdP and MongoDB with three collections (users, auditlogs, sessions). Labeled directional arrows connect all components. Bottom: a group-to-role mapping table showing elog_admin→admin, elog_shift_manager→shift_manager, elog_supervisor→supervisor, elog_operator→operator with a priority order indicator. Professional enterprise architecture style, grey and blue palette, clean flat design, white background."
