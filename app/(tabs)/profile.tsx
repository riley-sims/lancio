import { Text } from '@/components/Themed';
import { auth, db, friends, storage, supabase, vehicles as vehiclesHelper } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [recentDrives, setRecentDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    username: '',
    location: '',
  });
  const [friendsCount, setFriendsCount] = useState(112);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  // Load vehicles function (can be called independently)
  const loadVehicles = async (targetUserId?: string) => {
    const userIdToUse = targetUserId || userId;
    if (!userIdToUse) return;

    try {
      const { data: vehiclesData } = await vehiclesHelper.getVehicles(userIdToUse);
      if (vehiclesData && vehiclesData.length > 0) {
        setVehicles(vehiclesData);
      } else {
        setVehicles([]);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  // Reload vehicles when screen comes into focus (e.g., after adding a vehicle)
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadVehicles();
      }
    }, [userId])
  );

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
          setEditData({
            full_name: profileData?.full_name || profileData?.username || 'John Doe',
            username: profileData?.username || 'johndoe',
            location: profileData?.location || 'San Francisco, CA',
          });
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

        // Load vehicles
        await loadVehicles(user.id);

        // Load recent drives
        const { data: drivesData } = await db.getUserDrives(user.id);
        setRecentDrives((drivesData || []).slice(0, 3));

        // Load friends count
        const { data: friendsData } = await friends.getFriends(user.id);
        if (friendsData) {
          setFriendsCount(friendsData.length);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate inputs
    if (!editData.full_name || editData.full_name.trim() === '') {
      Alert.alert('Validation Error', 'Please enter your full name');
      return;
    }

    if (!editData.username || editData.username.trim() === '') {
      Alert.alert('Validation Error', 'Please enter a username');
      return;
    }

    // Remove @ symbol if user added it
    const cleanUsername = editData.username.replace('@', '').trim();
    if (cleanUsername === '') {
      Alert.alert('Validation Error', 'Please enter a valid username');
      return;
    }

    setSaving(true);
    
    try {
      // Get current user - try to use existing userId or fetch fresh
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user }, error: userError } = await auth.getCurrentUser();
        if (userError || !user) {
          Alert.alert('Error', 'Please log in to save your profile');
          setSaving(false);
          return;
        }
        currentUserId = user.id;
        setUserId(user.id);
      }
      
      // First check if profile exists
      const { data: existingProfile } = await db.getUserProfile(currentUserId);
      
      const updates = {
        full_name: editData.full_name.trim(),
        username: cleanUsername,
        location: editData.location.trim() || null,
      };

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await db.updateUserProfile(currentUserId, updates);
      } else {
        // Create new profile if it doesn't exist
        const { data, error } = await supabase
          .from('profiles')
          .insert([{
            id: currentUserId,
            ...updates,
          }])
          .select()
          .single();
        result = { data, error };
      }

      const { data, error } = result;

      if (error) {
        console.error('Profile update error:', error);
        let errorMessage = 'Failed to update profile';
        
        // Provide more specific error messages
        if (error.code === '23505') {
          errorMessage = 'Username already taken. Please choose another.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        Alert.alert('Error', errorMessage);
      } else {
        setProfile(data);
        setEditData({
          full_name: data?.full_name || '',
          username: data?.username || '',
          location: data?.location || '',
        });
        setIsEditing(false);
        // Reload profile to get fresh data
        await loadProfile();
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      full_name: profile?.full_name || profile?.username || 'John Doe',
      username: profile?.username || 'johndoe',
      location: profile?.location || 'San Francisco, CA',
    });
    setIsEditing(false);
  };

  const handleChangePhoto = () => {
    if (!userId) {
      Alert.alert('Error', 'Please sign in to update your profile picture.');
      return;
    }
    Alert.alert('Profile picture', 'Choose an option', [
      { text: 'Take Photo', onPress: () => pickImage('camera') },
      { text: 'Choose from Library', onPress: () => pickImage('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickImage = async (source: 'camera' | 'library') => {
    const opts = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1] as [number, number],
      quality: 0.8,
    };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);

    if (result.canceled || !result.assets[0]?.uri) return;

    setUploadingAvatar(true);
    try {
      const { path, error } = await storage.uploadAvatarFromUri(userId!, result.assets[0].uri);
      if (error) {
        console.error('Avatar upload error:', error);
        Alert.alert('Upload failed', 'Could not update profile picture. Check that the avatars bucket exists and RLS allows uploads.');
        return;
      }
      if (path) {
        const { error: updateErr } = await db.updateUserProfile(userId!, { avatar_url: path });
        if (updateErr) {
          Alert.alert('Update failed', 'Picture uploaded but profile could not be updated.');
          return;
        }
        await loadProfile();
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update profile picture.');
    } finally {
      setUploadingAvatar(false);
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
        <ActivityIndicator size="large" color="#004225" />
      </View>
    );
  }

  const avatarUrl = getAvatarUrl();
  const displayName = isEditing ? editData.full_name : (profile?.full_name || profile?.username || 'John Doe');
  const username = isEditing ? editData.username : (profile?.username || 'johndoe');
  const location = isEditing ? editData.location : (profile?.location || 'San Francisco, CA');

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { paddingTop: insets.top + 20 }]}>
          <View style={styles.avatarContainer}>
            <Pressable onPress={handleChangePhoto} disabled={uploadingAvatar} style={styles.avatarPressable}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <FontAwesome name="user" size={50} color="#fff" />
                </View>
              )}
              {uploadingAvatar && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
              {!uploadingAvatar && (
                <View style={styles.avatarEditBadge}>
                  <FontAwesome name="camera" size={14} color="#fff" />
                </View>
              )}
            </Pressable>
          </View>
          
          <View style={[styles.headerActions, { top: insets.top + 20 }]}>
            <Pressable 
              style={styles.actionButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <FontAwesome name={isEditing ? "times" : "cog"} size={20} color="#000" />
            </Pressable>
            <Pressable style={styles.actionButton}>
              <FontAwesome name="share" size={20} color="#000" />
            </Pressable>
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          {isEditing ? (
            <>
              <TextInput
                style={styles.editInput}
                value={editData.full_name}
                onChangeText={(text) => setEditData({ ...editData, full_name: text })}
                placeholder="Full Name"
              />
              <TextInput
                style={styles.editInput}
                value={editData.username}
                onChangeText={(text) => {
                  // Remove @ if user types it
                  const cleanText = text.replace('@', '').trim();
                  setEditData({ ...editData, username: cleanText });
                }}
                placeholder="Username (without @)"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={styles.editInput}
                value={editData.location}
                onChangeText={(text) => setEditData({ ...editData, location: text })}
                placeholder="Location"
              />
              <View style={styles.editActions}>
                <Pressable 
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </Pressable>
                <Pressable 
                  style={styles.cancelButton} 
                  onPress={handleCancel}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.username}>@{username}</Text>
              <View style={styles.locationRow}>
                <Text style={styles.location}>{location}</Text>
                <View style={styles.friendsCount}>
                  <FontAwesome name="users" size={14} color="#000" />
                  <Text style={styles.friendsCountText}>{friendsCount}</Text>
                </View>
              </View>
              
              {/* Social Icons */}
              <View style={styles.socialIcons}>
                <Pressable style={styles.socialIcon}>
                  <FontAwesome name="camera" size={18} color="#666" />
                </Pressable>
                <Pressable style={styles.socialIcon}>
                  <FontAwesome name="play" size={18} color="#666" />
                </Pressable>
                <Pressable style={styles.socialIcon}>
                  <FontAwesome name="comment" size={18} color="#666" />
                </Pressable>
                <Pressable style={styles.socialIcon}>
                  <FontAwesome name="users" size={18} color="#666" />
                </Pressable>
              </View>
            </>
          )}
        </View>

        {/* Drive Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Drive Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {stats?.total_miles ? stats.total_miles.toLocaleString().padStart(6, '0').replace(/(\d{2})(\d{3})/, '$1,$2') : '00,000'}
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
              <Text style={styles.statLabel}>Lancio Ranking</Text>
            </View>
          </View>
        </View>

        {/* My Garage */}
        <View style={styles.garageSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Garage ({vehicles.length})</Text>
            <Pressable 
              style={styles.addButton}
              onPress={() => router.push('/profile/vehicles/add')}
            >
              <FontAwesome name="plus" size={18} color="#004225" />
            </Pressable>
          </View>
          {vehicles.map((vehicle) => (
            <Pressable
              key={vehicle.id}
              style={styles.vehicleCard}
              onPress={() => router.push(`/profile/vehicle/${vehicle.id}`)}
            >
              <View style={styles.vehicleColorBadge}>
                <Text style={styles.vehicleColorText}>{vehicle.color}</Text>
              </View>
              <View style={styles.vehicleImagePlaceholder}>
                <FontAwesome name="car" size={32} color="#999" />
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleNickname}>{vehicle.nickname || 'Nickname'}</Text>
                <Text style={styles.vehicleName}>
                  {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.sub_model || vehicle.subModel}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Recent Drives */}
        <View style={styles.recentDrivesSection}>
          <Text style={styles.sectionTitle}>Recent Drives</Text>
          {recentDrives.length > 0 ? (
            recentDrives.map((drive) => (
              <Pressable
                key={drive.id}
                style={styles.driveCard}
                onPress={() => router.push(`/drives/${drive.id}/lobby`)}
              >
                <View style={styles.driveImagePlaceholder}>
                  <FontAwesome name="map-marker" size={24} color="#999" />
                </View>
                <View style={styles.driveInfo}>
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
                  <View style={styles.driveMeta}>
                    <Text style={styles.driveDate}>
                      {drive.start_time ? new Date(drive.start_time).toLocaleDateString() : '00/00/0000'}
                    </Text>
                    <Text style={styles.driveDistance}>000mi</Text>
                    <View style={styles.driveParticipants}>
                      <FontAwesome name="users" size={12} color="#666" />
                      <Text style={styles.driveParticipantsText}>XX</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent drives</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  avatarPressable: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#004225',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: '#004225',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#004225',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FAFAFA',
  },
  headerActions: {
    position: 'absolute',
    right: 20,
    flexDirection: 'column',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  friendsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  friendsCountText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  socialIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  socialIcon: {
    padding: 8,
  },
  editInput: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#000',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#004225',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    alignItems: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleColorBadge: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  vehicleColorText: {
    fontSize: 12,
    color: '#666',
  },
  vehicleImagePlaceholder: {
    width: 80,
    height: 60,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNickname: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 14,
    color: '#666',
  },
  recentDrivesSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  driveCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
  },
  driveImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driveInfo: {
    flex: 1,
  },
  driveTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  driveRoute: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  driveMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driveDate: {
    fontSize: 12,
    color: '#666',
  },
  driveDistance: {
    fontSize: 12,
    color: '#666',
  },
  driveParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  driveParticipantsText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
  },
});
