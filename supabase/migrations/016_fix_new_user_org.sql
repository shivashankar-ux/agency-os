-- ============================================================
-- AGENCY OS - Migration 016: Dynamic Org ID for New Users
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  assigned_org_id uuid;
begin
  -- Get org_id from the user metadata (passed during invite/signup)
  assigned_org_id := (new.raw_user_meta_data->>'org_id')::uuid;

  -- If missing, we abort to prevent silent data corruption or cross-tenant leaks
  if assigned_org_id is null then
    raise exception 'org_id is required in user metadata on signup';
  end if;

  insert into public.profiles (id, org_id, name, email, role)
  values (
    new.id,
    assigned_org_id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'member')
  );
  
  return new;
end;
$$;
