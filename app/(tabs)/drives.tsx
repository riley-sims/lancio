import { StyleSheet, View, ScrollView, Pressable, TextInput } from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import DriveCard from '@/components/cards/DriveCard';

export default function DrivesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'community'>('upcoming');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchCity, setSearchCity] = useState('');
  const [maxDistance, setMaxDistance] = useState('');

  const handleBuildDrive = () => {
    router.push('/drives/create');
  };

  // Mock data - replace with actual data from Supabase
  const upcomingEvents = [
    {
      id: '1',
      title: 'Event Name',
      startLocation: 'Location, ST',
      endLocation: 'Location, ST',
      date: 'Monday, Month 1st',
      time: '0:00 PST',
      stops: 3,
      duration: '0h 00m',
      distance: 'XX',
    },
  ];

  const communityDrives = [
    {
      id: '1',
      title: 'Event Name',
      startLocation: 'Location, ST',
      endLocation: 'Location, ST',
      date: 'Monday, Month 1st',
      time: '0:00 PST',
      stops: 3,
      duration: '0h 00m',
      distance: 'XX',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events + Drives</Text>
        <Pressable style={styles.buildButton} onPress={handleBuildDrive}>
          <Text style={styles.buildButtonText}>Build a Drive</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming Events
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'community' && styles.tabActive]}
          onPress={() => setActiveTab('community')}
        >
          <Text style={[styles.tabText, activeTab === 'community' && styles.tabTextActive]}>
            Community Drives
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView}>
        {activeTab === 'community' && (
          <>
            {/* Search and Filter */}
            <View style={styles.searchSection}>
              <View style={styles.searchInputContainer}>
                <FontAwesome name="search" size={16} color="#666" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Your City, State or ZIP code"
                  placeholderTextColor="#999"
                  value={searchCity}
                  onChangeText={setSearchCity}
                />
              </View>
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Max distance from start (mi)"
                  placeholderTextColor="#999"
                  value={maxDistance}
                  onChangeText={setMaxDistance}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Calendar */}
            <View style={styles.calendarSection}>
              <Text style={styles.calendarTitle}>September</Text>
              <View style={styles.calendarGrid}>
                {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                  <Pressable
                    key={day}
                    style={[
                      styles.calendarDay,
                      day === 1 && styles.calendarDayActive,
                    ]}
                    onPress={() => setSelectedDate(new Date(2024, 8, day))}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        day === 1 && styles.calendarDayTextActive,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Events List */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'upcoming'
              ? 'Upcoming Events'
              : `All Community Drives`}
          </Text>
          {(activeTab === 'upcoming' ? upcomingEvents : communityDrives).map((event) => (
            <Pressable
              key={event.id}
              onPress={() => router.push(`/drives/${event.id}/lobby`)}
            >
              <View style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventDate}>{event.date}</Text>
                  <Text style={styles.eventTime}>{event.time}</Text>
                </View>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventRoute}>
                  {event.startLocation} to {event.endLocation}
                </Text>
                <View style={styles.eventDetails}>
                  <Text style={styles.eventDetail}>{event.stops} stops</Text>
                  <Text style={styles.eventDetail}>{event.duration}</Text>
                  <Text style={styles.eventDetail}>{event.distance}</Text>
                </View>
                <View style={styles.eventIcons}>
                  <FontAwesome name="home" size={16} color="#666" />
                  <FontAwesome name="map" size={16} color="#666" />
                  <FontAwesome name="heart" size={16} color="#666" />
                  <FontAwesome name="user" size={16} color="#666" />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  buildButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  tabActive: {
    backgroundColor: '#4CAF50',
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
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  calendarSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarDay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayActive: {
    backgroundColor: '#4CAF50',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#000',
  },
  calendarDayTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  eventsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  eventRoute: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  eventDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  eventDetail: {
    fontSize: 12,
    color: '#666',
  },
  eventIcons: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});
