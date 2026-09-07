-- Migration: 025_whatsapp_alerts.sql
-- Create whatsapp_alerts table for WhatsApp notifications

CREATE TABLE IF NOT EXISTS public.whatsapp_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_phone TEXT,
  recipient_name TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  schedule_type TEXT DEFAULT 'weekly_recurring',
  target_date DATE,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  recurrence_day INTEGER DEFAULT 1,
  occurrences_per_day INTEGER DEFAULT 5,
  recurrence_start_time TIME DEFAULT '09:00',
  recurrence_end_time TIME DEFAULT '18:00',
  sent_count INTEGER DEFAULT 0,
  callmebot_apikey TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.whatsapp_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for whatsapp_alerts
DROP POLICY IF EXISTS "Allow members of org to read whatsapp_alerts" ON public.whatsapp_alerts;
CREATE POLICY "Allow members of org to read whatsapp_alerts"
  ON public.whatsapp_alerts FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Allow members of org to insert whatsapp_alerts" ON public.whatsapp_alerts;
CREATE POLICY "Allow members of org to insert whatsapp_alerts"
  ON public.whatsapp_alerts FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Allow members of org to update whatsapp_alerts" ON public.whatsapp_alerts;
CREATE POLICY "Allow members of org to update whatsapp_alerts"
  ON public.whatsapp_alerts FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Allow members of org to delete whatsapp_alerts" ON public.whatsapp_alerts;
CREATE POLICY "Allow members of org to delete whatsapp_alerts"
  ON public.whatsapp_alerts FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
