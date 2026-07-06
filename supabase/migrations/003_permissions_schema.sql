-- Drop old check constraint on profiles.role and add updated constraint allowing 'admin'
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('owner', 'admin', 'manager', 'member'));

-- Drop old permissions table
drop table if exists permissions;

-- Create granular user_permissions table
create table user_permissions (
  user_id uuid references profiles(id) on delete cascade,
  module text not null,
  action text not null,
  scope text check (scope in ('own', 'team', 'all')) default 'all',
  primary key (user_id, module, action)
);

-- Enable RLS on user_permissions
alter table user_permissions enable row level security;

-- Policies for user_permissions select & write
create policy "user_permissions_select" on user_permissions for select
  using (
    auth.uid() = user_id or 
    exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'admin'))
  );

create policy "user_permissions_all" on user_permissions for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'admin'))
  );
