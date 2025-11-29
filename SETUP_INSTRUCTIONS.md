# Task Management System - Setup Instructions

## 🎯 Overview

Your Task Management System is now ready! This guide will help you complete the final setup steps to get the system fully operational.

## ✅ What's Already Done

- ✅ Next.js application with TypeScript
- ✅ Supabase client configured
- ✅ Authentication pages (Login/Signup)
- ✅ Main Dashboard with Excel-style task grid
- ✅ Projects management
- ✅ Departments management
- ✅ Settings page
- ✅ All necessary dependencies installed
- ✅ Database schema SQL file created

## 🔧 Required Setup Steps

### Step 1: Run Database Schema

1. Open your Supabase project dashboard:
   - Go to: https://jnmrhminhdzusshspqrt.supabase.co
   - Or visit: https://supabase.com/dashboard

2. Navigate to **SQL Editor** (left sidebar)

3. Click **New Query**

4. Copy the entire contents of `/app/database_schema.sql` file

5. Paste into the SQL Editor

6. Click **Run** (or press Ctrl+Enter)

7. Wait for confirmation message: "Success. No rows returned"

This will create:
- All 6 database tables (user_profiles, tms_projects, tms_stakeholders, tms_departments, tms_team_members, tms_tasks)
- All indexes for performance
- All triggers for auto-updates
- Row Level Security (RLS) policies
- Performance calculation function

### Step 2: Create Your First Admin User

**Option A: Via Supabase Dashboard (Recommended)**

1. In Supabase Dashboard, go to **Authentication** > **Users**

2. Click **Add User** (top right)

3. Fill in:
   - Email: your-email@example.com
   - Password: your-secure-password
   - Auto Confirm User: ✅ (checked)

4. Click **Create User**

5. Copy the **User UID** (it's a long UUID like: abc123-...)

6. Go back to **SQL Editor** and run:

```sql
INSERT INTO public.user_profiles (id, email, full_name, role) 
VALUES (
  'paste-your-user-uid-here',
  'your-email@example.com',
  'Your Name',
  'admin'
);
```

**Option B: Via Signup Page**

1. Open the app at http://localhost:3000

2. You'll be redirected to login page

3. Click **Sign up**

4. Fill in the form and select **Admin** role

5. Submit the form

6. You'll be redirected to login - use your credentials to sign in

### Step 3: Test the Application

1. **Login**
   - Go to http://localhost:3000
   - Enter your credentials
   - Click Sign In

2. **Create a Project**
   - Click "Projects" in sidebar
   - Click "New Project"
   - Fill in name and description
   - Submit

3. **Add Stakeholders to Project**
   - In Projects page, click "Stakeholders" button
   - Click "Add Stakeholder"
   - Fill in details
   - Submit

4. **Create Departments**
   - Click "Departments" in sidebar
   - Click "New Department"
   - Fill in details
   - Submit

5. **Add Team Members to Department**
   - In Departments page, click "Team Members" button
   - Click "Add Member"
   - Fill in details
   - Submit

6. **Use Task Dashboard**
   - Click "Dashboard" in sidebar
   - Select a project from tabs at bottom
   - Click "Add Task" to create tasks
   - Click on any cell to edit inline
   - Changes auto-save after 500ms

## 🎨 Key Features to Explore

### Excel-Style Grid
- **Inline Editing**: Click any cell to edit
- **Auto-save**: Changes save automatically after 500ms
- **Row Colors**: Rows change color based on status
- **Sortable Columns**: Click headers to sort

### Filters
- Filter by Status
- Filter by Priority
- Filter by Department
- Clear all filters button

### Date Pickers
- Click date fields to open calendar
- Format: "Monday, November 3, 2025"

### Multi-select (Coming Soon)
- Department selection
- Team member assignment (filtered by department)

### Performance Calculation
- Automatically calculates when completed_date is set
- Before Time: green badge
- On Time: blue badge
- Delayed: red badge

## 🔐 User Roles

### Admin
- Full access to all features
- Can manage projects, departments, teams
- Can create and edit all tasks
- Access to settings

### Project Manager
- Can create and manage tasks
- Can manage projects and stakeholders
- View all departments and teams

### Team Member
- View tasks assigned to them
- Can update task status (if configured)
- Limited access

## 📊 Status Colors

The task grid uses color coding for easy status identification:

- **Yet To Start**: Light gray (#f7f7f7)
- **In Progress**: Light yellow (#fff6e5)
- **On Hold**: Light red (#fdecec)
- **Client Review Pending**: Light blue (#e8f3ff)
- **Completed**: Light green (#e9f9ec)

## 🚀 Running the Application

The application is already running via supervisor. To manage:

```bash
# Check status
sudo supervisorctl status nextjs

# Restart (if needed)
sudo supervisorctl restart nextjs

# View logs
tail -f /var/log/supervisor/nextjs.out.log
```

## 🔍 Troubleshooting

### Can't Login
- Verify you ran the database schema SQL
- Check if user exists in Supabase Auth > Users
- Verify user_profile record exists for the user

### No Projects/Departments Showing
- Make sure you created them via the UI
- Check Supabase Table Editor to verify data exists
- Check browser console for errors

### Auto-save Not Working
- Check browser console for errors
- Verify Supabase connection
- Check network tab for failed requests

### Database Errors
- Ensure all SQL from database_schema.sql was executed
- Check for any SQL errors in Supabase logs
- Verify RLS policies are active

## 🎯 Next Steps

1. ✅ Complete database setup
2. ✅ Create admin user
3. ✅ Login to the system
4. ✅ Create your first project
5. ✅ Add stakeholders
6. ✅ Create departments
7. ✅ Add team members
8. ✅ Start creating tasks!

## 📝 Additional Notes

### Real-time Sync
Real-time collaboration is configured via Supabase Realtime. Multiple users can edit tasks simultaneously (updates every few seconds).

### Data Relationships
- Stakeholders belong to Projects (1:many)
- Team Members belong to Departments (1:many)
- Tasks belong to Projects (1:many)
- Tasks can have multiple Departments (many:many via array)
- Tasks can have multiple Team Members (many:many via array)

### Performance
- Database is indexed for optimal query performance
- Grid can handle 1000+ tasks smoothly
- Auto-save is debounced to prevent excessive API calls

## 🆘 Need Help?

If you encounter any issues:

1. Check the browser console for JavaScript errors
2. Check Supabase logs for database errors
3. Review `/var/log/supervisor/nextjs.out.log` for backend errors
4. Verify all environment variables in `.env` are correct

---

**Your Task Management System is ready to use! 🎉**

Access it at: http://localhost:3000
