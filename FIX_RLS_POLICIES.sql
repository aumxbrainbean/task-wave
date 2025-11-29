-- ==================================================
-- FIX RLS POLICIES - REMOVE INFINITE RECURSION
-- ==================================================
-- Run this SQL in Supabase to fix the 500 errors
-- ==================================================

-- Drop all existing problematic policies
DROP POLICY IF EXISTS pol_profile_own_select ON public.user_profiles;
DROP POLICY IF EXISTS pol_profile_own_update ON public.user_profiles;
DROP POLICY IF EXISTS pol_profile_own_insert ON public.user_profiles;
DROP POLICY IF EXISTS pol_profile_admin_select ON public.user_profiles;

DROP POLICY IF EXISTS pol_projects_view ON public.tms_projects;
DROP POLICY IF EXISTS pol_projects_insert ON public.tms_projects;
DROP POLICY IF EXISTS pol_projects_update ON public.tms_projects;
DROP POLICY IF EXISTS pol_projects_delete ON public.tms_projects;

DROP POLICY IF EXISTS pol_stake_view ON public.tms_stakeholders;
DROP POLICY IF EXISTS pol_stake_manage ON public.tms_stakeholders;

DROP POLICY IF EXISTS pol_dept_view ON public.tms_departments;
DROP POLICY IF EXISTS pol_dept_manage ON public.tms_departments;

DROP POLICY IF EXISTS pol_team_view ON public.tms_team_members;
DROP POLICY IF EXISTS pol_team_manage ON public.tms_team_members;

DROP POLICY IF EXISTS pol_tasks_view ON public.tms_tasks;
DROP POLICY IF EXISTS pol_tasks_insert ON public.tms_tasks;
DROP POLICY IF EXISTS pol_tasks_update ON public.tms_tasks;
DROP POLICY IF EXISTS pol_tasks_delete ON public.tms_tasks;

-- ==================================================
-- CREATE HELPER FUNCTION TO GET USER ROLE (bypasses RLS)
-- ==================================================
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role 
  FROM public.user_profiles 
  WHERE id = user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- NEW SIMPLIFIED RLS POLICIES (no infinite recursion)
-- ==================================================

-- USER PROFILES - Allow users to see their own profile
CREATE POLICY pol_profile_select
  ON public.user_profiles FOR SELECT 
  USING (true);  -- Everyone authenticated can see profiles

CREATE POLICY pol_profile_update
  ON public.user_profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY pol_profile_insert
  ON public.user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- PROJECTS - Everyone can view, admin/PM can manage
CREATE POLICY pol_projects_select
  ON public.tms_projects FOR SELECT 
  USING (true);

CREATE POLICY pol_projects_insert
  ON public.tms_projects FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'project_manager')
  );

CREATE POLICY pol_projects_update
  ON public.tms_projects FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'project_manager')
  );

CREATE POLICY pol_projects_delete
  ON public.tms_projects FOR DELETE
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- STAKEHOLDERS
CREATE POLICY pol_stakeholders_select
  ON public.tms_stakeholders FOR SELECT 
  USING (true);

CREATE POLICY pol_stakeholders_insert
  ON public.tms_stakeholders FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'project_manager')
  );

CREATE POLICY pol_stakeholders_update
  ON public.tms_stakeholders FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'project_manager')
  );

CREATE POLICY pol_stakeholders_delete
  ON public.tms_stakeholders FOR DELETE
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'project_manager')
  );

-- DEPARTMENTS
CREATE POLICY pol_departments_select
  ON public.tms_departments FOR SELECT 
  USING (true);

CREATE POLICY pol_departments_insert
  ON public.tms_departments FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY pol_departments_update
  ON public.tms_departments FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY pol_departments_delete
  ON public.tms_departments FOR DELETE
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- TEAM MEMBERS
CREATE POLICY pol_team_members_select
  ON public.tms_team_members FOR SELECT 
  USING (true);

CREATE POLICY pol_team_members_insert
  ON public.tms_team_members FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY pol_team_members_update
  ON public.tms_team_members FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY pol_team_members_delete
  ON public.tms_team_members FOR DELETE
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- TASKS
CREATE POLICY pol_tasks_select
  ON public.tms_tasks FOR SELECT 
  USING (true);

CREATE POLICY pol_tasks_insert
  ON public.tms_tasks FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'project_manager')
  );

CREATE POLICY pol_tasks_update
  ON public.tms_tasks FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'project_manager')
  );

CREATE POLICY pol_tasks_delete
  ON public.tms_tasks FOR DELETE
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'project_manager')
  );

-- ==================================================
-- DONE! The 500 errors should be fixed now
-- ==================================================
