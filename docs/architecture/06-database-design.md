---
last_updated: 2026-08-06
owner: Riri
project: Rental Tracker
related:
- 03-system-architecture.md
- 04-tech-stack.md
- 05-folder-structure.md
- ../02-product-knowledge-base.md
status: Draft
title: Database Design
version: 1.0.0
---

# 06 Database Design

## Purpose

This document defines the logical database design for Rental Tracker.
The schema is intentionally designed for Version 1 (one property, two
tenants) while remaining extensible for future versions.

------------------------------------------------------------------------

# Design Principles

-   Keep historical records immutable.
-   One billing cycle per month.
-   Store calculated values for historical accuracy.
-   Avoid duplicated data.
-   Design for future multi-property support.

------------------------------------------------------------------------

# Entity Relationship Overview

``` text
Property
   │
   ├── Units
   │      │
   │      └── Tenant
   │              │
   │              ├── Billing Cycle
   │              │        │
   │              │        ├── Charges
   │              │        ├── Meter Reading
   │              │        ├── SOA
   │              │        └── Payments
```

------------------------------------------------------------------------

# Tables

## users

Single landlord account.

  Field        Type        Notes
  ------------ ----------- --------
  id           uuid        PK
  name         text        
  email        text        unique
  created_at   timestamp   

------------------------------------------------------------------------

## properties

  Field     Type
  --------- ---------
  id        uuid
  name      text
  address   text
  active    boolean

Version 1 contains one record.

------------------------------------------------------------------------

## units

  Field              Type
  ------------------ -------------------------
  id                 uuid
  property_id        uuid FK
  name               text
  floor              integer
  electricity_type   enum(submeter,residual)
  active             boolean

Version 1: - Unit 1 (First Floor) - Unit 2 (Second Floor)

------------------------------------------------------------------------

## tenants

  Field              Type
  ------------------ ---------
  id                 uuid
  unit_id            uuid FK
  full_name          text
  email              text
  mobile             text
  monthly_rent       numeric
  due_day            integer
  security_deposit   numeric
  advance_rent       numeric
  notes              text
  active             boolean

Only one active tenant per unit.

------------------------------------------------------------------------

## billing_cycles

Represents one calendar month.

  Field                  Type
  ---------------------- --------------------------------------------------------
  id                     uuid
  property_id            uuid FK
  month                  integer
  year                   integer
  mother_meter_bill      numeric
  water_charge_default   numeric
  status                 enum(draft,billing_complete,soa_generated,sent,closed)
  created_at             timestamp

Unique constraint:

(year, month, property_id)

------------------------------------------------------------------------

## meter_readings

  Field               Type
  ------------------- ---------
  id                  uuid
  billing_cycle_id    uuid FK
  previous_reading    numeric
  current_reading     numeric
  usage_kwh           numeric
  rate_per_kwh        numeric
  unit1_electricity   numeric
  unit2_electricity   numeric

Calculated values are stored to preserve historical accuracy.

------------------------------------------------------------------------

## charges

Stores all billable items.

  Field              Type
  ------------------ ---------
  id                 uuid
  billing_cycle_id   uuid FK
  tenant_id          uuid FK
  rent               numeric
  electricity        numeric
  water              numeric
  other_charges      numeric
  previous_balance   numeric
  total_due          numeric

------------------------------------------------------------------------

## statements_of_account

  Field              Type
  ------------------ --------------------
  id                 uuid
  billing_cycle_id   uuid FK
  tenant_id          uuid FK
  pdf_path           text
  generated_at       timestamp
  emailed_at         timestamp nullable

The emailed_at field records when the landlord confirms the SOA was
sent.

------------------------------------------------------------------------

## payments

  Field              Type
  ------------------ --------------------------------
  id                 uuid
  tenant_id          uuid FK
  billing_cycle_id   uuid FK
  amount             numeric
  payment_date       date
  method             enum(cash,gcash,bank_transfer)
  reference_number   text
  notes              text

Multiple payments are allowed for partial settlements.

------------------------------------------------------------------------

# Relationships

-   One Property → Many Units
-   One Unit → One Active Tenant
-   One Billing Cycle → Many Charges
-   One Billing Cycle → One Meter Reading
-   One Billing Cycle → Two SOAs
-   One Billing Cycle → Many Payments

------------------------------------------------------------------------

# Indexes

Create indexes on:

-   tenants.unit_id
-   billing_cycles(year, month)
-   charges.tenant_id
-   payments.tenant_id
-   statements_of_account.billing_cycle_id

------------------------------------------------------------------------

# Data Retention

Historical billing data must never be overwritten.

When a billing cycle is closed:

-   Charges become read-only.
-   Meter readings remain unchanged.
-   PDFs remain reproducible.

------------------------------------------------------------------------

# Future Expansion

The schema already supports:

-   Multiple properties
-   Multiple units
-   Multiple billing cycles
-   Multiple payments
-   Tenant history

Future modules (maintenance, expenses, online payments) should introduce
new tables rather than altering the core billing model.

------------------------------------------------------------------------

# Summary

The database is centred around the Billing Cycle, ensuring each month's
billing is a permanent snapshot. This approach guarantees reproducible
SOAs, accurate payment history, and a clean foundation for future
growth.
