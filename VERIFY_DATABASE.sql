-- ===================================================================
-- DATABASE VERIFICATION QUERIES
-- ===================================================================
-- Run these queries in Supabase SQL Editor to verify everything is set up correctly
-- ===================================================================

-- 1. Check if all tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('user_profiles', 'tms_projects', 'tms_stakeholders', 
                        'tms_departments', 'tms_team_members', 'tms_tasks') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'tms_projects', 'tms_stakeholders', 
                     'tms_departments', 'tms_team_members', 'tms_tasks')
ORDER BY table_name;

-- 2. Check if assigned_pm_id column exists in tms_projects
SELECT 
  column_name,
  data_type,
  is_nullable,
  '✅ Column exists' as status
FROM information_schema.columns 
WHERE table_name = 'tms_projects' 
  AND column_name = 'assigned_pm_id';

-- If the above query returns no rows, the column is missing!

-- 3. Check RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS ENABLED' 
    ELSE '❌ RLS DISABLED' 
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'tms_projects', 'tms_stakeholders', 
                    'tms_departments', 'tms_team_members', 'tms_tasks')
ORDER BY tablename;

-- 4. Check RLS policies exist
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  '✅ Policy active' as status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Check if triggers exist
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  '✅ Trigger exists' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('user_profiles', 'tms_projects', 'tms_stakeholders', 
                              'tms_departments', 'tms_team_members', 'tms_tasks', 'users')
ORDER BY event_object_table, trigger_name;

-- 6. Check indexes exist
SELECT 
  tablename,
  indexname,
  '✅ Index exists' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('tms_projects', 'tms_stakeholders', 'tms_team_members', 'tms_tasks')
ORDER BY tablename, indexname;

-- 7. Count existing data
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as row_count
FROM user_profiles
UNION ALL
SELECT 
  'tms_projects' as table_name,
  COUNT(*) as row_count
FROM tms_projects
UNION ALL
SELECT 
  'tms_departments' as table_name,
  COUNT(*) as row_count
FROM tms_departments
UNION ALL
SELECT 
  'tms_team_members' as table_name,
  COUNT(*) as row_count
FROM tms_team_members
UNION ALL
SELECT 
  'tms_tasks' as table_name,
  COUNT(*) as row_count
FROM tms_tasks;

-- 8. Check if auto user profile creation trigger works
-- This checks if the trigger exists on auth.users table
SELECT 
  trigger_name,
  '✅ Auto-profile trigger exists' as status
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

-- ===================================================================
-- EXPECTED RESULTS:
-- ===================================================================
-- Query 1: Should show 6 tables with "✅ EXISTS"
-- Query 2: Should return 1 row showing assigned_pm_id column
-- Query 3: Should show all 6 tables with "✅ RLS ENABLED"
-- Query 4: Should show multiple policies (at least 2-3 per table)
-- Query 5: Should show triggers for updated_at and on_auth_user_created
-- Query 6: Should show indexes for project_id, assigned_pm_id, etc.
-- Query 7: Shows how many rows exist in each table (0 is fine for fresh setup)
-- Query 8: Should return 1 row showing the trigger exists
-- ===================================================================

-- ===================================================================
-- IF ANYTHING IS MISSING:
-- ===================================================================
-- Run the complete schema file: /app/FIXED_COMPLETE_DATABASE_SCHEMA.sql
-- ===================================================================
