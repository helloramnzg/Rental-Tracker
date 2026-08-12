# Changelog

All notable changes to Rental Tracker are recorded here, grouped by
the phase they were built in. This project follows no formal release
numbering yet — it is pre-v1, still in initial implementation.

## Phase 15 — Testing

### Added
- **Vitest** (`vitest.config.mts`) with two projects:
  - `unit` — pure functions only (billing/payment calculations, Zod
    schemas, email template rendering, cron-auth, upcoming-reminder
    date math). 77 tests, no network/DB.
  - `integration` — hits the local Supabase instance directly through
    a signed-in `authenticated`-role client (never the service-role
    client for application-table writes — see below). Forced to a
    single fork/no file parallelism. 49 tests covering Billing (save,
    previous-balance carry-forward, cross-cycle cascade recalculation),
    SOA (generation, storage, regeneration-overwrites-in-place),
    Payments (record/update/delete, partial/overpayment/closed-cycle
    edge cases), Settings (property/billing/notifications), the auth
    middleware (session redirect logic via a captured real
    `@supabase/ssr` cookie), and Notifications (`sendReminderEmail` +
    all three `/api/cron/*` routes, with Resend always mocked).
- **Playwright** (`playwright.config.ts`) — 11 E2E specs covering full
  user journeys (not individual validation rules) for Authentication,
  Billing, Payments, SOA, and Settings. Runs against a **production
  build** (`npm run build && npm run start`), not `next dev` — see
  Fixed below.
- `tests/support/` — the fixture/isolation layer all of the above
  shares:
  - `factories/{tenant,billing-cycle,payment,soa,settings}.ts` —
    Billing/Payments/SOA fixtures create an ephemeral unit + tenant
    under the real (singleton) property at a random far-future
    year/month, so they never touch the two real seeded
    tenants/units or a real billing month. Settings has no such
    trick available (it's a genuine one-row-per-property singleton)
    — its tests snapshot the real row and restore it in
    `afterEach`/`afterAll` instead.
  - `env-guard.ts` — `assertLocalSupabaseEnvironment()`, called by
    every fixture/client helper; refuses to run against anything
    whose `NEXT_PUBLIC_SUPABASE_URL` host isn't 127.0.0.1/localhost.
  - `ensure-test-user.ts` — idempotently creates/repairs the
    documented test landlord account via the Auth admin API (works
    across `npm run db:reset`, which wipes `auth.users`).
  - `clients.ts` / `auth-cookies.ts` / `e2e-login.ts` — sign in as
    that landlord for integration tests (`signInAsLandlord`), or
    capture the resulting session cookies for direct middleware
    testing, or drive the real login form for E2E.
  - Full rationale in `tests/support/README.md`.
- `.env.test.example` (committed) / `.env.test` (gitignored) — test-
  only env overrides (fake `FROM_EMAIL`/`OWNER_EMAIL`/`CRON_SECRET`,
  test landlord credentials); layered on top of `.env.local` by
  `tests/support/load-env.ts`.
- `npm run test:unit` / `test:integration` / `test:e2e` / `test`
  (runs all three in order).

### Fixed
- **Confirmed empirically, not assumed**: `SUPABASE_SERVICE_ROLE_KEY`
  has no table GRANTs in this project's local setup beyond `SELECT` on
  `properties`/`settings` (bypassing RLS ≠ having a Postgres GRANT).
  Attempting `service_role` writes to `tenants` fails with `42501`.
  This ruled out using the service-role client for fixture setup/
  teardown on any application table — see
  `tests/support/README.md` "Service-role client: read-only in
  practice".
- Every factory `cleanup()` initially swallowed Supabase's returned
  `error` instead of throwing. One test's incorrect teardown order (a
  tenant deleted before the billing cycle whose `charges` row still
  referenced it, hitting the `ON DELETE RESTRICT` FK) failed silently
  and leaked a unit+tenant row into the real dev database with no
  test failure to flag it. Fixed by having every cleanup check and
  throw on error, and fixing the one test's ordering
  (`tests/integration/billing/save-billing-cycle.test.ts`).
- Playwright's login journeys were flaky against `next dev`: a click
  on the "Sign in" button could land before Turbopack's on-demand
  compile finished attaching React's `onSubmit` handler, so the
  browser fell back to a native GET form submission
  (`/login?email=...&password=...`) instead of authenticating. Even
  `page.waitForLoadState("networkidle")` didn't reliably avoid it.
  Switched Playwright's `webServer` to a production build, which
  doesn't have the on-demand-compile window — matches the precedent
  in HANDOVER.md for browser-automation flakiness in this repo.

## Phase 6 — SOA Generation

### Added
- `services/soa/generate-soa-pdf.ts` — PDF generation with `pdf-lib`, A4
  portrait, 20mm margins. Header, tenant info, charges table (with an
  electricity usage/rate breakdown line), totals, colour-coded payment
  status, footer.
- Real Inter TTF fonts bundled at `services/soa/fonts/` (OFL-licensed)
  and embedded via `@pdf-lib/fontkit`, specifically because `pdf-lib`'s
  built-in standard fonts cannot render the ₱ (Peso) glyph.
- `services/soa/get-soa-data.ts` — loads one tenant's SOA data entirely
  from the stored billing snapshot; computes payment status
  (outstanding/partial/paid) from actual payment records.
- `services/soa/generate-and-store-soa.ts` — generates + uploads to
  Supabase Storage at a deterministic path
  (`{year}/{month}/{year}-{month}_SOA_{unit}.pdf`), upserts
  `generated_soas`, and transitions `billing_cycles.status` to
  `soa_generated` once every tenant's SOA is generated.
- `features/soa/actions/{generate,download}-soa.ts` — Server Actions;
  download supports separate `preview` (inline) and `download` (forced
  save) modes via signed URLs (60s TTL).
- `app/(app)/soa/page.tsx` + `features/soa/components/soa-view.tsx` —
  real SOA screen: month selector, per-tenant cards with status badge,
  generated time, Preview/Download/Regenerate All.
- Migration `20260806130556_soa_storage.sql` — private `soa` Storage
  bucket + RLS.

### Fixed
- **Stale Data Cache on all authenticated pages.** Next.js caches any
  `fetch()` call made inside a Server Component by default, including
  Supabase-js's underlying HTTP calls — independent of whether the
  route itself is dynamically rendered, and persisting across `next
  start` restarts. Added `dynamic = "force-dynamic"` and `fetchCache =
  "force-no-store"` to `app/(app)/layout.tsx` so every authenticated
  page always reads current data. This was silently affecting Billing
  and SOA before it was found.

### Docs
- `docs/architecture/10-pdf-generation.md`: `@react-pdf/renderer` →
  `pdf-lib` (stale reference; the tech-stack doc and this session's
  task had already settled on pdf-lib).

## Phase 5 — Billing Engine

### Added
- `services/billing/calculate-electricity.ts`,
  `calculate-charges.ts` — pure calculation functions matching the
  documented formulas exactly.
- `services/billing/get-previous-balance.ts` — carry-forward balance:
  most recent prior cycle's `total_due` minus payments recorded
  against it (compounds correctly across multiple unpaid months since
  `total_due` already embeds the prior carry-forward).
- `services/billing/get-billing-context.ts` — loads property,
  settings, tenants+units, previous reading, and any existing draft
  cycle for a given month.
- `services/billing/save-billing-cycle.ts` — orchestrates
  billing_cycles/meter_readings/charges upserts; throws
  `BillingCycleNotEditableError` if the cycle is no longer `draft`.
- `features/billing/actions/save-billing-cycle.ts` — Server Action,
  Zod-validated, standard `{success, data|error}` response shape.
- `app/(app)/billing/page.tsx` + `features/billing/components/
  billing-form.tsx` — real billing form: month selector, utility info,
  live electricity calculation, per-tenant charges table, save.

### Fixed
- `previousReading` input used the HTML `disabled` attribute, which
  causes React Hook Form to silently exclude the field from submitted
  values (RHF only excludes `disabled`, not `readOnly`). Switched to
  `readOnly` with muted styling.
- A hidden `<input>` for `tenantId` was rendered directly inside
  `<TableRow>` (renders as `<tr>`), which is invalid HTML — `<tr>` can
  only contain `<td>`/`<th>`. This caused a hydration error that
  corrupted event handling for the whole table subtree, producing
  intermittent, hard-to-diagnose click failures. Moved the hidden
  input inside a `<TableCell>`.

## Phase 3 — Database

### Added
- Local Supabase stack via Docker + Supabase CLI (no hosted project).
- `20260806111057_initial_schema.sql` — 9 tables (`properties`,
  `units`, `tenants`, `billing_cycles`, `meter_readings`, `charges`,
  `payments`, `generated_soas`, `settings`), 3 enums, FKs, checks,
  indexes.
- `20260806111159_rls_policies.sql` — RLS enabled on all 9 tables,
  `authenticated`-only.
- `20260806120344_grant_authenticated_privileges.sql` — the base
  `GRANT` that RLS policies need to have anything to apply to (RLS
  alone doesn't grant table access; this was missing initially and
  caused `42501 permission denied` even for correctly authenticated
  requests).
- `supabase/seed.sql` — one property, two units, two tenants, one
  settings row. Deliberately excludes billing/payment/SOA history.
- `types/database.ts` generated via `supabase gen types typescript`,
  wired into all three Supabase client helpers via the `Database`
  generic.

### Deviations from `docs/architecture/06-database-design.md`
(all now reflected back into that doc)
- No `users` table — Supabase Auth's `auth.users` covers the single
  landlord; nothing else referenced `users.id`.
- `statements_of_account` renamed to `generated_soas`.
- New `settings` table added (electricity rate default had no home in
  the original schema).
- `units` table **kept** despite a task instruction that omitted it —
  Unit 1/2 electricity math and "one active tenant per unit" both
  depend on it; AGENTS.md resolves doc/instruction conflicts in favour
  of documentation.

## Phase 2 — Application Scaffold

### Added
- Next.js 16 (App Router) + TypeScript strict + Tailwind CSS v4 +
  shadcn/ui (Base UI-based "base-nova" style, not Radix).
- Design tokens from `docs/design/20-design-tokens.md` layered onto
  shadcn's CSS variables (colours, typography scale, spacing, radius,
  shadows, motion, z-index).
- Inter font (via `next/font/google`) replacing the default Geist.
- `lib/supabase/{client,server,middleware}.ts` + root `middleware.ts`
  — session-based route protection, fails closed on auth-check errors.
- App shell: responsive sidebar (260px desktop → icon-only tablet →
  slide-out drawer mobile) and topbar, all 6 documented nav items
  (Dashboard, Monthly Billing, Statements of Account, Payments,
  Tenants, Settings).
- Placeholder pages for all 6 routes + `/login`, using only documented
  empty-state copy — no fabricated data.
- Project-scoped npm cache (`.npmrc` → `.npm-cache/`) to avoid a
  global `~/.npm` permission conflict without needing `sudo`.

## Phase 1 — Documentation Refactor

### Changed
- Electricity Rate: now configurable, defaults to ₱15.00/kWh, billing
  screen pre-fills the default, landlord may override per cycle, SOA
  permanently stores the rate used.
- Water Charge: now a fixed, non-configurable ₱200.00/tenant business
  rule (was previously billing-cycle-level and editable).
- Reminder schedule: confirmed fixed (25th/26th/27th/28th), not
  landlord-configurable — resolved a contradiction where the Settings
  screen had offered to configure days that three separate hardcoded
  Vercel Cron jobs could never have honoured.
- Prisma references removed from tech-stack and folder-structure docs;
  replaced with Supabase CLI / migrations.
- Created `docs/project/02-product-knowledge-base.md`, which several
  other docs' frontmatter referenced but which never existed.

### Known leftover from this phase
- `docs/business/10-business-rules.md` — a duplicate, differently-scoped
  business-rules file created by a process outside this session before
  Phase 1 began. Left in place at the user's explicit instruction
  ("leave exactly as-is"). Not consolidated into
  `docs/product/14-business-rules.md`, which is the complete/current
  one. See HANDOVER.md.
