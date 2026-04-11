import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import * as Location from 'expo-location';

const PlaceSchema = z.object({
  name: z.string(),
  address: z.string(),
  city: z.string(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  rating: z.number(),
  priceLevel: z.number(),
  placeType: z.array(z.string()),
  cuisineEmoji: z.string(),
  phoneNumber: z.string().optional(),
  website: z.string().optional(),
  googleMapsUrl: z.string().optional(),
  openingHours: z.array(z.string()).optional(),
  description: z.string(),
  matchScore: z.number(),
});

const PlacesResponseSchema = z.object({
  places: z.array(PlaceSchema),
});

export interface PlaceResult {
  place: {
    id: string;
    name: string;
    address: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    rating: number;
    priceLevel: number;
    placeType: string[];
    cuisineEmoji: string;
    phoneNumber?: string;
    website?: string;
    googleMapsUrl?: string;
    openingHours?: string[];
  };
  description: string;
  matchScore: number;
}

export interface PlacesSearchResult {
  results: PlaceResult[];
  totalResults: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

async function reverseGeocode(latitude: number, longitude: number): Promise<{ city?: string; country?: string }> {
  try {
    if (Platform.OS !== 'web') {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results.length > 0) {
        return {
          city: results[0].city ?? results[0].subregion ?? undefined,
          country: results[0].country ?? undefined,
        };
      }
    }
  } catch (e) {
    console.log('[Places] Reverse geocode failed:', e);
  }
  return {};
}

async function searchPlacesAI(query: string, limit: number = 8, userLocation?: UserLocation | null): Promise<PlacesSearchResult> {
  console.log("[Places AI Search] Query:", query, "Location:", userLocation);

  const locationContext = userLocation
    ? `\n\nUSER LOCATION CONTEXT:\nThe user is currently located at latitude ${userLocation.latitude}, longitude ${userLocation.longitude}${userLocation.city ? `, in ${userLocation.city}` : ''}${userLocation.country ? `, ${userLocation.country}` : ''}.\nWhen the user says "near me" or doesn't specify a location, prioritize restaurants near these coordinates and in this city/area.\nAlways prefer results close to the user's current location unless they specify a different location.`
    : '';

  const result = await generateObject({
    messages: [
      {
        role: "user",
        content: `You are a restaurant and venue discovery assistant. A user is searching for: "${query}"${locationContext}

CRITICAL RELEVANCE RULES:
1. ONLY return restaurants that DIRECTLY match the search query. If the user searches for "wantan mee", return ONLY places known for wantan mee / wonton noodles. Do NOT return places serving different dishes (e.g. hokkien mee, char kuey teow, laksa) even if they are noodle places.
2. The dish or cuisine in the search query must be the PRIMARY specialty or a well-known menu item of the restaurant.
3. If the query is a specific dish name, focus on places FAMOUS for that exact dish.

CRITICAL ACCURACY RULES:
1. The NAME and ADDRESS of each restaurant MUST belong to the SAME real place. NEVER mix up names with wrong addresses.
2. ONLY return restaurants you are CERTAIN currently exist. Do NOT guess or fabricate.
3. Every field must be for the SAME restaurant.

Return up to ${limit} REAL restaurants/venues. Try to return as many relevant results as possible.
Include well-known places, popular local spots, hawker stalls, coffee shops, and hidden gems.
Cast a wide net across different areas and neighborhoods.

For each place provide:
- name: The EXACT official name of the restaurant
- address: The REAL street address OF THAT SAME restaurant. If unsure of exact street number, provide the street name and area.
- city: The city where THIS restaurant is located
- country: The country
- latitude/longitude: Coordinates for THIS specific restaurant location
- rating: Approximate rating 1-5 (use 0 if unknown)
- priceLevel: 1-4 (1=budget, 4=fine dining, use 0 if unknown)
- placeType: Array like ["restaurant", "noodles", "hawker"]
- cuisineEmoji: Single emoji for the cuisine type
- phoneNumber: Only if you are certain (omit otherwise)
- website: Only if you are certain (omit otherwise)
- googleMapsUrl: ALWAYS use this format: "https://www.google.com/maps/search/?api=1&query=EXACT+RESTAURANT+NAME+FULL+ADDRESS+CITY+COUNTRY" — include the FULL street address for precision. Never use just the name.
- openingHours: Only if you are certain (omit otherwise)
- description: 2-3 sentences about what makes this place special
- matchScore: 0-100 how relevant to the EXACT search query (penalize places that serve a different dish)

Sort by matchScore descending.
If the query mentions a specific city/location, only return places in that area.
If the user's location is known and no other location is specified, return places near the user's location.
If no location is specified and user location is unknown, return places from popular cities for that cuisine.`,
      },
    ],
    schema: PlacesResponseSchema,
  });

  console.log("[Places AI Search] Generated", result.places.length, "places");

  const results: PlaceResult[] = result.places.map((place: any, index: number) => ({
    place: {
      id: `ai-place-${Date.now()}-${index}`,
      name: place.name,
      address: place.address,
      city: place.city,
      country: place.country,
      latitude: place.latitude,
      longitude: place.longitude,
      rating: place.rating,
      priceLevel: place.priceLevel,
      placeType: place.placeType,
      cuisineEmoji: place.cuisineEmoji || '🍽️',
      phoneNumber: place.phoneNumber,
      website: place.website,
      googleMapsUrl: place.latitude && place.longitude
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ', ' + place.address + ', ' + place.city)}&center=${place.latitude},${place.longitude}&zoom=17`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ', ' + place.address + ', ' + place.city + ', ' + place.country)}`,
      openingHours: place.openingHours,
    },
    description: place.description,
    matchScore: place.matchScore,
  }));

  return {
    results,
    totalResults: results.length,
  };
}

async function reverseGeocodeWeb(latitude: number, longitude: number): Promise<{ city?: string; country?: string }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
    );
    if (response.ok) {
      const data = await response.json();
      const address = data?.address;
      if (address) {
        return {
          city: address.city || address.town || address.village || address.suburb || address.state,
          country: address.country,
        };
      }
    }
  } catch (e) {
    console.log('[Places] Web reverse geocode failed:', e);
  }
  return {};
}

function isNearMeQuery(query: string): boolean {
  const q = query.toLowerCase();
  return q.includes('near me') || q.includes('nearby') || q.includes('around me') || q.includes('close to me') || q.includes('my area');
}

export function usePlacesSearch() {
  const [data, setData] = useState<PlacesSearchResult | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationReady, setLocationReady] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function getLocation() {
      try {
        console.log('[Places] Starting location detection, platform:', Platform.OS);

        if (Platform.OS === 'web') {
          if ('geolocation' in navigator) {
            console.log('[Places] Requesting web geolocation...');
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                if (cancelled) return;
                console.log('[Places] Web raw coords:', position.coords.latitude, position.coords.longitude);
                const loc: UserLocation = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                };
                const geo = await reverseGeocodeWeb(loc.latitude, loc.longitude);
                loc.city = geo.city;
                loc.country = geo.country;
                if (!cancelled) {
                  setUserLocation(loc);
                  setLocationReady(true);
                  console.log('[Places] Web location detected:', loc);
                }
              },
              (err) => {
                console.log('[Places] Web geolocation error:', err.message, 'code:', err.code);
                if (!cancelled) {
                  setLocationError(err.message);
                  setLocationReady(true);
                }
              },
              { timeout: 15000, enableHighAccuracy: false, maximumAge: 300000 }
            );
          } else {
            console.log('[Places] Web geolocation not available');
            setLocationError('Geolocation not supported');
            setLocationReady(true);
          }
        } else {
          console.log('[Places] Checking existing location permissions...');
          const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
          console.log('[Places] Existing permission status:', existingStatus);

          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            console.log('[Places] Requesting location permission...');
            const { status } = await Location.requestForegroundPermissionsAsync();
            finalStatus = status;
            console.log('[Places] Permission result:', status);
          }

          if (finalStatus !== 'granted') {
            console.log('[Places] Location permission denied');
            if (!cancelled) {
              setLocationPermissionDenied(true);
              setLocationError('Location permission denied. Please enable location in your device settings.');
              setLocationReady(true);
            }
            return;
          }

          console.log('[Places] Getting current position...');
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (cancelled) return;
          console.log('[Places] Got position:', position.coords.latitude, position.coords.longitude);
          const loc: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          const geo = await reverseGeocode(loc.latitude, loc.longitude);
          loc.city = geo.city;
          loc.country = geo.country;
          if (!cancelled) {
            setUserLocation(loc);
            setLocationReady(true);
            console.log('[Places] Native location detected:', loc);
          }
        }
      } catch (error) {
        console.log('[Places] Location error:', error);
        if (!cancelled) {
          setLocationError('Failed to get location. Please check your location settings.');
          setLocationReady(true);
        }
      }
    }

    const timer = setTimeout(() => {
      void getLocation();
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        return new Promise((resolve) => {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const loc: UserLocation = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                };
                const geo = await reverseGeocodeWeb(loc.latitude, loc.longitude);
                loc.city = geo.city;
                loc.country = geo.country;
                setUserLocation(loc);
                setLocationReady(true);
                setLocationError(null);
                setLocationPermissionDenied(false);
                resolve(true);
              },
              () => resolve(false),
              { timeout: 15000, enableHighAccuracy: false, maximumAge: 300000 }
            );
          } else {
            resolve(false);
          }
        });
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const loc: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          const geo = await reverseGeocode(loc.latitude, loc.longitude);
          loc.city = geo.city;
          loc.country = geo.country;
          setUserLocation(loc);
          setLocationReady(true);
          setLocationError(null);
          setLocationPermissionDenied(false);
          return true;
        }
        setLocationPermissionDenied(true);
        return false;
      }
    } catch (error) {
      console.log('[Places] Manual location request error:', error);
      return false;
    }
  }, []);

  const mutation = useMutation({
    mutationFn: (query: string) => searchPlacesAI(query, 30, userLocation),
    onSuccess: (result) => {
      console.log("[Places Search] Success:", result.totalResults, "results");
      setData(result);
    },
    onError: (error) => {
      console.error("[Places Search] Error:", error);
    },
  });

  const search = useCallback((query: string) => {
    if (query.trim().length > 0) {
      mutation.mutate(query.trim());
    }
  }, [mutation]);

  const needsLocationForQuery = useCallback((query: string): boolean => {
    return isNearMeQuery(query) && !userLocation;
  }, [userLocation]);

  return {
    data,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    search,
    locationReady,
    locationDetected: userLocation !== null,
    locationCity: userLocation?.city ?? null,
    locationError,
    locationPermissionDenied,
    needsLocationForQuery,
    requestLocationPermission,
    refetch: () => {
      if (mutation.variables) {
        mutation.mutate(mutation.variables);
      }
    },
  };
}
