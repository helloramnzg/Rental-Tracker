---
last_updated: 2026-08-06
owner: Riri
project: Upa OS
related:
- 19-design-system.md
- 20-design-tokens.md
- 21-component-library.md
- 22-layout-system.md
status: Draft
title: Dashboard Specification
version: 1.0.0
---

# 23 Dashboard Specification

## Purpose

The Dashboard is the application's home screen and operational command
centre.

The primary objective is not analytics---it's helping the landlord
understand **what needs attention today** and complete the monthly
billing process efficiently.

------------------------------------------------------------------------

# Dashboard Goals

The dashboard should answer five questions within 10 seconds:

1.  What month am I working on?
2.  What should I do next?
3.  Have I generated this month's SOAs?
4.  Who has paid?
5.  Are there any outstanding tasks?

------------------------------------------------------------------------

# Information Priority

Information should appear in this order:

1.  Monthly Billing Checklist
2.  Current Billing Status
3.  KPI Cards
4.  Tenant Payment Status
5.  Recent Activity
6.  Quick Actions

------------------------------------------------------------------------

# Page Structure

``` text
Dashboard
│
├── Header
├── Monthly Checklist
├── KPI Cards
├── Current Billing Cycle
├── Tenant Payment Status
├── Recent Activity
└── Quick Actions
```

------------------------------------------------------------------------

# Header

## Contents

Left

-   Dashboard title
-   Current billing month

Right

-   Today's date
-   Notification bell
-   User profile

------------------------------------------------------------------------

# Monthly Billing Checklist

This is the most important widget.

## Checklist Items

□ Collect submeter reading

□ Enter utility bills

□ Review calculations

□ Generate SOAs

□ Send SOAs to tenants

□ Record payments

Each item should display:

-   Status
-   Completion timestamp
-   Action button (when applicable)

------------------------------------------------------------------------

# KPI Cards

Display four cards.

## Card 1

Current Billing Month

Example:

August 2026

------------------------------------------------------------------------

## Card 2

Outstanding Balance

Example:

₱5,420.00

------------------------------------------------------------------------

## Card 3

Payments Received

Example:

₱8,000.00

------------------------------------------------------------------------

## Card 4

SOA Status

Example:

2 of 2 Generated

------------------------------------------------------------------------

# Current Billing Cycle

Displays:

-   Billing month
-   Mother meter bill
-   Water charge
-   Current status
-   Due date

Primary action:

Continue Billing

------------------------------------------------------------------------

# Tenant Payment Status

Table Columns

-   Tenant
-   Unit
-   Total Due
-   Paid
-   Outstanding
-   Status

Status badges

-   Paid
-   Partial
-   Outstanding

------------------------------------------------------------------------

# Recent Activity

Display the latest actions.

Examples:

-   Billing cycle created
-   Meter reading entered
-   SOA generated
-   Payment recorded
-   Reminder email sent

Newest items appear first.

------------------------------------------------------------------------

# Quick Actions

Buttons:

-   Create Billing Cycle
-   Record Payment
-   Generate SOAs
-   View Statements
-   Edit Tenants

These actions should remain visible without scrolling.

------------------------------------------------------------------------

# Empty States

## New User

Display:

"Welcome to Upa OS"

Button:

Create Your First Billing Cycle

------------------------------------------------------------------------

## No Activity

Display:

"No activity has been recorded yet."

------------------------------------------------------------------------

# Loading States

Use:

-   Skeleton KPI cards
-   Skeleton checklist
-   Skeleton tables

Avoid loading the entire page behind a spinner.

------------------------------------------------------------------------

# Error States

If billing data fails to load:

Show:

-   Friendly explanation
-   Retry button

------------------------------------------------------------------------

# Mobile Behaviour

Desktop is the primary target.

On mobile:

-   KPI cards stack vertically
-   Checklist becomes a single column
-   Tenant table becomes expandable cards
-   Quick Actions become a floating action menu

------------------------------------------------------------------------

# Accessibility

Dashboard must support:

-   Keyboard navigation
-   Screen readers
-   Focus indicators
-   High colour contrast

------------------------------------------------------------------------

# Success Criteria

A landlord should be able to:

-   Understand the month's status within 10 seconds.
-   Complete the monthly billing workflow without opening multiple
    pages.
-   Immediately identify overdue tasks.

------------------------------------------------------------------------

# Future Expansion

The dashboard should be able to accommodate:

-   Multiple properties
-   Multiple users
-   Revenue charts
-   Maintenance reminders
-   Expense tracking
-   Analytics widgets

without changing the core page structure.

------------------------------------------------------------------------

# Summary

The Dashboard is designed as an action-oriented workspace rather than a
reporting screen. Every widget exists to guide the landlord through the
monthly billing cycle, surface important information, and minimise the
number of clicks required to complete routine tasks.
