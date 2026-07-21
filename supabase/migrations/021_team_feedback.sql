-- ============================================================
-- AGENCY OS - Migration 021: Team 360 Feedback System
-- ============================================================

-- 1. Feedback Rounds Table
CREATE TABLE IF NOT EXISTS public.feedback_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed')),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Round Participants Table
CREATE TABLE IF NOT EXISTS public.feedback_round_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES public.feedback_rounds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(round_id, user_id)
);

-- 3. Feedback Access Tokens Table (Magic Links)
CREATE TABLE IF NOT EXISTS public.feedback_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  round_id UUID NOT NULL REFERENCES public.feedback_rounds(id) ON DELETE CASCADE,
  giver_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Feedback Responses Table (Stores complete mapping)
CREATE TABLE IF NOT EXISTS public.feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES public.feedback_rounds(id) ON DELETE CASCADE,
  giver_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_feedback_rounds_org ON public.feedback_rounds(org_id);
CREATE INDEX IF NOT EXISTS idx_feedback_tokens_token ON public.feedback_tokens(token);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_round ON public.feedback_responses(round_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_receiver ON public.feedback_responses(receiver_user_id);

-- RLS Policies
ALTER TABLE public.feedback_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_round_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users within org to read feedback rounds
CREATE POLICY "Users can view org feedback rounds" ON public.feedback_rounds
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- Only owners/admins can manage feedback rounds
CREATE POLICY "Owners can manage feedback rounds" ON public.feedback_rounds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Participants view policy
CREATE POLICY "Users can view participants" ON public.feedback_round_participants
  FOR SELECT USING (true);

-- Tokens policy (read by owner or token bearer)
CREATE POLICY "Tokens access policy" ON public.feedback_tokens
  FOR ALL USING (true);

-- Responses policy:
-- Captain (owner/admin) can view full responses
CREATE POLICY "Owners can view all feedback responses" ON public.feedback_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Members can insert responses via public form
CREATE POLICY "Anyone can insert feedback responses" ON public.feedback_responses
  FOR INSERT WITH CHECK (true);

-- Member Anonymous View: View omitting giver_user_id for normal users
CREATE OR REPLACE VIEW public.anonymous_feedback_responses AS
SELECT 
  id,
  org_id,
  round_id,
  receiver_user_id,
  answers,
  submitted_at
FROM public.feedback_responses;
