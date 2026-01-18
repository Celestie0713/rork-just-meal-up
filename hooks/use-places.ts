import React, { useState, useMemo, createContext, useContext, ReactNode, useCallback } from 'react';
import { Platform } from 'react-native';
import { mockPlaces } from '@/mocks/places';
import { Place, PlaceDistance, UserLocation } from '@/types/place';
import { mockUsers } from '@/mocks/users';

const EARTH_RADIUS_KM = 6371;
const SEARCH_RADIUS_KM = 3;

interface OSMPlace {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    amenity?: string;
    shop?: string;
    cuisine?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
    'addr:state'?: string;
    'addr:postcode'?: string;
    'addr:country'?: string;
  };
}

interface OSMResponse {
  elements: OSMPlace[];
}

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

type PlacesContextType = {
  places: PlaceDistance[];
  userLocation: UserLocation | null;
  isLoadingLocation: boolean;
  locationError: string | null;
  locationPermissionStatus: 'not-requested' | 'granted' | 'denied';
  mode: 'nearby' | 'between-us';
  setMode: (mode: 'nearby' | 'between-us') => void;
  selectedInviteeId: string | null;
  setSelectedInviteeId: (id: string | null) => void;
  addPlace: (place: Omit<Place, 'id' | 'createdAt' | 'addedBy'>) => void;
  togglePlaceAdded: (placeId: string, userId: string) => void;
  requestLocationPermission: () => Promise<void>;
};

const PlacesContext = createContext<PlacesContextType | undefined>(undefined);

export function PlacesProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<Place[]>(mockPlaces);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedInviteeId, setSelectedInviteeId] = useState<string | null>(null);
  const [mode, setMode] = useState<'nearby' | 'between-us'>('nearby');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'not-requested' | 'granted' | 'denied'>('not-requested');
  const [isFetchingPlaces, setIsFetchingPlaces] = useState(false);

  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MealUpApp/1.0',
          },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log('Reverse geocode failed with status:', response.status);
        return 'Address unavailable';
      }
      
      const data = await response.json();
      console.log('Reverse geocode result:', data);
      
      if (data.address) {
        const parts = [
          data.address.house_number,
          data.address.road || data.address.street,
          data.address.suburb || data.address.neighbourhood || data.address.quarter,
          data.address.city || data.address.town || data.address.village || data.address.municipality,
        ].filter(Boolean);
        
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
      
      if (data.display_name) {
        const parts = data.display_name.split(',').slice(0, 3);
        return parts.join(',');
      }
      
      return 'Address unavailable';
    } catch (error) {
      console.log('Reverse geocoding error:', error);
      return 'Address unavailable';
    }
  };

  const fetchNearbyPlaces = useCallback(async (latitude: number, longitude: number) => {
    console.log('Fetching nearby places for:', latitude, longitude);
    setIsFetchingPlaces(true);
    
    try {
      const radius = SEARCH_RADIUS_KM * 1000;
      const query = `
        [out:json];
        (
          node["amenity"="restaurant"](around:${radius},${latitude},${longitude});
          node["amenity"="cafe"](around:${radius},${latitude},${longitude});
          node["amenity"="bar"](around:${radius},${latitude},${longitude});
          node["amenity"="fast_food"](around:${radius},${latitude},${longitude});
          node["amenity"="pub"](around:${radius},${latitude},${longitude});
          node["amenity"="food_court"](around:${radius},${latitude},${longitude});
          node["amenity"="ice_cream"](around:${radius},${latitude},${longitude});
          node["amenity"="biergarten"](around:${radius},${latitude},${longitude});
          node["shop"="bakery"](around:${radius},${latitude},${longitude});
          node["shop"="coffee"](around:${radius},${latitude},${longitude});
          node["shop"="tea"](around:${radius},${latitude},${longitude});
          node["shop"="pastry"](around:${radius},${latitude},${longitude});
          node["shop"="deli"](around:${radius},${latitude},${longitude});
        );
        out body;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch places');
      }
      
      const data: OSMResponse = await response.json();
      console.log('Fetched OSM places:', data.elements.length);
      
      const placesWithAddresses: Place[] = [];
      
      const isPlaceClosed = (tags: any) => {
        const tagKeys = Object.keys(tags || {});
        
        if (tagKeys.some(key => key.startsWith('disused:') || key.startsWith('abandoned:') || key.startsWith('demolished:') || key.startsWith('removed:') || key.startsWith('was:'))) {
          return true;
        }
        
        if (tags.opening_hours === 'closed' || tags.opening_hours === 'permanently closed') {
          return true;
        }
        
        if (tags.shop === 'vacant' || tags.amenity === 'closed') {
          return true;
        }
        
        if (tags.lifecycle_status && ['demolished', 'abandoned', 'disused', 'removed', 'closed'].includes(tags.lifecycle_status.toLowerCase())) {
          return true;
        }
        
        const textFields = [
          tags.note,
          tags.description,
          tags.fixme,
          tags['fixme:shop'],
          tags['fixme:amenity']
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (textFields && (
          textFields.includes('permanently closed') ||
          textFields.includes('closed down') ||
          textFields.includes('out of business') ||
          textFields.includes('no longer') ||
          textFields.includes('demolished') ||
          textFields.includes('abandoned')
        )) {
          return true;
        }
        
        return false;
      };
      
      for (const element of data.elements.filter(element => element.tags?.name && !isPlaceClosed(element.tags)).slice(0, 20)) {
        let address = '';
        
        const streetParts = [
          element.tags['addr:housenumber'],
          element.tags['addr:street'],
        ].filter(Boolean);
        
        const cityParts = [
          element.tags['addr:city'],
          element.tags['addr:state'],
        ].filter(Boolean);
        
        if (streetParts.length > 0 || cityParts.length > 0) {
          const allParts = [...streetParts, ...cityParts].filter(Boolean);
          address = allParts.join(', ');
        }
        
        if (!address || address.length < 5) {
          console.log(`Fetching address for ${element.tags.name} at ${element.lat}, ${element.lon}`);
          address = await reverseGeocode(element.lat, element.lon);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        const categoryMap: { [key: string]: string } = {
          restaurant: 'Restaurant',
          cafe: 'Cafe',
          bar: 'Bar',
          fast_food: 'Fast Food',
          pub: 'Pub',
          food_court: 'Food Court',
          ice_cream: 'Ice Cream',
          biergarten: 'Beer Garden',
          bakery: 'Bakery',
          coffee: 'Coffee Shop',
          tea: 'Tea House',
          pastry: 'Pastry Shop',
          deli: 'Deli',
        };
        
        const amenity = element.tags.amenity;
        const shop = element.tags.shop;
        const category = categoryMap[amenity || shop || ''] || 'Food & Beverage';
        
        placesWithAddresses.push({
          id: `osm-${element.id}`,
          name: element.tags.name || 'Unknown Place',
          category,
          location: {
            latitude: element.lat,
            longitude: element.lon,
            address,
          },
          addedBy: [],
          createdAt: new Date(),
        });
      }
      
      console.log('Processed places:', placesWithAddresses.length);
      setPlaces(placesWithAddresses);
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      setPlaces([]);
    } finally {
      setIsFetchingPlaces(false);
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    console.log('Requesting location permission...');
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Web location obtained:', position.coords);
              const newLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              setUserLocation(newLocation);
              setLocationPermissionStatus('granted');
              setIsLoadingLocation(false);
              
              if (mode === 'nearby') {
                fetchNearbyPlaces(newLocation.latitude, newLocation.longitude);
              }
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
        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(newLocation);
        setLocationPermissionStatus('granted');
        setIsLoadingLocation(false);
        
        if (mode === 'nearby') {
          fetchNearbyPlaces(newLocation.latitude, newLocation.longitude);
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Failed to get location');
      setLocationPermissionStatus('denied');
      setIsLoadingLocation(false);
    }
  }, [mode, fetchNearbyPlaces]);

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

  const value = useMemo<PlacesContextType>(() => ({
    places: sortedPlaces,
    userLocation,
    isLoadingLocation: isLoadingLocation || isFetchingPlaces,
    locationError,
    locationPermissionStatus,
    mode,
    setMode,
    selectedInviteeId,
    setSelectedInviteeId,
    addPlace,
    togglePlaceAdded,
    requestLocationPermission,
  }), [sortedPlaces, userLocation, isLoadingLocation, isFetchingPlaces, locationError, locationPermissionStatus, mode, selectedInviteeId, requestLocationPermission]);

  return (
    React.createElement(PlacesContext.Provider, { value }, children)
  );
}

export function usePlaces() {
  const context = useContext(PlacesContext);
  if (!context) {
    throw new Error('usePlaces must be used within PlacesProvider');
  }
  return context;
}
