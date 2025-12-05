# Environment Variables Template

Copy this to create your `.env` file:

```env
# ============================================
# CLIENT-SIDE VARIABLES (Safe to expose)
# ============================================

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Mapbox Configuration
EXPO_PUBLIC_MAPBOX_TOKEN=pk.your-mapbox-token-here

# Stripe Configuration (Optional)
EXPO_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your-stripe-key-here

# Expo Configuration
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id-here

# ============================================
# SERVER-SIDE VARIABLES (NEVER commit these!)
# ============================================
# These should be stored in Supabase Edge Function secrets
# or environment variables, NOT in your .env file

# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# STRIPE_SECRET_KEY=sk_test_your-secret-key
# STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
# ONESIGNAL_API_KEY=your-onesignal-key
# JWT_SECRET=your-jwt-secret
```

## How to Get Each Key

### EXPO_PUBLIC_SUPABASE_URL & EXPO_PUBLIC_SUPABASE_ANON_KEY
1. Go to https://supabase.com
2. Select your project
3. Go to Settings → API
4. Copy "Project URL" → `EXPO_PUBLIC_SUPABASE_URL`
5. Copy "anon public" key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### EXPO_PUBLIC_MAPBOX_TOKEN
1. Go to https://mapbox.com
2. Sign in and go to Account → Access tokens
3. Create a new token with scopes: `styles:read`, `tiles:read`, `fonts:read`
4. Copy token → `EXPO_PUBLIC_MAPBOX_TOKEN`

### EXPO_PUBLIC_STRIPE_PUBLIC_KEY
1. Go to https://stripe.com
2. Dashboard → Developers → API keys
3. Copy "Publishable key" → `EXPO_PUBLIC_STRIPE_PUBLIC_KEY`

### EXPO_PUBLIC_PROJECT_ID
1. Go to https://expo.dev
2. Select your project
3. Go to Settings
4. Copy "Project ID" → `EXPO_PUBLIC_PROJECT_ID`

## Security Reminders

- ✅ Client-side variables (EXPO_PUBLIC_*) are safe to expose
- ❌ Server-side keys should NEVER be in `.env` or committed to git
- 🔒 Store server keys in Supabase Edge Function secrets
- 📝 Add `.env` to `.gitignore` (already done)

