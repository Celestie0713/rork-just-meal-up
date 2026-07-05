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

const PlaceSchema = z.preprocess(
  (v) => {
    if (typeof v !== 'object' || v === null) return {};
    return v;
  },
  z.object({
    name: nullableString,
    address: nullableString,
    city: nullableString,
    country: nullableString,
    latitude: nullableNumber,
    longitude: nullableNumber,
    rating: nullableNumber,
    priceLevel: nullableNumber,
    placeType: z.preprocess((v2) => {
      if (!Array.isArray(v2)) return typeof v2 === 'string' ? [v2] : [];
      return v2.map((item: any) => (item === null || item === undefined ? '' : String(item)));
    }, z.array(z.string())),
    cuisineEmoji: nullableString,
    phoneNumber: z.string().nullable().default(null),
    website: z.string().nullable().default(null),
    googleMapsUrl: z.string().nullable().default(null),
    openingHours: nullableStringArray.nullable().default(null),
    description: nullableString,
    matchScore: nullableNumber,
  }).passthrough()
);

const PlacesResponseSchema = z.preprocess(
  (v) => {
    if (typeof v !== 'object' || v === null) return { places: [] };
    const obj = v as Record<string, unknown>;
    if (!Array.isArray(obj.places)) return { places: [] };
    return { places: obj.places };
  },
  z.object({
    places: z.array(PlaceSchema),
  })
);

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

const BASE_PROMPT = `You are a restaurant and venue discovery assistant. Return restaurants that DIRECTLY match the search query, where the dish or cuisine is the PRIMARY specialty. Prioritize real, well-known places. For broad cuisine searches, include as many quality results as you know — cover famous spots, local favorites, chains, hawker stalls, and hidden gems. Always provide a googleMapsUrl. Sort by matchScore descending.`;

function buildSearchPrompt(query: string, locationContext: string, batchHint: string, isSpecific: boolean): string {
  const quantityLine = isSpecific
    ? 'QUANTITY: Return ONLY places that GENUINELY match this exact name. If fewer than 5 real places exist worldwide, return ONLY those — do NOT fabricate similar-sounding places. Quality over quantity.'
    : 'QUANTITY: You MUST return at least 30 diverse, real restaurants per batch — aim for 40 if possible. Cover the full range: legendary destinations, neighborhood joints, hawker stalls, food courts, night markets, chains, and hidden gems. Do NOT return the same place more than once. Every result must be a distinct, real restaurant. More is better — fill the list completely. Return the maximum number of real, distinct places you can.';

  return `${BASE_PROMPT}

A user is searching for: "${query}"${locationContext}

${batchHint}

${quantityLine}

For each place provide:
- name: exact official restaurant name
- address: area/neighborhood/district (e.g. "Imbi", "Bukit Bintang", "Damansara Heights", "Petaling Jaya") — NOT a street address. Use the well-known local area name.
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

const STOP_WORDS = new Set([
  'restaurant', 'restoran', 'the', 'a', 'an', 'and', 'of', 'in', 'at', 'on',
  'by', 'cafe', 'bar', 'grill', 'kitchen', 'house', 'place', 'bistro', 'eatery',
  'original', 'classic', 'famous', 'best', 'top', 'new', 'old',
]);

/** Normalize common city abbreviations so 'KL' matches 'Kuala Lumpur' etc. */
const CITY_ALIASES: Record<string, string> = {
  kl: 'kuala lumpur',
  pj: 'petaling jaya',
  jb: 'johor bahru',
  sg: 'singapore',
  hk: 'hong kong',
  nyc: 'new york',
  la: 'los angeles',
  sf: 'san francisco',
  dc: 'washington',
  bkk: 'bangkok',
  klcc: 'kuala lumpur',
  mtl: 'montreal',
  chi: 'chicago',
};

function normalizeCity(city: string): string {
  const trimmed = city.toLowerCase().trim();
  return CITY_ALIASES[trimmed] ?? trimmed;
}

function significantWords(name: string): string[] {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/** True if a and b share at least one significant word (length >= 4 chars). */
function hasAnySignificantWordOverlap(a: string, b: string): boolean {
  const wordsA = significantWords(a);
  const wordsB = significantWords(b);
  if (wordsA.length === 0 || wordsB.length === 0) return false;
  const setB = new Set(wordsB);
  return wordsA.some((w) => w.length >= 4 && setB.has(w));
}

/** Two places are likely the same if 2+ significant words overlap. */
function hasHighWordOverlap(a: string, b: string): boolean {
  const wordsA = significantWords(a);
  const wordsB = significantWords(b);
  if (wordsA.length === 0 || wordsB.length === 0) return false;
  const setB = new Set(wordsB);
  const overlap = wordsA.filter((w) => setB.has(w)).length;
  const minLen = Math.min(wordsA.length, wordsB.length);
  return overlap >= Math.min(2, minLen);
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

/** True when one normalized name fully contains the other. */
function oneContainsOther(a: string, b: string): boolean {
  const normA = normalizeName(a);
  const normB = normalizeName(b);
  return normA.length > 3 && normB.length > 3 && (normA.includes(normB) || normB.includes(normA));
}

/** Rough km distance using equirectangular approx. */
function approxDistanceKm(a: PlaceResult, b: PlaceResult): number {
  const latDiff = Math.abs(a.place.latitude - b.place.latitude);
  const lngDiff = Math.abs(a.place.longitude - b.place.longitude);
  const avgLat = (a.place.latitude + b.place.latitude) / 2 * Math.PI / 180;
  const kmPerDeg = 111.32;
  const dx = lngDiff * kmPerDeg * Math.cos(avgLat);
  const dy = latDiff * kmPerDeg;
  return Math.sqrt(dx * dx + dy * dy);
}

function isSameLocation(a: PlaceResult, b: PlaceResult): boolean {
  // Both at (0,0) means the AI didn't provide real coords — skip location check.
  if (a.place.latitude === 0 && a.place.longitude === 0 && b.place.latitude === 0 && b.place.longitude === 0) {
    return false;
  }
  // If either is at (0,0), can't compare distances meaningfully
  if (a.place.latitude === 0 && a.place.longitude === 0) return false;
  if (b.place.latitude === 0 && b.place.longitude === 0) return false;
  return approxDistanceKm(a, b) < 0.8; // ~800m — aggressive to catch AI coordinate variation
}

function isSimilarName(a: PlaceResult, b: PlaceResult, strict = false): boolean {
  // Strict mode: ignore city — used for quoted/specific searches where
  // the same restaurant name in different cities is still a duplicate.
  if (!strict) {
    if (normalizeCity(a.place.city) !== normalizeCity(b.place.city)) return false;
  }
  // 2+ word overlap — strong signal
  if (hasHighWordOverlap(a.place.name, b.place.name)) return true;
  // One name fully contains the other when stripped
  if (oneContainsOther(a.place.name, b.place.name)) return true;
  // 1 significant word (≥4 chars) overlap + close coordinates
  if (hasAnySignificantWordOverlap(a.place.name, b.place.name) && approxDistanceKm(a, b) < 2.0) return true;
  return false;
}

function deduplicatePlaces(results: PlaceResult[], strict = false): PlaceResult[] {
  const deduped: PlaceResult[] = [];

  for (const r of results) {
    const isDup = deduped.some(
      (existing) =>
        isSameLocation(existing, r) || isSimilarName(existing, r, strict),
    );
    if (isDup) continue;
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

  // Quote-based search mode: if the user wraps the query in quotes ("like this"),
  // treat it as a specific restaurant name. Otherwise, always do a broad search
  // with 3 batches for maximum variety and coverage.
  const isQuoted = /^["\u201c\u201d].*["\u201c\u201d]$/.test(query.trim());
  // Strip quotes before passing to the AI
  const cleanQuery = isQuoted ? query.trim().replace(/^["\u201c\u201d]|["\u201c\u201d]$/g, '') : query;
  console.log("[Places AI Search] isQuoted:", isQuoted, "cleanQuery:", cleanQuery);

  const batches: string[] = isQuoted
    ? [
        'IMPORTANT: This is a specific restaurant name: "' + cleanQuery + '". Only return places that GENUINELY match this exact name. Do NOT return places that just happen to be the same cuisine type. Do NOT return generic restaurants. If fewer than 5 real places exist worldwide with this name, return ONLY those — do NOT fabricate. If the query includes a brand name (like "LV"), return ONLY places related to that brand.',
      ]
    : [
        'BATCH 1/5: Focus on the MOST FAMOUS and iconic places for this query — the legendary, award-winning, and widely-renowned establishments worldwide.',
        'BATCH 2/5: Focus on HIDDEN GEMS, local favorites, hawker stalls, food courts, neighborhood spots, and lesser-known but excellent places.',
        'BATCH 3/5: Focus on well-known chain restaurants, popular casual spots, and notable mid-range places not covered in batches 1-2.',
        'BATCH 4/5: Focus on street food, night markets, regional specialties, and authentic local spots across different cities/countries.',
        'BATCH 5/5: Focus on fine dining, Michelin-starred, celebrity chef restaurants, and any remaining notable places worldwide for this query.',
      ];

    const isSpecific = isQuoted;
  const batchResults = await Promise.all(
    batches.map((batchHint, batchIndex) =>
      generateObject({
        messages: [
          {
            role: "user",
            content: buildSearchPrompt(cleanQuery, locationContext, batchHint, isSpecific),
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

  // For quoted searches, use strict dedup (ignore city) and limit results.
  const strictDedup = isQuoted;
  const deduped = deduplicatePlaces(allResults, strictDedup);
  // Sort by matchScore descending
  deduped.sort((a, b) => b.matchScore - a.matchScore);
  // Quoted/specific searches: cap at 5 results to avoid showing the same place repeatedly
  const final = isQuoted ? deduped.slice(0, 5) : deduped;

  console.log("[Places AI Search] Total:", allResults.length, "raw, after dedup:", deduped.length, "final:", final.length);

  return {
    results: final,
    totalResults: final.length,
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
