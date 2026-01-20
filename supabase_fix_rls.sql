-- Fix RLS Policies for Profiles Table
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/nfaisyzhpzttuxmfbhot/sql

-- Step 1: Add missing columns if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Step 2: Drop existing INSERT policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Step 3: Create the INSERT policy - allows users to create their own profile
CREATE POLICY "Users can insert own profile" 
ON profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Step 4: Ensure SELECT and UPDATE policies exist
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" 
ON profiles 
FOR SELECT 
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

