-- Development seed data.
--
-- Seeds reference/setup data only (property, units, tenants, settings)
-- — matching the "one property, two rental units" scope in
-- docs/project/00-project-charter.md. Deliberately does NOT seed
-- billing_cycles, meter_readings, charges, payments, or generated_soas:
-- those represent business events that should come from actually
-- running the monthly billing workflow, not fabricated history.

insert into properties (id, name, address, active)
values (
  '11111111-1111-1111-1111-111111111111',
  'Sample Rental Property',
  '123 Sample Street, Quezon City, Metro Manila',
  true
);

insert into units (id, property_id, name, floor, electricity_type, active)
values
  (
    '22222222-2222-2222-2222-222222222221',
    '11111111-1111-1111-1111-111111111111',
    'Unit 1',
    1,
    'submeter',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Unit 2',
    2,
    'residual',
    true
  );

insert into tenants (
  id, unit_id, full_name, email, mobile, monthly_rent, due_day,
  security_deposit, advance_rent, active
)
values
  (
    '33333333-3333-3333-3333-333333333331',
    '22222222-2222-2222-2222-222222222221',
    'Juan Dela Cruz',
    'juan.delacruz@example.com',
    '+639170000001',
    8000.00,
    5,
    16000.00,
    8000.00,
    true
  ),
  (
    '33333333-3333-3333-3333-333333333332',
    '22222222-2222-2222-2222-222222222222',
    'Maria Santos',
    'maria.santos@example.com',
    '+639170000002',
    8500.00,
    5,
    17000.00,
    8500.00,
    true
  );

insert into settings (property_id, default_electricity_rate)
values ('11111111-1111-1111-1111-111111111111', 15.00);
