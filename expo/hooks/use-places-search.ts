import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

const nullableString = z.preprocess((v) => (v === null || v === undefined ? '' : String(v)), z.string());
const nullableNumber = z.preprocess((v) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }
  if (typeof v === 'number') return v;
  return 0;
}, z.number());
const nullableStringArray = z.preprocess((v) => {
  if (!Array.isArray(v)) return [];
  return v.map((item) => (item === null || item === undefined ? '' : String(item)));
}, z.array(z.string()));

const PlaceSchema = z.object({
  name: nullableString,
  address: nullableString,
  city: nullableString,
  country: nullableString,
  latitude: nullableNumber,
  longitude: nullableNumber,
  rating: nullableNumber,
  priceLevel: nullableNumber,
  placeType: z.preprocess((v) => {
    if (!Array.isArray(v)) return typeof v === 'string' ? [v] : [];
    return v.map((item) => (item === null || item === undefined ? '' : String(item)));
  }, z.array(z.string())),
  cuisineEmoji: nullableString,
  phoneNumber: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  googleMapsUrl: z.string().nullable().optional(),
  openingHours: nullableStringArray.nullable().optional(),
  description: nullableString,
  matchScore: nullableNumber,
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

const BASE_PROMPT = `You are a restaurant and venue discovery assistant. Return ONLY restaurants that DIRECTLY match the search query. The dish or cuisine must be the PRIMARY specialty. Only return places you are CERTAIN exist — do not guess or fabricate. Leave address empty unless 100% sure. Always provide a googleMapsUrl. Sort by matchScore descending.`;

function buildSearchPrompt(query: string, locationContext: string, batchHint: string, maxExpected?: number): string {
  const quantityLine = maxExpected && maxExpected < 10
    ? `QUANTITY: Return up to ${maxExpected} results. Quality over quantity — only return places you are CERTAIN exist. Do NOT fabricate to reach a quota.`
    : 'QUANTITY: Return AT LEAST 25 results. Do not stop early.';

  return `${BASE_PROMPT}

A user is searching for: "${query}"${locationContext}

${batchHint}

${quantityLine}

For each place provide:
- name: exact official restaurant name
- address: ONLY if 100% certain, otherwise ""
- city, country
- latitude/longitude: approximate OK
- rating: 1-5 (0 if unknown)
- priceLevel: 1-4 budget to fine dining (0 if unknown)
- placeType: array like ["restaurant", "indian", "curry"]
- cuisineEmoji: single emoji
- googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=NAME+CITY+COUNTRY"
- description: 2-3 sentences
- matchScore: 0-100 relevance to query`;
}

function mapPlaces(places: any[], baseIndex: number): PlaceResult[] {
  return places.map((place: any, i: number) => ({
    place: {
      id: `ai-place-${Date.now()}-${baseIndex + i}`,
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
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.city + ' ' + place.country)}`,
    },
    description: place.description,
    matchScore: place.matchScore,
  }));
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function isSameLocation(a: PlaceResult, b: PlaceResult): boolean {
  const latDiff = Math.abs(a.place.latitude - b.place.latitude);
  const lngDiff = Math.abs(a.place.longitude - b.place.longitude);
  // Both at 0,0 means the AI didn't provide real coords — skip coord dedup
  if (a.place.latitude === 0 && a.place.longitude === 0 && b.place.latitude === 0 && b.place.longitude === 0) {
    return false;
  }
  // Within ~500m
  return latDiff < 0.005 && lngDiff < 0.005;
}

function deduplicatePlaces(results: PlaceResult[]): PlaceResult[] {
  const seenKeys = new Set<string>();
  const deduped: PlaceResult[] = [];

  for (const r of results) {
    const exactKey = `${r.place.name.toLowerCase().trim()}|${r.place.city.toLowerCase().trim()}`;
    const fuzzyKey = `${normalizeName(r.place.name)}|${r.place.city.toLowerCase().trim()}`;

    // Skip exact duplicates
    if (seenKeys.has(exactKey)) continue;
    // Skip fuzzy name duplicates (e.g. "Kobu Omakase" vs "Kobu Omakase Tokyo")
    if (seenKeys.has(fuzzyKey)) continue;

    // Skip coordinate-based duplicates: same location, different name variant
    const isCoordDup = deduped.some((existing) => isSameLocation(existing, r));
    if (isCoordDup) continue;

    seenKeys.add(exactKey);
    seenKeys.add(fuzzyKey);
    deduped.push(r);
  }

  return deduped;
}

async function searchPlacesAI(query: string, limit: number = 12, userLocation?: UserLocation | null): Promise<PlacesSearchResult> {
  const nearMe = isNearMeQuery(query);
  const useNearMe = nearMe && !!userLocation;
  const useCountryBias = !nearMe && !!userLocation?.country;
  console.log("[Places AI Search] Query:", query, "nearMe:", useNearMe, "countryBias:", useCountryBias, userLocation?.country);

  let locationContext = '';
  if (useNearMe && userLocation) {
    locationContext = `\n\nThe user said "near me" and is at lat ${userLocation.latitude}, lon ${userLocation.longitude}${userLocation.city ? `, in ${userLocation.city}` : ''}${userLocation.country ? `, ${userLocation.country}` : ''}. Return restaurants close to these coordinates.`;
  } else if (useCountryBias && userLocation) {
    locationContext = `\n\nUser is in ${userLocation.country}${userLocation.city ? ` (near ${userLocation.city})` : ''}. If the query does NOT mention a different country/city, ONLY return places in ${userLocation.country}. If it explicitly mentions another location, use that instead. Search across the ENTIRE country, not just the user's city.`;
  } else {
    locationContext = '\n\nSearch globally. If the query mentions a location, use it. Otherwise return the most famous/relevant places worldwide.';
  }

  // Detect if this is a specific restaurant name (not a broad cuisine search).
  // Specific names like "kobu omakase" have only 1-2 real places — multi-batch
  // would force the AI to fabricate near-duplicates.
  const broadCuisineWords = ['indian', 'chinese', 'japanese', 'italian', 'mexican', 'thai', 'korean', 'vietnamese', 'french', 'pizza', 'sushi', 'burger', 'curry', 'ramen', 'taco', 'bbq', 'steak', 'seafood', 'noodle', 'rice', 'chicken', 'beef', 'pork', 'vegan', 'vegetarian', 'breakfast', 'brunch', 'lunch', 'dinner', 'dessert', 'bakery', 'cafe', 'coffee', 'bar', 'pub', 'buffet', 'street food', 'hawker', 'dim sum', 'tapas', 'grill', 'roast', 'fried', 'soup', 'salad', 'sandwich', 'wrap', 'bowl', 'platter'];
  const queryLower = query.toLowerCase();
  const isBroadCuisine = broadCuisineWords.some((w) => queryLower.includes(w));

  // For specific-name queries, use a single focused call that prioritizes accuracy.
  // For broad cuisine queries, use the 3-batch approach to get more variety.
  const batches: string[] = isBroadCuisine
    ? [
        'BATCH 1/3: Focus on the MOST FAMOUS and iconic places for this query — the legendary, award-winning, and widely-renowned establishments worldwide.',
        'BATCH 2/3: Focus on HIDDEN GEMS, local favorites, hawker stalls, food courts, neighborhood spots, and lesser-known but excellent places.',
        'BATCH 3/3: Focus on well-known chain restaurants, popular casual spots, and any remaining notable places not covered in batches 1-2.',
      ]
    : [
        'IMPORTANT: This appears to be a specific restaurant name. Only return places that are GENUINELY named this or are the actual restaurant. If fewer than 5 real places exist worldwide with this name, return ONLY those — do NOT fabricate similar-sounding places to fill space. Quality over quantity.',
      ];

    const maxExpected = isBroadCuisine ? 25 : 8;
  const batchResults = await Promise.all(
    batches.map((batchHint, batchIndex) =>
      generateObject({
        messages: [
          {
            role: "user",
            content: buildSearchPrompt(query, locationContext, batchHint, maxExpected),
          },
        ],
        schema: PlacesResponseSchema,
      }).catch((err) => {
        console.error(`[Places AI Search] Batch ${batchIndex + 1} failed:`, err);
        return { places: [] };
      })
    )
  );

  let index = 0;
  const allResults: PlaceResult[] = [];
  for (const r of batchResults) {
    console.log(`[Places AI Search] Batch returned`, r.places.length, "places");
    allResults.push(...mapPlaces(r.places, index));
    index += r.places.length;
  }

  const deduped = deduplicatePlaces(allResults);
  // Sort by matchScore descending
  deduped.sort((a, b) => b.matchScore - a.matchScore);

  console.log("[Places AI Search] Total:", allResults.length, "raw, after dedup:", deduped.length);

  return {
    results: deduped,
    totalResults: deduped.length,
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
    mutationFn: (query: string) => searchPlacesAI(query, 75, userLocation),
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

  const clearResults = useCallback(() => {
    setData(null);
  }, []);

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
    clearResults,
    refetch: () => {
      if (mutation.variables) {
        mutation.mutate(mutation.variables);
      }
    },
  };
}
