-- Create Vehicles Table and RLS Policies
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/nfaisyzhpzttuxmfbhot/sql

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  sub_model TEXT,
  year TEXT NOT NULL,
  color TEXT,
  nickname TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicles
-- Users can view all vehicles (or change to only their own if preferred)
DROP POLICY IF EXISTS "Users can view all vehicles" ON vehicles;
CREATE POLICY "Users can view all vehicles" 
ON vehicles 
FOR SELECT 
TO authenticated
USING (true);

-- Users can insert their own vehicles
DROP POLICY IF EXISTS "Users can insert own vehicles" ON vehicles;
CREATE POLICY "Users can insert own vehicles" 
ON vehicles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own vehicles
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
CREATE POLICY "Users can update own vehicles" 
ON vehicles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own vehicles
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;
CREATE POLICY "Users can delete own vehicles" 
ON vehicles 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS vehicles_user_id_idx ON vehicles(user_id);

