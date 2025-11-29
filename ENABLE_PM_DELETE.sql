-- ==================================================
-- ENABLE PROJECT MANAGERS TO DELETE
-- ==================================================
-- This allows PMs to delete projects, departments, team members, and stakeholders
-- ==================================================

-- Drop existing delete policies
DROP POLICY IF EXISTS pol_projects_delete ON public.tms_projects;
DROP POLICY IF EXISTS pol_departments_delete ON public.tms_departments;
DROP POLICY IF EXISTS pol_team_members_delete ON public.tms_team_members;
DROP POLICY IF EXISTS pol_stakeholders_delete ON public.tms_stakeholders;

-- ==================================================
-- NEW DELETE POLICIES - BOTH ADMIN & PM CAN DELETE
-- ==================================================

-- PROJECTS - Both admin and PM can delete
CREATE POLICY pol_projects_delete
  ON public.tms_projects FOR DELETE
  USING (true);  -- Both roles can delete

-- DEPARTMENTS - Both admin and PM can delete
CREATE POLICY pol_departments_delete
  ON public.tms_departments FOR DELETE
  USING (true);  -- Both roles can delete

-- TEAM MEMBERS - Both admin and PM can delete
CREATE POLICY pol_team_members_delete
  ON public.tms_team_members FOR DELETE
  USING (true);  -- Both roles can delete

-- STAKEHOLDERS - Both admin and PM can delete
CREATE POLICY pol_stakeholders_delete
  ON public.tms_stakeholders FOR DELETE
  USING (
    public.get_user_role(auth.uid()) = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.tms_projects 
      WHERE id = project_id AND assigned_pm_id = auth.uid()
    )
  );  -- Admin can delete any, PM can delete from their projects

-- ==================================================
-- DONE!
-- ==================================================
-- Both Admin and PM can now delete:
-- - Projects
-- - Departments
-- - Team Members
-- - Stakeholders (PM can delete from their projects only)
-- ==================================================
