---
last_updated: 2026-08-06
owner: Riri
project: Rental Tracker
related:
- 03-system-architecture.md
- 07-api-design.md
- 09-email-automation.md
- ../02-product-knowledge-base.md
status: Draft
title: PDF Generation
version: 1.0.0
---

# 10 PDF Generation

## Purpose

This document defines how Statements of Account (SOAs) are generated,
stored, regenerated, and distributed within Rental Tracker.

The goal is to produce professional, print-ready PDFs that remain
historically accurate and reproducible.

------------------------------------------------------------------------

# Design Principles

-   PDFs are generated from billing snapshots, never from live tenant
    data.
-   Every generated document should be reproducible.
-   PDFs should be suitable for both digital viewing and printing.
-   The layout should closely resemble the existing SOA format while
    adopting a cleaner modern design.

------------------------------------------------------------------------

# PDF Engine

Library:

**pdf-lib**

Reasons:

-   Open source
-   Works well with Next.js
-   Fully programmatic
-   Consistent rendering

------------------------------------------------------------------------

# Generation Flow

``` text
Billing Completed
        │
        ▼
Snapshot Charges
        │
        ▼
Generate SOA Data
        │
        ▼
React PDF Template
        │
        ▼
PDF File
        │
        ├── Download
        ├── Store
        └── Attach to Reminder Email
```

------------------------------------------------------------------------

# Page Specification

Paper Size

-   A4 Portrait

Margins

-   20 mm all sides

Typography

-   Primary: Inter
-   Headings: 16--20 pt
-   Body: 10--11 pt
-   Footer: 9 pt

------------------------------------------------------------------------

# SOA Structure

## Header

-   Company / Property Name
-   Property Address
-   Statement of Account title

------------------------------------------------------------------------

## Tenant Information

-   Tenant Name
-   Unit
-   Billing Month
-   Issue Date
-   Due Date

------------------------------------------------------------------------

## Charges Table

Columns:

-   Description
-   Amount

Rows:

-   Rent
-   Electricity
-   Water
-   Other Charges
-   Previous Balance

------------------------------------------------------------------------

## Summary

-   Current Charges
-   Total Amount Due

------------------------------------------------------------------------

## Payment Information

-   Bank Details
-   GCash (optional)
-   Contact Details

------------------------------------------------------------------------

## Footer

-   Payment instructions
-   Generated date
-   Document version

------------------------------------------------------------------------

# File Naming

Standard format:

``` text
YYYY-MM_SOA_Unit-1.pdf
YYYY-MM_SOA_Unit-2.pdf
```

Example:

``` text
2026-08_SOA_Unit-1.pdf
```

------------------------------------------------------------------------

# Storage

Generated PDFs are stored in:

Supabase Storage

Recommended folder structure:

``` text
soa/
├── 2026/
│   ├── 08/
│   └── 09/
```

------------------------------------------------------------------------

# Regeneration Rules

A PDF may be regenerated at any time.

However, regeneration must always use:

-   Stored charges
-   Stored meter readings
-   Stored billing snapshot

Never use current tenant information.

------------------------------------------------------------------------

# Download Behaviour

Users can:

-   Download one SOA
-   Download both SOAs
-   Regenerate before download

------------------------------------------------------------------------

# Print Optimisation

The PDF should:

-   Fit a single A4 page whenever possible.
-   Avoid page breaks within the charges table.
-   Maintain consistent spacing across operating systems.

------------------------------------------------------------------------

# Currency Formatting

Requirements:

-   Philippine Peso (₱)
-   Two decimal places
-   Thousands separator

Example:

``` text
₱12,345.67
```

------------------------------------------------------------------------

# Versioning

Each generated document should store:

-   Generation timestamp
-   Billing cycle ID
-   Tenant ID
-   Template version

This allows future template updates without affecting historical
records.

------------------------------------------------------------------------

# Future Expansion

The document engine should support:

-   Custom branding
-   Multiple properties
-   Additional document types
-   Watermarked copies
-   Email-ready PDFs
-   Digital signatures

without redesigning the generation pipeline.

------------------------------------------------------------------------

# Summary

Rental Tracker treats PDFs as immutable billing artefacts. Every
Statement of Account is generated from a historical billing snapshot,
stored for future reference, and can be regenerated at any time while
preserving the exact billing information originally issued.
