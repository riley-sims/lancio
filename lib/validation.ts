// Validation helper to check if all required environment variables are set
export const validateEnvironment = () => {
  const required = {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_MAPBOX_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
    EXPO_PUBLIC_PROJECT_ID: process.env.EXPO_PUBLIC_PROJECT_ID,
  };

  const missing: string[] = [];
  const present: string[] = [];

  Object.entries(required).forEach(([key, value]) => {
    if (value && value.length > 0) {
      present.push(key);
    } else {
      missing.push(key);
    }
  });

  return {
    isValid: missing.length === 0,
    missing,
    present,
  };
};

// Check on module load (for development)
if (__DEV__) {
  const validation = validateEnvironment();
  if (!validation.isValid) {
    console.warn('⚠️ Missing environment variables:', validation.missing);
  } else {
    console.log('✅ All environment variables are set');
  }
}

