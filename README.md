# Rally App 🚗

A mobile-first group drive coordination app built with React Native (Expo), Supabase, Mapbox, and Stripe.

## 🚀 Tech Stack

- **Frontend**: React Native (Expo) with expo-router
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Maps**: Mapbox
- **Payments**: Stripe
- **Notifications**: Expo Notifications
- **Language**: TypeScript

## 📋 Prerequisites

Before you begin, you'll need accounts and API keys for:

1. **Expo Account** - [expo.dev](https://expo.dev)
2. **Supabase Project** - [supabase.com](https://supabase.com)
3. **Mapbox Account** - [mapbox.com](https://mapbox.com)
4. **Stripe Account** - [stripe.com](https://stripe.com) (optional for MVP)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Client-side (safe to expose in app)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
EXPO_PUBLIC_STRIPE_PUBLIC_KEY=your_stripe_public_key

# Expo Configuration
EXPO_PUBLIC_PROJECT_ID=your_expo_project_id
```

**Note**: Server-side keys (SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, etc.) should be stored in Supabase Edge Functions secrets, not in your `.env` file.

### 3. Supabase Setup

#### Create Your Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key to `.env`
3. Create a storage bucket named `drive-images` for media uploads

#### Database Schema

You'll need to create tables for:
- `profiles` - User profiles
- `drives` - Group drive events
- `drive_participants` - Many-to-many relationship
- `notifications` - Push notification tokens

Example migration (run in Supabase SQL Editor):

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

-- Drive participants table
CREATE TABLE drive_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  drive_id UUID REFERENCES drives(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(drive_id, user_id)
);
```

#### Supabase Edge Functions

Deploy functions to handle server-side logic:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy a function
supabase functions deploy function-name
```

### 4. Mapbox Setup

1. Create a Mapbox account at [mapbox.com](https://mapbox.com)
2. Create an access token with these scopes:
   - `styles:read`
   - `tiles:read`
   - `fonts:read`
   - `directions:read` (optional, for routing)
3. Add your token to `.env` as `EXPO_PUBLIC_MAPBOX_TOKEN`
4. Update `app.json` with your Mapbox download token (for native builds)

### 5. Expo Setup

1. Create an Expo account at [expo.dev](https://expo.dev)
2. Create a new project or link existing one:
   ```bash
   npx expo login
   npx expo init --template blank-typescript
   ```
3. Get your project ID from `app.json` or expo.dev dashboard
4. Add `EXPO_PUBLIC_PROJECT_ID` to `.env`

### 6. Stripe Setup (Optional for MVP)

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your publishable key from the dashboard
3. Add to `.env` as `EXPO_PUBLIC_STRIPE_PUBLIC_KEY`
4. Create price IDs for subscriptions:
   - Basic Monthly
   - Pro Monthly
5. Update `lib/stripe.ts` with your price IDs

## 🏃 Running the App

### Development

```bash
# Start the Expo dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 📁 Project Structure

```
/app
  - (tabs)/          # Tab navigation screens
    - index.tsx      # Home screen
    - drives.tsx     # Drives list
    - explore.tsx    # Explore/map view
    - profile.tsx    # User profile
  - drives/          # Drive detail screens
  - explore/         # Explore screens
  - profile/         # Profile screens

/lib
  - supabase.ts      # Supabase client & helpers
  - mapbox.ts        # Mapbox configuration
  - stripe.ts        # Stripe helpers

/components
  - ui/              # Reusable UI components
  - maps/            # Map components
  - cards/           # Card components

/utils
  - notifications.ts # Push notification helpers
  - helpers.ts       # General utilities

/supabase
  - functions/       # Edge Functions
  - migrations/      # Database migrations
```

## 🔐 Security Notes

- **Never commit** `.env` files or server-side keys
- Store sensitive keys in Supabase Edge Function secrets
- Use Row Level Security (RLS) policies in Supabase
- Validate all user inputs on the server side

## 📱 Features

- ✅ User authentication (Supabase Auth)
- ✅ Group drive creation and management
- ✅ Real-time location tracking
- ✅ Push notifications
- ✅ Map integration (Mapbox)
- 🔄 Subscription management (Stripe)
- 🔄 Chat during drives
- 🔄 Drive history

## 🐛 Troubleshooting

### Mapbox not loading
- Verify your token has the correct scopes
- Check that `EXPO_PUBLIC_MAPBOX_TOKEN` is set correctly
- For native builds, ensure download token is in `app.json`

### Supabase connection issues
- Verify your URL and anon key
- Check network connectivity
- Ensure RLS policies allow your operations

### Push notifications not working
- Request permissions on app launch
- Verify `EXPO_PUBLIC_PROJECT_ID` is set
- Check device notification settings

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Mapbox Documentation](https://docs.mapbox.com)
- [Stripe React Native](https://stripe.dev/stripe-react-native)

## 📄 License

MIT

