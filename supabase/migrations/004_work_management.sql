-- ============================================================
-- AGENCY OS — Migration 004: Work Management Hub
-- Run this in Supabase SQL Editor: Project > SQL Editor > New Query
-- ============================================================

-- MILESTONES
create table if not exists milestones (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  title text not null,
  due_date date,
  status text check (status in ('pending', 'in_progress', 'completed', 'overdue')) default 'pending',
  description text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- DELIVERABLES
create table if not exists deliverables (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  milestone_id uuid references milestones(id) on delete set null,
  title text not null,
  status text check (status in ('pending', 'in_review', 'approved', 'rejected')) default 'pending',
  due_date date,
  file_url text,
  notes text,
  assigned_to uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- INDEXES
create index if not exists idx_milestones_project on milestones(project_id);
create index if not exists idx_deliverables_project on deliverables(project_id);
create index if not exists idx_deliverables_milestone on deliverables(milestone_id);

-- ROW LEVEL SECURITY
alter table milestones enable row level security;
alter table deliverables enable row level security;

-- Milestones: visible to anyone who can see the project (owner/manager/assigned)
create policy "milestones_select" on milestones for select
  using (
    exists (
      select 1 from projects p
      join clients c on c.id = p.client_id
      where p.id = milestones.project_id
        and c.org_id = get_my_org()
    )
  );

create policy "milestones_manage" on milestones for all
  using (get_my_role() in ('owner', 'manager') or has_permission('all_clients', true));

-- Deliverables: same scope as milestones
create policy "deliverables_select" on deliverables for select
  using (
    exists (
      select 1 from projects p
      join clients c on c.id = p.client_id
      where p.id = deliverables.project_id
        and c.org_id = get_my_org()
    )
  );

create policy "deliverables_manage" on deliverables for all
  using (get_my_role() in ('owner', 'manager') or has_permission('all_clients', true));
