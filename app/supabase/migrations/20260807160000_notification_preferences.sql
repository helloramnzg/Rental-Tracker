-- Phase 11 (Settings) — Notification Preferences section. Gates the
-- Phase 8 reminder-email cron jobs (services/notifications/send-reminder-email.ts).
-- in_app_notifications_enabled has no consumer yet — there is no
-- in-app notification system in this app — but is stored now so the
-- toggle in Settings persists.
alter table settings
  add column email_notifications_enabled boolean not null default true,
  add column in_app_notifications_enabled boolean not null default true;
