# Upa OS

*Rental management simplified*

## Project Charter

**Version:** 1.0 **Status:** Planning **Last Updated:** August 2026

------------------------------------------------------------------------

# Vision

Upa OS is a private web application that streamlines the monthly
rental billing process for a small residential property.

The application replaces the existing spreadsheet-based workflow with a
simple, reliable, and automated system that reduces repetitive
administrative work while keeping the landlord in full control of tenant
communications.

The goal is not to become a comprehensive property management platform.
Instead, Upa OS focuses on doing one job exceptionally well:

> Generate accurate monthly rental bills with minimal manual effort.

------------------------------------------------------------------------

# Problem Statement

The current billing process relies on multiple CSV files to track:

-   Electricity submeter readings
-   Monthly Statements of Account (SOAs)
-   Tenant balances

Every month the landlord must manually:

-   Record electricity readings
-   Calculate electricity costs
-   Update two SOAs
-   Export documents
-   Keep track of billing history
-   Remember monthly deadlines

Although this process only serves two tenants, it requires repetitive
manual work that increases the risk of calculation errors and forgotten
tasks.

------------------------------------------------------------------------

# Objectives

Upa OS should:

-   Eliminate repetitive monthly calculations.
-   Maintain a complete billing history.
-   Automatically calculate electricity costs.
-   Generate professional Statements of Account.
-   Remind the landlord of important monthly tasks.
-   Make payment tracking simple.
-   Reduce spreadsheet dependency.

------------------------------------------------------------------------

# Target User

Version 1 supports a single authenticated user.

**Role:** Landlord / Property Owner

There are no tenant logins, additional user roles, or public access.

------------------------------------------------------------------------

# Scope

Version 1 includes:

-   One property
-   Two rental units
-   Tenant management
-   Monthly billing
-   Electricity calculations
-   Water charges
-   Other charges
-   SOA generation
-   PDF export
-   Payment recording
-   Billing history
-   Email reminders to the landlord

------------------------------------------------------------------------

# Out of Scope

-   Tenant portal
-   Online payments
-   Automatic tenant emails
-   Maintenance requests
-   Expense management
-   Accounting
-   Multiple properties
-   Multiple users
-   Mobile application

------------------------------------------------------------------------

# Success Criteria

The landlord can complete an entire month's billing in under five
minutes:

1.  Enter mother meter bill.
2.  Enter current submeter reading.
3.  Review calculations.
4.  Download SOAs.
5.  Record payments.

------------------------------------------------------------------------

# Product Principles

## Simplicity First

Every screen should support one primary task.

## Automation Where Appropriate

Automate calculations, reminders, and document generation while keeping
the landlord in control.

## Accuracy Over Features

Correct billing always takes priority over additional functionality.

## Human Control

The application never emails tenants automatically. The landlord reviews
and sends all SOAs manually.

## Auditability

Historical billing records are immutable and SOAs can always be
regenerated.

------------------------------------------------------------------------

# Product Philosophy

Upa OS is a **Rental Billing Assistant**.

It is not accounting software.

It is not a full property management system.

It is a focused operational tool that simplifies one recurring monthly
process.
