---
last_updated: 2026-08-06
owner: Riri
project: Upa OS
related:
- 03-system-architecture.md
- 04-tech-stack.md
- 06-database-design.md
- 13-coding-standards.md
status: Draft
title: Folder Structure
version: 1.0.0
---

# 05 Folder Structure

## Purpose

This document defines the standard folder structure for Upa OS.
It ensures a consistent, scalable organisation that is easy for both
developers and AI coding agents to navigate.

------------------------------------------------------------------------

# Guiding Principles

-   Organise by feature, not by file type.
-   Separate UI from business logic.
-   Keep reusable code isolated.
-   Make every folder have one clear responsibility.

------------------------------------------------------------------------

# Project Structure

``` text
rental-tracker/
│
├── app/
├── components/
├── features/
├── lib/
├── services/
├── emails/
├── pdf/
├── supabase/
├── public/
├── types/
├── utils/
├── hooks/
├── docs/
├── tests/
├── middleware.ts
├── package.json
└── README.md
```

------------------------------------------------------------------------

# Folder Responsibilities

## app/

Contains:

-   App Router pages
-   Layouts
-   Route groups
-   Server Actions

No business calculations should live here.

------------------------------------------------------------------------

## components/

Reusable UI components shared across multiple features.

Examples:

-   Buttons
-   Cards
-   Tables
-   Dialogs
-   Form controls

Components should remain presentation-only.

------------------------------------------------------------------------

## features/

Contains complete business features.

Example:

``` text
features/
├── billing/
├── dashboard/
├── payments/
├── settings/
└── soa/
```

Each feature owns its:

-   Components
-   Actions
-   Hooks
-   Types
-   Validation

------------------------------------------------------------------------

## services/

Business logic.

Examples:

-   calculateElectricity.ts
-   generateSOA.ts
-   recordPayment.ts
-   sendReminder.ts

No React code belongs here.

------------------------------------------------------------------------

## lib/

Shared infrastructure.

Examples:

-   Supabase client
-   Configuration
-   Logger

------------------------------------------------------------------------

## emails/

React Email or email templates.

Examples:

-   reminder-email.tsx
-   soa-ready.tsx

------------------------------------------------------------------------

## pdf/

PDF templates and helpers.

Examples:

-   SOATemplate.tsx
-   pdfGenerator.ts

------------------------------------------------------------------------

## supabase/

Database schema and migrations, managed with the Supabase CLI.

Contains:

-   migrations/
-   config.toml

------------------------------------------------------------------------

## public/

Static assets.

Examples:

-   Logos
-   Icons
-   Images

------------------------------------------------------------------------

## types/

Global TypeScript types.

Only shared types belong here.

Feature-specific types stay within their feature folder.

------------------------------------------------------------------------

## utils/

Pure helper functions.

Examples:

-   formatCurrency()
-   formatDate()
-   generateFilename()

Utilities must not contain business rules.

------------------------------------------------------------------------

## hooks/

Reusable React hooks.

Examples:

-   useBillingCycle()
-   useTenant()

------------------------------------------------------------------------

## docs/

Project documentation.

Includes:

-   Product documentation
-   Architecture
-   Development guides

------------------------------------------------------------------------

## tests/

Automated tests.

Suggested structure:

``` text
tests/
├── unit/
├── integration/
└── e2e/
```

------------------------------------------------------------------------

# Naming Conventions

Folders:

-   lowercase
-   kebab-case

Files:

-   kebab-case.ts
-   kebab-case.tsx

Components:

-   PascalCase

Services:

Verb-based names.

Examples:

-   calculate-electricity.ts
-   generate-soa.ts

------------------------------------------------------------------------

# Feature Example

``` text
features/
└── billing/
    ├── components/
    ├── actions/
    ├── hooks/
    ├── types/
    ├── validation/
    └── index.ts
```

Each feature should be as self-contained as possible.

------------------------------------------------------------------------

# Rules

-   Business logic belongs only in services.
-   Components should never access the database directly.
-   Utilities must remain side-effect free.
-   Feature code should not depend on unrelated features.
-   Shared code should move to lib or components only when genuinely
    reusable.

------------------------------------------------------------------------

# Future Growth

This structure supports:

-   Multiple properties
-   Multiple landlords
-   Additional business modules
-   Mobile applications
-   API integrations

without requiring a major reorganisation of the repository.

------------------------------------------------------------------------

# Summary

A feature-first architecture keeps the codebase modular, predictable,
and easy to extend. Developers and AI coding agents should always follow
this structure when creating new functionality.
