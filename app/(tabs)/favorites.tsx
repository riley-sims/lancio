import DriveCard from '@/components/cards/DriveCard';
import { Text } from '@/components/Themed';
import { auth, db } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

export default function FavoritesScreen() {
  const router = useRouter();
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const { data: { user } } = await auth.getCurrentUser();
      if (user) {
        setUserId(user.id);
        // For now, show user's drives as favorites
        // TODO: Add a favorites/bookmarks table in Supabase
        const { data, error } = await db.getUserDrives(user.id);
        if (error) {
          console.error('Error loading favorites:', error);
        } else {
          setDrives(data || []);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
      </View>

      {drives.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No favorite drives yet</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {drives.map((drive) => (
            <DriveCard
              key={drive.id}
              id={drive.id}
              title={drive.title || 'Untitled Drive'}
              startLocation={drive.start_location}
              endLocation={drive.end_location}
              startTime={drive.start_time}
              participants={drive.participants}
              onPress={() => router.push(`/drives/${drive.id}/lobby`)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

