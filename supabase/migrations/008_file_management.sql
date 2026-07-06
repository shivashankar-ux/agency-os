-- ============================================================
-- AGENCY OS — Migration 008: File Management
-- Run this in Supabase SQL Editor: Project > SQL Editor > New Query
-- ============================================================

-- Create files metadata table
create table if not exists files (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  name text not null,
  file_path text not null, -- Supabase storage object path
  file_url text not null,  -- public CDN URL
  file_size bigint not null,
  mime_type text,
  version int default 1,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index files
create index if not exists idx_files_org on files(org_id);
create index if not exists idx_files_project on files(project_id);
create index if not exists idx_files_client on files(client_id);

-- Enable RLS
alter table files enable row level security;

-- Owner/manager see all; member sees their assigned client/project files or created by them; client sees their client_id
create policy "files_select" on files for select
  using (
    org_id = get_my_org()
    and (
      get_my_role() in ('owner', 'manager')
      -- employee: assigned to client or created the file
      or (
        get_my_role() = 'member'
        and (
          created_by = auth.uid()
          or client_id in (select client_id from client_assignments where user_id = auth.uid())
        )
      )
      -- client: own client files
      or (
        get_my_role() = 'client'
        and client_id = (select client_id from profiles where id = auth.uid())
      )
    )
  );

create policy "files_insert" on files for insert
  with check (
    org_id = get_my_org()
    and (
      get_my_role() in ('owner', 'manager', 'member')
      or (
        get_my_role() = 'client'
        and client_id = (select client_id from profiles where id = auth.uid())
      )
    )
  );

create policy "files_delete" on files for delete
  using (
    org_id = get_my_org()
    and (
      get_my_role() in ('owner', 'manager')
      or created_by = auth.uid()
    )
  );

-- Create storage bucket if possible
insert into storage.buckets (id, name, public)
values ('agency-files', 'agency-files', true)
on conflict (id) do nothing;

-- RLS policies for Supabase Storage objects (storage.objects table)
create policy "Allow auth users select objects" on storage.objects for select
  using (bucket_id = 'agency-files' and auth.role() = 'authenticated');

create policy "Allow auth users insert objects" on storage.objects for insert
  with check (bucket_id = 'agency-files' and auth.role() = 'authenticated');

create policy "Allow auth users delete objects" on storage.objects for delete
  using (bucket_id = 'agency-files' and auth.role() = 'authenticated');
