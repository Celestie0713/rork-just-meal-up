import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { GooglePlacesService } from '@/services/google-places';
import type { Place } from '@/types/place';

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | 'undetermined' | null>(null);
  const [hasLoadedInitialPlaces, setHasLoadedInitialPlaces] = useState(false);

  const searchNearbyPlaces = useCallback(async (
    latitude: number,
    longitude: number,
    radius: number = 1500,
    type: string = 'restaurant'
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await GooglePlacesService.searchNearby(latitude, longitude, radius, type);
      setPlaces(results);
    } catch (error) {
      console.error('Error searching nearby places:', error);
      setError('Failed to search nearby places');
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    try {
      console.log('Requesting location permission...');
      
      // For web, we need to handle it differently
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          setError('Geolocation is not supported by this browser');
          setLocationPermission(Location.PermissionStatus.DENIED);
          return;
        }
        
        // Use browser's geolocation API
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Web location obtained:', position);
            const locationObject = {
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                altitude: position.coords.altitude,
                accuracy: position.coords.accuracy,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
              },
              timestamp: position.timestamp,
            };
            setLocation(locationObject);
            setLocationPermission(Location.PermissionStatus.GRANTED);
          },
          (error) => {
            console.error('Web geolocation error:', error);
            setLocationPermission(Location.PermissionStatus.DENIED);
            setError('Location access denied or unavailable');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      } else {
        // Native platforms
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('Location permission status:', status);
        setLocationPermission(status);
        
        if (status === 'granted') {
          console.log('Getting current position...');
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          console.log('Current location obtained:', currentLocation);
          setLocation(currentLocation);
        } else {
          console.log('Location permission denied');
          setError('Location permission is required to find nearby places');
        }
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setError('Failed to get location permission');
      setLocationPermission(Location.PermissionStatus.DENIED);
    }
  }, []);

  // Load initial places when location is available
  useEffect(() => {
    if (location && !hasLoadedInitialPlaces) {
      searchNearbyPlaces(location.coords.latitude, location.coords.longitude);
      setHasLoadedInitialPlaces(true);
    }
  }, [location, hasLoadedInitialPlaces, searchNearbyPlaces]);

  // Check initial permission status
  useEffect(() => {
    const checkInitialPermission = async () => {
      try {
        console.log('Checking initial permission status...');
        if (Platform.OS === 'web') {
          // For web, we'll check when user explicitly requests
          console.log('Web platform detected, setting permission to undetermined');
          setLocationPermission('undetermined');
        } else {
          const { status } = await Location.getForegroundPermissionsAsync();
          console.log('Initial permission status:', status);
          setLocationPermission(status);
          
          if (status === 'granted') {
            console.log('Permission already granted, getting location...');
            const currentLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            console.log('Initial location obtained:', currentLocation);
            setLocation(currentLocation);
          }
        }
      } catch (error) {
        console.error('Error checking initial permission:', error);
        setLocationPermission(Location.PermissionStatus.DENIED);
      }
    };
    
    checkInitialPermission();
  }, []);



  const searchPlacesByText = useCallback(async (query: string) => {
    if (!query.trim()) {
      if (location) {
        searchNearbyPlaces(location.coords.latitude, location.coords.longitude);
      }
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const results = await GooglePlacesService.searchByText(
        query,
        location?.coords.latitude,
        location?.coords.longitude
      );
      setPlaces(results);
    } catch (error) {
      console.error('Error searching places by text:', error);
      setError('Failed to search places');
    } finally {
      setLoading(false);
    }
  }, [location, searchNearbyPlaces]);

  const refreshNearbyPlaces = useCallback(async () => {
    if (location) {
      await searchNearbyPlaces(location.coords.latitude, location.coords.longitude);
    }
  }, [location, searchNearbyPlaces]);

  return {
    places,
    loading,
    error,
    location,
    locationPermission,
    searchNearbyPlaces,
    searchPlacesByText,
    refreshNearbyPlaces,
    requestLocationPermission,
  };
}