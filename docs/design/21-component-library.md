---
last_updated: 2026-08-06
owner: Riri
project: Upa OS
related:
- 19-design-system.md
- 20-design-tokens.md
status: Draft
title: Component Library
version: 1.0.0
---

# 21 Component Library

## Purpose

This document defines every reusable UI component used throughout Upa OS.
All screens should be assembled from these components to ensure
consistency between design and implementation.

------------------------------------------------------------------------

# Component Principles

-   One responsibility per component
-   Accessible by default
-   Responsive
-   Built with shadcn/ui where possible
-   Styled only using design tokens
-   No business logic inside UI components

------------------------------------------------------------------------

# Button

## Purpose

Trigger an action.

## Variants

-   Primary
-   Secondary
-   Ghost
-   Destructive

## States

-   Default
-   Hover
-   Active
-   Focus
-   Disabled
-   Loading

## Specifications

-   Height: 40px
-   Radius: 10px
-   Font: Inter 14px Medium
-   Optional leading icon

------------------------------------------------------------------------

# Input Field

## Purpose

Collect text input.

## Anatomy

-   Label
-   Input
-   Helper text
-   Validation message

## States

-   Default
-   Focus
-   Filled
-   Error
-   Disabled

------------------------------------------------------------------------

# Select / Dropdown

Use for predefined options only.

Examples:

-   Billing Month
-   Payment Method
-   Unit

------------------------------------------------------------------------

# Search Field

Features:

-   Search icon
-   Clear button
-   Instant filtering
-   Keyboard accessible

------------------------------------------------------------------------

# Card

The primary layout container.

## Variants

-   Standard
-   KPI
-   Information
-   Alert

## Specifications

-   White background
-   12px radius
-   24px padding
-   Subtle border

------------------------------------------------------------------------

# KPI Card

Displays important metrics.

Examples:

-   Outstanding Balance
-   Paid This Month
-   Current Billing Cycle
-   Pending SOAs

Structure:

-   Icon
-   Label
-   Value
-   Optional trend indicator

------------------------------------------------------------------------

# Badge

Used for status indicators.

## Variants

-   Paid
-   Partial
-   Outstanding
-   Draft
-   Closed

------------------------------------------------------------------------

# Table

Used for:

-   Tenants
-   Billing History
-   Payments
-   SOAs

Requirements:

-   Sticky header
-   Zebra rows (optional)
-   Sortable columns
-   Empty state
-   Responsive overflow

------------------------------------------------------------------------

# Modal

Used for confirmation and data entry.

Examples:

-   Record Payment
-   Edit Tenant
-   Close Billing Cycle

------------------------------------------------------------------------

# Tabs

Examples:

-   Dashboard
-   Billing
-   Payments
-   Settings

------------------------------------------------------------------------

# Toast Notifications

Purpose:

Provide temporary feedback.

Variants:

-   Success
-   Warning
-   Error
-   Information

Duration:

3--5 seconds

------------------------------------------------------------------------

# Empty State

Every empty page should include:

-   Illustration or icon
-   Clear message
-   Primary call-to-action

------------------------------------------------------------------------

# Loading States

Use:

-   Skeleton loaders
-   Button loading states
-   Table placeholders

Avoid full-page spinners where possible.

------------------------------------------------------------------------

# Charts

Supported:

-   Bar Chart
-   Line Chart
-   Donut Chart

Guidelines:

-   Maximum four colours
-   Always include labels
-   Accessible colour contrast

------------------------------------------------------------------------

# Sidebar

Contents:

-   Logo / Property Name
-   Navigation
-   User Profile
-   Settings

Active navigation uses the primary accent colour.

------------------------------------------------------------------------

# Top Navigation

Contains:

-   Page title
-   Search
-   Notifications
-   User profile

------------------------------------------------------------------------

# Figma Naming

Examples:

Component/Button/Primary

Component/Card/KPI

Component/Input/Default

Component/Table/Standard

Use identical names in Figma and code where practical.

------------------------------------------------------------------------

# Accessibility

Every component must:

-   Support keyboard navigation
-   Display visible focus states
-   Meet WCAG AA contrast
-   Include ARIA attributes where required

------------------------------------------------------------------------

# Definition of Done

A component is complete when it:

-   Matches design tokens
-   Is responsive
-   Is accessible
-   Is documented
-   Is reusable
-   Includes all required states

------------------------------------------------------------------------

# Summary

The component library is the foundation of the Upa OS interface.
Every screen should be composed from these reusable building blocks to
maintain a cohesive, scalable, and maintainable design system.
