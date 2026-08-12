-- Tenant Module edit: Tenant Start Date / End Date. Start date is
-- required going forward (every tenancy has a start); end date is
-- nullable — most tenancies are ongoing. Existing seed tenants get a
-- start_date backfilled to created_at's date so the column can be
-- not-null without breaking them.
alter table tenants add column start_date date;
alter table tenants add column end_date date;

update tenants set start_date = created_at::date where start_date is null;

alter table tenants alter column start_date set not null;

alter table tenants add constraint tenants_end_date_after_start_date
  check (end_date is null or end_date >= start_date);
