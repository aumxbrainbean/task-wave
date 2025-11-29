-- Add assigned_pm_id column to tms_projects table
ALTER TABLE tms_projects 
ADD COLUMN assigned_pm_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_projects_assigned_pm ON tms_projects(assigned_pm_id);

-- Optional: Add comment for documentation
COMMENT ON COLUMN tms_projects.assigned_pm_id IS 'The PM (Project Manager) assigned to this project';
