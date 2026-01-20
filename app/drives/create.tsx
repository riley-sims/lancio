import MapView from '@/components/maps/MapView';
import { Text } from '@/components/Themed';
import { useUserLocation } from '@/hooks/useUserLocation';
import { auth, db, friends as friendsHelper } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

export default function CreateDriveScreen() {
  const router = useRouter();
  const { coords: userLocation } = useUserLocation();
  const [destination, setDestination] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [stopInput, setStopInput] = useState('');
  const [driveStyle, setDriveStyle] = useState('Fastest route');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFriends, setShowFriends] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const { data: { user } } = await auth.getCurrentUser();
      if (user) {
        const { data, error } = await friendsHelper.getFriends(user.id);
        if (error) {
          console.error('Error loading friends:', error);
        } else {
          setFriends(data || []);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addStop = () => {
    if (stopInput.trim()) {
      setStops([...stops, stopInput.trim()]);
      setStopInput('');
    }
  };

  const removeStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const toggleFriend = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const createDrive = async () => {
    if (!destination.trim()) {
      alert('Please enter a destination');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await auth.getCurrentUser();
      if (!user) {
        alert('Please sign in to create a drive');
        return;
      }

      // Create drive data — use your live location as start when available
      const startCoords = userLocation ? [userLocation[0], userLocation[1]] : [0, 0];
      const driveData = {
        creator_id: user.id,
        title: `Drive to ${destination}`,
        description: '',
        start_location: { name: 'My Location', coordinates: startCoords },
        end_location: { name: destination, coordinates: [0, 0] }, // TODO: Geocode destination
        start_time: new Date().toISOString(),
        max_participants: 35,
      };

      const { data: drive, error: driveError } = await db.createDrive(driveData);
      
      if (driveError) {
        console.error('Error creating drive:', driveError);
        alert('Failed to create drive');
        return;
      }

      // Add stops
      if (stops.length > 0 && drive) {
        for (let i = 0; i < stops.length; i++) {
          await db.addDriveStop(drive.id, {
            stop_order: i + 1,
            location: { name: stops[i], coordinates: [0, 0] },
            name: stops[i],
          });
        }
      }

      // Navigate to lobby
      router.push(`/drives/${drive.id}/lobby`);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create drive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map View — your location shown as blue dot for building routes from you */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialCenter={userLocation ?? undefined}
          initialZoom={userLocation ? 14 : 10}
          userLocation={userLocation}
        />
      </View>

      {/* Bottom Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bottomSheet}
      >
        <View style={styles.dragHandle} />
        
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Destination */}
          <View style={styles.section}>
            <Text style={styles.label}>Where do you want to go?</Text>
            <View style={styles.searchContainer}>
              <FontAwesome name="search" size={16} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="San Francisco, California, United"
                value={destination}
                onChangeText={setDestination}
              />
            </View>
          </View>

          {/* Stops */}
          <View style={styles.section}>
            <Text style={styles.label}>Any stops?</Text>
            {stops.map((stop, index) => (
              <View key={index} style={styles.stopItem}>
                <Text style={styles.stopText}>{stop}</Text>
                <Pressable onPress={() => removeStop(index)}>
                  <FontAwesome name="times" size={16} color="#666" />
                </Pressable>
              </View>
            ))}
            <View style={styles.searchContainer}>
              <FontAwesome name="search" size={16} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={stops.length === 0 ? "Stop A" : `Stop ${stops.length + 1}`}
                value={stopInput}
                onChangeText={setStopInput}
                onSubmitEditing={addStop}
              />
              <Pressable onPress={addStop} style={styles.addButton}>
                <FontAwesome name="plus" size={16} color="#007AFF" />
              </Pressable>
            </View>
          </View>

          {/* Drive Style */}
          <View style={styles.section}>
            <Text style={styles.label}>Drive style?</Text>
            <Pressable style={styles.dropdown}>
              <Text style={styles.dropdownText}>{driveStyle}</Text>
              <FontAwesome name="chevron-down" size={14} color="#666" />
            </Pressable>
          </View>

          {/* Who's Coming */}
          <View style={styles.section}>
            <Pressable
              style={styles.sectionHeader}
              onPress={() => setShowFriends(!showFriends)}
            >
              <Text style={styles.label}>Who's coming?</Text>
              <FontAwesome
                name={showFriends ? "chevron-up" : "chevron-down"}
                size={14}
                color="#666"
              />
            </Pressable>
            
            {showFriends && (
              <View style={styles.friendsList}>
                {friends.length === 0 ? (
                  <Text style={styles.emptyText}>No friends yet</Text>
                ) : (
                  friends.map((friend) => {
                    const friendData = friend.friend || friend.user;
                    const isSelected = selectedFriends.includes(friendData.id);
                    
                    return (
                      <Pressable
                        key={friendData.id}
                        style={styles.friendItem}
                        onPress={() => toggleFriend(friendData.id)}
                      >
                        <View style={styles.friendInfo}>
                          <View style={styles.friendAvatar}>
                            <FontAwesome name="user" size={20} color="#666" />
                          </View>
                          <View>
                            <Text style={styles.friendName}>{friendData.username || 'Friend'}</Text>
                            <Text style={styles.friendLocation}>{friendData.location || ''}</Text>
                          </View>
                        </View>
                        {isSelected ? (
                          <FontAwesome name="check-circle" size={24} color="#007AFF" />
                        ) : (
                          <FontAwesome name="plus-circle" size={24} color="#007AFF" />
                        )}
                      </Pressable>
                    );
                  })
                )}
              </View>
            )}
          </View>

          {/* Create Button */}
          <Pressable
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={createDrive}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Create Drive'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mapContainer: {
    height: '50%',
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    height: '50%',
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    padding: 8,
  },
  stopItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  stopText: {
    fontSize: 14,
    color: '#000',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
  },
  friendsList: {
    marginTop: 12,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  friendLocation: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

