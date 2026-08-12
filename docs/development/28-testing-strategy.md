---
project: Upa OS
title: Testing Strategy
version: 1.0.0
---

# 28 Testing Strategy

## Philosophy

Test business logic first.

## Test Pyramid

-   Unit Tests
-   Integration Tests
-   End-to-End Tests

## Critical Workflows

-   Billing calculations
-   Electricity computation
-   SOA generation
-   Payment recording
-   Reminder scheduling

## Unit Tests

Test:

-   Services
-   Utilities
-   Validation

## Integration Tests

Test:

-   Database operations
-   Server Actions
-   PDF generation

## E2E Tests

Verify:

-   Monthly billing workflow
-   Payment workflow
-   SOA download
-   Authentication

## Regression Checklist

Before every release:

-   Existing calculations unchanged
-   Historical SOAs regenerate correctly
-   Emails still trigger
