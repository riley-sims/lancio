// Gracefully handle Mapbox import - it may not be available in Expo Go
let Mapbox: any = null;
try {
  Mapbox = require('@rnmapbox/maps');
  // Initialize Mapbox with your token
  const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';
  
  // Set access token if available
  if (MAPBOX_TOKEN && Mapbox) {
    Mapbox.setAccessToken(MAPBOX_TOKEN);
  } else {
    console.warn('⚠️ EXPO_PUBLIC_MAPBOX_TOKEN is not set. Mapbox features will not work.');
  }
} catch (error) {
  console.warn('⚠️ @rnmapbox/maps native code not available. Mapbox features will not work.');
  console.warn('⚠️ This is expected in Expo Go. You need a development build for Mapbox to work.');
}

// Map configuration
export const mapConfig = {
  styleURL: Mapbox?.StyleURL?.Street || 'mapbox://styles/mapbox/streets-v12', // Can be changed to Mapbox.StyleURL.Satellite, etc.
  zoomLevel: 10,
  centerCoordinate: [-122.4194, 37.7749], // Default to San Francisco, update as needed
};

// Helper functions for map operations
export const mapHelpers = {
  // Calculate route between points using Mapbox Directions API
  getRoute: async (
    start: [number, number], 
    end: [number, number],
    waypoints?: Array<[number, number]>,
    profile: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<{
    coordinates: Array<[number, number]>;
    distance: number;
    duration: number;
  }> => {
    const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';
    
    if (!MAPBOX_TOKEN) {
      console.warn('Mapbox token not available for routing');
      return {
        coordinates: [start, end],
        distance: 0,
        duration: 0,
      };
    }

    try {
      // Build coordinates string: start, waypoints, end
      const allPoints = [start];
      if (waypoints && waypoints.length > 0) {
        allPoints.push(...waypoints);
      }
      allPoints.push(end);
      
      const coordinates = allPoints.map(coord => `${coord[0]},${coord[1]}`).join(';');
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Directions API request failed');
      }
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((coord: number[]) => 
          [coord[0], coord[1]] as [number, number]
        );
        
        return {
          coordinates,
          distance: route.distance, // in meters
          duration: route.duration, // in seconds
        };
      }
      
      // Fallback to straight line
      return {
        coordinates: [start, end],
        distance: 0,
        duration: 0,
      };
    } catch (error) {
      console.error('Route calculation error:', error);
      // Fallback to straight line
      return {
        coordinates: [start, end],
        distance: 0,
        duration: 0,
      };
    }
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

