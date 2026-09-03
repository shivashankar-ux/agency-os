-- ============================================================
-- AGENCY OS - Migration 027: Admin Client Assignment Visibility
-- ============================================================

DROP POLICY IF EXISTS "client_assignments_select" ON public.client_assignments;
CREATE POLICY "client_assignments_select" ON public.client_assignments
  FOR SELECT USING (
    get_my_role() IN ('owner', 'admin')
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'manager'
    )
  );