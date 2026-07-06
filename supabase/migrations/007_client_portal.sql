-- ============================================================
-- AGENCY OS — Migration 007: Client Portal
-- Run this in Supabase SQL Editor: Project > SQL Editor > New Query
-- ============================================================

-- 1. Remove the old role check constraint
alter table profiles drop constraint if exists profiles_role_check;

-- 2. Re-create constraint including 'client' role
alter table profiles add constraint profiles_role_check check (role in ('owner', 'manager', 'member', 'client'));

-- 3. Add client_id link to profiles
alter table profiles add column if not exists client_id uuid references clients(id) on delete set null;

-- 4. Enable RLS on profiles to allow client profiles select
-- We already have RLS on profiles. Let's make sure clients can only read their own profile,
-- and team members can read client profiles.
create policy "profiles_client_select" on profiles for select
  using (
    id = auth.uid()
    or get_my_role() in ('owner', 'manager', 'member')
  );

-- 5. RLS policies for clients:
-- Clients should only select their own client record
create policy "clients_portal_select" on clients for select
  using (
    id = (select client_id from profiles where id = auth.uid())
  );

-- 6. RLS policies for projects:
-- Clients should only see projects linked to their client_id
create policy "projects_portal_select" on projects for select
  using (
    client_id = (select client_id from profiles where id = auth.uid())
  );

-- 7. RLS policies for tasks:
-- Clients should see tasks belonging to their projects
create policy "tasks_portal_select" on tasks for select
  using (
    exists (
      select 1 from projects p
      where p.id = tasks.project_id
        and p.client_id = (select client_id from profiles where id = auth.uid())
    )
  );

-- 8. RLS policies for milestones and deliverables:
-- Clients should see milestones and deliverables for their projects
create policy "milestones_portal_select" on milestones for select
  using (
    exists (
      select 1 from projects p
      where p.id = milestones.project_id
        and p.client_id = (select client_id from profiles where id = auth.uid())
    )
  );

create policy "deliverables_portal_select" on deliverables for select
  using (
    exists (
      select 1 from projects p
      where p.id = deliverables.project_id
        and p.client_id = (select client_id from profiles where id = auth.uid())
    )
  );

-- 9. Invoices:
-- Clients should see their own invoices
create policy "invoices_portal_select" on invoices for select
  using (
    client_id = (select client_id from profiles where id = auth.uid())
  );
