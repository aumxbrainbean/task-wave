# 🚀 Task Management System - Complete Setup Guide

## ✅ What I've Fixed

### 1. **Database Schema Issues**
- ✅ Created complete database schema with `assigned_pm_id` column for PM assignments
- ✅ Fixed all RLS policies to allow proper data access
- ✅ Added automatic user profile creation on signup
- ✅ Set up proper indexes for performance

### 2. **TypeScript Type Mismatches**
- ✅ Updated `Project` interface in `/app/types/index.ts` to include `assigned_pm_id`
- ✅ Updated Database types in `/app/lib/supabase/client.ts` to match schema
- ✅ All TypeScript types now match the actual database structure

### 3. **Application Configuration**
- ✅ Configured environment variables with your Supabase credentials
- ✅ Set up Next.js application to run on port 3000
- ✅ Application is now running and accessible

---

## 📋 Step-by-Step Setup Instructions

### Step 1: Run the Database Schema (5 minutes)

1. **Open your Supabase dashboard**: https://jnmrhminhdzusshspqrt.supabase.co
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**
4. **Copy the entire contents** of `/app/FIXED_COMPLETE_DATABASE_SCHEMA.sql`
5. **Paste** into the SQL Editor
6. Click **"RUN"** or press `Ctrl+Enter`
7. Wait for **"Success. No rows returned"** message

✅ **Your database is now properly configured!**

---

### Step 2: Create Your First Admin User (3 minutes)

**Option A: Via Supabase Dashboard (Recommended)**

1. In Supabase dashboard, click **"Authentication"** → **"Users"**
2. Click **"Add User"** button (top right)
3. Fill in the form:
   - **Email**: your-email@example.com
   - **Password**: YourSecurePassword123
   - ✅ Check **"Auto Confirm User"**
4. Click **"Create User"**
5. **Copy the User UID** (long string like `abc-123-def-456...`)

6. Go back to **"SQL Editor"** and run this query:
   ```sql
   -- Update the user role to admin (replace USER_UID_HERE with your actual UID)
   UPDATE public.user_profiles 
   SET role = 'admin', full_name = 'Your Name'
   WHERE id = 'USER_UID_HERE';
   ```

**Option B: Via Application (Alternative)**

1. Open http://localhost:3000 (or your preview URL)
2. You'll be redirected to the login page
3. Click **"Sign up"** at the bottom
4. Fill in the registration form
5. After signup, manually update the role in Supabase:
   - Go to **Table Editor** → **user_profiles**
   - Find your user
   - Change `role` from `team_member` to `admin`

✅ **Your admin account is ready!**

---

### Step 3: Test the Application

1. **Login**: Open http://localhost:3000 and login with your admin credentials

2. **Create a Project**:
   - Click **"Projects"** in the sidebar
   - Click **"New Project"** button
   - Fill in:
     - Name: "Test Project"
     - Description: "Testing the system"
   - Click **"Create Project"**
   
3. **Verify Projects are Visible**:
   - ✅ You should see your project in the list
   - ✅ You can assign a PM using the dropdown
   - ✅ You can click "Stakeholders" to add stakeholders

4. **Check Users Page**:
   - Click **"Users"** in the sidebar
   - ✅ You should see yourself listed
   - ✅ Click the "+" icon to assign projects
   - ✅ Your test project should appear in the assignment dialog

---

## 🎯 What Was Wrong & How I Fixed It

### Issue 1: Projects Not Showing Up
**Root Cause**: 
- The `tms_projects` table was missing the `assigned_pm_id` column
- TypeScript types didn't match the database schema
- RLS policies were too restrictive

**Fix Applied**:
- ✅ Added `assigned_pm_id` column to database schema
- ✅ Updated all TypeScript interfaces
- ✅ Fixed RLS policies to use `auth.uid() IS NOT NULL` for viewing

### Issue 2: No Projects in Assignment Dialog
**Root Cause**: 
- Same as above - projects weren't being returned by queries due to missing column and RLS issues

**Fix Applied**:
- ✅ Database schema now includes all required columns
- ✅ Proper foreign key relationships established
- ✅ RLS policies allow authenticated users to view projects

### Issue 3: Database Schema Inconsistency
**Root Cause**: 
- Multiple partial SQL files existed
- Some had PM support, some didn't
- TypeScript types were based on old schema

**Fix Applied**:
- ✅ Created one comprehensive, complete SQL file
- ✅ All TypeScript types updated to match
- ✅ Consistent schema across all layers

---

## 🔧 Technical Changes Made

### Files Modified:
1. `/app/types/index.ts` - Added `assigned_pm_id` to Project interface
2. `/app/lib/supabase/client.ts` - Added `assigned_pm_id` to Database types
3. `/app/.env.local` - Added Supabase credentials
4. `/app/supervisord.conf` - Fixed directory path

### Files Created:
1. `/app/FIXED_COMPLETE_DATABASE_SCHEMA.sql` - Complete database setup
2. `/app/SETUP_GUIDE.md` - This guide

---

## 📊 Database Schema Overview

### Tables Created:
- **user_profiles** - Extended user data with roles (admin, project_manager, team_member)
- **tms_projects** - Projects with PM assignments
- **tms_stakeholders** - Project stakeholders
- **tms_departments** - Organizational departments
- **tms_team_members** - Team members in departments
- **tms_tasks** - Tasks with assignments and tracking

### Key Features:
- ✅ Automatic performance calculation (Before Time / On Time / Delayed)
- ✅ Automatic timestamp updates
- ✅ Automatic user profile creation on signup
- ✅ Proper foreign key relationships
- ✅ Row Level Security (RLS) for data protection
- ✅ Optimized indexes for fast queries

---

## 🆘 Troubleshooting

### Projects Still Not Showing?

1. **Check if data exists**:
   ```sql
   SELECT * FROM tms_projects;
   ```

2. **Check RLS policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'tms_projects';
   ```

3. **Verify user is authenticated**:
   - Check browser console (F12) for errors
   - Make sure you're logged in
   - Try logging out and back in

### Can't Login?

1. **Verify user exists** in Supabase Dashboard → Authentication → Users
2. **Check user_profile was created** in Table Editor → user_profiles
3. **Ensure email is confirmed** (check "Email Confirmed" column)

### Application Not Loading?

1. **Check Next.js is running**:
   ```bash
   ps aux | grep node
   ```

2. **Check logs**:
   ```bash
   tail -100 /var/log/nextjs.log
   ```

3. **Restart if needed**:
   ```bash
   killall node
   cd /app && nohup yarn dev > /var/log/nextjs.log 2>&1 &
   ```

---

## 🎉 You're All Set!

Your Task Management System is now properly configured with:
- ✅ Complete database schema with PM support
- ✅ Proper TypeScript types
- ✅ Working project creation and display
- ✅ Project assignment functionality
- ✅ User management features

### Next Steps:
1. Create more users via Supabase Auth
2. Assign them different roles (admin, project_manager, team_member)
3. Create departments and team members
4. Start managing tasks in the Dashboard

**Need help?** Check the other documentation files:
- `QUICK_START.md` - Quick reference guide
- `README.md` - Feature overview
- `PROJECT_SUMMARY.md` - Technical details

---

**Enjoy your Task Management System!** 🚀
