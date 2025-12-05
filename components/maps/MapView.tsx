import React from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox, { Camera, MapView as MapboxMapView } from '@rnmapbox/maps';
import { mapConfig } from '@/lib/mapbox';

interface MapViewProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  style?: any;
  children?: React.ReactNode;
}

export default function MapView({
  initialCenter = mapConfig.centerCoordinate,
  initialZoom = mapConfig.zoomLevel,
  style,
  children,
}: MapViewProps) {
  return (
    <View style={[styles.container, style]}>
      <MapboxMapView style={styles.map} styleURL={mapConfig.styleURL}>
        <Camera
          zoomLevel={initialZoom}
          centerCoordinate={initialCenter}
          animationMode="flyTo"
          animationDuration={2000}
        />
        {children}
      </MapboxMapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

