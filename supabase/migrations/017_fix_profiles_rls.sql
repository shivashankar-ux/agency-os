-- ============================================================
-- AGENCY OS - Migration 017: Fix profiles RLS isolation
-- ============================================================

-- Drop the old policy from 007
drop policy if exists "profiles_client_select" on profiles;

-- Re-create policy with org_id filter
create policy "profiles_client_select" on profiles for select
  using (
    id = auth.uid()
    or (
      org_id = get_my_org() 
      and get_my_role() in ('owner', 'admin', 'manager', 'member')
    )
  );
