---
last_updated: 2026-08-06
owner: Riri
project: Rental Tracker
related:
- 03-system-architecture.md
- 04-tech-stack.md
- 08-authentication.md
- 09-email-automation.md
status: Draft
title: Deployment
version: 1.0.0
---

# 11 Deployment

## Purpose

This document defines how Rental Tracker is deployed, configured,
maintained, and updated across development and production environments.

The deployment strategy prioritises simplicity, reliability, and
zero-cost infrastructure for Version 1.

------------------------------------------------------------------------

# Deployment Principles

-   Prefer managed services over self-hosting.
-   Keep deployments automated.
-   Minimise downtime.
-   Never expose secrets.
-   Production should be reproducible from Git.

------------------------------------------------------------------------

# Hosting Architecture

``` text
GitHub
   │
   ▼
Vercel
   │
   ├── Next.js Application
   ├── Server Actions
   └── Vercel Cron
          │
          ▼
Supabase
   ├── PostgreSQL
   ├── Auth
   └── Storage
          │
          ▼
Resend
   └── Reminder Emails
```

------------------------------------------------------------------------

# Environments

## Local Development

Purpose:

-   Build features
-   Test business logic
-   Preview PDFs

Runs on:

-   localhost

------------------------------------------------------------------------

## Production

Purpose:

-   Live application
-   Scheduled reminders
-   Persistent database
-   File storage

Hosted on:

-   Vercel Hobby

------------------------------------------------------------------------

# Deployment Workflow

``` text
Developer
    │
    ▼
Git Commit
    │
    ▼
GitHub
    │
    ▼
Automatic Vercel Build
    │
    ▼
Production Deployment
```

Every push to the main branch creates a production deployment.

------------------------------------------------------------------------

# Environment Variables

Required:

``` text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
FROM_EMAIL
OWNER_EMAIL
APP_URL
```

Guidelines:

-   Store only in Vercel.
-   Never commit secrets.
-   Rotate keys if compromised.

------------------------------------------------------------------------

# Database Migrations

Changes should follow this process:

1.  Update schema.
2.  Test locally.
3.  Backup production.
4.  Apply migration.
5.  Verify application.

Production migrations should never be applied without validation.

------------------------------------------------------------------------

# Storage

Provider:

Supabase Storage

Folders:

``` text
soa/
├── 2026/
│   ├── 08/
│   ├── 09/
│   └── ...
```

------------------------------------------------------------------------

# Monitoring

Monitor:

-   Deployment status
-   Build failures
-   Cron execution
-   Email delivery
-   Database availability

Version 1 relies on Vercel, Supabase, and Resend dashboards.

------------------------------------------------------------------------

# Backups

Database:

-   Use Supabase managed backups where available.
-   Export important billing data periodically.

Documents:

-   Generated PDFs remain stored in Supabase Storage.
-   Historical PDFs should never be deleted automatically.

------------------------------------------------------------------------

# Rollback Strategy

If deployment fails:

1.  Roll back to the previous successful Vercel deployment.
2.  Investigate the issue locally.
3.  Fix and redeploy.

Database rollbacks should only occur if data integrity is affected.

------------------------------------------------------------------------

# Security Checklist

Before every production deployment:

-   Environment variables configured
-   HTTPS enabled
-   Authentication verified
-   Reminder emails tested
-   Billing calculations validated
-   PDF generation verified

------------------------------------------------------------------------

# Maintenance

Monthly:

-   Verify reminder emails
-   Confirm storage health
-   Check failed deployments
-   Review billing logs

Quarterly:

-   Review dependencies
-   Update packages
-   Test backups

------------------------------------------------------------------------

# Future Deployment

The deployment architecture should support:

-   Custom domains
-   Staging environment
-   Multiple properties
-   Multiple users
-   CI/CD enhancements

without major infrastructure changes.

------------------------------------------------------------------------

# Summary

Rental Tracker uses GitHub, Vercel, Supabase, and Resend to provide a
simple, production-ready deployment pipeline with minimal operational
overhead while remaining within free-tier limits for Version 1.
