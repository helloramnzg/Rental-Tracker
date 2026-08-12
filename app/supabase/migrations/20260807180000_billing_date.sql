-- Billing Module edit: "Billing Date" — additive, per explicit
-- decision to keep (year, month) as the billing cycle's identity
-- (unique constraint, SOA-per-month, payment-linkage, previous-balance
-- carry-forward all stay unchanged). This is the specific calendar
-- date the billing was performed/finalized, shown alongside "Billing
-- Month" — not a replacement for it.
alter table billing_cycles add column billing_date date;

update billing_cycles set billing_date = created_at::date where billing_date is null;

alter table billing_cycles alter column billing_date set not null;
