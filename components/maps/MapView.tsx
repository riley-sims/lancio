import { mapConfig } from '@/lib/mapbox';
import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Gracefully handle Mapbox imports
let Mapbox: any = null;
let Camera: any = null;
let MapboxMapView: any = null;
let PointAnnotation: any = null;
let ShapeSource: any = null;
let LineLayer: any = null;

try {
  const mapboxModule = require('@rnmapbox/maps');
  Mapbox = mapboxModule.default || mapboxModule;
  Camera = mapboxModule.Camera;
  MapboxMapView = mapboxModule.MapView;
  PointAnnotation = mapboxModule.PointAnnotation;
  ShapeSource = mapboxModule.ShapeSource;
  LineLayer = mapboxModule.LineLayer;
} catch (error) {
  console.warn('Mapbox native code not available. Map will show placeholder.');
}

interface MapViewProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  style?: any;
  children?: React.ReactNode;
  markers?: Array<{ id: string; coordinates: [number, number]; title?: string }>;
  onMarkerPress?: (markerId: string) => void;
  onMapPress?: (coordinates: [number, number]) => void;
  route?: Array<[number, number]>; // Route coordinates for driving directions
}

export default function MapView({
  initialCenter,
  initialZoom,
  style,
  children,
  markers = [],
  onMarkerPress,
  onMapPress,
  route,
}: MapViewProps) {
  const [isReady, setIsReady] = useState(false);
  const [center, setCenter] = useState<[number, number]>(
    initialCenter || (mapConfig.centerCoordinate as [number, number])
  );
  const [zoom, setZoom] = useState(initialZoom || mapConfig.zoomLevel);
  const cameraRef = useRef<any>(null);

  const mapboxToken = (process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '').trim();
  const hasValidToken = mapboxToken.length > 0 && mapboxToken.startsWith('pk.');

  useEffect(() => {
    if (hasValidToken && Mapbox) {
      try {
        Mapbox.setAccessToken(mapboxToken);
        setIsReady(true);
      } catch (error) {
        console.warn('Mapbox setAccessToken error:', error);
        setIsReady(false);
      }
    } else {
      if (!mapboxToken) {
        console.warn('EXPO_PUBLIC_MAPBOX_TOKEN is not set. Add a public token (pk.) to .env and rebuild.');
      } else if (!mapboxToken.startsWith('pk.')) {
        console.warn('EXPO_PUBLIC_MAPBOX_TOKEN must be a Mapbox public token (starts with pk.).');
      }
      setIsReady(false);
    }
  }, [hasValidToken]);

  // Update camera when initialCenter or initialZoom changes
  useEffect(() => {
    if (initialCenter) {
      setCenter(initialCenter);
    }
    if (initialZoom !== undefined) {
      setZoom(initialZoom);
    }
  }, [initialCenter, initialZoom]);

  // Update camera when markers or route change - fit bounds to show all points
  useEffect(() => {
    if (cameraRef.current && (markers.length > 0 || (route && route.length > 0))) {
      const allPoints: [number, number][] = [];
      
      // Add marker coordinates
      markers.forEach(marker => {
        allPoints.push(marker.coordinates);
      });
      
      // Add route coordinates
      if (route && route.length > 0) {
        allPoints.push(...route);
      }
      
      if (allPoints.length > 0) {
        // Calculate bounds
        const lons = allPoints.map(p => p[0]);
        const lats = allPoints.map(p => p[1]);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        
        // Center point
        const centerLon = (minLon + maxLon) / 2;
        const centerLat = (minLat + maxLat) / 2;
        
        setCenter([centerLon, centerLat]);
        
        // Calculate appropriate zoom level based on bounds
        const lonDiff = maxLon - minLon;
        const latDiff = maxLat - minLat;
        const maxDiff = Math.max(lonDiff, latDiff);
        
        let calculatedZoom = 14;
        if (maxDiff > 0.1) calculatedZoom = 10;
        else if (maxDiff > 0.05) calculatedZoom = 11;
        else if (maxDiff > 0.02) calculatedZoom = 12;
        else if (maxDiff > 0.01) calculatedZoom = 13;
        else calculatedZoom = 14;
        
        setZoom(calculatedZoom);
      }
    }
  }, [markers, route]);

  // Show placeholder when: missing native Mapbox, no valid token, or not ready
  if (!Mapbox || !MapboxMapView || !Camera || !isReady || !hasValidToken) {
    const isTokenIssue = Mapbox && MapboxMapView && Camera && !hasValidToken;
    return (
      <View style={[styles.container, style, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
        <FontAwesome name="map" size={48} color="#666" />
        <Text style={{ color: '#999', textAlign: 'center', marginTop: 16, fontSize: 14 }}>
          {isTokenIssue ? 'Mapbox token required' : 'Map requires native build'}
        </Text>
        <Text style={{ color: '#666', textAlign: 'center', marginTop: 8, fontSize: 12, paddingHorizontal: 40 }}>
          {isTokenIssue
            ? 'Add EXPO_PUBLIC_MAPBOX_TOKEN (pk.…) to .env and restart Metro.'
            : 'Run: npx expo run:ios or npx expo run:android'}
        </Text>
      </View>
    );
  }

  // Create route geometry for ShapeSource
  const routeGeometry = route && route.length > 0 ? {
    type: 'LineString' as const,
    coordinates: route,
  } : null;

  try {
    return (
      <View style={[styles.container, style]}>
        <MapboxMapView
          style={styles.map}
          styleURL={mapConfig.styleURL}
          onPress={(feature: any) => {
            if (onMapPress && feature?.geometry?.coordinates) {
              onMapPress(feature.geometry.coordinates as [number, number]);
            }
          }}
        >
          <Camera
            ref={cameraRef}
            zoomLevel={zoom}
            centerCoordinate={center}
            animationMode="flyTo"
            animationDuration={1000}
            key={`camera-${center[0]}-${center[1]}-${zoom}`}
          />
          
          {/* Route line */}
          {routeGeometry && ShapeSource && LineLayer && (
            <ShapeSource id="routeSource" shape={routeGeometry}>
              <LineLayer
                id="routeLayer"
                style={{
                  lineColor: '#007AFF',
                  lineWidth: 4,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </ShapeSource>
          )}
          
          {/* Markers */}
          {markers.map((marker) => (
            <PointAnnotation
              key={marker.id}
              id={marker.id}
              coordinate={marker.coordinates}
              onSelected={() => onMarkerPress?.(marker.id)}
            >
              <View style={styles.markerContainer}>
                <View style={styles.marker}>
                  <FontAwesome name="map-marker" size={24} color="#FF3B30" />
                </View>
              </View>
            </PointAnnotation>
          ))}
          {children}
        </MapboxMapView>
      </View>
    );
  } catch (error) {
    console.error('MapView render error:', error);
    return (
      <View style={[styles.container, style, { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#666', textAlign: 'center' }}>
          Map error. Please try again.
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

