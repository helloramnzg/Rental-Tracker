# **Rental Tracker — Technical Review**

## **1\. Product Understanding**

Rental Tracker is a single-tenant-user, two-unit rental billing assistant for one landlord managing one property. It explicitly replaces a CSV/spreadsheet workflow. Its entire value proposition is compressed into one sentence in the Charter: *"Generate accurate monthly rental bills with minimal manual effort,"* with a success criterion of completing a month's billing in under 5 minutes.  
It is deliberately not: accounting software, a full property management platform, a tenant portal, or a payments processor. Scope is tightly bounded — one property, two units, no tenant logins, no online payments, no automatic tenant-facing emails (`00-project-charter.md`).  
The core loop, repeated everywhere (Charter, `context.md`, Dashboard spec): collect submeter reading → enter mother meter bill/water charge → auto-calculate electricity → review tenant charges → generate SOAs (PDF) → landlord manually sends to tenants → record payments.

## **2\. Architecture Summary**

Layered architecture (`03-system-architecture.md`):  
Browser → Next.js App Router → Server Actions → Business Services → PostgreSQL (Supabase) \+ PDF Generator → Email (Resend)

* Presentation: UI only, no calculations.  
* Application: Server Actions/Route Handlers — orchestration \+ Zod validation, no business rules.  
* Domain: Services (calculateElectricity, generateSOA, closeBillingCycle, recordPayment) — all business rules live here, exclusively.  
* Data: Supabase Postgres, Supabase Storage for PDFs.

Stack: Next.js 15 (App Router), TypeScript strict, Tailwind \+ shadcn/ui, Supabase (DB/Auth/Storage), React Hook Form \+ Zod, @react-pdf/renderer, Resend, Vercel (hosting \+ Cron), pnpm (`04-tech-stack.md`).  
Repository is feature-first (`05-folder-structure.md`): app/, components/, features/{billing,dashboard,payments,settings,soa}/, services/, lib/, emails/, pdf/, types/, utils/, hooks/.  
Data model centers on Billing Cycle as the aggregate root: properties → units → tenants → billing\_cycles → {meter\_readings, charges, statements\_of\_account, payments} (`06-database-design.md`). Twelve ADRs formalize these choices (`12-architecture-decisions.md`), the most consequential being ADR-004 (snapshot model) and ADR-006 (no automatic tenant emails).  
Auth is Supabase Auth, email+password, single "Landlord" role, all routes protected except /login (`08-authentication.md`).

## **3\. Business Rules Summary**

From `14-business-rules.md`, `AGENTS.md`, and `24-billing-screen.md`:

* Electricity — Unit 1: (Current Reading − Previous Reading) × Rate (rate defaults to ₱15/kWh, configurable in Settings per `26-settings-screen.md` and `35-project-glossary.md`).  
* Electricity — Unit 2: Mother Meter Bill − Unit 1 Electricity Cost (residual method).  
* Total Due \= Rent \+ Electricity \+ Water \+ Other Charges \+ Previous Balance.  
* Billing cycle \= one per property per month; closed cycles are read-only.  
* Payments: partial payments allowed; balance rolls forward.  
* SOAs generated only from stored billing snapshots — never recalculated from live tenant data.  
* Fixed monthly cadence: 25th (collect readings) → 26th (complete billing) → 27th (SOAs ready) → 28th (landlord manually emails tenants).  
* Historical billing records are immutable; PDFs must always be reproducible from the original snapshot.

## **4\. Design Philosophy**

Two consistent threads run through `01-product-vision.md` and `19-design-system.md`:

* Product philosophy: "calm monthly assistant, not accounting software." Task-before-data, one primary action per screen, progressive disclosure, automation that *prepares* work but never completes irreversible actions (e.g., PDFs generate automatically, but tenant emails never send automatically), full calculation transparency ("no hidden calculations"), and permanent/reproducible history.  
* Visual philosophy: Linear/Notion/Stripe-inspired — soft off-white background, white cards, 12px radii, minimal green accent (\#A8E063 / \#1E3D34), Inter typeface, 8px spacing grid, WCAG AA accessibility. Explicitly avoids dark dashboards, gradients, and glassmorphism.

Every design/product doc converges on the same "Decision Filter" logic: a feature only belongs in v1 if it reduces monthly work, reduces mistakes, simplifies the workflow, and can be explained in one sentence.

## **5\. User Workflow Summary**

Three flows are documented in `15-user-flows.md`:

1. Monthly Billing: Login → Dashboard → Billing Cycle → Enter Meter Reading → Review Charges → Generate SOAs → Download PDFs.  
2. Payment: Dashboard → Payments → Select Tenant → Record Payment → Update Status.  
3. Tenant Edit: Settings → Tenant → Edit Details → Save.

The Dashboard (`23-dashboard-spec.md`) is the operational hub — a 6-item checklist (collect reading, enter bills, review calculations, generate SOAs, send SOAs, record payments) plus 4 KPI cards, tenant payment status table, recent activity feed, and quick actions.

## **6\. Risks**

* Solo-maintainer \+ AI-first process risk: The entire system depends on strict adherence to "documentation wins over code" and "stop and ask when ambiguous" (`AGENTS.md`). This review already surfaces several ambiguities (Section 8/9) an AI agent implementing literally could silently resolve *wrong*.  
* Cron/Settings mismatch risk (see Section 8): if reminder days become genuinely configurable but Cron jobs are hardcoded, reminders silently stop matching what Settings promises.  
* Financial correctness risk: this is a billing system handling real money and legally-relevant records (SOAs, payments) for actual tenants, but no doc defines reconciliation/audit tooling beyond "immutable snapshot" — e.g., no documented process for correcting a mis-entered reading after a cycle is closed, short of undocumented manual DB intervention.  
* Single point of failure: one Supabase project, one Vercel account, one Resend account, no documented disaster-recovery/restore drill beyond "use Supabase managed backups where available" (`11-deployment.md`) — untested backup is not a backup.  
* Free-tier assumption risk: the entire cost model assumes free tiers indefinitely (`04-tech-stack.md`); no documented threshold or plan for what happens if usage/policy changes push any service past free limits.  
* Scope-creep risk against a very sparse spec: many docs (product/13-18) are extremely thin (single-page bullet lists) compared to the architecture/design docs. An implementer will be forced to make many judgment calls that AGENTS.md says should instead halt for clarification.

## **7\. Missing Documentation**

* 02-product-knowledge-base.md is referenced but does not exist. Frontmatter related: links in `03-system-architecture.md`, `06-database-design.md`, `09-email-automation.md`, `10-pdf-generation.md`, and `01-product-vision.md` all point to it. The numbering scheme also skips 02 entirely (00, 01, then jumps to 03). This is either a deleted/never-written foundational doc or a numbering error — either way it's a gap in the "required reading order" AGENTS.md insists must never be skipped.  
* No documented migration tooling. `04-tech-stack.md` explicitly excludes Prisma, but no doc says how schema/migrations are actually authored and applied against Supabase (SQL files? Supabase CLI? Studio?). `11-deployment.md` just says "update schema... apply migration" with no mechanism.  
* No server actions for 3 of 5 Settings sections. `07-api-design.md` lists only updateProperty() and updateBankDetails(), but `26-settings-screen.md` has five sections (Property, Tenants, Utility Settings, Reminder Schedule, Payment Details). No updateUtilitySettings() or updateReminderSchedule() action is documented.  
* No input field for "Other Charges." It appears as a line item in Tenant Charges review, SOA spec, and the DB charges table, but no screen documents where/how the landlord enters it per tenant.  
* No documented mechanism for how a single "Water Charge" value (entered once on the Billing screen) becomes two separate charges.water values (one per tenant) — split evenly? duplicated? See Section 9\.  
* No documented checklist completion logic. The Dashboard's six checklist items ("Collect submeter reading," "Record payments," etc.) have no defined state machine for when each is considered "done."  
* No documented markSOAAsSent() action to set statements\_of\_account.emailed\_at, despite that field's explicit purpose in `06-database-design.md`.  
* No documented tenant transition/move-out workflow despite the DB constraint "only one active tenant per unit" implying tenants do get swapped out.  
* Settings → Tenant fields are incomplete relative to the schema. `26-settings-screen.md` lists only Name, Email, Mobile, Monthly Rent, but tenants table also has due\_day, security\_deposit, advance\_rent, notes with no corresponding UI documented anywhere.  
* No documented password/validation schema, despite `08-authentication.md` stating "recommended" password rules.  
* No email templating approach specified. `05-folder-structure.md` mentions "React Email or email templates" as an either/or, but `04-tech-stack.md`'s stack table never lists React Email as a dependency.

## **8\. Contradictions**

1. Prisma: `04-tech-stack.md` states, in bold, *"Prisma is intentionally omitted in Version 1."* Yet `05-folder-structure.md` defines a standard prisma/ folder containing schema.prisma and migrations/ as part of the canonical repo structure. This is a direct, unresolved conflict between two architecture docs of the same status/date.  
2. Configurable reminder schedule vs. hardcoded Cron jobs: `26-settings-screen.md` documents a "Reminder Schedule" settings section with editable Reminder 1/2/3 Day fields. But `09-email-automation.md` and ADR-010 hardcode three separate Vercel Cron jobs fixed to the 25th/26th/27th with no described mechanism for reading a per-property configured day. As currently architected, changing the Settings value would do nothing.  
3. Electricity rate: fixed rule vs. configurable value: `14-business-rules.md` and `24-billing-screen.md` write the formula with a literal × ₱15/kWh, phrased as if it's a permanent constant. But `26-settings-screen.md` and the glossary ("Electricity Rate: cost per kWh configured in Settings") describe ₱15/kWh only as the *default*, and meter\_readings.rate\_per\_kwh is stored per-cycle in the DB schema — consistent with it being changeable. AGENTS.md itself warns "Never hardcode configurable values," yet the canonical Business Rules doc does exactly that in its own formula text. Ambiguous whether the documented "business rule" is the number ₱15 or the mechanism (current configured rate).  
4. Package manager: Documentation mandates pnpm (`04-tech-stack.md`, `AGENTS.md`), but the actual scaffolded app already contains a package-lock.json (npm), not a pnpm lockfile — the codebase has already drifted from doc on day one.  
5. Next.js version: Docs specify Next.js 15 (`04-tech-stack.md`); the scaffolded `app/package.json` has Next.js 16.3.0 installed. Given AGENTS.md's rule "if documentation and code disagree, documentation wins," this is technically already a violation requiring a decision (downgrade the code, or update the doc).

## **9\. Edge Cases (undocumented)**

* Late/misattributed payments: payments.billing\_cycle\_id is a required FK, but if a tenant pays two months late while a new cycle is already open, which cycle does the payment attach to — the one it's settling, or the currently open one? This directly affects how previous\_balance is computed for future cycles, and is undefined.  
* Overpayment: can a tenant build up a credit (negative previous\_balance)? Not addressed anywhere.  
* Water charge split: a single "Water Charge" value is entered once per billing cycle on the Billing screen, but charges.water is per-tenant. Is it split 50/50, duplicated in full to both, or something else?  
* Correcting a closed cycle: business rules say closed cycles are read-only and immutable — but what's the recovery path if the landlord enters a wrong mother meter reading and only notices after closing? No documented "correction" or "reopen" workflow; the only exposed action is regenerateSOA(), which explicitly must use the *existing* (possibly wrong) snapshot.  
* First month / no previous reading: Unit 1's formula requires a previous\_reading; nothing describes what happens on the very first billing cycle when there is no prior reading to subtract from.  
* deletePayment() vs. immutability: `07-api-design.md` lists deletePayment() as a Server Action with no stated restriction, while `18-payment-system.md` states "Payment history cannot be deleted after billing is closed." Whether deletePayment() enforces that rule, or is a documented API surface that contradicts the business rule, is unclear.  
* Two tenants, one bill, mismatched calculation edge: if usage\_kwh × rate computed from the submeter exceeds the actual mother meter bill (e.g., meter/billing error), Unit 2's residual formula (Mother Meter Bill − Unit 1 Cost) goes negative. No documented floor/validation for this.  
* billing\_cycles.status transition to closed: five states exist (draft, billing\_complete, soa\_generated, sent, closed), and closeBillingCycle() is a named service — but no doc says what triggers the sent → closed transition (automatic after some condition, or a manual landlord action), nor what "closed" actually restricts beyond charges.

## **10\. Suggestions for Improvement**

*(Flagged as suggestions only, per your instruction not to propose implementation without approval.)*

* Resolve the Prisma contradiction explicitly in an ADR before any schema work begins — right now two docs of equal authority disagree.  
* Either write 02-product-knowledge-base.md or strip the dangling references and renumber, so "required reading order" in AGENTS.md is actually satisfiable.  
* Decide and document whether the electricity rate is a business-rule constant or a Settings-driven variable, then make the Business Rules and Billing Screen docs reference "the configured rate" rather than a literal number.  
* Resolve the reminder-schedule contradiction: either make Settings' Reminder Schedule fields explicitly "future/not implemented in v1," or redesign the Cron approach (e.g., one daily Cron that checks configured days) before the Settings screen is built.  
* Add a short "Corrections & Reopening" policy doc — given the strong immutability stance, the absence of any documented error-recovery path for a closed cycle is the single biggest operational gap for a real landlord using this monthly.  
* Add explicit water-charge and other-charges entry/allocation rules to the Billing Screen spec.  
* Reconcile docs/architecture/\*.md frontmatter dates/status against actual implementation state before treating the docs as "final" — several are still status: Draft.

