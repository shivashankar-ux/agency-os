-- Migration: 024_alerts_occurrences.sql
-- Add occurrences_per_day, target_date, and sent_count to email_alerts table

ALTER TABLE public.email_alerts 
ADD COLUMN IF NOT EXISTS occurrences_per_day INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS target_date DATE,
ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS schedule_type TEXT DEFAULT 'immediate';

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
