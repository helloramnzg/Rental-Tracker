---
last_updated: 2026-08-06
owner: Riri
project: Upa OS
related:
- 00-project-charter.md
- 02-product-knowledge-base.md
status: Draft
title: Product Vision & Design Principles
version: 1.0.0
---

# Product Vision & Design Principles

## Purpose

This document defines how Upa OS should feel, behave, and
evolve.

It is the decision-making guide for product design, user experience, and
future development. Whenever there is uncertainty about adding a feature
or designing a screen, these principles take precedence.

------------------------------------------------------------------------

# Product Vision

Upa OS should feel like a calm monthly assistant rather than
accounting software.

The application exists to reduce cognitive load. It should guide the
landlord through a predictable monthly workflow with confidence and
minimal effort.

The user should never need to remember what to do next---the application
should always make the next action obvious.

------------------------------------------------------------------------

# Core Experience

The product should be:

-   Simple instead of feature-heavy
-   Guided instead of overwhelming
-   Reliable instead of clever
-   Fast instead of flexible
-   Focused instead of generic

------------------------------------------------------------------------

# UX Principles

## 1. Task Before Data

Every screen should answer:

> "What does the landlord need to do next?"

The dashboard is a checklist, not a reporting screen.

------------------------------------------------------------------------

## 2. One Primary Action Per Screen

Each page should have a single clear objective.

Examples:

-   Dashboard → Continue this month's workflow
-   Billing → Complete monthly calculations
-   SOA → Review and download
-   Payments → Record payments

------------------------------------------------------------------------

## 3. Progressive Disclosure

Show only the information needed for the current task.

Advanced information should remain accessible but not distracting.

------------------------------------------------------------------------

## 4. Reduce Manual Work

The application should remember information whenever possible.

Examples:

-   Carry forward previous submeter readings
-   Reuse tenant information
-   Reuse rent amounts
-   Generate documents automatically

The user should only enter information that genuinely changes each
month.

------------------------------------------------------------------------

## 5. Human Approval

Automation should prepare work---not complete irreversible actions.

Examples:

✓ Generate PDFs automatically

✓ Calculate electricity automatically

✓ Send reminder emails automatically

✗ Email tenants automatically

------------------------------------------------------------------------

## 6. Build Trust

Every calculation should be explainable.

Users should be able to see:

-   Source values
-   Formula used
-   Final result

No hidden calculations.

------------------------------------------------------------------------

## 7. History is Permanent

Billing records should never be overwritten.

Historical records must always be reproducible.

------------------------------------------------------------------------

# Interface Principles

The interface should feel modern and uncluttered.

Inspired by:

-   Linear
-   Notion
-   Stripe Dashboard

Characteristics:

-   Generous spacing
-   Clear typography
-   Minimal colour palette
-   Strong visual hierarchy
-   Soft cards instead of heavy tables

------------------------------------------------------------------------

# Design Philosophy

The application should answer these questions at a glance:

-   What month am I working on?
-   What is still incomplete?
-   What has already been completed?
-   What requires my attention today?

------------------------------------------------------------------------

# Decision Filter

Before adding any feature, ask:

1.  Does this reduce monthly work?
2.  Does this reduce mistakes?
3.  Does this simplify the workflow?
4.  Does this fit the product vision?
5.  Can it be explained in one sentence?

If the answer is "No" to most of these questions, the feature should not
be included in Version 1.

------------------------------------------------------------------------

# North Star

The landlord should be able to complete an entire month's billing with
confidence in under five minutes, while always feeling informed and in
control.
