---
last_updated: 2026-08-06
project: Upa OS
status: Draft
title: 10-business-rules
version: 1.0.0
---

# Business Rules

## Billing Cycle

-   One billing cycle per property per month.
-   Closed cycles are read-only.

## Electricity

Electricity Rate is configurable by the landlord.

-   Default Electricity Rate: ₱15.00/kWh
-   The Billing screen pre-fills the default rate.
-   The landlord may override the rate for the current billing cycle.
-   Generated SOAs permanently store the electricity rate used.

Unit 1: (Current Reading − Previous Reading) × Electricity Rate

Unit 2: Mother Meter Bill − Unit 1 Electricity Cost

## Water Charge

Water Charge is a fixed business rule.

-   Each tenant pays ₱200.00.
-   Automatically included in every billing cycle.
-   Not configurable and not editable.
-   Stored in generated SOAs.

## Charges

Total Due = Rent + Electricity + Water + Other Charges + Previous
Balance

## Payments

-   Allow partial payments.
-   Outstanding balance carries forward.

## SOAs

Generated only from billing snapshots.

## Notifications

25th: collect readings 26th: complete billing 27th: SOAs ready 28th:
landlord manually emails tenants
