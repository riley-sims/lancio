import LocationSearchInput from '@/components/maps/LocationSearchInput';
import MapView from '@/components/maps/MapView';
import { Text } from '@/components/Themed';
import { useUserLocation } from '@/hooks/useUserLocation';
import { LocationSuggestion } from '@/lib/locationSearch';
import { mapHelpers } from '@/lib/mapbox';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { coords: userLocation, loading: loadingLocation } = useUserLocation();
  const [destination, setDestination] = useState('');
  const [destinationLocation, setDestinationLocation] = useState<LocationSuggestion | null>(null);
  const [stopA, setStopA] = useState('');
  const [stopALocation, setStopALocation] = useState<LocationSuggestion | null>(null);
  const [driveStyle, setDriveStyle] = useState("Let's have fun");
  const [friends, setFriends] = useState('');
  const [mapMarkers, setMapMarkers] = useState<Array<{ id: string; coordinates: [number, number]; title?: string }>>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-122.4194, 37.7749]); // San Francisco
  const [mapZoom, setMapZoom] = useState(12);
  const [route, setRoute] = useState<Array<[number, number]>>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const hasCenteredOnUser = useRef(false);

  // Center on user when we get first location and no destination yet
  useEffect(() => {
    if (userLocation && !hasCenteredOnUser.current && !destinationLocation) {
      hasCenteredOnUser.current = true;
      setMapCenter(userLocation);
      setMapZoom(14);
    }
  }, [userLocation, destinationLocation]);

  // Fetch route when locations change — start from your live location
  useEffect(() => {
    const fetchRoute = async () => {
      if (!destinationLocation) {
        setRoute([]);
        return;
      }

      setLoadingRoute(true);
      try {
        const start = userLocation || mapCenter;
        const end = destinationLocation.center;
        const waypoints = stopALocation ? [stopALocation.center] : undefined;

        const routeData = await mapHelpers.getRoute(start, end, waypoints, 'driving');
        setRoute(routeData.coordinates);
      } catch (error) {
        console.error('Error fetching route:', error);
        setRoute([]);
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [userLocation, destinationLocation, stopALocation, mapCenter]);

  // Handle destination selection (your location is shown via userLocation prop, not as a marker)
  const handleDestinationSelect = useCallback((location: LocationSuggestion) => {
    setDestinationLocation(location);
    setMapCenter(location.center);
    setMapZoom(14);

    const newMarkers = [{ id: 'destination', coordinates: location.center, title: location.name }];
    if (stopALocation) newMarkers.push({ id: 'stopA', coordinates: stopALocation.center, title: stopALocation.name });
    setMapMarkers(newMarkers);
  }, [stopALocation]);

  // Handle stop selection
  const handleStopASelect = useCallback((location: LocationSuggestion) => {
    setStopALocation(location);

    const newMarkers = [];
    if (destinationLocation) newMarkers.push({ id: 'destination', coordinates: destinationLocation.center, title: destinationLocation.name });
    newMarkers.push({ id: 'stopA', coordinates: location.center, title: location.name });
    setMapMarkers(newMarkers);
  }, [destinationLocation]);

  // Handle creating a drive
  const handleCreateDrive = () => {
    if (!destinationLocation) {
      // If no destination, navigate to create drive page
      router.push('/drives/create');
      return;
    }
    
    // Navigate to create drive with location data
    router.push({
      pathname: '/drives/create',
      params: {
        destination: destination,
        destinationCoords: JSON.stringify(destinationLocation.center),
        stopA: stopA || undefined,
        stopACoords: stopALocation ? JSON.stringify(stopALocation.center) : undefined,
      },
    });
  };

  const handleMapPress = (coordinates: [number, number]) => {
    // Optionally handle map taps
    console.log('Map pressed at:', coordinates);
  };

  return (
    <View style={styles.container}>
      {/* Map Section - Full Screen */}
      <View style={styles.mapContainer}>
        <MapView
          key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
          initialCenter={mapCenter}
          initialZoom={mapZoom}
          markers={mapMarkers}
          route={route}
          userLocation={userLocation}
          onMapPress={handleMapPress}
        />

        {/* Map Controls — center on your location */}
        <View style={[styles.mapControls, { top: insets.top + 10 }]}>
          <Pressable
            style={styles.mapControlButton}
            onPress={() => { if (userLocation) { setMapCenter(userLocation); setMapZoom(14); } }}
            disabled={loadingLocation || !userLocation}
          >
            {loadingLocation ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <FontAwesome name="location-arrow" size={18} color="#000" />
            )}
          </Pressable>
        </View>
        
        {/* Route Loading Indicator */}
        {loadingRoute && (
          <View style={[styles.loadingOverlay, { top: insets.top + 60 }]}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Calculating route...</Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Sheet Overlay */}
      <KeyboardAvoidingView 
        style={[styles.bottomSheetContainer, { bottom: 0 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          style={styles.bottomSheet}
          contentContainerStyle={styles.bottomSheetContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Where do you want to go? */}
          <View style={styles.inputSection}>
            <LocationSearchInput
              placeholder="Where do you want to go?"
              value={destination}
              onChangeText={setDestination}
              onLocationSelect={handleDestinationSelect}
              style={styles.searchInput}
            />
          </View>

          {/* Any stops? */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Any stops?</Text>
            <View style={styles.stopInputRow}>
              <LocationSearchInput
                placeholder="Stop A"
                value={stopA}
                onChangeText={setStopA}
                onLocationSelect={handleStopASelect}
                style={styles.stopInput}
              />
              <Pressable style={styles.addStopButton}>
                <FontAwesome name="plus" size={16} color="#fff" />
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
            <Pressable style={styles.dropdownButton}>
              <FontAwesome name="users" size={16} color="#666" style={styles.dropdownIcon} />
              <Text style={styles.dropdownText}>Add friends...</Text>
              <FontAwesome name="chevron-down" size={14} color="#666" />
            </Pressable>
          </View>

          {/* Create Drive Button */}
          <Pressable 
            style={[styles.createButton, !destinationLocation && styles.createButtonDisabled]}
            onPress={handleCreateDrive}
            disabled={!destinationLocation}
          >
            <Text style={styles.createButtonText}>
              {destinationLocation ? 'Continue to Create Drive' : 'Select a Destination'}
            </Text>
            {destinationLocation && (
              <FontAwesome name="arrow-right" size={16} color="#fff" style={styles.createButtonIcon} />
            )}
          </Pressable>
        </ScrollView>
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
  mapControls: {
    position: 'absolute',
    right: 16,
    zIndex: 5,
  },
  mapControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    maxHeight: '60%',
  },
  bottomSheet: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 80, // Extra padding to account for tab bar and ensure content is visible
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
  searchInput: {
    marginBottom: 0,
  },
  stopInput: {
    marginBottom: 0,
    flex: 1,
  },
  stopInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addStopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#004225',
    justifyContent: 'center',
    alignItems: 'center',
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
  dropdownIcon: {
    marginRight: 12,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  createButton: {
    backgroundColor: '#004225',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  createButtonIcon: {
    marginLeft: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});
