# Known Architectural Constraints

## Purpose
This document records architectural decisions that should not be changed without careful consideration.

## Constraints

### Documentation First
Documentation is the source of truth. Code must conform to the documentation.

### Small Scale Optimisation
The application is designed for two rental units. Do not introduce unnecessary complexity for hypothetical scale.

### Single Owner
The application is intended for one property owner/administrator.

### Monthly Billing
The system revolves around a monthly billing cycle ending on the 28th.

### Snapshot-based SOAs
Generated SOAs represent a billing snapshot and should not change after generation.

### Business Logic Separation
All billing calculations belong in services, never UI components.

### Vendor Lock-in
Supabase, Vercel and Resend are acceptable dependencies unless requirements change.

## Decision Process
Any architectural change must update:
- Architecture documentation
- AGENTS.md
- Relevant implementation guides
