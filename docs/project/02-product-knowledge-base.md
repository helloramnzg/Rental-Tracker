---
last_updated: 2026-08-06
owner: Riri
project: Upa OS
related:
- 00-project-charter.md
- 01-product-vision.md
status: Draft
title: Product Knowledge Base
version: 1.0.0
---

# Product Knowledge Base

## Purpose

This document is the single source of truth for how Upa OS works from a product perspective. It describes the property, billing process, business rules, reminders, SOA lifecycle, and current scope.

---

# 1. Product Overview

Upa OS is a lightweight web application built for a single landlord managing one residential property with two rental units.

Its primary purpose is to replace manual spreadsheets by streamlining monthly billing, electricity calculations, SOA generation, payment tracking, and reminders.

---

# 2. Property Structure

The property currently contains two rental units.

## Unit 1
- First-floor tenant
- Has its own electricity submeter

## Unit 2
- Second-floor tenant
- Electricity cost is derived from the mother meter after deducting Unit 1's consumption

Current scope supports exactly two tenants.

---

# 3. Tenants

Each tenant record contains:

- Name
- Email address
- Monthly rent
- Fixed monthly water charge
- Billing history
- Payment history

Future versions may support multiple properties and additional tenants.

---

# 4. Monthly Billing Cycle

Every month follows the same workflow:

25th
- Reminder to read submeter

26th
- Enter readings and complete billing

27th
- Generate SOAs

28th
- Landlord manually emails SOAs to tenants

---

# 5. Electricity Calculation

## Configurable Electricity Rate

Default:
- ₱15 per kWh

### Unit 1

Electricity Usage =
Current Reading − Previous Reading

Electricity Cost =
Usage × Electricity Rate

### Unit 2

Electricity Cost =
Mother Meter Bill − Unit 1 Electricity Cost

---

# 6. Water Charges

Each tenant is charged a fixed monthly water fee.

- Unit 1: ₱200
- Unit 2: ₱200

This charge is automatic and not configurable.

---

# 7. Other Charges

The landlord may add optional charges during billing.

Each charge includes:
- Description
- Amount
- Optional notes

Examples:
- Repairs
- Cleaning
- Late fees

---

# 8. Payment Lifecycle

Each billing cycle progresses through:

- Pending
- Partially Paid
- Fully Paid

Payments are recorded manually.

---

# 9. SOA Lifecycle

For each billing cycle:

1. Charges are calculated
2. SOA is generated
3. PDF is exported
4. Landlord manually emails the tenant
5. SOA becomes a historical snapshot

Generated SOAs should never be edited.

---

# 10. Notifications

The application sends reminder emails only to the landlord.

Schedule:

- 25th – Read submeter
- 26th – Complete billing
- 27th – Generate SOAs

No emails are automatically sent to tenants.

---

# 11. Historical Records

The application stores:

- Meter readings
- Monthly bills
- Generated SOAs
- Payment history

Historical records remain available for reporting and reference.

---

# 12. Current Limitations

Version 1 supports:

- One property
- Two rental units
- One landlord
- Manual payment recording
- Manual emailing of SOAs

---

# 13. Future Scope

Potential future enhancements include:

- Multiple properties
- Multiple landlords
- Online tenant portal
- Online payments
- Automatic tenant email delivery
- SMS or Messenger notifications
- Water usage allocation
- Financial reporting dashboard
