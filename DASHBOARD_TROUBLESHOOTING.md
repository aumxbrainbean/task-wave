# Dashboard Loading Issue - Troubleshooting Guide

## Symptoms
- Dashboard page keeps showing loading spinner
- Nothing appears
- Page doesn't error, just stays blank

## Root Causes & Solutions

### Issue 1: SQL Script Not Run
**Problem:** Database doesn't have the required columns/policies/triggers

**Check:**
Run this query in Supabase SQL Editor:
```sql
-- Check if assigned_pm_id column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'tms_projects' AND column_name = 'assigned_pm_id';

-- Should return 1 row. If empty, script wasn't run.
```

**Solution:** Run `/app/tms-app/DATABASE_SETUP_SIMPLE.sql`

---

### Issue 2: No User Profile Created
**Problem:** User exists in auth.users but not in user_profiles table

**Check:**
Run this query in Supabase SQL Editor:
```sql
-- List all auth users
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- List all user profiles
SELECT id, email, role FROM user_profiles ORDER BY created_at DESC LIMIT 5;

-- Compare: Do the IDs match?
```

**Solution A:** If trigger is set up, re-register
1. Sign out
2. Go to /auth/signup
3. Register again with same email (or new email)
4. Trigger will auto-create profile

**Solution B:** Manually create profile
```sql
-- Replace YOUR_USER_ID with actual UUID from auth.users
INSERT INTO user_profiles (id, email, full_name, role, created_at)
VALUES (
  'YOUR_USER_ID',
  'your-email@example.com',
  'Your Name',
  'admin',
  NOW()
);
```

---

### Issue 3: RLS Policies Block Query
**Problem:** Row-Level Security prevents user from reading their own profile

**Check:**
Run this query while logged in:
```sql
-- Check your own profile (run this after logging in)
SELECT * FROM user_profiles WHERE id = auth.uid();

-- Should return 1 row with your data
-- If error "permission denied" or empty, RLS is blocking
```

**Solution:** Re-run RLS policies from `/app/tms-app/DATABASE_SETUP_SIMPLE.sql`

---

### Issue 4: No Projects Created Yet
**Problem:** Dashboard loads but shows empty (this is actually normal if no projects exist)

**Check:**
```sql
SELECT id, name FROM tms_projects ORDER BY created_at DESC LIMIT 5;
```

**Solution:** 
1. Go to /projects page
2. Create a new project
3. Return to dashboard
4. Dashboard should now show project tabs

---

### Issue 5: Browser Console Errors
**Problem:** JavaScript errors preventing page load

**Check:**
1. Open browser (F12)
2. Go to Console tab
3. Refresh dashboard page
4. Look for red error messages

**Common Errors & Solutions:**

**Error:** "Cannot read property 'role' of null"
- **Fix:** User profile doesn't exist, see Issue 2

**Error:** "Failed to fetch"
- **Fix:** Supabase connection issue, check .env.local

**Error:** "permission denied for table user_profiles"
- **Fix:** RLS policies missing, see Issue 3

**Error:** Infinite loading spinner
- **Fix:** Likely fetchProjects() is failing silently, check Issues 1-3

---

## Quick Diagnostic Checklist

Run these in order:

### Step 1: Verify Database Setup
```sql
-- All should return data:
SELECT * FROM information_schema.tables WHERE table_name = 'user_profiles';
SELECT * FROM information_schema.tables WHERE table_name = 'tms_projects';
SELECT * FROM information_schema.columns WHERE table_name = 'tms_projects' AND column_name = 'assigned_pm_id';
```

### Step 2: Check Your User
```sql
-- Check auth user
SELECT id, email, created_at FROM auth.users WHERE email = 'YOUR_EMAIL';

-- Check profile exists
SELECT id, email, role FROM user_profiles WHERE email = 'YOUR_EMAIL';

-- Both should return matching records
```

### Step 3: Test RLS Policies
```sql
-- This should work if RLS is correct
SELECT * FROM user_profiles WHERE id = auth.uid();
```

### Step 4: Check for Projects
```sql
SELECT COUNT(*) as project_count FROM tms_projects;

-- If 0, you need to create projects via /projects page
```

---

## Most Common Fix

**90% of dashboard loading issues are solved by:**

1. **Running the SQL script:**
   - Copy `/app/tms-app/DATABASE_SETUP_SIMPLE.sql`
   - Paste in Supabase SQL Editor
   - Click Run

2. **Creating/Fixing user profile:**
   ```sql
   -- Get your user ID
   SELECT id FROM auth.users WHERE email = 'your-email@example.com';
   
   -- Create profile with that ID
   INSERT INTO user_profiles (id, email, full_name, role, created_at)
   VALUES ('PASTE_USER_ID_HERE', 'your-email@example.com', 'Your Name', 'admin', NOW())
   ON CONFLICT (id) DO UPDATE SET role = 'admin';
   ```

3. **Creating a test project:**
   - Go to http://localhost:3000/projects
   - Click "New Project"
   - Add name and description
   - Save

4. **Refresh dashboard**

---

## Still Not Working?

### Enable Debug Mode

Add console.log to see what's failing:

1. Open `/app/tms-app/lib/stores/taskStore.ts`
2. Find `fetchProjects` function (around line 57)
3. Add this at the start:
```typescript
console.log('Fetching projects...')
```
4. Add this in the catch block (line 90):
```typescript
console.error('Error fetching projects:', error)
console.error('Error details:', JSON.stringify(error, null, 2))
```

5. Refresh dashboard
6. Open browser console (F12)
7. Check for log messages

The error details will tell you exactly what's failing.

---

## Emergency Fix: Disable PM Filtering Temporarily

If fetchProjects keeps failing, temporarily simplify it:

Open `/app/tms-app/lib/stores/taskStore.ts` and replace the fetchProjects function with:

```typescript
fetchProjects: async () => {
  try {
    const { data, error } = await supabase
      .from('tms_projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error:', error)
      throw error
    }
    
    set({ projects: data || [] })
    
    if (data && data.length > 0) {
      set({ selectedProjectId: data[0].id })
    }
  } catch (error) {
    console.error('Error fetching projects:', error)
  }
},
```

This removes the user_profiles query that might be failing.

After dashboard loads, you can add back the PM filtering logic.
