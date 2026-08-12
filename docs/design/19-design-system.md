---
last_updated: 2026-08-06
owner: Riri
project: Upa OS
related:
- ../01-product-vision.md
status: Draft
title: Design System
version: 2.0.0
---

# 19 Design System

## Vision

Upa OS should feel like a premium modern SaaS product. The
experience should be calm, spacious, approachable, and highly
functional, inspired by products like Linear, Stripe, Notion and the
provided dashboard reference. The design system intentionally avoids
brand-specific elements (such as the Emitly logo) and instead defines a
reusable visual language.

------------------------------------------------------------------------

# Design Personality

-   Calm
-   Professional
-   Friendly
-   Minimal
-   Premium
-   Data-first

Avoid dark dashboards, heavy gradients, glassmorphism, and overly
saturated colours.

------------------------------------------------------------------------

# Visual Direction

## Overall Feel

-   Soft off-white backgrounds
-   Rounded cards
-   Light borders
-   Subtle shadows
-   Plenty of whitespace
-   Green accent colour
-   Minimal illustrations

The interface should look inviting rather than technical.

------------------------------------------------------------------------

# Colour Palette

## Primary

  Token            Value     Usage
  ---------------- --------- ------------------------------------
  Primary          #A8E063   Primary actions, active navigation
  Primary Dark     #1E3D34   Buttons, headings
  Soft Green       #E8F5E5   Highlights
  Background       #F7F9F7   App background
  Surface          #FFFFFF   Cards
  Border           #E5E7EB   Borders
  Text Primary     #1F2937   Main text
  Text Secondary   #6B7280   Supporting text
  Warning          #F9D976   Warnings
  Accent Purple    #EBD6FF   Calendar / tags

------------------------------------------------------------------------

# Typography

## Font

DM Sans

  Style       Size   Weight
  --------- ------ --------
  Display       32      700
  H1            28      700
  H2            22      600
  H3            18      600
  Body          16      400
  Small         14      400
  Caption       12      500

------------------------------------------------------------------------

# Layout

-   8px spacing system
-   24px page padding
-   Maximum content width: 1440px
-   Sidebar: 260px
-   Top bar: 72px

------------------------------------------------------------------------

# Cards

Cards are the primary layout primitive.

Requirements:

-   White background
-   12px radius
-   1px border (#E5E7EB)
-   Very soft shadow
-   24px internal padding

------------------------------------------------------------------------

# Buttons

Primary: - Bright green background - Dark green text

Secondary: - White background - Border only

Tertiary: - Soft green fill

Ghost: - Transparent

------------------------------------------------------------------------

# Navigation

Sidebar:

-   Rounded active item
-   Icon + label
-   Soft green active state

Topbar:

-   Search
-   Notifications
-   User profile

------------------------------------------------------------------------

# Forms

-   Rounded inputs
-   Clear labels
-   Inline validation
-   Large click targets

Use: - React Hook Form - Zod

------------------------------------------------------------------------

# Data Visualisation

Charts should use:

-   Green
-   Yellow
-   Purple
-   Neutral Grey

Never more than one accent colour in a single chart.

------------------------------------------------------------------------

# Icons

Library:

Lucide React

Default size: 20px

------------------------------------------------------------------------

# Radius

-   Input: 10px
-   Button: 10px
-   Card: 12px
-   Modal: 16px

------------------------------------------------------------------------

# Motion

Animations should be subtle.

-   150--250ms transitions
-   Fade
-   Scale
-   Slide

Avoid bounce animations.

------------------------------------------------------------------------

# Accessibility

-   WCAG AA contrast
-   Keyboard navigation
-   Focus rings
-   Screen reader labels

------------------------------------------------------------------------

# Design Principles

1.  Information before decoration.
2.  Every page has one primary action.
3.  Dashboard prioritises tasks over analytics.
4.  Consistent spacing creates clarity.
5.  Colour communicates state, not decoration.

------------------------------------------------------------------------

# Reference

This design system is based on the approved dashboard mood board
supplied during planning and deliberately excludes any third-party
branding or logos while preserving the overall visual style.
