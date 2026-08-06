---
last_updated: 2026-08-06
owner: Riri
project: Rental Tracker
related:
- 03-system-architecture.md
- 04-tech-stack.md
- 07-api-design.md
- ../02-product-knowledge-base.md
status: Draft
title: Email Automation
version: 1.0.0
---

# 09 Email Automation

## Purpose

This document defines the automated email system for Rental Tracker.

Version 1 only sends emails to the landlord. The application never sends
emails directly to tenants.

------------------------------------------------------------------------

# Design Principles

-   Automate reminders, not tenant communication.
-   Every automated email should prompt a clear action.
-   Emails should be reliable, simple, and easy to understand.
-   Failed deliveries should be logged for review.

------------------------------------------------------------------------

# Email Provider

Provider: **Resend**

Reasons:

-   Generous free tier
-   Simple API
-   Excellent Next.js support
-   Reliable transactional email delivery

------------------------------------------------------------------------

# Scheduling

Scheduler: **Vercel Cron**

Three scheduled jobs run every month.

  Day    Time    Purpose
  ------ ------- --------------------------------------
  25th   09:00   Reminder to collect submeter reading
  26th   09:00   Reminder to complete monthly billing
  27th   09:00   Notify that SOAs are ready

All schedules use the server's configured timezone.

------------------------------------------------------------------------

# Email Flow

``` text
Vercel Cron
      │
      ▼
Server Action
      │
      ▼
Business Service
      │
      ▼
Resend API
      │
      ▼
Landlord Inbox
```

------------------------------------------------------------------------

# Reminder 1

## Schedule

25th of every month

## Subject

Rental Billing Reminder -- Collect Submeter Reading

## Purpose

Prompt the landlord to:

-   Record current submeter reading
-   Obtain the mother meter bill
-   Confirm water charges

------------------------------------------------------------------------

# Reminder 2

## Schedule

26th of every month

## Subject

Rental Billing Reminder -- Complete Monthly Billing

## Purpose

Prompt the landlord to:

-   Enter utility information
-   Review electricity calculations
-   Finalise billing

------------------------------------------------------------------------

# Reminder 3

## Schedule

27th of every month

## Subject

Your Monthly SOAs Are Ready

## Purpose

Inform the landlord that:

-   Both SOAs have been generated
-   PDFs are attached (or available for download)
-   Bills are ready to send to tenants manually

------------------------------------------------------------------------

# Email Templates

Templates live in:

``` text
emails/
├── reminder-submeter.tsx
├── reminder-billing.tsx
└── soa-ready.tsx
```

Each template should:

-   Use consistent branding
-   Be mobile-friendly
-   Contain a clear call-to-action
-   Link back to Rental Tracker

------------------------------------------------------------------------

# Failure Handling

If an email cannot be delivered:

1.  Log the error.
2.  Store the failure timestamp.
3.  Display the failure on the dashboard.

Version 1 does not retry automatically.

Manual resend should be available from the dashboard.

------------------------------------------------------------------------

# Dashboard Integration

The dashboard should display:

-   Last reminder sent
-   Delivery status
-   Failed email notifications
-   Manual resend option

------------------------------------------------------------------------

# Environment Variables

``` text
RESEND_API_KEY=
APP_URL=
FROM_EMAIL=
OWNER_EMAIL=
```

Secrets must never be committed to source control.

------------------------------------------------------------------------

# Future Expansion

Future versions may support:

-   Tenant email delivery
-   SMS reminders
-   Push notifications
-   Custom reminder schedules
-   Multiple landlords
-   Multiple notification recipients

These features should extend the notification service without changing
the existing reminder workflow.

------------------------------------------------------------------------

# Summary

Rental Tracker uses Vercel Cron and Resend to automate the landlord's
monthly billing reminders. The system is intentionally lightweight,
reliable, and centred on assisting the landlord while leaving all tenant
communication under manual control.
