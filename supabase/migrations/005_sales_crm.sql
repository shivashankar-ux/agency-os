-- ============================================================
-- AGENCY OS — Migration 005: Sales CRM
-- Run this in Supabase SQL Editor: Project > SQL Editor > New Query
-- ============================================================

-- LEADS / PROSPECTS table
create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  source text check (source in ('referral', 'cold_outreach', 'inbound', 'social', 'event', 'other')) default 'other',
  stage text check (stage in ('prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost')) default 'prospect',
  deal_value numeric(12,2) default 0,
  expected_close_date date,
  notes text,
  tags text[], -- array of text tags
  assigned_to uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- LEAD ACTIVITIES (notes, calls, emails, meetings)
create table if not exists lead_activities (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete cascade not null,
  type text check (type in ('note', 'call', 'email', 'meeting', 'follow_up')) default 'note',
  title text not null,
  body text,
  scheduled_at timestamptz,
  completed boolean default false,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- INDEXES
create index if not exists idx_leads_org on leads(org_id);
create index if not exists idx_leads_stage on leads(stage);
create index if not exists idx_leads_assigned on leads(assigned_to);
create index if not exists idx_lead_activities_lead on lead_activities(lead_id);

-- RLS
alter table leads enable row level security;
alter table lead_activities enable row level security;

-- Leads: owner/manager see all; members see only their own
create policy "leads_select" on leads for select
  using (
    org_id = get_my_org()
    and (
      get_my_role() in ('owner', 'manager')
      or assigned_to = auth.uid()
      or created_by = auth.uid()
    )
  );

create policy "leads_insert" on leads for insert
  with check (
    org_id = get_my_org()
    and (get_my_role() in ('owner', 'manager') or has_permission('crm'))
  );

create policy "leads_update" on leads for update
  using (
    org_id = get_my_org()
    and (
      get_my_role() in ('owner', 'manager')
      or assigned_to = auth.uid()
      or created_by = auth.uid()
    )
  );

create policy "leads_delete" on leads for delete
  using (get_my_role() in ('owner', 'manager'));

-- Lead activities: same scope as leads
create policy "lead_activities_select" on lead_activities for select
  using (
    exists (
      select 1 from leads l
      where l.id = lead_activities.lead_id
        and l.org_id = get_my_org()
    )
  );

create policy "lead_activities_insert" on lead_activities for insert
  with check (
    exists (
      select 1 from leads l where l.id = lead_activities.lead_id and l.org_id = get_my_org()
    )
  );

create policy "lead_activities_update" on lead_activities for update
  using (created_by = auth.uid() or get_my_role() in ('owner', 'manager'));
