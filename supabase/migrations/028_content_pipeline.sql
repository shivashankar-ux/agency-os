-- ============================================================
-- AGENCY OS - Migration 028: Reels Content Pipeline, Checklists,
-- Client Onboarding, Monthly Client Reports
-- ============================================================

-- 1. Reels (script -> approval -> shoot -> edit -> post)
CREATE TABLE IF NOT EXISTS public.reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  script_text TEXT,
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',
  scheduled_shoot_date DATE,
  status TEXT NOT NULL DEFAULT 'script_sent' CHECK (status IN (
    'script_sent', 'changes_requested', 'approved', 'shot', 'edited', 'posted'
  )),
  revision_count INT NOT NULL DEFAULT 0,
  revision_notes TEXT,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  views INT,
  likes INT,
  saves INT,
  comments INT,
  media_urls TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reels_org_client ON public.reels(org_id, client_id);
CREATE INDEX IF NOT EXISTS idx_reels_status ON public.reels(status);

-- 2. Production checklists (shoot-day / editor), one per reel per type
CREATE TABLE IF NOT EXISTS public.production_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  checklist_type TEXT NOT NULL CHECK (checklist_type IN ('shoot_day', 'editor')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (reel_id, checklist_type)
);

CREATE TABLE IF NOT EXISTS public.production_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.production_checklists(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  checked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  checked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist ON public.production_checklist_items(checklist_id);

-- 3. Client onboarding (one structured intake per client, flexible JSON responses)
CREATE TABLE IF NOT EXISTS public.client_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Monthly client reports (manual summary fields; per-reel stats are read live from `reels`)
CREATE TABLE IF NOT EXISTS public.client_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  followers_start INT,
  followers_end INT,
  total_views_reach INT,
  profile_visits INT,
  enquiries_received INT,
  new_members_mentioned INT,
  what_worked TEXT,
  what_to_improve TEXT,
  next_month_reel_ideas TEXT[] DEFAULT '{}',
  suggestion TEXT,
  generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_reports_client ON public.client_reports(org_id, client_id);

-- RLS
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_reports ENABLE ROW LEVEL SECURITY;

-- REELS: same visibility rule as clients (owner / all_clients permission / assigned member)
CREATE POLICY "reels_select" ON public.reels FOR SELECT
  USING (
    org_id = get_my_org()
    AND (
      get_my_role() = 'owner'
      OR has_permission('all_clients')
      OR EXISTS (SELECT 1 FROM client_assignments WHERE client_id = reels.client_id AND user_id = auth.uid())
    )
  );
CREATE POLICY "reels_insert" ON public.reels FOR INSERT
  WITH CHECK (org_id = get_my_org() AND (get_my_role() IN ('owner', 'manager') OR has_permission('all_clients', true)));
CREATE POLICY "reels_update" ON public.reels FOR UPDATE
  USING (
    org_id = get_my_org()
    AND (
      get_my_role() IN ('owner', 'manager')
      OR has_permission('all_clients', true)
      OR EXISTS (SELECT 1 FROM client_assignments WHERE client_id = reels.client_id AND user_id = auth.uid())
    )
  );
CREATE POLICY "reels_delete" ON public.reels FOR DELETE
  USING (get_my_role() = 'owner');

-- CHECKLISTS: follow the parent reel's visibility
CREATE POLICY "checklists_select" ON public.production_checklists FOR SELECT
  USING (EXISTS (SELECT 1 FROM reels r WHERE r.id = production_checklists.reel_id));
CREATE POLICY "checklists_manage" ON public.production_checklists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reels r
      WHERE r.id = production_checklists.reel_id
      AND (
        get_my_role() IN ('owner', 'manager')
        OR has_permission('all_clients', true)
        OR EXISTS (SELECT 1 FROM client_assignments WHERE client_id = r.client_id AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY "checklist_items_select" ON public.production_checklist_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM production_checklists c WHERE c.id = production_checklist_items.checklist_id));
CREATE POLICY "checklist_items_manage" ON public.production_checklist_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM production_checklists c
      JOIN reels r ON r.id = c.reel_id
      WHERE c.id = production_checklist_items.checklist_id
      AND (
        get_my_role() IN ('owner', 'manager')
        OR has_permission('all_clients', true)
        OR EXISTS (SELECT 1 FROM client_assignments WHERE client_id = r.client_id AND user_id = auth.uid())
      )
    )
  );

-- CLIENT ONBOARDING: same visibility rule as clients
CREATE POLICY "client_onboarding_select" ON public.client_onboarding FOR SELECT
  USING (
    org_id = get_my_org()
    AND (
      get_my_role() = 'owner'
      OR has_permission('all_clients')
      OR EXISTS (SELECT 1 FROM client_assignments WHERE client_id = client_onboarding.client_id AND user_id = auth.uid())
    )
  );
CREATE POLICY "client_onboarding_manage" ON public.client_onboarding FOR ALL
  USING (org_id = get_my_org() AND (get_my_role() IN ('owner', 'manager') OR has_permission('all_clients', true)));

-- CLIENT REPORTS: same visibility rule as clients
CREATE POLICY "client_reports_select" ON public.client_reports FOR SELECT
  USING (
    org_id = get_my_org()
    AND (
      get_my_role() = 'owner'
      OR has_permission('all_clients')
      OR EXISTS (SELECT 1 FROM client_assignments WHERE client_id = client_reports.client_id AND user_id = auth.uid())
    )
  );
CREATE POLICY "client_reports_manage" ON public.client_reports FOR ALL
  USING (org_id = get_my_org() AND (get_my_role() IN ('owner', 'manager') OR has_permission('all_clients', true)));
