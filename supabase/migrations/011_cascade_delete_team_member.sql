-- ============================================================
-- AGENCY OS — Migration 011: Safe Foreign Key Cascades for Deleting Team Members
-- ============================================================

-- Drop restrictive constraints and re-add them with ON DELETE SET NULL or ON DELETE CASCADE
-- This ensures that when a user is deleted from profiles, it doesn't block the deletion due to tasks/projects/leads they are assigned to or created.

-- 1. Tasks Table Constraints
alter table tasks drop constraint if exists tasks_assigned_to_fkey;
alter table tasks add constraint tasks_assigned_to_fkey foreign key (assigned_to) references profiles(id) on delete set null;

alter table tasks drop constraint if exists tasks_created_by_fkey;
alter table tasks add constraint tasks_created_by_fkey foreign key (created_by) references profiles(id) on delete set null;

-- 2. Task Comments Constraints
alter table task_comments drop constraint if exists task_comments_user_id_fkey;
alter table task_comments add constraint task_comments_user_id_fkey foreign key (user_id) references profiles(id) on delete cascade;

-- 3. Projects Constraints
alter table projects drop constraint if exists projects_created_by_fkey;
alter table projects add constraint projects_created_by_fkey foreign key (created_by) references profiles(id) on delete set null;

-- 4. Clients Constraints
alter table clients drop constraint if exists clients_created_by_fkey;
alter table clients add constraint clients_created_by_fkey foreign key (created_by) references profiles(id) on delete set null;

-- 5. Expenses Constraints
alter table expenses drop constraint if exists expenses_created_by_fkey;
alter table expenses add constraint expenses_created_by_fkey foreign key (created_by) references profiles(id) on delete set null;

-- 6. Audit Log Constraints
alter table audit_log drop constraint if exists audit_log_user_id_fkey;
alter table audit_log add constraint audit_log_user_id_fkey foreign key (user_id) references profiles(id) on delete set null;

-- 7. Time Entries Constraints
alter table time_entries drop constraint if exists time_entries_user_id_fkey;
alter table time_entries add constraint time_entries_user_id_fkey foreign key (user_id) references profiles(id) on delete set null;

-- 8. Leads (Sales CRM) Constraints
alter table leads drop constraint if exists leads_assigned_to_fkey;
alter table leads add constraint leads_assigned_to_fkey foreign key (assigned_to) references profiles(id) on delete set null;

alter table leads drop constraint if exists leads_created_by_fkey;
alter table leads add constraint leads_created_by_fkey foreign key (created_by) references profiles(id) on delete set null;

-- 9. Lead Activities Constraints
alter table lead_activities drop constraint if exists lead_activities_created_by_fkey;
alter table lead_activities add constraint lead_activities_created_by_fkey foreign key (created_by) references profiles(id) on delete set null;

-- 10. Calendar Events Constraints
alter table calendar_events drop constraint if exists calendar_events_created_by_fkey;
alter table calendar_events add constraint calendar_events_created_by_fkey foreign key (created_by) references profiles(id) on delete set null;
