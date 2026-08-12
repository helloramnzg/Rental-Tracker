-- Phase 10 (Tenant Management) needs to display "Updated date" on the
-- Tenant Details page (docs/product/13-functional-requirements.md-era
-- spec), but the original schema only had created_at. Set explicitly
-- by the application on every update — no trigger, to keep the
-- calculation visible in application code rather than hidden in the
-- database (docs/project/01-product-vision.md: "No hidden calculations").
alter table tenants add column updated_at timestamptz not null default now();
