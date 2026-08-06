# Preferred Implementation Patterns

## Folder Responsibilities

- app/: routes and pages
- components/: reusable UI
- services/: business logic
- lib/: utilities
- types/: shared types

## Forms

- React Hook Form
- Zod validation
- Client-side validation with server validation

## Database

- Supabase client wrapper
- Typed queries
- No SQL inside UI

## Services

Business logic should be exposed through small service functions.

## Components

Components should be presentational whenever possible.

## APIs

Keep route handlers thin. Delegate logic to services.
