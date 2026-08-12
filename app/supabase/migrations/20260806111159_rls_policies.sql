-- Row Level Security policies.
--
-- Per docs/architecture/08-authentication.md, Version 1 has exactly one
-- authenticated role: the landlord. There is no landlord_id column
-- anywhere in the schema to scope rows by (multi-landlord support is
-- explicitly future scope), so "validate ownership" here reduces to
-- "require an authenticated session" — anon/public gets no access at
-- all, any authenticated user gets full access.

alter table properties enable row level security;
alter table units enable row level security;
alter table tenants enable row level security;
alter table billing_cycles enable row level security;
alter table meter_readings enable row level security;
alter table charges enable row level security;
alter table payments enable row level security;
alter table generated_soas enable row level security;
alter table settings enable row level security;

create policy "Authenticated users can manage properties"
  on properties for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage units"
  on units for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage tenants"
  on tenants for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage billing_cycles"
  on billing_cycles for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage meter_readings"
  on meter_readings for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage charges"
  on charges for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage payments"
  on payments for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage generated_soas"
  on generated_soas for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage settings"
  on settings for all
  to authenticated
  using (true)
  with check (true);
