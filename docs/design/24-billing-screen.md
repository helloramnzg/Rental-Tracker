---
project: Rental Tracker
status: Draft
title: Billing Screen Specification
version: 1.0.0
---

# 24 Billing Screen

## Purpose

The Billing screen is the operational workspace used once per month to
create, review and finalise tenant bills.

## Workflow

1.  Select or create billing cycle
2.  Enter mother meter bill
3.  Enter current submeter reading
4.  Review automatic calculations
5.  Review tenant charges
6.  Generate SOAs

## Screen Layout

-   Page Header
-   Billing Progress
-   Utility Information Card
-   Electricity Calculation Card
-   Tenant Charges
-   Billing Summary
-   Primary Action Bar

## Utility Information

Fields:

-   Billing Month
-   Mother Meter Bill
-   Water Charge
-   Previous Submeter Reading (read-only)
-   Current Submeter Reading

## Automatic Calculations

Unit 1

(Current Reading − Previous Reading) × ₱15/kWh

Unit 2

Mother Meter Bill − Unit 1 Electricity Cost

Calculations update immediately after valid input.

## Tenant Charges

Display

-   Rent
-   Electricity
-   Water
-   Previous Balance
-   Other Charges
-   Total Due

## Validation

-   Current reading cannot be lower than previous.
-   Mother meter bill must be greater than zero.
-   Billing month must be unique.

## Actions

Primary

-   Generate SOAs

Secondary

-   Save Draft
-   Cancel

## Success

Display confirmation and enable SOA preview/download.

## Definition of Done

-   Billing saved
-   Charges calculated
-   Snapshot stored
-   SOAs generated
