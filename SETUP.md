# Quick Setup Guide

Follow these steps to get your Rally app running:

## Step 1: Get Your API Keys

### Supabase
1. Go to https://supabase.com and create a new project
2. Go to Settings → API
3. Copy:
   - Project URL → `EXPO_PUBLIC_SUPABASE_URL`
   - anon/public key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → Save this for Edge Functions (don't put in .env)

### Mapbox
1. Go to https://mapbox.com and create an account
2. Go to Account → Access tokens
3. Create a new token with scopes:
   - `styles:read`
   - `tiles:read`
   - `fonts:read`
   - `directions:read` (optional)
4. Copy token → `EXPO_PUBLIC_MAPBOX_TOKEN`

### Expo
1. Go to https://expo.dev and create an account
2. Create a new project or use existing
3. Get Project ID from dashboard → `EXPO_PUBLIC_PROJECT_ID`

### Stripe (Optional)
1. Go to https://stripe.com and create an account
2. Get publishable key from dashboard → `EXPO_PUBLIC_STRIPE_PUBLIC_KEY`

## Step 2: Create .env File

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then fill in your values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
EXPO_PUBLIC_STRIPE_PUBLIC_KEY=your-stripe-key
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

## Step 3: Update app.json

1. Replace `YOUR_MAPBOX_DOWNLOAD_TOKEN` in `app.json` with your Mapbox download token
2. Replace `YOUR_EXPO_PROJECT_ID` with your actual Expo project ID

## Step 4: Set Up Supabase Database

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drives table
CREATE TABLE drives (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_location JSONB NOT NULL,
  end_location JSONB NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drive participants
CREATE TABLE drive_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  drive_id UUID REFERENCES drives(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(drive_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_participants ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (customize as needed)
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view all drives" ON drives FOR SELECT USING (true);
CREATE POLICY "Users can create drives" ON drives FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can view all participants" ON drive_participants FOR SELECT USING (true);
CREATE POLICY "Users can join drives" ON drive_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Step 5: Create Storage Bucket

1. Go to Supabase → Storage
2. Create a new bucket named `drive-images`
3. Set it to public (or configure policies as needed)

## Step 6: Install and Run

```bash
# Install dependencies
npm install

# Start the app
npm start

# Then press:
# - i for iOS simulator
# - a for Android emulator
# - w for web browser
```

## Step 7: Test Authentication

1. Open the app
2. Try signing up with a test email
3. Check Supabase Auth dashboard to see the user

## Next Steps

- Customize the UI components in `/components`
- Add more screens in `/app`
- Create Edge Functions in `/supabase/functions`
- Set up push notifications
- Configure Stripe subscriptions

## Troubleshooting

**"Mapbox token invalid"**
- Check token has correct scopes
- Verify token is in `.env` as `EXPO_PUBLIC_MAPBOX_TOKEN`

**"Supabase connection failed"**
- Verify URL and anon key are correct
- Check Supabase project is active

**"Expo push token error"**
- Ensure `EXPO_PUBLIC_PROJECT_ID` is set
- Check you're logged into Expo CLI

