# Fix RLS Policy Error for Signup

## Problem
You're getting this error when trying to sign up:
```
"new row violates row-level security policy for table \"profiles\""
```

## Solution

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/nfaisyzhpzttuxmfbhot/sql
2. Or: Dashboard → SQL Editor → New Query

### Step 2: Run the SQL Fix
Copy and paste the entire contents of `supabase_fix_rls.sql` into the SQL Editor and click "Run".

Or copy this SQL directly:

```sql
-- Add missing columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create the INSERT policy
CREATE POLICY "Users can insert own profile" 
ON profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Ensure SELECT policy exists
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" 
ON profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Ensure UPDATE policy exists
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### Step 3: Verify
1. Go to Database → Policies
2. Find the `profiles` table
3. You should see 3 policies:
   - "Users can view all profiles" (SELECT)
   - "Users can insert own profile" (INSERT) ← This is the new one
   - "Users can update own profile" (UPDATE)

### Step 4: Test
Try signing up again in your app. The error should be resolved!

## What This Does
- Adds `full_name` and `location` columns to the profiles table
- Creates an INSERT policy that allows authenticated users to create their own profile
- Ensures all necessary RLS policies are in place

