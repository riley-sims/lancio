import { Text } from '@/components/Themed';
import Calendar from '@/components/ui/Calendar';
import { db } from '@/lib/supabase';
import { formatDateTime } from '@/utils/helpers';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function ExploreScreen() {
  const router = useRouter();
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'events' | 'community'>('events');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    loadDrives();
  }, []);

  const loadDrives = async () => {
    try {
      const { data, error } = await db.getUpcomingDrives();
      if (error) {
        console.error('Error loading drives:', error);
      } else {
        setDrives(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    return drives.filter(drive => {
      const driveDate = new Date(drive.start_time);
      return (
        driveDate.getDate() === date.getDate() &&
        driveDate.getMonth() === date.getMonth() &&
        driveDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const calendarEvents = drives.map(drive => ({
    date: new Date(drive.start_time),
    count: 1,
  }));

  const filteredDrives = selectedTab === 'events' 
    ? drives.filter(d => new Date(d.start_time) >= new Date())
    : drives;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events + Drives</Text>
        <Pressable 
          style={styles.buildButton}
          onPress={() => router.push('/drives/create')}
        >
          <Text style={styles.buildButtonText}>Build a Drive</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, selectedTab === 'events' && styles.tabActive]}
          onPress={() => setSelectedTab('events')}
        >
          <Text style={[styles.tabText, selectedTab === 'events' && styles.tabTextActive]}>
            Upcoming Events
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, selectedTab === 'community' && styles.tabActive]}
          onPress={() => setSelectedTab('community')}
        >
          <Text style={[styles.tabText, selectedTab === 'community' && styles.tabTextActive]}>
            Community Drives
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Calendar */}
        <Calendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          events={calendarEvents}
        />

        {/* Events Section */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>
            {selectedTab === 'events' ? 'All Upcoming Events' : 'Community Drives'}
          </Text>

          {filteredDrives.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome name="road" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>
                {selectedTab === 'events' 
                  ? 'No upcoming events found' 
                  : 'No community drives found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {selectedTab === 'events'
                  ? 'Check back later or create your own drive!'
                  : 'Try adjusting your filters or search for a different location'}
              </Text>
              <Pressable 
                style={styles.emptyButton}
                onPress={() => router.push('/drives/create')}
              >
                <Text style={styles.emptyButtonText}>Create a Drive</Text>
              </Pressable>
            </View>
          ) : (
            filteredDrives.map((drive) => (
              <Pressable
                key={drive.id}
                style={styles.eventCard}
                onPress={() => router.push(`/drives/${drive.id}/lobby`)}
              >
                {/* Event Image Placeholder */}
                <View style={styles.eventImage}>
                  <FontAwesome name="road" size={40} color="#007AFF" />
                </View>
                
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <FontAwesome name="globe" size={14} color="#666" />
                    <Text style={styles.eventDate}>
                      {formatDateTime(drive.start_time)}
                    </Text>
                  </View>
                  
                  <Text style={styles.eventTitle}>{drive.title || 'Untitled Drive'}</Text>
                  
                  <Text style={styles.eventLocation}>
                    {drive.start_location?.name || 'Start'} → {drive.end_location?.name || 'End'}
                  </Text>
                  
                  <View style={styles.eventFooter}>
                    <Text style={styles.eventMeta}>
                      {drive.stops?.length || 0} stops
                    </Text>
                    <Text style={styles.eventMeta}>•</Text>
                    <Text style={styles.eventMeta}>2h 30m</Text>
                    <Text style={styles.eventMeta}>•</Text>
                    <FontAwesome name="users" size={12} color="#666" />
                    <Text style={styles.eventMeta}>
                      {drive.participants?.[0]?.count || 0}/{drive.max_participants || 35}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
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
  buildButton: {
    backgroundColor: '#004225',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buildButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FAFAFA',
  },
  tabActive: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  eventsSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    marginTop: 8,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventImage: {
    height: 150,
    backgroundColor: '#E8F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 12,
    color: '#666',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventMeta: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#004225',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
