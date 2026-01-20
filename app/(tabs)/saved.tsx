import { Text } from '@/components/Themed';
import { auth, db } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function SavedScreen() {
  const router = useRouter();
  const [favoriteDrives, setFavoriteDrives] = useState<any[]>([]);
  const [recentDrives, setRecentDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'favorites' | 'recents'>('favorites');

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    try {
      const { data: { user } } = await auth.getCurrentUser();
      if (user) {
        // For now, show user's drives as saved
        // TODO: Add a saved/bookmarks table in Supabase
        const { data, error } = await db.getUserDrives(user.id);
        if (error) {
          console.error('Error loading saved:', error);
        } else {
          // Split into favorites and recents (mock for now)
          setFavoriteDrives((data || []).slice(0, 5));
          setRecentDrives((data || []).slice(5));
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

  const drives = activeSection === 'favorites' ? favoriteDrives : recentDrives;
  const sectionTitle = activeSection === 'favorites' 
    ? `Favorite Drives (${favoriteDrives.length})` 
    : `Recent Drives (${recentDrives.length})`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved + Recents</Text>
        <Pressable 
          style={styles.createDriveButton}
          onPress={() => router.push('/drives/create')}
        >
          <FontAwesome name="plus" size={14} color="#004225" />
          <Text style={styles.createDriveButtonText}>Create Drive</Text>
        </Pressable>
      </View>

      {drives.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome 
            name="map" 
            size={64} 
            color="#E0E0E0" 
          />
          <Text style={styles.emptyText}>
            No saved drives yet
          </Text>
          <Text style={styles.emptySubtext}>
            Create your first custom drive to get started!
          </Text>
          <Pressable 
            style={styles.emptyCreateButton}
            onPress={() => router.push('/drives/create')}
          >
            <Text style={styles.emptyCreateButtonText}>Create Drive</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {drives.map((drive) => (
            <Pressable
              key={drive.id}
              style={styles.driveCard}
              onPress={() => router.push(`/drives/${drive.id}/lobby`)}
            >
              <Text style={styles.driveNickname}>
                {drive.title || 'Drive Nickname'}
              </Text>
              <Text style={styles.driveRoute}>
                {typeof drive.start_location === 'string' 
                  ? drive.start_location 
                  : drive.start_location?.name || 'Location, ST'} to{' '}
                {typeof drive.end_location === 'string'
                  ? drive.end_location
                  : drive.end_location?.name || 'Location, ST'}
              </Text>
              <View style={styles.driveDetails}>
                <Text style={styles.driveDetail}>
                  {drive.stops || 0} Stops
                </Text>
                <Text style={styles.driveDetail}>0h 00m</Text>
                <Text style={styles.driveDetail}>000mi</Text>
                <FontAwesome name="map" size={16} color="#666" style={styles.mapIcon} />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  createDriveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  createDriveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004225',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  driveCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driveNickname: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  driveRoute: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  driveDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  driveDetail: {
    fontSize: 12,
    color: '#666',
  },
  mapIcon: {
    marginLeft: 'auto',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 24,
  },
  emptyCreateButton: {
    backgroundColor: '#004225',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyCreateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

