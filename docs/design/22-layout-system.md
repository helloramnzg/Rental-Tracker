---
last_updated: 2026-08-06
owner: Riri
project: Upa OS
related:
- 19-design-system.md
- 20-design-tokens.md
- 21-component-library.md
status: Draft
title: Layout System
version: 1.0.0
---

# 22 Layout System

## Purpose

This document defines the structural layout of Upa OS. It
establishes how pages are composed, how users navigate the application,
and how content is organised consistently across every screen.

The layout should feel calm, spacious, and modern while helping
landlords complete monthly billing tasks with minimal cognitive effort.

------------------------------------------------------------------------

# Layout Principles

-   Prioritise content over decoration
-   One primary task per page
-   Consistent spacing using the 8px grid
-   Responsive without changing interaction patterns
-   Clear visual hierarchy
-   Fast to scan

------------------------------------------------------------------------

# Application Shell

Every authenticated page uses the same application shell.

``` text
┌────────────────────────────────────────────────────────────┐
│                     Top Navigation                         │
├───────────────┬────────────────────────────────────────────┤
│               │                                            │
│   Sidebar     │            Page Content                    │
│               │                                            │
│               │                                            │
│               │                                            │
└───────────────┴────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# Sidebar

Width: **260px**

Contents (top to bottom):

-   Property Name
-   Navigation
-   Divider
-   Settings
-   User Profile

Navigation Items

-   Dashboard
-   Monthly Billing
-   Statements of Account
-   Payments
-   Tenants
-   Settings

Rules

-   Fixed position
-   Collapsible in future versions
-   Highlight active page
-   Icons from Lucide React only

------------------------------------------------------------------------

# Top Navigation

Height: **72px**

Contains:

Left

-   Page title
-   Breadcrumb (future)

Right

-   Search (future)
-   Notifications
-   User profile

The top navigation remains fixed while content scrolls.

------------------------------------------------------------------------

# Page Container

Maximum Width

1440px

Padding

24px

Vertical spacing

32px between sections

------------------------------------------------------------------------

# Content Structure

Every page follows this hierarchy:

``` text
Page
├── Header
├── Primary Action
├── KPI Cards (optional)
├── Main Content
└── Secondary Content
```

------------------------------------------------------------------------

# Dashboard Layout

``` text
Header

KPI Cards (4)

Monthly Checklist

Recent Billing Activity

Payment Status

Quick Actions
```

Dashboard should answer:

-   What needs my attention?
-   What is due this month?
-   Who has paid?
-   What should I do next?

------------------------------------------------------------------------

# Billing Screen

Structure

``` text
Billing Header

Billing Progress

Meter Reading Card

Charges Summary

Tenant Breakdown

Generate SOA
```

The primary action ("Generate SOA") should always remain visible.

------------------------------------------------------------------------

# SOA Screen

Structure

``` text
Header

Billing Month Selector

SOA Cards

Preview

Download
```

Support:

-   Preview
-   Download
-   Regenerate

------------------------------------------------------------------------

# Payments Screen

Structure

``` text
Header

Payment Summary

Outstanding Balances

Payment History

Record Payment
```

------------------------------------------------------------------------

# Settings Screen

Sections

-   Property Details
-   Tenant Management
-   Utility Settings
-   Reminder Schedule
-   Bank Details

Group related settings into cards.

------------------------------------------------------------------------

# Grid System

Desktop

12-column grid

Tablet

8-column grid

Mobile

4-column grid

Cards should align consistently across breakpoints.

------------------------------------------------------------------------

# Responsive Behaviour

Desktop (Primary)

≥1024px

Sidebar visible.

Tablet

640--1023px

Sidebar collapses to icons.

Mobile

\<640px

Sidebar becomes a slide-out drawer.

------------------------------------------------------------------------

# Scrolling

-   Sidebar remains fixed.
-   Top navigation remains fixed.
-   Main content scrolls independently.
-   Tables scroll horizontally when required.

------------------------------------------------------------------------

# Empty States

Every screen with no data should include:

-   Icon or illustration
-   Friendly explanation
-   Primary call-to-action

Example:

"No billing cycle has been created for this month."

Button:

Create Billing Cycle

------------------------------------------------------------------------

# Loading States

Use:

-   Skeleton cards
-   Skeleton tables
-   Button loading indicators

Avoid blocking the entire interface with loading overlays.

------------------------------------------------------------------------

# Error States

Errors should appear inline whenever possible.

Provide:

-   Clear explanation
-   Suggested action
-   Retry option

------------------------------------------------------------------------

# Future Layout Expansion

The layout system should support:

-   Multiple properties
-   Multi-user workspaces
-   Tenant portal
-   Analytics dashboard
-   Mobile application

without changing the core application shell.

------------------------------------------------------------------------

# Summary

The Layout System defines the structural foundation of Upa OS.
Every screen should inherit the same navigation, spacing, and content
hierarchy, creating a predictable and efficient user experience that
scales as the application grows.
