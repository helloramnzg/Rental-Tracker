# Test support

## Why fixtures look the way they do

This app's domain has exactly one property and, per seed data, two units
(`docs/project/00-project-charter.md`: "Version 1 supports... two rental
units"). Every service that reads the property does
`.eq("active", true).limit(1).single()` — a second active property row
would break `.single()` for every other test and the real app.

So test fixtures never create a second property. Instead:

- **Billing / SOA / Payments fixtures** create an ephemeral **unit**
  under the real property (unique name per fixture) and an ephemeral
  **active tenant** on it, then a billing cycle at a random high year
  (5000+) that can never collide with real or other tests' data. Nothing
  about the real seeded property/units/tenants is ever touched. Teardown
  deletes payments → billing cycle (cascades to meter_readings, charges,
  generated_soas) → tenant → unit, and removes any uploaded SOA Storage
  objects.
- **Settings** has a genuine one-row-per-property singleton with no
  natural way to sandbox it. Settings integration/E2E tests snapshot the
  real row's values in `beforeEach`/`before`, mutate it, assert, then
  restore the snapshot in `afterEach`/`after` — "isolated per test where
  practical" per the approved plan, honestly applied to a case where
  full isolation isn't possible.
- **Authentication** tests don't create fixtures; they sign in as the
  documented test landlord account and inspect cookies/redirects.
- **Notifications** tests mock the Resend client (`@/lib/resend`) so no
  real network call or email send ever happens, and toggle the real
  settings row's `email_notifications_enabled` (same snapshot/restore
  pattern as Settings) to exercise the skip path.

## Why integration tests and E2E specs run serially

Given the fixture strategy above, most integration tests *are*
parallel-safe (different random units/years). But Settings/Notifications
tests mutate the one real settings row, and nothing stops a stray bug in
one test's teardown from racing another test's fixture creation. With
only two real units and one property, the blast radius of a race is the
whole app's dev data — not worth the speed. `vitest.config.ts` and
`playwright.config.ts` both force single-worker, sequential execution.
This matches `docs/engineering/31-known-architectural-constraints.md`
("Small Scale Optimisation... do not introduce unnecessary complexity").

## Service-role client: read-only in practice

`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS but — confirmed empirically
against this project's local instance, not assumed — has **no table
grants at all** except `SELECT` on `properties` and `settings` (see
`supabase/migrations/20260807161500_grant_service_role_settings_read.sql`
and `..._161600_grant_service_role_properties_read.sql`). It cannot
insert/update/delete tenants, units, billing_cycles, charges, payments,
or generated_soas — attempting to do so fails with Postgres error 42501.

So per the approved plan's adjustment #2, the service-role client here
is used only for what it can actually do and what only it can do:
ensuring the test landlord's `auth.users` row exists (via the Auth admin
API, which doesn't go through PostgREST table grants). Every fixture
that touches an application table — including setup and teardown — goes
through the same signed-in, `authenticated`-role client the application
itself uses, so tests exercise the real RLS policies, not a bypass.
