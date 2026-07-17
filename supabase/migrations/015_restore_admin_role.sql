-- ============================================================
-- AGENCY OS - Migration 015: Restore Admin Role
-- ============================================================

-- 1. Remove the old role check constraint
alter table profiles drop constraint if exists profiles_role_check;

-- 2. Re-create constraint including 'admin' role
alter table profiles add constraint profiles_role_check check (role in ('owner', 'admin', 'manager', 'member', 'client'));
