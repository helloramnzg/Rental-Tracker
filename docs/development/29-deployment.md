---
project: Rental Tracker
title: Production Deployment
version: 1.0.0
---

# 29 Production Deployment

## Infrastructure

-   Vercel
-   Supabase
-   Resend
-   GitHub

## Release Checklist

-   Tests passing
-   Environment variables configured
-   Database migrated
-   PDFs verified
-   Reminder emails verified

## Deployment Flow

GitHub → Vercel → Production

## Rollback

Use previous successful Vercel deployment if required.

## Monitoring

-   Build failures
-   Email delivery
-   Cron jobs
-   Database availability
