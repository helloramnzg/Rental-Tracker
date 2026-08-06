# Handover

Read this before touching code. It exists so a new session doesn't
have to re-derive decisions that were already made — and, more
importantly, doesn't have to re-learn the mistakes that were already
made and fixed. Read `AGENTS.md` and the required doc order first;
this file assumes that context.

Written: 2026-08-06, end of a single long session that covered Phases
1–6 (docs refactor → app scaffold → database → billing engine → SOA
generation). Phase 7 (Payments) was started — docs re-read, no code
written — then interrupted for this handover.

---

## 1. Architecture summary

Next.js 16 (App Router, Turbopack for both dev and build) +
TypeScript strict + Supabase (Postgres, Auth, Storage — local Docker
instance, not hosted) + Tailwind CSS v4 + shadcn/ui (Base UI
primitives under the "base-nova" style, **not Radix** — matters if you
reach for Radix-specific docs/patterns, they won't match).

Layers, feature-first:

```
app/(app)/{billing,soa,dashboard,payments,tenants,settings}/page.tsx
  → Server Components, fetch data, render feature client components
features/{billing,soa}/
  ├── components/   client components (forms, views)
  ├── actions/      'use server' Server Actions — thin, Zod-validate,
  │                 call services/, return {success,data|error}
  └── validation/   Zod schemas, shared by RHF resolver + the action
services/{billing,soa}/
  business logic + all Supabase reads/writes. No React here.
lib/supabase/{client,server,middleware}.ts
  three separate Supabase client constructors (browser/server/edge),
  all typed with types/database.ts (generated, do not hand-edit)
```

`payments/` and `tenants/` and `dashboard/` don't have `features/` or
`services/` subtrees yet — their pages are still Phase 2 placeholders.

**Critical, non-obvious fix**: `app/(app)/layout.tsx` has
`export const dynamic = "force-dynamic"` and `export const fetchCache
= "force-no-store"`. Without these, Next.js's Data Cache silently
caches Supabase's underlying `fetch()` calls from Server Components —
independent of the route being dynamic, and persisting across `next
start` restarts. Discovered because the SOA screen kept showing "no
data" for twenty minutes after data demonstrably existed in the
database. If you add a new authenticated route outside `(app)/`, it
needs this too, or it needs to inherit from a layout that has it.

Auth: Supabase Auth (email+password only), single landlord role, no
`landlord_id`/ownership column anywhere — RLS policies are all "any
`authenticated` user, full access." `middleware.ts` fails closed (auth
check errors → treated as unauthenticated) and redirects
unauthenticated users to `/login`.

## 2. Implemented features

- **Auth**: login page, session-based middleware protection, all
  routes except `/login` require auth.
- **App shell**: responsive sidebar/topbar, all 6 nav items, design
  tokens applied.
- **Database**: full schema, RLS, migrations, seed, generated types.
  See `app/supabase/migrations/` (4 files, run in order) and
  `app/supabase/seed.sql`.
- **Billing Engine** (`/billing`): create/edit a monthly billing
  cycle — mother meter bill, submeter readings, configurable
  electricity rate (default ₱15/kWh, override per cycle), fixed
  ₱200 water charge, other charges, live calculation, save. Editable
  only while `billing_cycles.status = 'draft'`.
- **SOA Generation** (`/soa`): generate a PDF Statement of Account per
  tenant from the billing snapshot, store in Supabase Storage,
  preview (inline) and download (forced save) via signed URLs,
  regenerate. Generating SOAs for a cycle transitions its status to
  `soa_generated`, which locks it against further billing edits.
- **Payments (schema only)**: the `payments` table, RLS, and types
  exist and are fully usable. No service/action/UI layer yet — see
  §3.

## 3. Unfinished features

In priority order, roughly matching what's blocking what:

1. **Payments (Phase 7 — was in progress)**. Docs re-read this
   session: `docs/product/18-payment-system.md`,
   `docs/product/14-business-rules.md`,
   `docs/design/22-layout-system.md` (Payments Screen: Header →
   Payment Summary → Outstanding Balances → Payment History → Record
   Payment), `docs/design/21-component-library.md` (Badge variants:
   Paid/Partial/Outstanding/Draft/Closed). No code written. Needs:
   - `services/payments/record-payment.ts` — insert a payment row,
     validate `amount > 0`.
   - A shared payment-status calculator. **Don't duplicate the logic
     that already exists in `services/soa/get-soa-data.ts`
     (`computePaymentStatus`)** — extract it to somewhere shared
     (e.g. `services/payments/compute-payment-status.ts`) and have
     the SOA service import it. This was already flagged as
     duplication risk before the session ended.
   - `services/payments/get-payments-context.ts` — per-tenant
     outstanding balance + payment history for a billing month.
   - `features/payments/{actions,components,validation}/` following
     the same pattern as `features/billing/`.
   - Real `app/(app)/payments/page.tsx` replacing the Phase 2
     placeholder.
   - Task explicitly scoped this to **record only** — no
     update/delete. `docs/architecture/07-api-design.md` documents a
     `deletePayment()` action name and
     `docs/product/18-payment-system.md` says "Payment history cannot
     be deleted after billing is closed" — don't build delete unless
     asked; if you do, that constraint needs enforcing.
2. **Dashboard** (`/dashboard`) — still the Phase 2 empty-state
   placeholder. `docs/design/23-dashboard-spec.md` wants a Monthly
   Checklist, 4 KPI cards, Current Billing Cycle card, Tenant Payment
   Status table, Recent Activity, Quick Actions. None of it reads real
   data yet.
3. **Tenants** (`/tenants`) — placeholder only. No CRUD UI despite the
   `tenants` table supporting it fully (including fields with no UI
   anywhere yet: `due_day`, `security_deposit`, `advance_rent`,
   `notes`).
4. **Settings** (`/settings`) — only has the Electricity Rate section
   (a Phase 1 doc-editing pass trimmed Property/Tenants/Payment
   Details sections out of `docs/design/26-settings-screen.md`; see
   §7 and CHANGELOG Phase 1). If those sections come back, the
   `settings` table currently only has `default_electricity_rate` —
   it'll need new columns for bank details etc., and the SOA's
   "Payment Information" section (bank details/GCash) currently has
   no data source and is intentionally omitted from the PDF.
5. **Email automation** — `docs/architecture/09-email-automation.md`
   wants three Vercel Cron jobs (25th/26th/27th) hitting Resend.
   `resend` is an installed dependency; nothing else exists. No
   `emails/` templates, no cron config, no Vercel Cron wiring.
6. **"Mark SOA as sent"** — `generated_soas.emailed_at` exists in the
   schema and is described in the docs, but nothing sets it. No
   action to mark a landlord's manual send as complete.
7. **Reports** — mentioned in `docs/product/13-functional-requirements.md`,
   never scoped or discussed beyond the mention.
8. **Download All** (SOA screen) — docs want it
   (`docs/design/25-soa-screen.md`); only per-tenant Download exists.
   Skipped deliberately — multi-file browser downloads are more
   involved (popup-blocking risk, or need a zip) and weren't in the
   Phase 6 task's explicit deliverable list.

## 4. Known bugs

- **None currently open in application code**, as far as this session
  verified. Two real bugs were found and fixed this session (see
  CHANGELOG Phase 5 and Phase 6) — documented here so they aren't
  reintroduced:
  - Don't put `disabled` on a React-Hook-Form-registered input you
    still want submitted. Use `readOnly`.
  - Don't put raw `<input>` (even `type="hidden"`) as a direct child
    of a table-row-rendering component. Put it inside a cell.
- **Environment-only, not an app bug**: in this Claude Code sandbox's
  browser automation, `computer` tool clicks on certain buttons were
  unreliable — sometimes not reaching the React handler at all,
  sometimes triggering an unexplained navigation to `/dashboard`.
  Root cause was never fully pinned down (tried: native form
  submission, `type=button` + onClick, explicit
  `preventDefault()`, fresh tabs, dev vs. production server — all
  exhibited it to varying degrees). **Workaround used throughout**:
  verify functionality via (a) standalone Node scripts calling the
  real service functions directly against the local Supabase
  instance, and (b) direct React prop invocation via
  `javascript_tool` (`element[reactPropsKey].onClick(...)`) as a
  reliable proxy for "the click handler works," since real OS-level
  clicks were the unreliable part, not the application code. If you
  hit the same thing, don't assume it's your code — verify with a
  script first. Also found along the way: `read_console_messages` and
  `read_network_requests` can return stale/cached snapshots in long
  sessions — don't trust them over direct `javascript_exec` checks or
  database ground truth.

## 5. Technical debt

- **No tests anywhere.** `tests/` is an empty placeholder dir.
  `docs/development/28-testing-strategy.md` describes a full pyramid;
  none of it exists. Given how much of this session was spent
  debugging UI-interaction flakiness that turned out to be
  environmental, integration tests around the Server Actions (which
  can run headlessly against the local Supabase instance, as this
  session's verification scripts did) would have caught real
  regressions much faster than browser-based testing did.
- **Currency formatting duplicated** across `billing-form.tsx`,
  `soa-view.tsx`, and `generate-soa-pdf.ts` (three near-identical
  `formatCurrency` functions). Should be one function in `utils/`
  (per `docs/architecture/05-folder-structure.md`'s own convention,
  which nothing currently uses — `utils/` is empty).
- **No shared payment-status calculator** yet (see §3 item 1) — will
  become duplication the moment Payments is built if not extracted
  first.
- No loading/skeleton states implemented anywhere despite
  `docs/design/22-layout-system.md` calling for them.
- No error boundaries beyond Next.js's default dev/prod error pages.
- `middleware.ts` — Next.js 16 flags this convention as deprecated in
  favour of `proxy.ts`. Left as-is because both the Phase 2 task and
  `docs/architecture/05-folder-structure.md` name it explicitly;
  non-blocking, but will eventually need `npx @next/codemod@canary
  middleware-to-proxy .` or a manual rename.
- `docs/business/10-business-rules.md` — a duplicate, less-complete
  business-rules file in a non-standard `docs/business/` folder,
  created by something outside this session before Phase 1 started.
  Left in place three separate times at explicit user instruction
  ("leave exactly as-is"). The real one is
  `docs/product/14-business-rules.md`. If anyone ever asks to clean up
  docs, this is the first thing to fold in and delete.
- Several docs still have unrelated content missing from an early
  Phase 1 editing pass done outside this session, before this session
  started fixing things around it (`docs/design/24-billing-screen.md`,
  `26-settings-screen.md`, `docs/engineering/35-project-glossary.md`,
  `docs/product/17-soa-specification.md` — all lost sections like
  Workflow/Validation/Property-settings/most glossary terms). Left
  as-is per explicit user instruction each time it came up. Worth a
  dedicated pass if anyone wants the docs fully fleshed out again.

## 6. Important implementation decisions not obvious from docs

- **`units` table kept** even though a Phase 3 task instruction's
  table list omitted it. Unit 1/Unit 2 electricity math and "one
  active tenant per unit" both depend on it being a real table, not
  fields on `tenants`. AGENTS.md says documentation wins over an
  instruction when they conflict; this is that rule in practice.
- **No `public.users` table.** Supabase Auth's `auth.users` covers the
  single landlord; nothing else references a `users.id`.
- **`generated_soas`**, not `statements_of_account` (docs updated to
  match).
- **`settings` table is new**, not in the original schema doc (docs
  updated). Currently holds only `default_electricity_rate`.
- **RLS is coarse**: every table's policy is "authenticated → full
  access," no per-row ownership. This is correct for the documented
  single-landlord V1 scope, but if multi-landlord ever ships, every
  policy needs revisiting, not just adding a filter.
- **Storage bucket `soa` is private.** Downloads/previews go through
  60-second signed URLs, generated per-request by a Server Action
  (`features/soa/actions/download-soa.ts`), never a public URL.
  `mode: "download"` sets Storage's `{ download: true }` (forces
  `Content-Disposition: attachment`); `mode: "preview"` omits it (lets
  the browser render the PDF inline).
- **SOA regeneration overwrites, not append.** Storage path is
  deterministic per `(billing_cycle_id, tenant)`:
  `{year}/{month}/{year}-{month}_SOA_{unit}.pdf`. "Immutable" in the
  docs refers to the underlying billing-snapshot numbers, not the PDF
  file — regenerating re-renders the same numbers, doesn't create a
  new file.
- **Inter font is bundled as real TTF files** (`services/soa/fonts/`,
  OFL license, embedded via `@pdf-lib/fontkit`) rather than using
  `pdf-lib`'s built-in standard fonts. This isn't a style choice —
  `pdf-lib`'s standard fonts use WinAnsi encoding and cannot render
  the ₱ (Peso) glyph the docs require for currency formatting.
- **Previous-balance carry-forward** is recursive by construction, not
  by an explicit loop: `previous_balance` for cycle N = cycle N-1's
  `total_due` minus payments against cycle N-1. Since `total_due`
  already embeds cycle N-1's own carried-forward balance, this
  correctly compounds across any number of unpaid months without
  double-counting. See `services/billing/get-previous-balance.ts`.
- **Editability lock**: `saveBillingCycle` throws
  `BillingCycleNotEditableError` unless `status = 'draft'`.
  `generateSoasForBillingCycle` sets `status = 'soa_generated'` after
  generating every tenant's SOA. These two together implement
  "editable before SOA generation" — there's no separate flag, it's
  purely the status transition.
- **Local dev environment specifics**: project-scoped npm cache
  (`app/.npmrc` → `.npm-cache/`, avoids a global `~/.npm` permission
  issue without `sudo`); local Supabase via Docker + Supabase CLI, not
  a hosted project; two `.claude/launch.json` configs exist —
  `rental-tracker-app` (dev) and `rental-tracker-app-prod` (production
  build, used for verification since it doesn't have HMR-related
  quirks).
- **Test landlord account** (local Docker instance only, not
  committed anywhere): `landlord@example.com` / `Landlord123!`. Wiped
  by `npm run db:reset`.
- **Database is currently in pristine seed state** — property/units/
  tenants/settings only, no billing_cycles/charges/payments/
  generated_soas. All verification data created during Phases 5–6 was
  deliberately cleaned up afterward (Postgres rows deleted directly;
  Storage objects deleted via the Storage API, since `storage.objects`
  has a delete-protection trigger against direct SQL deletes).

## 7. Documentation status

Fixed this session (handover pass): `docs/architecture/06-database-design.md`
now correctly documents `generated_soas` (not `statements_of_account`),
notes the `users` table was never implemented, and documents the new
`settings` table. `docs/architecture/10-pdf-generation.md` now says
`pdf-lib` (was `@react-pdf/renderer`).

Grep-checked and clean of stale references (`Prisma`, `pnpm`,
`@react-pdf/renderer`, `statements_of_account`, `Next.js 15`) across
`docs/`, `ai/`, `app/AGENTS.md`, `README.md` as of this handover.

Still not fully reconciled with the implementation (see §5's last
bullet) — several docs lost unrelated sections during an editing pass
outside this session, and were deliberately left that way at the
user's explicit instruction each time it came up. Don't restore that
content unilaterally without asking; it was declined three times in
this session already.

`docs/business/10-business-rules.md` still duplicates
`docs/product/14-business-rules.md`. Left as-is per explicit
instruction. Do not delete unless asked.

## 8. How to pick this back up

```bash
cd app
npm install
npm run db:start          # requires Docker running
npm run db:types          # regenerate types/database.ts if schema changed
cp .env.local.example .env.local   # fill in with `npm run db:start` output
npm run dev
```

Log in with the test landlord account above. `npm run typecheck &&
npm run lint && npm run build` should all be clean before considering
any change done — that was the bar held throughout this session.

If you're building Payments next: read `docs/product/18-payment-system.md`,
`docs/product/14-business-rules.md` (Payments section), and
`docs/design/22-layout-system.md` (Payments Screen structure) fresh —
don't trust a summary, docs may have shifted. Follow the exact
`features/billing/` file pattern for `features/payments/`. Extract the
shared payment-status calculator before duplicating it a third time.
