-- ===================================================================
-- COMPLETE FIXED DATABASE SCHEMA FOR TASK MANAGEMENT SYSTEM
-- ===================================================================
-- Run this entire script in your Supabase SQL Editor
-- This includes ALL necessary tables, columns, indexes, RLS policies, and triggers
-- ===================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================================
-- PART 1: CREATE TABLES
-- ===================================================================

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'team_member' CHECK (role IN ('admin', 'project_manager', 'team_member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects Table (WITH assigned_pm_id column)
CREATE TABLE IF NOT EXISTS public.tms_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.user_profiles(id),
  assigned_pm_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stakeholders Table
CREATE TABLE IF NOT EXISTS public.tms_stakeholders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.tms_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  designation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments Table
CREATE TABLE IF NOT EXISTS public.tms_departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members Table
CREATE TABLE IF NOT EXISTS public.tms_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES public.tms_departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  designation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS public.tms_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.tms_projects(id) ON DELETE CASCADE,
  task_description TEXT NOT NULL,
  assigned_by_stakeholder_id UUID REFERENCES public.tms_stakeholders(id),
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  assigned_date DATE,
  eta_date DATE,
  department_ids UUID[] DEFAULT '{}',
  assigned_to_ids UUID[] DEFAULT '{}',
  assigned_by_pm BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Yet To Start' CHECK (status IN ('Yet To Start', 'In Progress', 'On Hold', 'Client Review Pending', 'Completed')),
  require_qa BOOLEAN DEFAULT false,
  completed_date DATE,
  performance TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- PART 2: ADD MISSING COLUMNS (if tables already exist)
-- ===================================================================

-- Add assigned_pm_id column to tms_projects if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tms_projects' AND column_name = 'assigned_pm_id'
  ) THEN
    ALTER TABLE public.tms_projects 
    ADD COLUMN assigned_pm_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ===================================================================
-- PART 3: CREATE FUNCTIONS AND TRIGGERS
-- ===================================================================

-- Function to calculate performance
CREATE OR REPLACE FUNCTION calculate_performance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_date IS NOT NULL AND NEW.eta_date IS NOT NULL THEN
    IF NEW.completed_date < NEW.eta_date THEN
      NEW.performance := 'Before Time';
    ELSIF NEW.completed_date = NEW.eta_date THEN
      NEW.performance := 'On Time';
    ELSE
      NEW.performance := 'Delayed';
    END IF;
  ELSE
    NEW.performance := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate performance
DROP TRIGGER IF EXISTS trigger_calculate_performance ON public.tms_tasks;
CREATE TRIGGER trigger_calculate_performance
  BEFORE INSERT OR UPDATE ON public.tms_tasks
  FOR EACH ROW
  EXECUTE FUNCTION calculate_performance();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON public.user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tms_projects_updated_at ON public.tms_projects;
CREATE TRIGGER update_tms_projects_updated_at 
  BEFORE UPDATE ON public.tms_projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tms_stakeholders_updated_at ON public.tms_stakeholders;
CREATE TRIGGER update_tms_stakeholders_updated_at 
  BEFORE UPDATE ON public.tms_stakeholders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tms_departments_updated_at ON public.tms_departments;
CREATE TRIGGER update_tms_departments_updated_at 
  BEFORE UPDATE ON public.tms_departments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tms_team_members_updated_at ON public.tms_team_members;
CREATE TRIGGER update_tms_team_members_updated_at 
  BEFORE UPDATE ON public.tms_team_members 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tms_tasks_updated_at ON public.tms_tasks;
CREATE TRIGGER update_tms_tasks_updated_at 
  BEFORE UPDATE ON public.tms_tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
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
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================================================================
-- PART 4: CREATE INDEXES
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_tms_projects_assigned_pm ON public.tms_projects(assigned_pm_id);
CREATE INDEX IF NOT EXISTS idx_tms_stakeholders_project_id ON public.tms_stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_tms_team_members_department_id ON public.tms_team_members(department_id);
CREATE INDEX IF NOT EXISTS idx_tms_tasks_project_id ON public.tms_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tms_tasks_status ON public.tms_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tms_tasks_priority ON public.tms_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tms_tasks_eta_date ON public.tms_tasks(eta_date);
CREATE INDEX IF NOT EXISTS idx_tms_tasks_department_ids ON public.tms_tasks USING GIN(department_ids);
CREATE INDEX IF NOT EXISTS idx_tms_tasks_assigned_to_ids ON public.tms_tasks USING GIN(assigned_to_ids);

-- ===================================================================
-- PART 5: ENABLE ROW LEVEL SECURITY (RLS)
-- ===================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tms_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tms_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tms_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tms_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tms_tasks ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- PART 6: DROP EXISTING POLICIES (clean slate)
-- ===================================================================

-- Drop user_profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON public.user_profiles;

-- Drop projects policies
DROP POLICY IF EXISTS "Anyone can view projects" ON public.tms_projects;
DROP POLICY IF EXISTS "Admin and PM can insert projects" ON public.tms_projects;
DROP POLICY IF EXISTS "Admin and PM can update projects" ON public.tms_projects;
DROP POLICY IF EXISTS "Admin can delete projects" ON public.tms_projects;

-- Drop stakeholders policies
DROP POLICY IF EXISTS "Anyone can view stakeholders" ON public.tms_stakeholders;
DROP POLICY IF EXISTS "Admin and PM can manage stakeholders" ON public.tms_stakeholders;

-- Drop departments policies
DROP POLICY IF EXISTS "Anyone can view departments" ON public.tms_departments;
DROP POLICY IF EXISTS "Admin can manage departments" ON public.tms_departments;

-- Drop team_members policies
DROP POLICY IF EXISTS "Anyone can view team members" ON public.tms_team_members;
DROP POLICY IF EXISTS "Admin can manage team members" ON public.tms_team_members;

-- Drop tasks policies
DROP POLICY IF EXISTS "Users can view tasks" ON public.tms_tasks;
DROP POLICY IF EXISTS "Admin and PM can insert tasks" ON public.tms_tasks;
DROP POLICY IF EXISTS "Admin and PM can update tasks" ON public.tms_tasks;
DROP POLICY IF EXISTS "Admin and PM can delete tasks" ON public.tms_tasks;

-- ===================================================================
-- PART 7: CREATE NEW RLS POLICIES
-- ===================================================================

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for projects
CREATE POLICY "Anyone authenticated can view projects" 
  ON public.tms_projects FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and PM can insert projects" 
  ON public.tms_projects FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
    )
  );

CREATE POLICY "Admin and PM can update projects" 
  ON public.tms_projects FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
    )
  );

CREATE POLICY "Admin can delete projects" 
  ON public.tms_projects FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for stakeholders
CREATE POLICY "Anyone authenticated can view stakeholders" 
  ON public.tms_stakeholders FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and PM can manage stakeholders" 
  ON public.tms_stakeholders FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
    )
  );

-- RLS Policies for departments
CREATE POLICY "Anyone authenticated can view departments" 
  ON public.tms_departments FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage departments" 
  ON public.tms_departments FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for team_members
CREATE POLICY "Anyone authenticated can view team members" 
  ON public.tms_team_members FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage team members" 
  ON public.tms_team_members FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks" 
  ON public.tms_tasks FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin and PM can insert tasks" 
  ON public.tms_tasks FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
    )
  );

CREATE POLICY "Admin and PM can update tasks" 
  ON public.tms_tasks FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
    )
  );

CREATE POLICY "Admin and PM can delete tasks" 
  ON public.tms_tasks FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
    )
  );

-- ===================================================================
-- PART 8: ADD COMMENTS FOR DOCUMENTATION
-- ===================================================================

COMMENT ON COLUMN public.tms_projects.assigned_pm_id IS 'The PM (Project Manager) assigned to this project';
COMMENT ON TABLE public.user_profiles IS 'Extended user profiles linked to auth.users';
COMMENT ON TABLE public.tms_projects IS 'Projects in the task management system';
COMMENT ON TABLE public.tms_stakeholders IS 'Stakeholders associated with projects';
COMMENT ON TABLE public.tms_departments IS 'Organizational departments';
COMMENT ON TABLE public.tms_team_members IS 'Team members within departments';
COMMENT ON TABLE public.tms_tasks IS 'Tasks within projects';

-- ===================================================================
-- SETUP COMPLETE!
-- ===================================================================
-- After running this script:
-- ✅ All tables created with proper structure
-- ✅ assigned_pm_id column added to tms_projects
-- ✅ All indexes created for performance
-- ✅ All triggers and functions set up
-- ✅ RLS policies configured correctly
-- ✅ Automatic user profile creation enabled
--
-- Next steps:
-- 1. Create your admin user in Supabase Auth
-- 2. The user profile will be automatically created
-- 3. Update the user role to 'admin' if needed
-- ===================================================================
