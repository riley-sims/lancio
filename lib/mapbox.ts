import Mapbox from '@rnmapbox/maps';

// Initialize Mapbox with your token
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

// Set access token if available
if (MAPBOX_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
} else {
  console.warn('⚠️ EXPO_PUBLIC_MAPBOX_TOKEN is not set. Mapbox features will not work.');
}

// Map configuration
export const mapConfig = {
  styleURL: Mapbox.StyleURL.Street, // Can be changed to Mapbox.StyleURL.Satellite, etc.
  zoomLevel: 10,
  centerCoordinate: [-122.4194, 37.7749], // Default to San Francisco, update as needed
};

// Helper functions for map operations
export const mapHelpers = {
  // Calculate route between points
  getRoute: async (start: [number, number], end: [number, number]) => {
    // Note: This requires Mapbox Directions API
    // For now, return a simple straight line
    // You'll need to implement the actual API call
    return {
      coordinates: [start, end],
      distance: 0,
      duration: 0,
    };
  },
  
  // Get current location
  getCurrentLocation: async () => {
    // This should use expo-location
    // Placeholder for now
    return {
      latitude: 37.7749,
      longitude: -122.4194,
    };
  },
  
  // Format coordinates for display
  formatCoordinates: (coords: [number, number]) => {
    return {
      latitude: coords[1],
      longitude: coords[0],
    };
  },
};

export default Mapbox;

