-- Add missing columns to vehicles (safe to run if columns already exist)
-- Run in Supabase: SQL Editor → New query → paste → Run
-- https://supabase.com/dashboard → your project → SQL Editor

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS sub_model TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS image_url TEXT;
