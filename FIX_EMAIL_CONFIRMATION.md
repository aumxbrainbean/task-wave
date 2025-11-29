# Fix "Email not confirmed" Error

## Problem
After signing up, you get "Email not confirmed" error when trying to log in.

## Why This Happens
Supabase requires email confirmation by default. When you sign up:
1. Supabase creates the user account
2. Sends a confirmation email
3. User must click the link in email before logging in

For development/testing, this is inconvenient.

---

## Solution 1: Disable Email Confirmation (Recommended for Development)

### Steps:

1. **Go to Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings**
   - Click "Authentication" in left sidebar
   - Click "Settings" 
   - Or go directly to: Authentication → Settings → Email

3. **Disable Email Confirmation**
   - Find "Enable email confirmations"
   - **UNCHECK** this option
   - Click "Save"

4. **Test Again**
   - Go to your app: http://localhost:3000/auth/signup
   - Register a new user
   - You should now be able to log in immediately without email confirmation

---

## Solution 2: Manually Confirm Existing Users

If you already have users that need to be confirmed:

### Via Supabase Dashboard (Easiest):

1. Go to Supabase Dashboard
2. Click "Authentication" → "Users"
3. Find your user in the list
4. Click on the user
5. Look for "Email Confirmed" field
6. If it says "false" or is unchecked, check it
7. Save

### Via SQL Query:

```sql
-- Confirm a specific user by email
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'your-email@example.com';

-- Confirm ALL users (useful for development)
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

---

## Solution 3: Auto-Confirm Users in Signup Code

Update the signup code to auto-confirm users:

### Modify `/app/tms-app/app/auth/signup/page.tsx`

Find this code (around line 32):
```typescript
const { data, error: signUpError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      role: role,
    }
  }
})
```

Replace with:
```typescript
const { data, error: signUpError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: {
      full_name: fullName,
      role: role,
    }
  }
})
```

**Note:** This still requires email confirmation unless you disable it in settings (Solution 1).

---

## Solution 4: Setup Email Templates (Production)

For production, you want email confirmation but with custom templates:

1. Go to Supabase Dashboard
2. Authentication → Email Templates
3. Configure "Confirm signup" template
4. Customize the email text and design
5. Test with a real email address

---

## Recommended Approach

**For Development/Testing:**
- Use **Solution 1** (Disable email confirmation)
- This allows instant testing without email setup

**For Production:**
- Keep email confirmation enabled
- Setup custom email templates (Solution 4)
- Configure proper email provider (SendGrid, etc.)

---

## Quick Fix Checklist

- [ ] Go to Supabase → Authentication → Settings
- [ ] Uncheck "Enable email confirmations"
- [ ] Click Save
- [ ] Delete any test users: Authentication → Users → Delete
- [ ] Go to http://localhost:3000/auth/signup
- [ ] Register new user
- [ ] Should be able to login immediately

---

## Verification

After applying the fix, test:

1. **Sign up a new user**
   ```
   Email: test@example.com
   Password: Test123456
   Role: Admin
   ```

2. **Login immediately**
   - Should work without "Email not confirmed" error

3. **Check user profile exists**
   Run in Supabase SQL Editor:
   ```sql
   SELECT * FROM user_profiles WHERE email = 'test@example.com';
   ```
   Should return 1 row (profile was auto-created by trigger)

---

## Troubleshooting

**Still getting "Email not confirmed"?**
- Clear browser cache and cookies
- Make sure you saved the setting in Supabase
- Wait 1-2 minutes for settings to propagate
- Try in incognito/private browser window

**User created but no profile?**
- Means the trigger didn't run
- Check if you ran the SQL script: `/app/tms-app/DATABASE_SETUP_SIMPLE.sql`
- Manually create profile:
  ```sql
  INSERT INTO user_profiles (id, email, full_name, role, created_at)
  SELECT id, email, raw_user_meta_data->>'full_name', 
         COALESCE(raw_user_meta_data->>'role', 'team_member'), NOW()
  FROM auth.users 
  WHERE email = 'your-email@example.com';
  ```

**Can't find the setting?**
- Path: Supabase Dashboard → Authentication → Settings
- Look for "Email" section
- Find "Enable email confirmations" toggle
- Make sure to click "Save" at the bottom

---

## Summary

The fastest way to fix this for development:

1. **Supabase Dashboard** → **Authentication** → **Settings**
2. **Uncheck** "Enable email confirmations"
3. **Save**
4. Sign up again
5. ✅ Should work!
