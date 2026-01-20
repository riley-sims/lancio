import MapView from '@/components/maps/MapView';
import { Text } from '@/components/Themed';
import { useUserLocation } from '@/hooks/useUserLocation';
import { auth, db, storage } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function DriveLobbyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { coords: userLocation } = useUserLocation();
  const [drive, setDrive] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadDrive();
    loadParticipants();
  }, [id]);

  const loadDrive = async () => {
    try {
      const { data, error } = await db.getDriveWithDetails(id);
      if (error) {
        console.error('Error loading drive:', error);
      } else {
        setDrive(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      const { data: { user } } = await auth.getCurrentUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await db.getDriveParticipants(id);
        if (error) {
          console.error('Error loading participants:', error);
        } else {
          setParticipants(data || []);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateStatus = async (participantId: string, newStatus: string) => {
    if (!userId) return;
    
    try {
      const { error } = await db.updateParticipantStatus(id, participantId, newStatus);
      if (error) {
        console.error('Error updating status:', error);
      } else {
        loadParticipants();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getParticipantStatus = (participant: any) => {
    if (participant.user_id === userId && participant.is_host) {
      return participant.status || 'ready';
    }
    return participant.status || 'waiting';
  };

  const isHost = drive?.creator_id === userId;
  const waitingCount = participants.filter(p => p.status === 'waiting').length;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!drive) {
    return (
      <View style={styles.container}>
        <Text>Drive not found</Text>
      </View>
    );
  }

  const startLocation = drive.start_location?.name || 'My Location';
  const endLocation = drive.end_location?.name || 'Destination';
  const stops = drive.stops || [];

  const isRegistered = participants.some(p => p.user_id === userId);
  const registeredDrivers = participants.filter(p => p.status === 'registered' || p.status === 'ready');

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={20} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Upcoming Events</Text>
        <Pressable style={styles.shareButton}>
          <FontAwesome name="share" size={20} color="#000" />
        </Pressable>
      </View>

      {/* Event Info */}
      <View style={styles.eventInfo}>
        <Text style={styles.eventDate}>
          {drive.start_time ? new Date(drive.start_time).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          }) : 'Monday, Month 1st'}
        </Text>
        <Text style={styles.eventTime}>
          {drive.start_time ? new Date(drive.start_time).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            timeZoneName: 'short'
          }) : '0:00'} PST
        </Text>
        <Text style={styles.eventTitle}>{drive.title || 'Event Name'}</Text>
        
        {/* Route Details */}
        <View style={styles.routeDetails}>
          <Text style={styles.routeDetail}>
            Start: {startLocation}
          </Text>
          {stops.map((stop: any, index: number) => (
            <Text key={stop.id} style={styles.routeDetail}>
              Stop {String.fromCharCode(65 + index)}: {stop.name || stop.location?.name || `Stop ${index + 1}`}
            </Text>
          ))}
          <Text style={styles.routeDetail}>
            End: {endLocation}
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryText}>{stops.length + 2} stops</Text>
          <Text style={styles.summaryText}>0h 00m</Text>
          <Text style={styles.summaryText}>XX</Text>
        </View>
      </View>

      {/* Registered Drivers */}
      <View style={styles.registeredSection}>
        <Text style={styles.sectionTitle}>Registered Drivers</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.driversScroll}>
          {registeredDrivers.map((participant) => {
            const user = participant.user;
            return (
              <View key={participant.id} style={styles.driverAvatar}>
                {user?.avatar_url ? (
                  <Image
                    source={{ uri: storage.getPublicUrl('avatars', user.avatar_url) }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <FontAwesome name="user" size={20} color="#fff" />
                  </View>
                )}
              </View>
            );
          })}
          {registeredDrivers.length === 0 && (
            <Text style={styles.noDrivers}>No registered drivers yet</Text>
          )}
        </ScrollView>
      </View>

      {/* Map — your location shown as blue dot */}
      <View style={styles.mapContainer}>
        <MapView
          initialCenter={userLocation ?? [-122.4194, 37.7749]}
          initialZoom={userLocation ? 14 : 10}
          style={styles.map}
          userLocation={userLocation}
        />
      </View>

      {/* Action Button */}
      <View style={styles.actionSection}>
        <Pressable
          style={[styles.actionButton, isRegistered && styles.actionButtonRegistered]}
          onPress={() => {
            if (!isRegistered) {
              // Register for event
              updateStatus(userId || '', 'registered');
            }
          }}
        >
          <Text style={[styles.actionButtonText, isRegistered && styles.actionButtonTextRegistered]}>
            {isRegistered ? 'Registered!' : 'Register now'}
          </Text>
        </Pressable>
      </View>

      {/* Icons */}
      <View style={styles.iconsSection}>
        <FontAwesome name="home" size={20} color="#666" />
        <FontAwesome name="map" size={20} color="#666" />
        <FontAwesome name="heart" size={20} color="#666" />
        <FontAwesome name="user" size={20} color="#666" />
      </View>

      {/* Old Route Details Card - Commented out for now */}
      {/* <View style={styles.routeCard}>
        <View style={styles.routeItem}>
          <View style={styles.routeIcon}>
            <FontAwesome name="paper-plane" size={16} color="#007AFF" />
          </View>
          <View style={styles.routeContent}>
            <Text style={styles.routeLabel}>STARTING FROM</Text>
            <Text style={styles.routeValue}>{startLocation}</Text>
          </View>
        </View>

        <View style={styles.routeItem}>
          <View style={[styles.routeIcon, { backgroundColor: '#8B4513' }]}>
            <FontAwesome name="flag" size={16} color="#fff" />
          </View>
          <View style={styles.routeContent}>
            <Text style={styles.routeLabel}>HEADING TO</Text>
            <Text style={styles.routeValue}>{endLocation}</Text>
          </View>
        </View>

        {stops.map((stop: any, index: number) => (
          <View key={stop.id} style={styles.routeItem}>
            <View style={[styles.routeIcon, { backgroundColor: '#007AFF' }]}>
              <FontAwesome name="map-marker" size={16} color="#fff" />
            </View>
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>STOP</Text>
              <Text style={styles.routeValue}>{stop.name || stop.location?.name || `Stop ${index + 1}`}</Text>
            </View>
          </View>
        ))}

        <View style={styles.routeOptions}>
          <Pressable style={styles.routeOption}>
            <FontAwesome name="leaf" size={16} color="#007AFF" />
            <Text style={styles.routeOptionText}>Fastest route</Text>
          </Pressable>
          <Pressable style={styles.routeOption}>
            <FontAwesome name="bars" size={16} color="#007AFF" />
            <Text style={styles.routeOptionText}>22 turn-by-turn cues</Text>
          </Pressable>
        </View>
      </View>

      {/* Lobby Status */}
      <View style={styles.lobbySection}>
        <View style={styles.lobbyHeader}>
          <Text style={styles.lobbyTitle}>Lobby status</Text>
          <Text style={styles.lobbyCount}>{waitingCount} waiting</Text>
        </View>

        {participants.map((participant) => {
          const user = participant.user;
          const isCurrentUser = participant.user_id === userId;
          const status = getParticipantStatus(participant);
          const isReady = status === 'ready';
          
          return (
            <View key={participant.id} style={styles.participantCard}>
              <View style={styles.participantInfo}>
                {user?.avatar_url ? (
                  <Image
                    source={{ uri: storage.getPublicUrl('avatars', user.avatar_url) }}
                    style={styles.participantAvatar}
                  />
                ) : (
                  <View style={styles.participantAvatar}>
                    <FontAwesome name="user" size={20} color="#666" />
                  </View>
                )}
                <View>
                  <Text style={styles.participantName}>
                    {isCurrentUser ? 'You (Host)' : user?.username || 'User'}
                  </Text>
                  <Text style={styles.participantUsername}>
                    @{user?.username || 'username'}
                  </Text>
                </View>
              </View>
              
              <Pressable
                style={[styles.statusButton, isReady && styles.statusButtonReady]}
                onPress={() => {
                  if (isCurrentUser || isHost) {
                    const newStatus = isReady ? 'waiting' : 'ready';
                    updateStatus(participant.user_id, newStatus);
                  }
                }}
              >
                <Text style={[styles.statusButtonText, isReady && styles.statusButtonTextReady]}>
                  {isReady ? 'Ready' : 'Waiting'}
                </Text>
                {!isReady && <FontAwesome name="clock-o" size={12} color="#666" style={{ marginLeft: 4 }} />}
              </Pressable>
            </View>
          );
        })}

        <Text style={styles.instructionText}>
          Tap a driver's status when they confirm they're in the lobby.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  shareButton: {
    padding: 8,
  },
  eventInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  routeDetails: {
    marginBottom: 12,
  },
  routeDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summary: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryText: {
    fontSize: 12,
    color: '#666',
  },
  registeredSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  driversScroll: {
    flexDirection: 'row',
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#004225',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#004225',
  },
  noDrivers: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  mapContainer: {
    height: 300,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonRegistered: {
    backgroundColor: '#004225',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextRegistered: {
    color: '#fff',
  },
  iconsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeContent: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  routeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  routeOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  routeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    flex: 1,
  },
  routeOptionText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
  },
  lobbySection: {
    padding: 16,
  },
  lobbyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  lobbyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  lobbyCount: {
    fontSize: 14,
    color: '#666',
  },
  participantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  participantUsername: {
    fontSize: 12,
    color: '#666',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  statusButtonReady: {
    backgroundColor: '#007AFF',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statusButtonTextReady: {
    color: '#fff',
  },
  instructionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

