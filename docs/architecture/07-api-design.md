---
last_updated: 2026-08-06
owner: Riri
project: Rental Tracker
related:
- 03-system-architecture.md
- 04-tech-stack.md
- 06-database-design.md
status: Draft
title: API Design
version: 1.0.0
---

# 07 API Design

## Purpose

Defines how the frontend communicates with the backend. Rental Tracker
uses **Next.js Server Actions** as the primary interaction model.
Traditional REST endpoints are only introduced when required.

------------------------------------------------------------------------

# Design Principles

-   Prefer Server Actions over REST APIs.
-   Validate every input using Zod.
-   Keep business logic inside `services/`.
-   Return predictable responses.
-   Never expose database logic to the UI.

------------------------------------------------------------------------

# Request Flow

``` text
UI
 ↓
Server Action
 ↓
Validation (Zod)
 ↓
Business Service
 ↓
Supabase
 ↓
Response
```

------------------------------------------------------------------------

# Standard Response

Successful operations:

``` ts
{
  success: true,
  data: {}
}
```

Failed operations:

``` ts
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Current meter reading is required."
  }
}
```

------------------------------------------------------------------------

# Server Actions

## Billing

-   createBillingCycle()
-   updateBillingCycle()
-   calculateCharges()
-   closeBillingCycle()

## Meter Readings

-   saveMeterReading()
-   getLatestReading()

## SOA

-   generateSOA()
-   regenerateSOA()
-   downloadSOA()

## Payments

-   recordPayment()
-   updatePayment()
-   deletePayment()

## Tenants

-   createTenant()
-   updateTenant()
-   archiveTenant()

## Settings

-   updateProperty()
-   updateBankDetails()

------------------------------------------------------------------------

# Optional Route Handlers

Use Route Handlers only when external access is required.

Examples:

``` text
GET  /api/health
POST /api/webhooks/resend
```

No public billing endpoints are exposed in Version 1.

------------------------------------------------------------------------

# Validation

Every mutation must:

1.  Validate request with Zod.
2.  Check authentication.
3.  Execute business logic.
4.  Persist changes.
5.  Return typed response.

------------------------------------------------------------------------

# Error Codes

-   VALIDATION_ERROR
-   UNAUTHORIZED
-   NOT_FOUND
-   CONFLICT
-   INTERNAL_ERROR

Display user-friendly messages in the UI while logging technical
details.

------------------------------------------------------------------------

# Security

-   All actions require authentication.
-   Never trust client-side calculations.
-   Perform electricity calculations on the server.
-   Validate ownership of every record before updating.

------------------------------------------------------------------------

# Business Logic

Server Actions orchestrate requests only.

Business rules belong in:

``` text
services/
├── billing/
├── payments/
├── soa/
└── notifications/
```

Examples:

-   calculateElectricity()
-   generateStatement()
-   computeBalance()

------------------------------------------------------------------------

# Versioning

Version 1 has no public API.

If public integrations are added later, introduce:

``` text
/api/v1/
```

without changing existing internal Server Actions.

------------------------------------------------------------------------

# Testing

Every Server Action should have:

-   Validation tests
-   Service unit tests
-   Integration tests against the database

------------------------------------------------------------------------

# Summary

Rental Tracker uses a Server Action-first architecture to minimise
complexity, improve type safety, and keep the application tightly
integrated with Next.js. Public APIs are intentionally limited until a
genuine integration requirement exists.
