-- ==================================================
-- UPDATE ROLE SYSTEM - ADMIN & PROJECT MANAGER ONLY
-- ==================================================
-- This removes team_member role and updates all policies
-- ==================================================

-- Step 1: Update any existing team_members to project_manager
UPDATE public.user_profiles 
SET role = 'project_manager' 
WHERE role = 'team_member';

-- Step 2: Drop existing constraint and recreate with only 2 roles
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('admin', 'project_manager'));

-- Step 3: Update default role to project_manager
ALTER TABLE public.user_profiles 
ALTER COLUMN role SET DEFAULT 'project_manager';

-- ==================================================
-- UPDATE RLS POLICIES FOR NEW ROLE SYSTEM
-- ==================================================

-- Drop all existing policies
DROP POLICY IF EXISTS pol_profile_select ON public.user_profiles;
DROP POLICY IF EXISTS pol_profile_update ON public.user_profiles;
DROP POLICY IF EXISTS pol_profile_insert ON public.user_profiles;

DROP POLICY IF EXISTS pol_projects_select ON public.tms_projects;
DROP POLICY IF EXISTS pol_projects_insert ON public.tms_projects;
DROP POLICY IF EXISTS pol_projects_update ON public.tms_projects;
DROP POLICY IF EXISTS pol_projects_delete ON public.tms_projects;

DROP POLICY IF EXISTS pol_stakeholders_select ON public.tms_stakeholders;
DROP POLICY IF EXISTS pol_stakeholders_insert ON public.tms_stakeholders;
DROP POLICY IF EXISTS pol_stakeholders_update ON public.tms_stakeholders;
DROP POLICY IF EXISTS pol_stakeholders_delete ON public.tms_stakeholders;

DROP POLICY IF EXISTS pol_departments_select ON public.tms_departments;
DROP POLICY IF EXISTS pol_departments_insert ON public.tms_departments;
DROP POLICY IF EXISTS pol_departments_update ON public.tms_departments;
DROP POLICY IF EXISTS pol_departments_delete ON public.tms_departments;

DROP POLICY IF EXISTS pol_team_members_select ON public.tms_team_members;
DROP POLICY IF EXISTS pol_team_members_insert ON public.tms_team_members;
DROP POLICY IF EXISTS pol_team_members_update ON public.tms_team_members;
DROP POLICY IF EXISTS pol_team_members_delete ON public.tms_team_members;

DROP POLICY IF EXISTS pol_tasks_select ON public.tms_tasks;
DROP POLICY IF EXISTS pol_tasks_insert ON public.tms_tasks;
DROP POLICY IF EXISTS pol_tasks_update ON public.tms_tasks;
DROP POLICY IF EXISTS pol_tasks_delete ON public.tms_tasks;

-- ==================================================
-- USER PROFILES - Both roles can see all profiles
-- ==================================================
CREATE POLICY pol_profile_select
  ON public.user_profiles FOR SELECT 
  USING (true);

CREATE POLICY pol_profile_update
  ON public.user_profiles FOR UPDATE 
  USING (auth.uid() = id OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY pol_profile_insert
  ON public.user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ==================================================
-- PROJECTS - Admin sees all, PM sees only assigned
-- ==================================================
CREATE POLICY pol_projects_select
  ON public.tms_projects FOR SELECT 
  USING (
    public.get_user_role(auth.uid()) = 'admin' 
    OR assigned_pm_id = auth.uid()
    OR assigned_pm_id IS NULL
  );

CREATE POLICY pol_projects_insert
  ON public.tms_projects FOR INSERT
  WITH CHECK (true);  -- Both admin and PM can create projects

CREATE POLICY pol_projects_update
  ON public.tms_projects FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'admin'
    OR (
      public.get_user_role(auth.uid()) = 'project_manager'
      AND (
        assigned_pm_id = auth.uid()  -- Can update own projects
        OR assigned_pm_id IS NULL    -- Can assign themselves to unassigned projects
      )
    )
  );

CREATE POLICY pol_projects_delete
  ON public.tms_projects FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'admin');

-- ==================================================
-- STAKEHOLDERS - Admin full access, PM can manage
-- ==================================================
CREATE POLICY pol_stakeholders_select
  ON public.tms_stakeholders FOR SELECT 
  USING (
    public.get_user_role(auth.uid()) = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.tms_projects 
      WHERE id = project_id 
      AND (assigned_pm_id = auth.uid() OR assigned_pm_id IS NULL)
    )
  );

CREATE POLICY pol_stakeholders_insert
  ON public.tms_stakeholders FOR INSERT
  WITH CHECK (true);  -- Both can add stakeholders

CREATE POLICY pol_stakeholders_update
  ON public.tms_stakeholders FOR UPDATE
  USING (true);  -- Both can update stakeholders

CREATE POLICY pol_stakeholders_delete
  ON public.tms_stakeholders FOR DELETE
  USING (
    public.get_user_role(auth.uid()) = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.tms_projects 
      WHERE id = project_id AND assigned_pm_id = auth.uid()
    )
  );

-- ==================================================
-- DEPARTMENTS - Both can manage
-- ==================================================
CREATE POLICY pol_departments_select
  ON public.tms_departments FOR SELECT 
  USING (true);

CREATE POLICY pol_departments_insert
  ON public.tms_departments FOR INSERT
  WITH CHECK (true);  -- Both admin and PM can create

CREATE POLICY pol_departments_update
  ON public.tms_departments FOR UPDATE
  USING (true);  -- Both can update

CREATE POLICY pol_departments_delete
  ON public.tms_departments FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'admin');

-- ==================================================
-- TEAM MEMBERS - Both can manage
-- ==================================================
CREATE POLICY pol_team_members_select
  ON public.tms_team_members FOR SELECT 
  USING (true);

CREATE POLICY pol_team_members_insert
  ON public.tms_team_members FOR INSERT
  WITH CHECK (true);  -- Both can add team members

CREATE POLICY pol_team_members_update
  ON public.tms_team_members FOR UPDATE
  USING (true);  -- Both can update

CREATE POLICY pol_team_members_delete
  ON public.tms_team_members FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'admin');

-- ==================================================
-- TASKS - Admin sees all, PM sees only their project tasks
-- ==================================================
CREATE POLICY pol_tasks_select
  ON public.tms_tasks FOR SELECT 
  USING (
    public.get_user_role(auth.uid()) = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.tms_projects 
      WHERE id = project_id AND assigned_pm_id = auth.uid()
    )
  );

CREATE POLICY pol_tasks_insert
  ON public.tms_tasks FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.tms_projects 
      WHERE id = project_id AND assigned_pm_id = auth.uid()
    )
  );

CREATE POLICY pol_tasks_update
  ON public.tms_tasks FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.tms_projects 
      WHERE id = project_id AND assigned_pm_id = auth.uid()
    )
  );

CREATE POLICY pol_tasks_delete
  ON public.tms_tasks FOR DELETE
  USING (
    public.get_user_role(auth.uid()) = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.tms_projects 
      WHERE id = project_id AND assigned_pm_id = auth.uid()
    )
  );

-- ==================================================
-- UPDATE AUTO-CREATE USER FUNCTION
-- ==================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'project_manager'),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- DONE! Role system updated
-- ==================================================
-- Admin: Full access to everything
-- Project Manager: 
--   - Can create/edit projects, departments, stakeholders, team members
--   - Can only see and manage their assigned projects
--   - Can assign themselves to unassigned projects
--   - Can unassign only their own projects
-- ==================================================
