-- RLS policies restrict *which rows* a role can see; they don't grant
-- access to the table itself. Postgres still requires a base GRANT for
-- `authenticated` before those policies have anything to apply to.
-- This was missing from 20260806111159_rls_policies.sql, causing
-- "permission denied for table X" (42501) even for correctly
-- authenticated requests.

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  properties,
  units,
  tenants,
  billing_cycles,
  meter_readings,
  charges,
  payments,
  generated_soas,
  settings
to authenticated;
