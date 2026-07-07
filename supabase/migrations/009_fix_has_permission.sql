-- ============================================================
-- AGENCY OS — Migration 009: Fix has_permission function
-- ============================================================

-- Recreate has_permission to query user_permissions table instead of the dropped permissions table
create or replace function has_permission(feature text, need_edit boolean default false)
returns boolean
language plpgsql
security definer
stable
as $$
declare
  v_role text;
  v_user_id uuid;
  v_has_custom boolean;
  v_allowed boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return false;
  end if;

  -- Get user's role
  select role into v_role from profiles where id = v_user_id;
  if v_role is null then
    v_role := 'member';
  end if;

  -- Owner and Admin bypass permission checks (full access to everything)
  if v_role in ('owner', 'admin') then
    return true;
  end if;

  -- Check if user has custom permission overrides
  select exists (
    select 1 from user_permissions 
    where user_id = v_user_id and module = '_core' and action = 'custom'
  ) into v_has_custom;

  if v_has_custom then
    -- Custom overrides mapping
    if feature = 'all_clients' then
      select exists (
        select 1 from user_permissions
        where user_id = v_user_id 
          and module = 'clients' 
          and action = (case when need_edit then 'edit' else 'view' end)
          and scope = 'all'
      ) into v_allowed;
      return v_allowed;

    elsif feature = 'crm' then
      select exists (
        select 1 from user_permissions
        where user_id = v_user_id 
          and module = 'crm' 
          and action = (case when need_edit then 'edit' else 'view' end)
      ) into v_allowed;
      return v_allowed;

    elsif feature = 'finance' then
      select exists (
        select 1 from user_permissions
        where user_id = v_user_id 
          and module = 'finance' 
          and action = (case when need_edit then 'create_invoice' else 'view' end)
      ) into v_allowed;
      return v_allowed;

    else
      -- Generic lookup fallback
      select exists (
        select 1 from user_permissions
        where user_id = v_user_id 
          and module = feature 
          and action = (case when need_edit then 'edit' else 'view' end)
      ) into v_allowed;
      return v_allowed;
    end if;

  else
    -- Static Role-based defaults mapping
    if feature = 'all_clients' then
      return v_role in ('owner', 'admin', 'manager');

    elsif feature = 'crm' then
      return v_role in ('owner', 'admin', 'manager');

    elsif feature = 'finance' then
      return v_role in ('owner', 'admin');

    else
      return false;
    end if;
  end if;
end;
$$;
