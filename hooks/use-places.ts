import { useState, useMemo } from 'react';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { mockPlaces } from '@/mocks/places';
import { Place, PlaceDistance, UserLocation } from '@/types/place';
import { mockUsers } from '@/mocks/users';

const EARTH_RADIUS_KM = 6371;
const SEARCH_RADIUS_KM = 3;

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function calculateMidpoint(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { latitude: number; longitude: number } {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const lon1Rad = lon1 * Math.PI / 180;

  const bx = Math.cos(lat2Rad) * Math.cos(dLon);
  const by = Math.cos(lat2Rad) * Math.sin(dLon);
  const lat3Rad = Math.atan2(
    Math.sin(lat1Rad) + Math.sin(lat2Rad),
    Math.sqrt((Math.cos(lat1Rad) + bx) * (Math.cos(lat1Rad) + bx) + by * by)
  );
  const lon3Rad = lon1Rad + Math.atan2(by, Math.cos(lat1Rad) + bx);

  return {
    latitude: lat3Rad * 180 / Math.PI,
    longitude: lon3Rad * 180 / Math.PI,
  };
}

export const [PlacesProvider, usePlaces] = createContextHook(() => {
  const [places, setPlaces] = useState<Place[]>(mockPlaces);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedInviteeId, setSelectedInviteeId] = useState<string | null>(null);
  const [mode, setMode] = useState<'nearby' | 'between-us'>('nearby');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'not-requested' | 'granted' | 'denied'>('not-requested');

  const requestLocationPermission = async () => {
    console.log('Requesting location permission...');
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Web location obtained:', position.coords);
              setUserLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
              setLocationPermissionStatus('granted');
              setIsLoadingLocation(false);
            },
            (error) => {
              console.error('Web geolocation error:', error);
              setLocationError(error.message);
              setLocationPermissionStatus('denied');
              setIsLoadingLocation(false);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            }
          );
        } else {
          console.log('Geolocation not available');
          setLocationError('Geolocation is not available in your browser');
          setLocationPermissionStatus('denied');
          setIsLoadingLocation(false);
        }
      } else {
        const ExpoLocation = await import('expo-location');
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('Location permission denied');
          setLocationError('Location permission denied');
          setLocationPermissionStatus('denied');
          setIsLoadingLocation(false);
          return;
        }

        const location = await ExpoLocation.getCurrentPositionAsync({});
        console.log('Native location obtained:', location.coords);
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setLocationPermissionStatus('granted');
        setIsLoadingLocation(false);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Failed to get location');
      setLocationPermissionStatus('denied');
      setIsLoadingLocation(false);
    }
  };

  const inviteeLocation = useMemo(() => {
    if (!selectedInviteeId) return null;
    const invitee = mockUsers.find(u => u.id === selectedInviteeId);
    if (!invitee) return null;
    return {
      latitude: 37.7849 + Math.random() * 0.02 - 0.01,
      longitude: -122.4094 + Math.random() * 0.02 - 0.01,
    };
  }, [selectedInviteeId]);

  const sortedPlaces = useMemo(() => {
    if (!userLocation) return [];

    console.log('Calculating places for mode:', mode);
    console.log('User location:', userLocation);
    console.log('Selected invitee:', selectedInviteeId);

    if (mode === 'nearby') {
      const withDistances: PlaceDistance[] = places.map(place => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          place.location.latitude,
          place.location.longitude
        );
        return {
          place,
          distanceFromUser: distance,
        };
      }).filter(pd => pd.distanceFromUser <= SEARCH_RADIUS_KM);

      return withDistances.sort((a, b) => a.distanceFromUser - b.distanceFromUser);
    } else {
      if (!inviteeLocation) return [];

      const midpoint = calculateMidpoint(
        userLocation.latitude,
        userLocation.longitude,
        inviteeLocation.latitude,
        inviteeLocation.longitude
      );

      console.log('Midpoint:', midpoint);

      const withDistances: PlaceDistance[] = places.map(place => {
        const distanceFromUser = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          place.location.latitude,
          place.location.longitude
        );
        const distanceFromInvitee = calculateDistance(
          inviteeLocation.latitude,
          inviteeLocation.longitude,
          place.location.latitude,
          place.location.longitude
        );
        const balanceScore = Math.abs(distanceFromUser - distanceFromInvitee);

        return {
          place,
          distanceFromUser,
          distanceFromInvitee,
          totalDistance: distanceFromUser + distanceFromInvitee,
          balanceScore,
        };
      }).filter(pd => 
        pd.distanceFromUser <= SEARCH_RADIUS_KM || 
        pd.distanceFromInvitee! <= SEARCH_RADIUS_KM
      );

      return withDistances.sort((a, b) => {
        const scoreDiff = a.balanceScore! - b.balanceScore!;
        if (Math.abs(scoreDiff) < 0.1) {
          return a.totalDistance! - b.totalDistance!;
        }
        return scoreDiff;
      });
    }
  }, [userLocation, inviteeLocation, places, mode, selectedInviteeId]);

  const addPlace = (place: Omit<Place, 'id' | 'createdAt' | 'addedBy'>) => {
    const newPlace: Place = {
      ...place,
      id: `p${Date.now()}`,
      addedBy: ['current-user'],
      createdAt: new Date(),
    };
    console.log('Adding new place:', newPlace);
    setPlaces(prev => [...prev, newPlace]);
  };

  const togglePlaceAdded = (placeId: string, userId: string) => {
    setPlaces(prev => prev.map(place => {
      if (place.id === placeId) {
        const isAdded = place.addedBy.includes(userId);
        return {
          ...place,
          addedBy: isAdded
            ? place.addedBy.filter(id => id !== userId)
            : [...place.addedBy, userId],
        };
      }
      return place;
    }));
  };

  return {
    places: sortedPlaces,
    userLocation,
    isLoadingLocation,
    locationError,
    locationPermissionStatus,
    mode,
    setMode,
    selectedInviteeId,
    setSelectedInviteeId,
    addPlace,
    togglePlaceAdded,
    requestLocationPermission,
  };
});
