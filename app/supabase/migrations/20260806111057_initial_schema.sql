-- Initial schema for Rental Tracker.
-- Source of truth: docs/architecture/06-database-design.md,
-- docs/product/14-business-rules.md, docs/design/26-settings-screen.md.
--
-- Deviations from docs/architecture/06-database-design.md, per Phase 3
-- task instructions:
--   * No standalone `users` table — Supabase Auth's own `auth.users`
--     already covers the single landlord account, and no other table
--     references `users.id`, so it was never load-bearing.
--   * `statements_of_account` renamed to `generated_soas`.
--   * New `settings` table added — holds the configurable Electricity
--     Rate default described in docs/design/26-settings-screen.md,
--     which the documented schema never gave a home.
-- `units` is kept as its own table despite being omitted from the
-- Phase 3 task's table list: Unit 1/Unit 2 electricity math, floor
-- labels, and "one active tenant per unit" all depend on it, and
-- AGENTS.md resolves doc/instruction conflicts in favour of docs.

create extension if not exists "pgcrypto";

-- Enums ----------------------------------------------------------------

create type unit_electricity_type as enum ('submeter', 'residual');

create type billing_cycle_status as enum (
  'draft',
  'billing_complete',
  'soa_generated',
  'sent',
  'closed'
);

create type payment_method as enum ('cash', 'gcash', 'bank_transfer');

-- properties -------------------------------------------------------------

create table properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- units --------------------------------------------------------------------

create table units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  name text not null,
  floor integer,
  electricity_type unit_electricity_type not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (property_id, name)
);

create index units_property_id_idx on units (property_id);

-- tenants ------------------------------------------------------------------

create table tenants (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units (id) on delete restrict,
  full_name text not null,
  email text,
  mobile text,
  monthly_rent numeric(10, 2) not null default 0,
  due_day integer check (due_day between 1 and 31),
  security_deposit numeric(10, 2) not null default 0,
  advance_rent numeric(10, 2) not null default 0,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index tenants_unit_id_idx on tenants (unit_id);

-- Only one active tenant per unit (docs/architecture/06-database-design.md).
create unique index tenants_unit_id_active_unique
  on tenants (unit_id)
  where active;

-- billing_cycles -------------------------------------------------------

create table billing_cycles (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete restrict,
  month integer not null check (month between 1 and 12),
  year integer not null check (year >= 2000),
  mother_meter_bill numeric(10, 2) not null check (mother_meter_bill > 0),
  status billing_cycle_status not null default 'draft',
  created_at timestamptz not null default now(),
  unique (property_id, year, month)
);

create index billing_cycles_property_id_idx on billing_cycles (property_id);
create index billing_cycles_year_month_idx on billing_cycles (year, month);

-- meter_readings -------------------------------------------------------

create table meter_readings (
  id uuid primary key default gen_random_uuid(),
  billing_cycle_id uuid not null unique
    references billing_cycles (id) on delete cascade,
  previous_reading numeric(10, 2) not null,
  current_reading numeric(10, 2) not null,
  usage_kwh numeric(10, 2) not null default 0,
  rate_per_kwh numeric(10, 2) not null,
  unit1_electricity numeric(10, 2) not null default 0,
  unit2_electricity numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  -- "Current reading cannot be lower than previous"
  -- (docs/design/24-billing-screen.md Validation).
  check (current_reading >= previous_reading)
);

-- charges ----------------------------------------------------------------

create table charges (
  id uuid primary key default gen_random_uuid(),
  billing_cycle_id uuid not null
    references billing_cycles (id) on delete cascade,
  tenant_id uuid not null references tenants (id) on delete restrict,
  rent numeric(10, 2) not null default 0,
  electricity numeric(10, 2) not null default 0,
  -- Water Charge is a fixed, non-configurable business rule
  -- (docs/product/14-business-rules.md).
  water numeric(10, 2) not null default 200.00,
  other_charges numeric(10, 2) not null default 0,
  previous_balance numeric(10, 2) not null default 0,
  total_due numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (billing_cycle_id, tenant_id)
);

create index charges_billing_cycle_id_idx on charges (billing_cycle_id);
create index charges_tenant_id_idx on charges (tenant_id);

-- payments -----------------------------------------------------------------

create table payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete restrict,
  billing_cycle_id uuid not null
    references billing_cycles (id) on delete restrict,
  amount numeric(10, 2) not null check (amount > 0),
  payment_date date not null default current_date,
  method payment_method not null,
  reference_number text,
  notes text,
  created_at timestamptz not null default now()
);

create index payments_tenant_id_idx on payments (tenant_id);
create index payments_billing_cycle_id_idx on payments (billing_cycle_id);

-- generated_soas ---------------------------------------------------------
-- Named `statements_of_account` in docs/architecture/06-database-design.md;
-- renamed per Phase 3 task instructions.

create table generated_soas (
  id uuid primary key default gen_random_uuid(),
  billing_cycle_id uuid not null
    references billing_cycles (id) on delete cascade,
  tenant_id uuid not null references tenants (id) on delete restrict,
  pdf_path text not null,
  generated_at timestamptz not null default now(),
  emailed_at timestamptz,
  unique (billing_cycle_id, tenant_id)
);

create index generated_soas_billing_cycle_id_idx
  on generated_soas (billing_cycle_id);
create index generated_soas_tenant_id_idx on generated_soas (tenant_id);

-- settings -----------------------------------------------------------------
-- Not present in docs/architecture/06-database-design.md. Added to give
-- the configurable Electricity Rate default (docs/design/26-settings-screen.md,
-- docs/product/14-business-rules.md) a place to live. One row per
-- property; a billing cycle's actual rate is still captured per-cycle
-- in meter_readings.rate_per_kwh, since the landlord may override it.

create table settings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique
    references properties (id) on delete cascade,
  default_electricity_rate numeric(10, 2) not null default 15.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger settings_set_updated_at
  before update on settings
  for each row
  execute function set_updated_at();
