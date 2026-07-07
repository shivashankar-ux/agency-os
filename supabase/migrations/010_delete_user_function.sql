-- ============================================================
-- AGENCY OS — Migration 010: Safe Team Member Deletion Function
-- ============================================================

-- Create database function that allows owners to delete team members safely without service role key
create or replace function delete_team_member(target_user_id uuid)
returns void
language plpgsql
security definer -- runs with administrative privileges to bypass RLS and edit auth.users
as $$
declare
  v_caller_role text;
begin
  -- 1. Resolve role of the current authenticated user making the call
  select role into v_caller_role 
  from public.profiles 
  where id = auth.uid();

  -- 2. Restrict to Owner only
  if v_caller_role is null or v_caller_role != 'owner' then
    raise exception 'Only owners can delete team members';
  end if;

  -- 3. Prevent deleting yourself
  if target_user_id = auth.uid() then
    raise exception 'You cannot delete your own account';
  end if;

  -- 4. Delete the user from auth.users (cascades automatically to public.profiles and related tables)
  delete from auth.users where id = target_user_id;
end;
$$;
