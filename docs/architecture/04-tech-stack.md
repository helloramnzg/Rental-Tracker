---
last_updated: 2026-08-06
owner: Riri
project: Rental Tracker
related:
- 03-system-architecture.md
- 05-folder-structure.md
- 06-database-design.md
status: Draft
title: Tech Stack
version: 1.1.0
---

# 04 Tech Stack

## Purpose

This document defines the technology stack for Rental Tracker with a
primary goal of maximising the use of free and open-source tools while
remaining production-ready.

------------------------------------------------------------------------

# Technology Principles

-   Prefer free and open-source software whenever possible.
-   Stay within generous free-tier limits.
-   Minimise recurring costs.
-   Keep the stack simple and AI-friendly.
-   Optimise for long-term maintainability over unnecessary complexity.

------------------------------------------------------------------------

# Expected Scale (Version 1)

-   1 landlord account
-   2 tenants
-   2 SOAs generated per month
-   3 automated reminder emails per month
-   Low storage and database usage

This workload comfortably fits within the free tiers of the selected
services.

------------------------------------------------------------------------

# Stack Overview

  Layer             Technology                   Cost
  ----------------- -------------------------- ------
  Frontend          Next.js 15 + React           Free
  Styling           Tailwind CSS                 Free
  UI Components     shadcn/ui                    Free
  Icons             Lucide React                 Free
  Language          TypeScript (Strict Mode)     Free
  Backend           Next.js Server Actions       Free
  Database          PostgreSQL (Supabase)        Free
  Authentication    Supabase Auth                Free
  Storage           Supabase Storage             Free
  Forms             React Hook Form              Free
  Validation        Zod                          Free
  PDF Generation    @react-pdf/renderer          Free
  Email             Resend                       Free
  Scheduling        Vercel Cron                  Free
  Hosting           Vercel Hobby                 Free
  Version Control   Git + GitHub                 Free
  Package Manager   pnpm                         Free

------------------------------------------------------------------------

# Technology Decisions

## Next.js 15

**Purpose**

Single full-stack framework for frontend and backend.

**Why Chosen**

-   App Router
-   Server Actions
-   Excellent TypeScript support
-   Native Vercel deployment
-   Large community
-   Excellent AI coding support

------------------------------------------------------------------------

## TypeScript

Strict Mode is mandatory.

Reasons:

-   Safer refactoring
-   Strong typing
-   Better AI-generated code quality

------------------------------------------------------------------------

## Tailwind CSS

Used for styling.

Reasons:

-   Utility-first workflow
-   Small production bundle
-   Large ecosystem

------------------------------------------------------------------------

## shadcn/ui

Provides reusable UI components.

Reasons:

-   Accessible
-   Customisable
-   No licensing costs
-   Components are copied into the project rather than depending on a
    runtime library

------------------------------------------------------------------------

## Lucide React

Open-source icon library.

Reasons:

-   Lightweight
-   Consistent
-   Tree-shakeable

------------------------------------------------------------------------

## Supabase

Purpose:

-   PostgreSQL database
-   Authentication
-   File storage

Reasons:

-   Generous free tier
-   Managed PostgreSQL
-   Row Level Security
-   Built-in authentication
-   Minimal infrastructure management

No additional backend service is required.

------------------------------------------------------------------------

## Database Access

The application will use the official Supabase client.

Prisma is intentionally omitted in Version 1 to reduce complexity and
dependencies.

If future requirements become significantly more complex, Prisma can be
evaluated later.

------------------------------------------------------------------------

## React Hook Form

Handles all application forms.

Reasons:

-   Lightweight
-   Excellent performance
-   Integrates well with Zod

------------------------------------------------------------------------

## Zod

Used for validating all user input.

Every Server Action must validate incoming data before processing.

------------------------------------------------------------------------

## @react-pdf/renderer

Generates Statements of Account.

Requirements:

-   A4 output
-   Printable
-   Deterministic layout
-   Historical regeneration

------------------------------------------------------------------------

## Resend

Used only for emails to the landlord.

Examples:

-   25th reminder
-   26th reminder
-   27th SOA notification

The application does not automatically email tenants.

------------------------------------------------------------------------

## Vercel Cron

Runs scheduled reminder jobs.

Suitable because only three scheduled tasks run each month.

------------------------------------------------------------------------

## Vercel Hobby

Hosts the application.

Reasons:

-   Free
-   Native Next.js support
-   Preview deployments
-   Minimal operational overhead

------------------------------------------------------------------------

# Estimated Monthly Usage

  Resource             Estimated Usage
  ------------------ -----------------
  Emails                         5--10
  PDFs                               2
  Database Storage        \<10 MB/year
  File Storage             \<5 MB/year
  Cron Jobs                          3

The application is expected to remain within free-tier limits for years.

------------------------------------------------------------------------

# Development Standards

-   ESLint
-   Prettier
-   GitHub
-   Environment variables for secrets
-   No hardcoded credentials

------------------------------------------------------------------------

# Future Considerations

The chosen stack should support future additions including:

-   Multiple properties
-   Multiple landlords
-   Tenant portal
-   Online payments
-   OCR receipt scanning
-   Mobile responsiveness

These features should not require replacing the core technology stack.

------------------------------------------------------------------------

# Summary

Rental Tracker is intentionally designed around free and open-source
technologies. The selected stack minimises operational cost while
remaining scalable, maintainable, and well suited to AI-assisted
development.
