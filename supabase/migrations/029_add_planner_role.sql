-- ============================================================
-- AGENCY OS - Migration 029: Add 'planner' role
-- ============================================================
-- Additive: extends the existing role CHECK constraint only.
-- No columns dropped, no data touched.

alter table profiles drop constraint if exists profiles_role_check;

alter table profiles add constraint profiles_role_check
  check (role in ('owner', 'admin', 'manager', 'planner', 'member', 'client'));
