---
last_updated: 2026-08-06
owner: Riri
project: Rental Tracker
related:
- 03-system-architecture.md
- 04-tech-stack.md
- 06-database-design.md
- 13-coding-standards.md
status: Draft
title: Architecture Decisions
version: 1.0.0
---

# 12 Architecture Decisions

## Purpose

This document records the key architectural decisions made for Rental
Tracker and explains why they were chosen. It serves as the project's
Architecture Decision Record (ADR) log.

------------------------------------------------------------------------

# ADR-001 --- Next.js as the Full-Stack Framework

**Decision**

Use Next.js App Router for both frontend and backend.

**Reason**

-   One framework
-   Server Actions
-   Excellent TypeScript support
-   Native Vercel deployment

**Consequences**

-   Simpler architecture
-   Faster development
-   Fewer moving parts

------------------------------------------------------------------------

# ADR-002 --- Supabase as the Backend Platform

**Decision**

Use Supabase for PostgreSQL, Authentication, and Storage.

**Reason**

-   Generous free tier
-   Managed infrastructure
-   Built-in authentication
-   Excellent PostgreSQL support

**Alternatives Considered**

-   Firebase
-   Self-hosted PostgreSQL

------------------------------------------------------------------------

# ADR-003 --- Server Actions Over REST APIs

**Decision**

Use Next.js Server Actions for application operations.

**Reason**

-   End-to-end type safety
-   Less boilerplate
-   Better developer experience

REST endpoints are reserved for external integrations.

------------------------------------------------------------------------

# ADR-004 --- Billing Snapshot Model

**Decision**

Store calculated monthly charges instead of recalculating historical
bills.

**Reason**

-   Historical accuracy
-   Reproducible SOAs
-   Immutable financial records

Changing rent or tenant details must never alter previous billing
cycles.

------------------------------------------------------------------------

# ADR-005 --- Business Logic Lives in Services

**Decision**

Business calculations belong in `services/`.

**Reason**

-   Easier testing
-   Reusable logic
-   Clean UI components

Examples:

-   calculateElectricity()
-   generateSOA()
-   recordPayment()

------------------------------------------------------------------------

# ADR-006 --- Manual Tenant Communication

**Decision**

The application never emails tenants automatically.

**Reason**

The landlord remains responsible for reviewing every Statement of
Account before distribution.

Version 1 only sends reminder emails to the landlord.

------------------------------------------------------------------------

# ADR-007 --- Free-First Technology Strategy

**Decision**

Prioritise free and open-source tools.

**Reason**

Version 1 has minimal infrastructure requirements and should operate
within free-tier limits.

------------------------------------------------------------------------

# ADR-008 --- Feature-First Repository Structure

**Decision**

Organise the codebase by business feature rather than technical layer.

**Reason**

-   Better modularity
-   Easier navigation
-   Improved AI-assisted development

------------------------------------------------------------------------

# ADR-009 --- Single Landlord Account

**Decision**

Support one authenticated landlord account in Version 1.

**Reason**

Matches current business needs while allowing future multi-user
expansion.

------------------------------------------------------------------------

# ADR-010 --- Scheduled Reminders

**Decision**

Use Vercel Cron with Resend.

**Reason**

Only three reminder emails are required each month:

-   25th --- Collect meter readings
-   26th --- Complete billing
-   27th --- Review generated SOAs

------------------------------------------------------------------------

# ADR-011 --- PDF as an Immutable Record

**Decision**

Generate PDFs from billing snapshots and retain them.

**Reason**

Regenerated SOAs must always match the original billing information.

------------------------------------------------------------------------

# ADR-012 --- Future Scalability

**Decision**

Design Version 1 for one property while modelling entities to support
future expansion.

Potential future additions:

-   Multiple properties
-   Multiple landlords
-   Tenant portal
-   Online payments
-   Maintenance tracking

These features should extend the existing architecture rather than
require redesign.

------------------------------------------------------------------------

# Decision Review Process

Every new architectural decision should answer:

1.  What problem does it solve?
2.  Why was this approach chosen?
3.  What alternatives were considered?
4.  What are the consequences?
5.  Does it align with the Project Charter and Product Vision?

------------------------------------------------------------------------

# Summary

Architecture decisions should be documented before implementation
whenever they materially affect the application's structure,
scalability, or maintainability. This document is the authoritative
record of those decisions and should be updated whenever significant
architectural changes are approved.
