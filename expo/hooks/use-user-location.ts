import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

export interface Coords {
  latitude: number;
  longitude: number;
}

/**
 * Real device coordinates for cupid distance filtering.
 *
 * Web: silently auto-detects via browser geolocation (same pattern as
 * use-places-search — the browser shows the permission prompt).
 *
 * Native: never auto-requests on mount. expo-location auto-detection on
 * mount crashes the cloud simulator with an opaque {} error because it
 * tries to talk to hardware that doesn't exist. Call requestLocation()
 * from a user action (e.g. saving cupid preferences) to prompt instead.
 */
export function useUserLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || !('geolocation' in navigator)) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        if (!cancelled) setLocationError('Location unavailable');
      },
      { timeout: 15000, enableHighAccuracy: false, maximumAge: 300000 }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const requestLocation = useCallback(async (): Promise<Coords | null> => {
    setIsRequesting(true);
    try {
      if (Platform.OS === 'web') {
        return await new Promise<Coords | null>((resolve) => {
          if (!('geolocation' in navigator)) {
            resolve(null);
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const c: Coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              setCoords(c);
              setLocationError(null);
              resolve(c);
            },
            () => resolve(null),
            { timeout: 15000, enableHighAccuracy: false, maximumAge: 300000 }
          );
        });
      }
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return null;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const c: Coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCoords(c);
      setLocationError(null);
      return c;
    } catch (error) {
      console.log('[UserLocation] request failed:', error);
      setLocationError('Failed to get location');
      return null;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  return { coords, locationError, isRequesting, requestLocation };
}
