-- Seed 2 test friends for development and testing
-- Run in Supabase SQL Editor: https://supabase.com/dashboard → Your project → SQL Editor
--
-- 1. Get your user ID: Supabase Dashboard → Authentication → Users → copy your UUID
-- 2. Replace YOUR_USER_ID in this file with that UUID (e.g. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
-- 3. Run the script

-- Test friend 1: Alex Rivera
-- Test friend 2: Jordan Lee

-- Insert or update 2 test profiles
INSERT INTO profiles (id, username, full_name, location)
VALUES
  ('11111111-1111-4111-a111-111111111101', 'alexrivera', 'Alex Rivera', 'Austin, TX'),
  ('22222222-2222-4222-a222-222222222202', 'jordanlee', 'Jordan Lee', 'Denver, CO')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  location = EXCLUDED.location;

-- Link them as your friends (you see them in "My Driving Pals", "Who's coming?", etc.)
-- Run once; if you get duplicate-key errors, the rows already exist.
INSERT INTO friends (user_id, friend_id, status)
VALUES
  ('YOUR_USER_ID', '11111111-1111-4111-a111-111111111101', 'accepted'),
  ('11111111-1111-4111-a111-111111111101', 'YOUR_USER_ID', 'accepted'),
  ('YOUR_USER_ID', '22222222-2222-4222-a222-222222222202', 'accepted'),
  ('22222222-2222-4222-a222-222222222202', 'YOUR_USER_ID', 'accepted');

-- Note: These test friends are profile-only. They show in your friends list and you can
-- message them or add them to drives. They cannot log in unless you create Auth users
-- in Supabase with the same IDs (11111111-1111-4111-a111-111111111101 and
-- 22222222-2222-4222-a222-222222222202).
