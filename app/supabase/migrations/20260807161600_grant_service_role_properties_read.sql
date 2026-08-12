-- sendReminderEmail() resolves the active property before reading
-- settings, so service_role also needs SELECT on properties (missed
-- in 20260807161500_grant_service_role_settings_read.sql — confirmed
-- by testing the actual service-role path, not just an authenticated
-- session, which masked the gap).
grant select on properties to service_role;
