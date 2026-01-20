import { Text } from '@/components/Themed';
import { auth, db } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    // Validation
    if (!email || !email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email');
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    if (!fullName || !fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name');
      return;
    }

    if (!username || !username.trim()) {
      Alert.alert('Validation Error', 'Please enter a username');
      return;
    }

    // Remove @ symbol if user added it
    const cleanUsername = username.replace('@', '').trim();
    if (cleanUsername === '') {
      Alert.alert('Validation Error', 'Please enter a valid username');
      return;
    }

    setLoading(true);

    try {
      // Validate Supabase configuration
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
        Alert.alert(
          'Configuration Error',
          'Supabase is not configured. Please check your environment variables.'
        );
        setLoading(false);
        return;
      }

      // Sign up the user
      const { data: authData, error: authError } = await auth.signUp(email.trim(), password);

      if (authError) {
        console.error('Sign up error:', authError);
        let errorMessage = 'Failed to create account';
        
        // Handle specific error types
        if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
          errorMessage = 'An account with this email already exists';
        } else if (authError.message?.includes('Network request failed') || authError.name === 'AuthRetryableFetchError') {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (authError.message?.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address';
        } else if (authError.message?.includes('Password')) {
          errorMessage = 'Password must be at least 6 characters';
        } else if (authError.message) {
          errorMessage = authError.message;
        }
        
        Alert.alert('Error', errorMessage);
        setLoading(false);
        return;
      }

      if (!authData?.user) {
        Alert.alert('Error', 'Failed to create account. Please try again.');
        setLoading(false);
        return;
      }

      // Try to create user profile
      // Note: This may fail if email confirmation is required and session isn't established yet
      const profileData = {
        full_name: fullName.trim(),
        username: cleanUsername,
        location: location.trim() || null,
      };

      // Wait a moment for session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if we have a session before creating profile
      const { data: { session } } = await auth.getSession();
      
      if (session) {
        // Session is available, try to create profile
        const { data: profile, error: profileError } = await db.createUserProfile(
          authData.user.id,
          profileData
        );

        if (profileError) {
          console.error('Profile creation error:', profileError);
          let errorMessage = 'Account created but failed to save profile';
          
          if (profileError.code === '23505') {
            errorMessage = 'Username already taken. Please choose another.';
          } else if (profileError.code === '42501') {
            errorMessage = 'Database security policy error. Please run the SQL fix in Supabase dashboard (see FIX_RLS_POLICY.md)';
            console.error('RLS Policy Error - Run the SQL in supabase_fix_rls.sql');
          } else if (profileError.message) {
            errorMessage = profileError.message;
          }
          
          Alert.alert('Warning', errorMessage);
          // Still allow them to continue - they can update profile later
        }
      } else {
        // No session yet (likely email confirmation required)
        // Profile will be created when they confirm email and sign in
        console.log('No session available yet - profile will be created on first login');
      }

      // Navigation will be handled by AuthContext
      // If email confirmation is required, user will need to confirm first
      if (session) {
        router.replace('/(tabs)');
      } else {
        Alert.alert(
          'Account Created',
          'Please check your email to confirm your account, then sign in.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="user" size={16} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="at" size={16} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location (Optional)</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="map-marker" size={16} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="City, State"
                placeholderTextColor="#999"
                value={location}
                onChangeText={setLocation}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="envelope" size={16} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="lock" size={16} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="lock" size={16} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>
          </View>

          <Pressable
            style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.signUpButtonText}>Create Account</Text>
            )}
          </Pressable>

          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/login')} disabled={loading}>
              <Text style={styles.loginLink}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  signUpButton: {
    backgroundColor: '#004225',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#004225',
    fontWeight: '600',
  },
});

