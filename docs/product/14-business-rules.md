---
last_updated: 2026-08-06
project: Rental Tracker
status: Draft
title: 10-business-rules
version: 1.0.0
---

# Business Rules

## Billing Cycle

-   One billing cycle per property per month.
-   Closed cycles are read-only.

## Electricity

Unit 1: (Current Reading − Previous Reading) × ₱15/kWh

Unit 2: Mother Meter Bill − Unit 1 Electricity Cost

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
