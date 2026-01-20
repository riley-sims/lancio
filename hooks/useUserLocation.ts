import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export type UserLocation = [number, number] | null;

export function useUserLocation(): {
  coords: UserLocation;
  loading: boolean;
  error: string | null;
} {
  const [coords, setCoords] = useState<UserLocation>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          setLoading(false);
          return;
        }

        // Get an initial position immediately so the "you" dot appears without waiting for first watch
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setCoords([loc.coords.longitude, loc.coords.latitude]);
        } catch {
          // continue; watch may still provide updates
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 3000,
            distanceInterval: 10,
          },
          (loc) => {
            const c: [number, number] = [loc.coords.longitude, loc.coords.latitude];
            setCoords(c);
            setError(null);
          },
          (err) => {
            setError(err ?? 'Location error');
          }
        );
        setLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to start location');
        setLoading(false);
      }
    })();

    return () => {
      subscription?.remove();
    };
  }, []);

  return { coords, loading, error };
}
