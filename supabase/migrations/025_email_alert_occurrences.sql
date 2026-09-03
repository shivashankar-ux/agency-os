-- ============================================================
-- AGENCY OS - Migration 025: Repeating Email Alert Occurrences
-- ============================================================

ALTER TABLE public.email_alerts ADD COLUMN IF NOT EXISTS recurrence_interval_hours NUMERIC(5,2);
ALTER TABLE public.email_alerts ADD COLUMN IF NOT EXISTS recurrence_start_time TIME;
ALTER TABLE public.email_alerts ADD COLUMN IF NOT EXISTS recurrence_end_time TIME;