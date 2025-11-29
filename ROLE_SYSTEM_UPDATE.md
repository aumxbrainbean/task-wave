# 🎯 Role System Update - Admin & Project Manager Only

## ✅ Changes Implemented

### 1. **Database Schema Updates**
- ✅ Removed `team_member` role from system
- ✅ Updated role constraint to only allow: `admin` and `project_manager`
- ✅ Changed default role to `project_manager`
- ✅ Updated all existing team_member users to project_manager

### 2. **TypeScript Type Updates**
- ✅ Updated `UserRole` type in `/app/types/index.ts`
- ✅ Updated Database types in `/app/lib/supabase/client.ts`
- ✅ Removed all team_member references

### 3. **Access Control (RLS Policies)**

#### **Admin Role - Full Access:**
- ✅ Can see ALL projects, tasks, departments, stakeholders, team members
- ✅ Can create, edit, delete everything
- ✅ Can assign any PM to any project
- ✅ Can unassign projects from any PM

#### **Project Manager Role - Limited Access:**
- ✅ **Dashboard**: Only shows tasks/projects assigned to them
- ✅ **Projects**: Can see their assigned projects + unassigned projects
- ✅ **Create/Edit**: Can create and edit projects, departments, stakeholders, team members
- ✅ **PM Assignment**: 
  - Can assign themselves to unassigned projects
  - Can unassign only their own projects
  - Cannot unassign projects assigned to other PMs
  - Cannot assign other PMs to projects
- ✅ **Tasks**: Can only see and manage tasks for their assigned projects

### 4. **UI Updates**
- ✅ Projects page: PM dropdown is restricted based on user role
- ✅ Projects page: Assignment validation prevents unauthorized changes
- ✅ Dashboard: Automatically filters projects for PMs (via taskStore)
- ✅ Users page: Shows correct role badges (Admin/PM only)

---

## 📋 What to Run

### **Step 1: Update Database**
Run this SQL in Supabase SQL Editor:
```
Copy entire contents of: /app/UPDATE_ROLES_SYSTEM.sql
```

### **Step 2: Restart Application**
```bash
killall node
cd /app && nohup yarn dev > /var/log/nextjs.log 2>&1 &
```

### **Step 3: Test Both Roles**

#### **Test Admin:**
1. Login as admin
2. Go to Projects → Should see ALL projects
3. Try assigning any PM to any project → Should work
4. Try unassigning any project → Should work
5. Go to Dashboard → Should see all projects in tabs

#### **Test Project Manager:**
1. Create a new PM user in Supabase
2. Login as PM
3. Go to Projects → Should see unassigned projects only
4. Create a new project
5. Assign yourself to it → Should work
6. Try to assign another PM → Should show alert
7. Try to unassign another PM's project → Should be disabled/show alert
8. Go to Dashboard → Should only see YOUR projects in tabs

---

## 🔑 Key Behaviors

### **PM Assignment Rules:**

| Action | Admin | Project Manager |
|--------|-------|-----------------|
| See all projects | ✅ Yes | ❌ No (only assigned + unassigned) |
| Assign any PM to project | ✅ Yes | ❌ No |
| Assign self to unassigned project | ✅ Yes | ✅ Yes |
| Unassign own project | ✅ Yes | ✅ Yes |
| Unassign other PM's project | ✅ Yes | ❌ No |
| Create projects | ✅ Yes | ✅ Yes |
| Edit projects | ✅ Yes | ✅ Yes (own projects) |
| Delete projects | ✅ Yes | ❌ No |
| Create departments | ✅ Yes | ✅ Yes |
| Create team members | ✅ Yes | ✅ Yes |
| Add stakeholders | ✅ Yes | ✅ Yes |
| See all tasks | ✅ Yes | ❌ No (only own project tasks) |

---

## 🧪 Testing Checklist

### **Admin Testing:**
- [ ] Can see all projects in Projects page
- [ ] Can see all projects in Dashboard
- [ ] Can assign any PM to any project
- [ ] Can unassign any project
- [ ] Can delete any project
- [ ] Can see all tasks in Dashboard

### **PM Testing:**
- [ ] Only sees assigned projects + unassigned projects
- [ ] Dashboard only shows assigned projects
- [ ] Can create new project
- [ ] Can assign self to unassigned project
- [ ] Cannot assign other PMs
- [ ] Cannot unassign other PM's projects
- [ ] Can unassign own projects
- [ ] Can add/edit departments and team members
- [ ] Only sees tasks for assigned projects

---

## 🗂️ Files Modified

1. **SQL Files:**
   - `/app/UPDATE_ROLES_SYSTEM.sql` - Complete role system update

2. **TypeScript Types:**
   - `/app/types/index.ts` - UserRole type
   - `/app/lib/supabase/client.ts` - Database types

3. **React Components:**
   - `/app/app/projects/page.tsx` - PM assignment logic & restrictions

4. **Store (Already correct):**
   - `/app/lib/stores/taskStore.ts` - Already filters projects for PMs

---

## 🚀 Current Status

- ✅ Database schema updated
- ✅ TypeScript types fixed
- ✅ RLS policies implemented
- ✅ UI restrictions in place
- ✅ Dashboard filtering working
- ⏳ **Ready to test after running SQL**

---

**Run the SQL file and test both roles!** 🎉
