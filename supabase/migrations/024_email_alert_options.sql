-- ============================================================
-- AGENCY OS - Migration 024: Email Alert Options
-- ============================================================

ALTER TABLE public.email_alerts ALTER COLUMN recipient_user_id DROP NOT NULL;
ALTER TABLE public.email_alerts ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE public.email_alerts ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE public.email_alerts ADD COLUMN IF NOT EXISTS recurrence_day SMALLINT;
ALTER TABLE public.email_alerts ADD COLUMN IF NOT EXISTS recurrence_time TIME;
ALTER TABLE public.email_alerts ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.email_alerts DROP CONSTRAINT IF EXISTS email_alerts_recipient_check;
ALTER TABLE public.email_alerts ADD CONSTRAINT email_alerts_recipient_check
  CHECK (recipient_user_id IS NOT NULL OR recipient_email IS NOT NULL);