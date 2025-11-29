# Task Management System - Quick Start Guide

## ⚡ Get Started in 5 Steps

### Step 1: Run Database Schema (5 minutes)

1. Open your browser and go to: **https://supabase.com/dashboard**
2. Find your project or go directly to: **https://jnmrhminhdzusshspqrt.supabase.co**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file `/app/database_schema.sql` in your code editor
6. Copy ALL the contents
7. Paste into the Supabase SQL Editor
8. Click **RUN** or press `Ctrl+Enter`
9. Wait for "Success. No rows returned" message

✅ **Database is now ready!**

---

### Step 2: Create Your Admin Account (2 minutes)

**Option A: Via Supabase Dashboard (Easier)**

1. In Supabase, click **Authentication** → **Users**
2. Click **Add User** button
3. Enter:
   - **Email**: your-email@example.com
   - **Password**: YourSecurePassword123
   - ✅ Check "Auto Confirm User"
4. Click **Create User**
5. **IMPORTANT**: Copy the User UID (long string like: `abc-123-def-456...`)
6. Go back to **SQL Editor**
7. Create a new query and run:

```sql
INSERT INTO public.user_profiles (id, email, full_name, role) 
VALUES (
  'YOUR-USER-UID-HERE',
  'your-email@example.com',
  'Your Name',
  'admin'
);
```

**Option B: Via App Signup Page (Alternative)**

1. Open http://localhost:3000
2. Click **Sign up**
3. Fill in the form, select **Admin** role
4. Submit and then login

✅ **Admin account created!**

---

### Step 3: Login to TMS (30 seconds)

1. Open: **http://localhost:3000**
2. You'll be redirected to login page
3. Enter your email and password
4. Click **Sign In**

✅ **You're in!**

---

### Step 4: Set Up Your First Project (3 minutes)

1. Click **"Projects"** in the sidebar
2. Click **"New Project"** button
3. Enter:
   - **Name**: My First Project
   - **Description**: Testing the system
4. Click **Create Project**
5. Click **"Stakeholders"** button on your project
6. Click **"Add Stakeholder"**
7. Add at least one stakeholder:
   - Name: John Client
   - Email: john@client.com
   - Phone: +1234567890
   - Designation: Project Owner
8. Click **Add Stakeholder**

✅ **Project created with stakeholders!**

---

### Step 5: Create Department & Team (3 minutes)

1. Click **"Departments"** in the sidebar
2. Click **"New Department"** button
3. Enter:
   - **Name**: Development
   - **Description**: Dev team
4. Click **Create Department**
5. Click **"Team Members"** button on your department
6. Click **"Add Member"**
7. Add a team member:
   - Name: Sarah Developer
   - Email: sarah@dev.com
   - Role: Developer
   - Designation: Senior Developer
8. Click **Add Member**

✅ **Department and team created!**

---

## 🎉 You're Ready to Use TMS!

### Start Using the Task Dashboard

1. Click **"Dashboard"** in the sidebar
2. Your project should show in a tab at the bottom
3. Click **"Add Task"** to create your first task
4. Click on any cell to edit it inline
5. Changes auto-save after 500ms!

### Try These Features:

**Editing Tasks**
- ✏️ Click task description to edit text
- 📅 Click date fields to open calendar
- 🔽 Click dropdowns to change status/priority
- ✨ Changes save automatically!

**Filters**
- Filter by Status (Yet To Start, In Progress, etc.)
- Filter by Priority (Low, Medium, High, Critical)
- Filter by Department
- Click "Clear Filters" to reset

**Row Colors**
- Tasks change color based on status
- Completed tasks are green
- In Progress are yellow
- On Hold are red

**Performance Tracking**
- Set an ETA date
- Mark task as Completed
- Performance automatically calculates!
- Green = Before Time
- Blue = On Time
- Red = Delayed

---

## 📋 Common Tasks

### Adding a Task
1. Go to Dashboard
2. Select project from bottom tabs
3. Click "Add Task"
4. Fill in the details by clicking cells
5. Auto-saves!

### Changing Status
1. Find your task in the grid
2. Click the Status dropdown
3. Select new status
4. Watch the row color change!

### Filtering Tasks
1. Use the dropdowns at the top
2. Select Status/Priority/Department
3. Grid updates instantly
4. Click "Clear Filters" to see all

### Switching Projects
1. Look at tabs at bottom of dashboard
2. Click different project tab
3. Tasks load for that project

---

## 🔐 User Roles Explained

**Admin (You)**
- ✅ Full access to everything
- ✅ Manage projects, departments, teams
- ✅ Create and edit all tasks
- ✅ Access settings

**Project Manager**
- ✅ Create and manage tasks
- ✅ Manage projects and stakeholders
- ✅ View departments and teams
- ❌ Cannot create departments

**Team Member**
- ✅ View assigned tasks
- ✅ Update task status
- ❌ Cannot create projects/departments
- ❌ Limited access

You can create more users via:
- Supabase Dashboard → Authentication → Add User
- Or via the Signup page

---

## 💡 Pro Tips

1. **Use Filters**: Filter by status to focus on "In Progress" tasks
2. **Color Coding**: Quickly spot on-hold tasks (red) or completed (green)
3. **Auto-save**: Just edit and wait 0.5 seconds - no save button needed!
4. **Project Switching**: Use bottom tabs to jump between projects
5. **Keyboard Navigation**: Tab key moves between cells in the grid

---

## 🆘 Troubleshooting

**Can't login?**
- Did you run the database schema SQL?
- Did you create the user_profile record?
- Check Supabase Auth → Users to verify account exists

**Don't see projects?**
- Make sure you created them via Projects page
- Check Supabase → Table Editor → tms_projects

**Tasks not saving?**
- Check browser console (F12) for errors
- Verify Supabase connection in Settings page

**Page not loading?**
- Check `/var/log/supervisor/nextjs.out.log` for errors
- Restart server: `sudo supervisorctl restart nextjs`

---

## 📚 More Information

- **Full Setup**: See `SETUP_INSTRUCTIONS.md`
- **Features**: See `README.md`
- **Technical Details**: See `PROJECT_SUMMARY.md`
- **Database Schema**: See `database_schema.sql`

---

## 🚀 What's Next?

After you're comfortable with the basics:

1. **Add more projects** with stakeholders
2. **Create more departments** with team members
3. **Assign tasks** to team members (coming soon - multi-select)
4. **Invite team members** to collaborate
5. **Use filters** to manage your workflow

---

**Enjoy your Task Management System!** 🎊

Need help? Check the troubleshooting section or review the detailed documentation files.
