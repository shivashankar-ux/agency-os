-- ============================================================
-- AGENCY OS - Migration 022: Client Document Generator & Brand Assets
-- ============================================================

-- 1. Org Branding Table
CREATE TABLE IF NOT EXISTS public.org_branding (
  org_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  logo_storage_path TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#4f46e5',
  accent_color TEXT DEFAULT '#06b6d4',
  font_family TEXT DEFAULT 'Inter',
  company_name TEXT,
  company_address TEXT,
  gstin TEXT,
  bank_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Document Templates Table
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('welcome', 'onboarding', 'advance_invoice', 'final_invoice', 'brand_assets_request')),
  name TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Client Documents History Table
CREATE TABLE IF NOT EXISTS public.client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'generated' CHECK (status IN ('draft', 'generated', 'downloaded')),
  field_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_storage_path TEXT,
  pdf_url TEXT,
  invoice_number TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Invoice Counters Table
CREATE TABLE IF NOT EXISTS public.invoice_counters (
  org_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  year INT NOT NULL,
  last_number INT NOT NULL DEFAULT 0
);

-- 5. Brand Asset Submissions Table (Client-Facing Collection)
CREATE TABLE IF NOT EXISTS public.brand_asset_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  request_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'reviewed')),
  submitted_data JSONB DEFAULT '{}'::jsonb,
  submitted_files JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_documents_org_client ON public.client_documents(org_id, client_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_org ON public.document_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_brand_asset_submissions_token ON public.brand_asset_submissions(request_token);

-- Row Level Security (RLS)
ALTER TABLE public.org_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_asset_submissions ENABLE ROW LEVEL SECURITY;

-- Org Branding Policies
CREATE POLICY "Org members can view branding" ON public.org_branding
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Owners can manage branding" ON public.org_branding
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Document Templates Policies
CREATE POLICY "Org members can view templates" ON public.document_templates
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Owners can manage templates" ON public.document_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Client Documents Policies
CREATE POLICY "Org members can view documents" ON public.client_documents
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can insert documents" ON public.client_documents
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- Invoice Counters Policy
CREATE POLICY "Org members can manage invoice counters" ON public.invoice_counters
  FOR ALL USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- Brand Asset Submissions Policies
CREATE POLICY "Org members can view brand assets" ON public.brand_asset_submissions
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Public token access for brand assets" ON public.brand_asset_submissions
  FOR ALL USING (true);
