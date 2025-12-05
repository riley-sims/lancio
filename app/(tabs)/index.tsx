import { StyleSheet, View, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import MapView from '@/components/maps/MapView';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [destination, setDestination] = useState('');
  const [stopA, setStopA] = useState('');
  const [driveStyle, setDriveStyle] = useState("Let's have fun");
  const [friends, setFriends] = useState('');

  const handleSearch = () => {
    // Navigate to drives/events screen or create drive
    router.push('/drives/create');
  };

  return (
    <View style={styles.container}>
      {/* Map Section - Full Screen */}
      <View style={styles.mapContainer}>
        <MapView 
          initialCenter={[-122.4194, 37.7749]} // San Francisco
          initialZoom={12}
        />
      </View>

      {/* Bottom Sheet Overlay */}
      <KeyboardAvoidingView 
        style={[styles.bottomSheetContainer, { bottom: 60 + insets.bottom }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.bottomSheet}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Where do you want to go? */}
          <View style={styles.inputSection}>
            <View style={styles.searchInputContainer}>
              <FontAwesome name="search" size={16} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Where do you want to go?"
                placeholderTextColor="#999"
                value={destination}
                onChangeText={setDestination}
                onFocus={handleSearch}
              />
            </View>
          </View>

          {/* Any stops? */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Any stops?</Text>
            <View style={styles.inputRow}>
              <View style={styles.searchInputContainer}>
                <FontAwesome name="search" size={16} color="#666" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Stop A"
                  placeholderTextColor="#999"
                  value={stopA}
                  onChangeText={setStopA}
                />
              </View>
              <Pressable style={styles.addButton}>
                <FontAwesome name="plus" size={16} color="#000" />
              </Pressable>
            </View>
          </View>

          {/* Drive style? */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Drive style?</Text>
            <Pressable style={styles.dropdownButton}>
              <Text style={styles.dropdownText}>{driveStyle}</Text>
              <FontAwesome name="chevron-down" size={14} color="#666" />
            </Pressable>
          </View>

          {/* Who's coming? */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Who's coming?</Text>
            <View style={styles.inputRow}>
              <View style={styles.searchInputContainer}>
                <FontAwesome name="users" size={16} color="#666" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Add friends..."
                  placeholderTextColor="#999"
                  value={friends}
                  onChangeText={setFriends}
                />
              </View>
              <Pressable style={styles.addButton}>
                <FontAwesome name="plus" size={16} color="#000" />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
  },
});
