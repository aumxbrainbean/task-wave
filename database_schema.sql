-- Task Management System Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'team_member' CHECK (role IN ('admin', 'project_manager', 'team_member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects Table
CREATE TABLE IF NOT EXISTS public.tms_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.user_profiles(id),
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
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tms_projects_updated_at BEFORE UPDATE ON public.tms_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tms_stakeholders_updated_at BEFORE UPDATE ON public.tms_stakeholders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tms_departments_updated_at BEFORE UPDATE ON public.tms_departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tms_team_members_updated_at BEFORE UPDATE ON public.tms_team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tms_tasks_updated_at BEFORE UPDATE ON public.tms_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tms_stakeholders_project_id ON public.tms_stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_tms_team_members_department_id ON public.tms_team_members(department_id);
CREATE INDEX IF NOT EXISTS idx_tms_tasks_project_id ON public.tms_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tms_tasks_status ON public.tms_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tms_tasks_priority ON public.tms_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tms_tasks_eta_date ON public.tms_tasks(eta_date);
CREATE INDEX IF NOT EXISTS idx_tms_tasks_department_ids ON public.tms_tasks USING GIN(department_ids);
CREATE INDEX IF NOT EXISTS idx_tms_tasks_assigned_to_ids ON public.tms_tasks USING GIN(assigned_to_ids);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tms_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tms_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tms_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tms_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tms_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for projects (Admin and PM can manage)
CREATE POLICY "Anyone can view projects" ON public.tms_projects FOR SELECT USING (true);
CREATE POLICY "Admin and PM can insert projects" ON public.tms_projects FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
);
CREATE POLICY "Admin and PM can update projects" ON public.tms_projects FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
);
CREATE POLICY "Admin can delete projects" ON public.tms_projects FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for stakeholders
CREATE POLICY "Anyone can view stakeholders" ON public.tms_stakeholders FOR SELECT USING (true);
CREATE POLICY "Admin and PM can manage stakeholders" ON public.tms_stakeholders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
);

-- RLS Policies for departments
CREATE POLICY "Anyone can view departments" ON public.tms_departments FOR SELECT USING (true);
CREATE POLICY "Admin can manage departments" ON public.tms_departments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for team_members
CREATE POLICY "Anyone can view team members" ON public.tms_team_members FOR SELECT USING (true);
CREATE POLICY "Admin can manage team members" ON public.tms_team_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks" ON public.tms_tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid())
);
CREATE POLICY "Admin and PM can insert tasks" ON public.tms_tasks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
);
CREATE POLICY "Admin and PM can update tasks" ON public.tms_tasks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
);
CREATE POLICY "Admin and PM can delete tasks" ON public.tms_tasks FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
);

-- Insert default admin user (update email/password after running this)
-- Note: You need to create the user in Supabase Auth first, then update this with their UUID
-- Example: INSERT INTO public.user_profiles (id, email, full_name, role) VALUES ('your-user-uuid', 'admin@example.com', 'Admin User', 'admin');
