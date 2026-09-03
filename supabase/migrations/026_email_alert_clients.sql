-- ============================================================
-- AGENCY OS - Migration 026: Client-linked Email Alerts
-- ============================================================

ALTER TABLE public.email_alerts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_email_alerts_client ON public.email_alerts(client_id, created_at DESC);