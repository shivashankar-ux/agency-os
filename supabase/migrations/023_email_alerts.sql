-- ============================================================
-- AGENCY OS - Migration 023: Employee Email Alerts
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_alerts_due
  ON public.email_alerts(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_alerts_org
  ON public.email_alerts(org_id, created_at DESC);

ALTER TABLE public.email_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view organization email alerts"
  ON public.email_alerts FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND org_id = email_alerts.org_id
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
  );

CREATE POLICY "Admins can create organization email alerts"
  ON public.email_alerts FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND org_id = email_alerts.org_id
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Admins can update organization email alerts"
  ON public.email_alerts FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND org_id = email_alerts.org_id
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
  );