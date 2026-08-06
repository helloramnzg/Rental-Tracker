---
last_updated: 2026-08-06
owner: Riri
project: Rental Tracker
related:
- ../00-project-charter.md
- ../01-product-vision.md
- ../02-product-knowledge-base.md
- 04-tech-stack.md
- 06-database-design.md
status: Draft
title: System Architecture
version: 1.0.0
---

# 03 System Architecture

## Purpose

This document defines the high-level architecture for Rental Tracker. It
explains how the system is structured, how data flows through the
application, and where business logic belongs.

This document intentionally avoids implementation details. Those are
covered in the remaining architecture documents.

------------------------------------------------------------------------

# Architectural Goals

The architecture should:

-   Keep business logic independent from the UI.
-   Support future expansion to multiple properties and users.
-   Be easy for AI coding agents to understand.
-   Minimise infrastructure complexity.
-   Be easy to deploy and maintain.
-   Prioritise correctness over optimisation.

------------------------------------------------------------------------

# High-Level Architecture

    Browser
        │
        ▼
    Next.js App Router
        │
        ▼
    Server Actions / Route Handlers
        │
        ▼
    Business Services
        │
     ┌──┴──────────────┐
     ▼                 ▼
    PostgreSQL     PDF Generator
    (Supabase)         │
     └──────┬──────────┘
            ▼
      Email Service

------------------------------------------------------------------------

# Architecture Layers

## Presentation Layer

Responsible for:

-   Dashboard
-   Billing screens
-   SOA preview
-   Payment tracking
-   Settings

Responsibilities:

-   Render UI
-   Collect user input
-   Display validation
-   Never perform business calculations

------------------------------------------------------------------------

## Application Layer

Responsible for:

-   Server Actions
-   Route Handlers
-   Request validation
-   Authentication
-   Orchestration

This layer coordinates requests but should not contain business rules.

------------------------------------------------------------------------

## Domain Layer

The heart of the application.

Core business entities:

-   Property
-   Unit
-   Tenant
-   Billing Cycle
-   Meter Reading
-   Charges
-   Statement of Account
-   Payment

Business services include:

-   calculateElectricity()
-   generateSOA()
-   closeBillingCycle()
-   recordPayment()

All business rules belong here.

------------------------------------------------------------------------

## Data Layer

Responsible for:

-   PostgreSQL database
-   File storage
-   Generated PDFs
-   Application configuration

No UI code should directly access the database.

------------------------------------------------------------------------

# Data Flow

## Monthly Billing

1.  Landlord opens current billing cycle.
2.  Inputs mother meter bill.
3.  Inputs current submeter reading.
4.  Server validates inputs.
5.  Business services calculate all charges.
6.  Results are stored.
7.  SOAs are generated.
8.  PDFs become available for download.
9.  Reminder email with PDFs is sent to the landlord.

------------------------------------------------------------------------

# Separation of Responsibilities

  Layer            Responsibility
  ---------------- ---------------------------------------
  UI               Display information and collect input
  Server Actions   Coordinate requests
  Services         Business rules and calculations
  Database         Persist data
  Email            Notifications only
  PDF Engine       Generate Statements of Account

------------------------------------------------------------------------

# Scalability Strategy

Version 1 supports:

-   One property
-   Two units
-   One landlord

The architecture should allow future support for:

-   Multiple properties
-   Multiple landlords
-   Multiple units
-   Tenant portal
-   Online payments
-   Expense tracking

These enhancements should require new modules rather than redesigning
the core domain.

------------------------------------------------------------------------

# Non-Functional Requirements

-   Fast page loads
-   Reliable monthly billing
-   Deterministic calculations
-   Secure authentication
-   Recoverable backups
-   Immutable billing history

------------------------------------------------------------------------

# Architecture Principles

1.  Business logic never belongs in UI components.
2.  Every calculation must be reproducible.
3.  Historical billing records must never be overwritten.
4.  Services should be reusable across UI, APIs, and scheduled jobs.
5.  Prefer composition over duplication.
6.  Optimise for maintainability before optimisation.

------------------------------------------------------------------------

# Dependencies

This document should be read before:

-   04-tech-stack.md
-   05-folder-structure.md
-   06-database-design.md
-   07-api-design.md

Together, these documents define the complete technical foundation of
Rental Tracker.
