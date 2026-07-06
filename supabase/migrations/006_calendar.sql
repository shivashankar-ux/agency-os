-- ============================================================
-- AGENCY OS — Migration 006: Calendar & Scheduler
-- Run this in Supabase SQL Editor: Project > SQL Editor > New Query
-- ============================================================

-- CALENDAR EVENTS
create table if not exists calendar_events (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  title text not null,
  description text,
  event_type text check (event_type in ('meeting', 'deadline', 'reminder', 'task', 'other')) default 'other',
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean default false,
  color text default 'indigo', -- indigo | emerald | amber | rose | violet
  client_id uuid references clients(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  assigned_to uuid references profiles(id) on delete set null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- INDEXES
create index if not exists idx_calendar_events_org on calendar_events(org_id);
create index if not exists idx_calendar_events_start on calendar_events(start_at);
create index if not exists idx_calendar_events_assigned on calendar_events(assigned_to);

-- RLS
alter table calendar_events enable row level security;

-- Owner/manager see all org events; members see their own + org-wide
create policy "calendar_events_select" on calendar_events for select
  using (
    org_id = get_my_org()
    and (
      get_my_role() in ('owner', 'manager')
      or assigned_to = auth.uid()
      or created_by = auth.uid()
      or assigned_to is null  -- org-wide events visible to all
    )
  );

create policy "calendar_events_insert" on calendar_events for insert
  with check (org_id = get_my_org());

create policy "calendar_events_update" on calendar_events for update
  using (
    org_id = get_my_org()
    and (
      get_my_role() in ('owner', 'manager')
      or created_by = auth.uid()
    )
  );

create policy "calendar_events_delete" on calendar_events for delete
  using (
    get_my_role() in ('owner', 'manager')
    or created_by = auth.uid()
  );
