# Database Setup - Step by Step Guide

If the complete script doesn't work, run these steps one by one in Supabase SQL Editor.

---

## STEP 1: Add PM Column to Projects Table

```sql
ALTER TABLE tms_projects 
ADD COLUMN IF NOT EXISTS assigned_pm_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_assigned_pm ON tms_projects(assigned_pm_id);
```

**Expected Result:** Column added successfully

---

## STEP 2: Drop Old RLS Policies

```sql
DROP POLICY IF EXISTS users_view_own_profile ON user_profiles;
DROP POLICY IF EXISTS users_update_own_profile ON user_profiles;
DROP POLICY IF EXISTS users_insert_own_profile ON user_profiles;
DROP POLICY IF EXISTS admins_view_all_profiles ON user_profiles;
```

**Expected Result:** Policies dropped (or "does not exist" message is OK)

---

## STEP 3: Create New RLS Policies

### Policy 1: Users can view their own profile
```sql
CREATE POLICY users_view_own_profile
ON user_profiles FOR SELECT
USING (auth.uid() = id);
```

### Policy 2: Users can update their own profile
```sql
CREATE POLICY users_update_own_profile
ON user_profiles FOR UPDATE
USING (auth.uid() = id);
```

### Policy 3: Users can insert their own profile
```sql
CREATE POLICY users_insert_own_profile
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);
```

### Policy 4: Admins can view all profiles
```sql
CREATE POLICY admins_view_all_profiles
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

**Expected Result:** 4 policies created successfully

---

## STEP 4: Create Auto-Profile Function

```sql
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
```

**Expected Result:** Function created successfully

---

## STEP 5: Create Trigger

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Expected Result:** Trigger created successfully

---

## STEP 6: Enable RLS

```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

**Expected Result:** RLS enabled

---

## VERIFICATION

### Check if PM column exists:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tms_projects' AND column_name = 'assigned_pm_id';
```

### Check RLS policies:
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'user_profiles';
```

### Check trigger:
```sql
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

---

## Troubleshooting

### If you get "permission denied" errors:
- Make sure you're running queries as the Supabase service role
- Check that you're in the SQL Editor, not Table Editor

### If trigger doesn't work:
- Verify the function was created: `\df handle_new_user`
- Check auth.users table permissions

### If RLS still blocks:
- Temporarily disable RLS to test: `ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;`
- Then re-enable after testing: `ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;`

---

## Quick Test After Setup

1. Try to register a new user via your app
2. Check if profile was created:
```sql
SELECT id, email, full_name, role 
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;
```

3. Try to assign a PM to a project
4. Check if assignment worked:
```sql
SELECT p.name, p.assigned_pm_id, u.full_name as pm_name
FROM tms_projects p
LEFT JOIN user_profiles u ON p.assigned_pm_id = u.id;
```
