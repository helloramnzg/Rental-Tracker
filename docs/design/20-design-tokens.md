---
last_updated: 2026-08-06
owner: Riri
project: Upa OS
related:
- 19-design-system.md
status: Draft
title: Design Tokens
version: 1.0.0
---

# 20 Design Tokens

## Purpose

Design tokens are the single source of truth for all visual primitives
used throughout Upa OS. Components and screens must reference
these tokens instead of hard-coded values.

------------------------------------------------------------------------

# Brand Personality

-   Calm
-   Modern
-   Minimal
-   Professional
-   Friendly
-   Premium SaaS

------------------------------------------------------------------------

# Colour Tokens

## Brand

  Token          Hex       Usage
  -------------- --------- -----------------
  primary        #A8E063   Primary buttons, primary accent
  primary-dark   #1E3D34   Headings, text on primary buttons, dark surfaces
  primary-soft   #E8F5E5   Active states

## Neutral

  Token            Hex
  ---------------- ---------
  background       #F7F9F7
  surface          #FFFFFF
  border           #E5E7EB
  text-primary     #1F2937
  text-secondary   #6B7280

## Semantic

  Token     Hex
  --------- ---------
  success   #8FD694
  warning   #F9D976
  error     #F87171
  info      #93C5FD
  purple    #EBD6FF

------------------------------------------------------------------------

# Typography

Font Family

DM Sans

  Token       Size   Weight   Line Height   Letter Spacing
  --------- ------ -------- ------------- ----------------
  display       32      700            40   -0.03em
  h1            28      700            36   -0.03em
  h2            18      700            26   -0.02em
  h3            17      700            24   -0.01em
  body          14      400            20   normal
  small         13      400            18   normal
  caption       12      400            16   normal

Two effective weights carry most UI text: 400 (regular body/muted)
and 600–700 (emphasis — buttons, badges, labels, nav-active state,
headings). Components apply 600/700 explicitly where emphasis is
needed; caption/body/small stay regular by default.

------------------------------------------------------------------------

# Spacing

Base Unit: **8px**

  Token     Value
  --------- -------
  space-1   8px
  space-2   16px
  space-3   24px
  space-4   32px
  space-5   40px
  space-6   48px
  space-7   64px
  space-8   80px

------------------------------------------------------------------------

# Border Radius

  Token         Value
  ------------- --------
  radius-sm     8px
  radius-md     10px
  radius-lg     12px
  radius-xl     16px
  radius-full   9999px

------------------------------------------------------------------------

# Shadows

  Token       Value
  ----------- --------------------------------
  shadow-sm   0 1px 2px rgba(16,24,40,.05)
  shadow-md   0 4px 8px rgba(16,24,40,.08)
  shadow-lg   0 10px 24px rgba(16,24,40,.10)

Use borders before shadows.

------------------------------------------------------------------------

# Layout

  Token               Value
  ------------------- --------
  sidebar-width       260px
  topbar-height       72px
  page-padding        24px
  card-padding        24px
  max-content-width   1440px

------------------------------------------------------------------------

# Motion

  Token    Value
  -------- -------------
  fast     150ms
  normal   200ms
  slow     250ms
  easing   ease-in-out

Use fade, scale and slide transitions only.

------------------------------------------------------------------------

# Z-Index

  Token      Value
  ---------- -------
  dropdown   100
  sticky     200
  modal      500
  toast      900

------------------------------------------------------------------------

# Icons

Library: Lucide React

Default: 20px

Small: 16px

Large: 24px

------------------------------------------------------------------------

# Component Defaults

Buttons: 40px height

Inputs: 40px height

Cards: 12px radius

Tables: 48px row height

Badges: Pill style

------------------------------------------------------------------------

# Dark Mode

Version 1 does not include dark mode.

All components should be designed so dark mode can be introduced later
without changing component structure.

------------------------------------------------------------------------

# Implementation Notes

-   Never hardcode colours.
-   Never hardcode spacing.
-   Reference token names in Figma and code.
-   Keep naming identical across documentation, design files and
    Tailwind configuration.

------------------------------------------------------------------------

# Summary

These design tokens provide the visual foundation for every component
and screen in Upa OS, ensuring consistency between design and
implementation.
