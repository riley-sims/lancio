import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user } = useAuth();
  return user ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}
