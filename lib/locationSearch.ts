// Location search using Mapbox Geocoding API
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

export interface LocationSuggestion {
  id: string;
  name: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  context?: Array<{ id: string; text: string }>;
}

export const locationSearch = {
  // Search for locations using Mapbox Geocoding API
  searchLocations: async (query: string, limit: number = 5): Promise<LocationSuggestion[]> => {
    if (!query || query.trim().length < 2) {
      return [];
    }

    if (!MAPBOX_TOKEN) {
      console.warn('Mapbox token not available for location search');
      return [];
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_TOKEN}&limit=${limit}&types=place,locality,neighborhood,address,poi`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Geocoding API request failed');
      }

      const data = await response.json();
      
      return (data.features || []).map((feature: any) => ({
        id: feature.id,
        name: feature.text,
        place_name: feature.place_name,
        center: feature.center,
        context: feature.context?.map((ctx: any) => ({
          id: ctx.id,
          text: ctx.text,
        })),
      }));
    } catch (error) {
      console.error('Location search error:', error);
      return [];
    }
  },

  // Reverse geocode: convert coordinates to address
  reverseGeocode: async (longitude: number, latitude: number): Promise<LocationSuggestion | null> => {
    if (!MAPBOX_TOKEN) {
      console.warn('Mapbox token not available for reverse geocoding');
      return null;
    }

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Reverse geocoding API request failed');
      }

      const data = await response.json();
      const feature = data.features?.[0];

      if (!feature) {
        return null;
      }

      return {
        id: feature.id,
        name: feature.text,
        place_name: feature.place_name,
        center: feature.center,
        context: feature.context?.map((ctx: any) => ({
          id: ctx.id,
          text: ctx.text,
        })),
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  },
};

