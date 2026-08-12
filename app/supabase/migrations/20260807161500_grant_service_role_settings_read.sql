-- The service_role key has no table grants in this project's setup
-- (only `authenticated` was granted — see
-- 20260806120344_grant_authenticated_privileges.sql, which fixed the
-- same gap for a different role). The Notification Preferences check
-- in services/notifications/send-reminder-email.ts runs from
-- /api/cron/* routes, which have no user session and must read
-- settings via the service-role client instead.
grant usage on schema public to service_role;
grant select on settings to service_role;
