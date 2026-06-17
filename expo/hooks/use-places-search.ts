import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

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
      const Location = await import('expo-location');
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
  const nearMe = isNearMeQuery(query);
  const useNearMe = nearMe && !!userLocation;
  const useCountryBias = !nearMe && !!userLocation?.country;
  console.log("[Places AI Search] Query:", query, "nearMe:", useNearMe, "countryBias:", useCountryBias, userLocation?.country);

  let locationContext = '';
  if (useNearMe && userLocation) {
    locationContext = `\n\nUSER LOCATION CONTEXT:\nThe user said "near me" and is currently located at latitude ${userLocation.latitude}, longitude ${userLocation.longitude}${userLocation.city ? `, in ${userLocation.city}` : ''}${userLocation.country ? `, ${userLocation.country}` : ''}.\nReturn restaurants close to these coordinates.`;
  } else if (useCountryBias && userLocation) {
    locationContext = `\n\nUSER COUNTRY CONTEXT:\nThe user is located in ${userLocation.country}${userLocation.city ? ` (currently near ${userLocation.city})` : ''}.\n- If the query does NOT mention any specific country or city, ONLY return places located in ${userLocation.country}. Do not return results from other countries.\n- If the query explicitly mentions a different country or city (e.g. "don omakase tokyo", "sushi in new york"), return places from THAT location instead and ignore the user's country.\n- Do NOT narrow to the user's exact city unless they said "near me" — search across all of ${userLocation.country}.`;
  } else {
    locationContext = '\n\nDo NOT bias results by the user\'s current location. Search globally based on the query. If the query mentions a city or location, return places in THAT location. If no location is mentioned, return the most famous/relevant places worldwide that match the query.';
  }

  const result = await generateObject({
    messages: [
      {
        role: "user",
        content: `You are a restaurant and venue discovery assistant. A user is searching for: "${query}"${locationContext}

CRITICAL QUANTITY REQUIREMENT:
- You MUST return at least 20 REAL restaurants/venues. Aim for the full ${limit}.
- NEVER return fewer than 15 results unless the query is extremely obscure and you genuinely cannot think of more.
- For common dishes (like "pork noodle", "ramen", "pizza", "burger", etc.), returning 4-5 results is UNACCEPTABLE. You must return 20+.
- Think systematically: what are the famous establishments in each major city or region known for this dish? List them ALL.
- Include places from international chains, local chains, famous independent restaurants, hawker stalls, food courts, coffee shops, and hidden gems.
- Cast the WIDEST possible net — across ALL cities, regions, and countries where this dish is popular.
- If you find yourself listing fewer than 15, you are NOT trying hard enough. Keep thinking of more places.

CRITICAL RELEVANCE RULES:
1. ONLY return restaurants that DIRECTLY match the search query. If the user searches for "wantan mee", return ONLY places known for wantan mee / wonton noodles. Do NOT return places serving different dishes (e.g. hokkien mee, char kuey teow, laksa) even if they are noodle places.
2. The dish or cuisine in the search query must be the PRIMARY specialty or a well-known menu item of the restaurant.
3. If the query is a specific dish name, focus on places FAMOUS for that exact dish.

CRITICAL ACCURACY RULES:
1. The NAME and ADDRESS of each restaurant MUST belong to the SAME real place. NEVER mix up names with wrong addresses.
2. ONLY return restaurants you are CERTAIN currently exist. Do NOT guess or fabricate.
3. Every field must be for the SAME restaurant.

CRITICAL ADDRESS RULES:
- You MUST provide an address field, but if you are NOT 100% CERTAIN of the exact street address (street number + street name), do NOT fabricate one. Instead, provide a descriptive location like "Orchard Road area", "Shinjuku district", "Chinatown", "Brick Lane area", "Near Central Station".
- If the restaurant is in a shopping mall or food court, include the mall name: "Food Republic, Wisma Atria, Orchard Road".
- If the restaurant is a hawker stall or food court stall, include the hawker center name and stall number if known: "Stall #02-15, Maxwell Food Centre".
- NEVER make up a street number just to fill the field. A vague-but-honest area description is infinitely better than a wrong street address.
- The combination of NAME + CITY + COUNTRY + googleMapsUrl is the authoritative location identifier. The address field is supplementary context.

For each place provide:
- name: The EXACT official name of the restaurant
- address: Only include street number+name if 100% certain. Otherwise use area/neighborhood/mall/hawker center description. Include stall numbers for hawker stalls.
- city: The city where THIS restaurant is located
- country: The country
- latitude/longitude: Coordinates for THIS specific restaurant location (approximate is OK)
- rating: Approximate rating 1-5 (use 0 if unknown)
- priceLevel: 1-4 (1=budget, 4=fine dining, use 0 if unknown)
- placeType: Array like ["restaurant", "noodles", "hawker"]
- cuisineEmoji: Single emoji for the cuisine type
- phoneNumber: Only if you are certain (omit otherwise)
- website: Only if you are certain (omit otherwise)
- googleMapsUrl: CRITICAL — this is the primary way users will find the restaurant. ALWAYS provide a working Google Maps search URL. Format: "https://www.google.com/maps/search/?api=1&query=RESTAURANT+NAME+CITY+COUNTRY". Keep it simple — just the restaurant name + city + country is enough for Google Maps to find it.
- openingHours: Only if you are certain (omit otherwise)
- description: 2-3 sentences about what makes this place special
- matchScore: 0-100 how relevant to the EXACT search query (penalize places that serve a different dish)

Sort by matchScore descending.
If the query mentions a specific city/location, only return places in that area (overriding any country context above).
Otherwise, follow the location context above.`,
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
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.city + ' ' + place.country)}`,
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

  // Auto-detect location lazily only when the Places tab is active.
  // Aggressive permission requests on mount crash the cloud simulator
  // with an opaque {} error because expo-location tries to talk to
  // hardware that doesn't exist.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

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
        }
        // On native, skip auto-detection — only resolve via explicit
        // requestLocationPermission() to avoid {} crash in cloud simulators.
      } catch (error) {
        console.log('[Places] Location error:', error);
        if (!cancelled) {
          setLocationError('Failed to get location. Please check your location settings.');
          setLocationReady(true);
        }
      }
    }

    // Only run on web — native auto-detection is disabled to prevent
    // expo-location from crashing the cloud simulator bridge.
    if (Platform.OS === 'web') {
      timer = setTimeout(() => {
        void getLocation();
      }, 500);
    } else {
      // Mark location as "not detected" without attempting native calls.
      setLocationReady(true);
    }

    return () => {
      cancelled = true;
      if (timer !== null) clearTimeout(timer);
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
        const Location = await import('expo-location');
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
