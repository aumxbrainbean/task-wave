-- ===================================================================
-- COMPLETE DATABASE SETUP FOR PM FEATURE AND USER REGISTRATION FIX
-- ===================================================================
-- Run this entire script in your Supabase SQL Editor

-- ===================================================================
-- PART 1: Add PM Assignment Column to Projects
-- ===================================================================

ALTER TABLE tms_projects 
ADD COLUMN IF NOT EXISTS assigned_pm_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_assigned_pm ON tms_projects(assigned_pm_id);

COMMENT ON COLUMN tms_projects.assigned_pm_id IS 'The PM (Project Manager) assigned to this project';


-- ===================================================================
-- PART 2: Fix User Profiles RLS and Auto-Creation
-- ===================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS users_view_own_profile ON user_profiles;
DROP POLICY IF EXISTS users_update_own_profile ON user_profiles;
DROP POLICY IF EXISTS users_insert_own_profile ON user_profiles;
DROP POLICY IF EXISTS admins_view_all_profiles ON user_profiles;

-- Create RLS policies that allow users to manage their own profiles
CREATE POLICY users_view_own_profile
ON user_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY users_update_own_profile
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY users_insert_own_profile
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow admins to see all profiles
CREATE POLICY admins_view_all_profiles
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'team_member'),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function after user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;


-- ===================================================================
-- VERIFICATION QUERIES (Optional - Run these separately to verify)
-- ===================================================================

-- Check if assigned_pm_id column exists
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'tms_projects' AND column_name = 'assigned_pm_id';

-- Check RLS policies on user_profiles
-- SELECT schemaname, tablename, policyname
-- FROM pg_policies
-- WHERE tablename = 'user_profiles';

-- Check if trigger exists
-- SELECT trigger_name, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';
