-- ============================================================
-- AGENCY OS - Initial Schema
-- Run this in Supabase SQL Editor: Project > SQL Editor > New Query
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('owner', 'manager', 'member')) default 'member',
  job_title text,
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- CLIENTS
-- ============================================================
create table clients (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  contact_person text,
  phone text,
  email text,
  gst_number text,
  status text check (status in ('active', 'paused', 'churned')) default 'active',
  contract_type text check (contract_type in ('retainer', 'project', 'one_time')) default 'project',
  monthly_retainer_value numeric(12,2) default 0,
  start_date date,
  drive_folder_link text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Which team members are assigned to which clients (controls visibility)
create table client_assignments (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(client_id, user_id)
);

-- ============================================================
-- PROJECTS
-- ============================================================
create table projects (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  name text not null,
  description text,
  status text check (status in ('active', 'completed', 'on_hold')) default 'active',
  start_date date,
  end_date date,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- TASKS
-- ============================================================
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references profiles(id),
  status text check (status in ('todo', 'in_progress', 'review', 'done')) default 'todo',
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  due_date date,
  requires_approval boolean default false,
  approval_status text check (approval_status in ('pending', 'approved', 'rejected', null)) default null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table task_comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references profiles(id),
  comment text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- TIME TRACKING
-- ============================================================
create table time_entries (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references profiles(id),
  hours numeric(5,2) not null,
  entry_date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- PERMISSIONS (per-user feature toggles, layered on top of role)
-- ============================================================
create table permissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  feature_key text not null, -- e.g. 'finance', 'all_clients', 'team_management'
  can_view boolean default false,
  can_edit boolean default false,
  unique(user_id, feature_key)
);

-- ============================================================
-- FINANCE
-- ============================================================
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  invoice_number text not null,
  amount numeric(12,2) not null,
  gst_amount numeric(12,2) default 0,
  total_amount numeric(12,2) generated always as (amount + gst_amount) stored,
  status text check (status in ('draft', 'sent', 'paid', 'overdue')) default 'draft',
  issue_date date default current_date,
  due_date date,
  created_at timestamptz default now()
);

create table expenses (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  client_id uuid references clients(id), -- nullable: some expenses aren't client-specific
  category text not null,
  amount numeric(12,2) not null,
  expense_date date default current_date,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_profiles_org on profiles(org_id);
create index idx_clients_org on clients(org_id);
create index idx_projects_client on projects(client_id);
create index idx_tasks_project on tasks(project_id);
create index idx_tasks_assigned on tasks(assigned_to);
create index idx_time_entries_task on time_entries(task_id);
create index idx_time_entries_user on time_entries(user_id);
create index idx_invoices_client on invoices(client_id);
create index idx_client_assignments_client on client_assignments(client_id);
create index idx_client_assignments_user on client_assignments(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table clients enable row level security;
alter table client_assignments enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table task_comments enable row level security;
alter table time_entries enable row level security;
alter table permissions enable row level security;
alter table invoices enable row level security;
alter table expenses enable row level security;
alter table audit_log enable row level security;

-- Helper function: get current user's role
create or replace function get_my_role()
returns text
language sql
security definer
stable
as $$
  select role from profiles where id = auth.uid();
$$;

-- Helper function: get current user's org
create or replace function get_my_org()
returns uuid
language sql
security definer
stable
as $$
  select org_id from profiles where id = auth.uid();
$$;

-- Helper: does current user have a specific permission?
create or replace function has_permission(feature text, need_edit boolean default false)
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select case when need_edit then can_edit else can_view end
     from permissions where user_id = auth.uid() and feature_key = feature),
    false
  );
$$;

-- PROFILES: everyone in org can see each other; only owner can edit roles
create policy "profiles_select" on profiles for select
  using (org_id = get_my_org());
create policy "profiles_update_own" on profiles for update
  using (id = auth.uid() or get_my_role() = 'owner');
create policy "profiles_insert_owner" on profiles for insert
  with check (get_my_role() = 'owner');

-- ORGANIZATIONS: members can view their own org
create policy "org_select" on organizations for select
  using (id = get_my_org());

-- CLIENTS: owner sees all; manager/member see only assigned clients (unless granted all_clients permission)
create policy "clients_select" on clients for select
  using (
    org_id = get_my_org()
    and (
      get_my_role() = 'owner'
      or has_permission('all_clients')
      or exists (select 1 from client_assignments where client_id = clients.id and user_id = auth.uid())
    )
  );
create policy "clients_insert" on clients for insert
  with check (org_id = get_my_org() and (get_my_role() in ('owner','manager') or has_permission('all_clients', true)));
create policy "clients_update" on clients for update
  using (org_id = get_my_org() and (get_my_role() = 'owner' or has_permission('all_clients', true)));
create policy "clients_delete" on clients for delete
  using (get_my_role() = 'owner');

-- CLIENT ASSIGNMENTS: visible to owner + the assigned user
create policy "client_assignments_select" on client_assignments for select
  using (
    get_my_role() = 'owner'
    or user_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'manager')
  );
create policy "client_assignments_manage" on client_assignments for all
  using (get_my_role() in ('owner','manager'));

-- PROJECTS: follow client visibility
create policy "projects_select" on projects for select
  using (exists (select 1 from clients c where c.id = projects.client_id));
create policy "projects_manage" on projects for all
  using (get_my_role() in ('owner','manager') or has_permission('all_clients', true));

-- TASKS: assignee can see/update their own; owner/manager see all under visible projects
create policy "tasks_select" on tasks for select
  using (
    assigned_to = auth.uid()
    or get_my_role() in ('owner','manager')
    or has_permission('all_clients')
  );
create policy "tasks_insert" on tasks for insert
  with check (get_my_role() in ('owner','manager') or has_permission('all_clients', true));
create policy "tasks_update" on tasks for update
  using (assigned_to = auth.uid() or get_my_role() in ('owner','manager'));
create policy "tasks_delete" on tasks for delete
  using (get_my_role() in ('owner','manager'));

-- TASK COMMENTS: visible to anyone who can see the task
create policy "task_comments_select" on task_comments for select
  using (exists (select 1 from tasks t where t.id = task_comments.task_id));
create policy "task_comments_insert" on task_comments for insert
  with check (user_id = auth.uid());

-- TIME ENTRIES: own entries editable; owner/manager can view all
create policy "time_entries_select" on time_entries for select
  using (user_id = auth.uid() or get_my_role() in ('owner','manager'));
create policy "time_entries_insert" on time_entries for insert
  with check (user_id = auth.uid());
create policy "time_entries_update" on time_entries for update
  using (user_id = auth.uid() or get_my_role() = 'owner');

-- PERMISSIONS: only owner can view/manage the permissions table
create policy "permissions_select" on permissions for select
  using (user_id = auth.uid() or get_my_role() = 'owner');
create policy "permissions_manage" on permissions for all
  using (get_my_role() = 'owner');

-- INVOICES: owner always; others need explicit finance permission
create policy "invoices_select" on invoices for select
  using (get_my_role() = 'owner' or has_permission('finance'));
create policy "invoices_manage" on invoices for all
  using (get_my_role() = 'owner' or has_permission('finance', true));

-- EXPENSES: same as invoices
create policy "expenses_select" on expenses for select
  using (get_my_role() = 'owner' or has_permission('finance'));
create policy "expenses_manage" on expenses for all
  using (get_my_role() = 'owner' or has_permission('finance', true));

-- AUDIT LOG: owner only
create policy "audit_log_select" on audit_log for select
  using (get_my_role() = 'owner');
create policy "audit_log_insert" on audit_log for insert
  with check (true);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, org_id, name, email, role)
  values (
    new.id,
    (select id from organizations limit 1), -- assigns to the first (only) org for now
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'member')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
