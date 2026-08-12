---
last_updated: 2026-08-06
owner: Riri
project: Upa OS
related:
- 03-system-architecture.md
- 04-tech-stack.md
- 06-database-design.md
status: Draft
title: Authentication
version: 1.0.0
---

# 08 Authentication

## Purpose

Defines the authentication and authorisation strategy for Upa OS.

Version 1 is intentionally simple: there is only one authenticated
landlord account.

------------------------------------------------------------------------

# Authentication Principles

-   Authentication must be secure by default.
-   Every protected page requires a valid session.
-   Authorisation should support future expansion without redesign.
-   The UI must never trust client-side authentication alone.

------------------------------------------------------------------------

# Authentication Provider

Provider: **Supabase Auth**

Authentication Method:

-   Email + Password
-   Google Sign-in (OAuth, via Supabase Auth)

Future methods (not implemented in Version 1):

-   Magic Link
-   Microsoft Sign-in

------------------------------------------------------------------------

# User Roles

## Version 1

Only one role exists.

  Role       Description
  ---------- --------------------------------
  Landlord   Full access to the application

Future roles:

-   Property Manager
-   Accountant
-   Tenant
-   Administrator

------------------------------------------------------------------------

# Protected Routes

All application routes require authentication except:

``` text
/login
```

Example:

``` text
/
├── dashboard
├── billing
├── payments
├── soa
└── settings
```

------------------------------------------------------------------------

# Session Flow

``` text
User
 ↓
Login
 ↓
Supabase Auth
 ↓
Session Created
 ↓
Middleware Validation
 ↓
Protected Route
```

------------------------------------------------------------------------

# Login Process

1.  User enters email and password.
2.  Credentials are validated by Supabase Auth.
3.  Session is created.
4.  User is redirected to the Dashboard.

------------------------------------------------------------------------

# Logout Process

1.  Destroy Supabase session.
2.  Clear local authentication state.
3.  Redirect to Login.

------------------------------------------------------------------------

# Middleware

Application middleware should:

-   Verify active session.
-   Redirect unauthenticated users.
-   Protect all application pages.
-   Refresh sessions when required.

------------------------------------------------------------------------

# Authorisation

Although Version 1 has one user, all data access should validate
ownership.

Future multi-user support should require minimal changes.

------------------------------------------------------------------------

# Password Policy

Minimum recommendations:

-   12 characters
-   Mixed case
-   Number
-   Special character

Password storage is handled entirely by Supabase.

------------------------------------------------------------------------

# Security Requirements

-   Never expose service role keys.
-   Store secrets in environment variables.
-   Use HTTPS in production.
-   Validate every Server Action.
-   Never trust client input.

------------------------------------------------------------------------

# Environment Variables

``` text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The service role key must only be used on the server.

------------------------------------------------------------------------

# Future Expansion

The authentication architecture should support:

-   Multiple landlords
-   Multiple properties
-   Role-based access control
-   Tenant portal
-   Invitation workflow
-   Password reset

without requiring structural redesign.

------------------------------------------------------------------------

# Summary

Upa OS uses Supabase Auth with email and password
authentication. The implementation is intentionally lightweight for
Version 1 while providing a secure foundation that can evolve into a
multi-user, role-based system in future releases.
