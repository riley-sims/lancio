import { StyleSheet, View, ScrollView, ActivityIndicator, Image, Pressable } from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { auth, db, storage } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [recentDrives, setRecentDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await auth.getCurrentUser();
      if (user) {
        setUserId(user.id);
        
        // Load profile
        const { data: profileData, error: profileError } = await db.getUserProfile(user.id);
        if (profileError) {
          console.error('Error loading profile:', profileError);
        } else {
          setProfile(profileData);
        }
        
        // Load stats
        const { data: statsData, error: statsError } = await db.getUserProfileWithStats(user.id);
        if (statsError) {
          console.error('Error loading stats:', statsError);
          setStats({
            total_miles: profileData?.total_miles || 0,
            drives_led: profileData?.drives_led || 0,
            events_joined: profileData?.events_joined || 0,
          });
        } else {
          setStats(statsData?.[0] || {
            total_miles: profileData?.total_miles || 0,
            drives_led: profileData?.drives_led || 0,
            events_joined: profileData?.events_joined || 0,
          });
        }

        // Load vehicles (mock for now)
        setVehicles([
          { id: '1', make: 'Make', model: 'Model', subModel: 'Sub-Model', year: '0000', color: 'Color Name' },
          { id: '2', make: 'Make', model: 'Model', subModel: 'Sub-Model', year: '0000', color: 'Color Name' },
        ]);

        // Load recent drives
        const { data: drivesData } = await db.getUserDrives(user.id);
        setRecentDrives((drivesData || []).slice(0, 3));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = () => {
    if (profile?.avatar_url) {
      return profile.avatar_url.startsWith('http')
        ? profile.avatar_url
        : storage.getPublicUrl('avatars', profile.avatar_url);
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const avatarUrl = getAvatarUrl();
  const displayName = profile?.full_name || profile?.username || 'John Doe';
  const username = profile?.username || 'johndoe';
  const location = profile?.location || 'San Francisco, CA';

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <FontAwesome name="user" size={40} color="#666" />
            </View>
          )}
          <View style={styles.avatarBorder} />
        </View>
        <Pressable style={styles.shareButton}>
          <FontAwesome name="share" size={20} color="#000" />
        </Pressable>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.username}>@{username}</Text>
        <Text style={styles.location}>{location}</Text>
        
        {/* Social Icons */}
        <View style={styles.socialIcons}>
          <FontAwesome name="camera" size={20} color="#666" />
          <FontAwesome name="video-camera" size={20} color="#666" />
          <FontAwesome name="map" size={20} color="#666" />
          <FontAwesome name="cog" size={20} color="#666" />
          <Text style={styles.friendsBadge}>2</Text>
        </View>
      </View>

      {/* Drive Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Drive Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats?.total_miles ? stats.total_miles.toLocaleString().padStart(5, '0') : '00,000'}
            </Text>
            <Text style={styles.statLabel}>Total Miles</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats?.drives_led ? stats.drives_led.toString().padStart(2, '0') : '00'}
            </Text>
            <Text style={styles.statLabel}>Drives Led</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats?.events_joined ? stats.events_joined.toString().padStart(2, '0') : '00'}
            </Text>
            <Text style={styles.statLabel}>Events Joined</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>#000</Text>
            <Text style={styles.statLabel}>Lance Ranking</Text>
          </View>
        </View>
      </View>

      {/* My Garage */}
      <View style={styles.garageSection}>
        <Text style={styles.sectionTitle}>My Garage ({vehicles.length})</Text>
        {vehicles.map((vehicle) => (
          <Pressable
            key={vehicle.id}
            style={styles.vehicleCard}
            onPress={() => router.push(`/profile/vehicle/${vehicle.id}`)}
          >
            <View style={styles.vehicleImagePlaceholder}>
              <FontAwesome name="car" size={40} color="#666" />
            </View>
            <View style={styles.vehicleInfo}>
              <View style={styles.colorBadge}>
                <Text style={styles.colorText}>{vehicle.color}</Text>
              </View>
              <Text style={styles.vehicleName}>
                {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.subModel}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Recent Drives */}
      <View style={styles.recentDrivesSection}>
        <Text style={styles.sectionTitle}>Recent Drives</Text>
        {recentDrives.map((drive) => (
          <Pressable
            key={drive.id}
            style={styles.driveCard}
            onPress={() => router.push(`/drives/${drive.id}/lobby`)}
          >
            <Text style={styles.driveTitle}>
              {drive.title || 'Drive Event Title'}
            </Text>
            <Text style={styles.driveRoute}>
              {typeof drive.start_location === 'string'
                ? drive.start_location
                : drive.start_location?.name || 'City, ST'} to{' '}
              {typeof drive.end_location === 'string'
                ? drive.end_location
                : drive.end_location?.name || 'City, ST'}
            </Text>
            <Text style={styles.driveDate}>
              {drive.start_time ? new Date(drive.start_time).toLocaleDateString() : '00/00/0000'} 0000
            </Text>
            <Text style={styles.driveDistance}>00mi</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
  },
  avatarBorder: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#4CAF50',
    top: -5,
    left: -5,
  },
  shareButton: {
    padding: 8,
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  socialIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    position: 'relative',
  },
  friendsBadge: {
    position: 'absolute',
    right: -8,
    top: -8,
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  garageSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleImagePlaceholder: {
    width: 80,
    height: 60,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  colorBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  colorText: {
    fontSize: 12,
    color: '#666',
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  recentDrivesSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  driveCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driveTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  driveRoute: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  driveDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  driveDistance: {
    fontSize: 12,
    color: '#666',
  },
});
