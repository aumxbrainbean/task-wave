-- ===================================================================
-- COMPLETE DATABASE SETUP FOR PM FEATURE AND USER REGISTRATION FIX
-- ===================================================================
-- Run this entire script in your Supabase SQL Editor
-- This will fix both the PM assignment feature and user registration issues

-- ===================================================================
-- PART 1: Add PM Assignment Column to Projects
-- ===================================================================

-- Add assigned_pm_id column to tms_projects table
ALTER TABLE tms_projects 
ADD COLUMN IF NOT EXISTS assigned_pm_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_assigned_pm ON tms_projects(assigned_pm_id);

-- Add comment for documentation
COMMENT ON COLUMN tms_projects.assigned_pm_id IS 'The PM (Project Manager) assigned to this project';


-- ===================================================================
-- PART 2: Fix User Profiles RLS and Auto-Creation
-- ===================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Create RLS policies that allow users to manage their own profiles
CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow admins to see all profiles (check role from their own profile)
CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create a function to automatically create user profile on signup
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
-- VERIFICATION QUERIES (Optional - Run these to verify setup)
-- ===================================================================

-- Check if assigned_pm_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tms_projects' AND column_name = 'assigned_pm_id';

-- Check RLS policies on user_profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_profiles';

-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ===================================================================
-- SETUP COMPLETE!
-- ===================================================================
-- After running this script:
-- 1. PM assignment feature will work correctly
-- 2. New user registration will automatically create user_profiles
-- 3. RLS policies will properly protect user data
-- ===================================================================
