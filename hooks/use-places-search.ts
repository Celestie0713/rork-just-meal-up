import { useState, useCallback } from 'react';
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

async function searchPlacesAI(query: string, limit: number = 8): Promise<PlacesSearchResult> {
  console.log("[Places AI Search] Query:", query);

  const result = await generateObject({
    messages: [
      {
        role: "user",
        content: `You are a restaurant and venue discovery assistant. A user is searching for: "${query}"

CRITICAL ACCURACY RULES:
1. ONLY return restaurants that are FAMOUS, WELL-ESTABLISHED, and you are 100% CERTAIN currently exist and operate in 2026.
2. NEVER invent, fabricate, or guess any restaurant name, address, or detail.
3. Stick to ICONIC and WIDELY KNOWN restaurants - the kind featured in major food publications (Michelin, Eater, Infatuation, TimeOut).
4. Every detail MUST be factually correct. If you are not absolutely sure about a detail, OMIT it.
5. Return AS MANY results as possible (up to ${limit}). Include both famous and lesser-known local favorites.
6. Include restaurants you are at least 80% confident about.
7. Include a wide variety: fine dining, casual, street food, cafes, bars, bakeries, etc.

Return up to ${limit} REAL, verified restaurants/venues.

For each place provide:
- name: The EXACT official name (no approximations or variations)
- address: The real street address (omit street number if unsure, but city must be correct)
- city: The city
- country: The country
- latitude/longitude: Best estimate coordinates for the area
- rating: Approximate rating 1-5 (use 0 if unknown)
- priceLevel: 1-4 (1=budget, 4=fine dining, use 0 if unknown)
- placeType: Array like ["restaurant", "italian", "fine dining"]
- cuisineEmoji: Single emoji for the cuisine type
- phoneNumber: Only if you are certain (omit otherwise)
- website: Only if you are certain (omit otherwise)
- googleMapsUrl: Format "https://www.google.com/maps/search/RESTAURANT+NAME+CITY"
- openingHours: Only if you are certain (omit otherwise)
- description: 2-3 sentences about what makes this place special and well-known
- matchScore: 0-100 how well it fits the query

Sort by matchScore descending.
If the query mentions a specific city/location, only return places in that area.
If no location specified, return places from major cities worldwide.

MAXIMIZE RESULTS: Return as many places as possible (up to ${limit}). Include a diverse mix of well-known spots and popular local favorites. Cast a wide net.`,
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
      googleMapsUrl: place.googleMapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(place.name + ' ' + place.city)}`,
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

export function usePlacesSearch() {
  const [data, setData] = useState<PlacesSearchResult | null>(null);

  const mutation = useMutation({
    mutationFn: (query: string) => searchPlacesAI(query, 20),
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

  return {
    data,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    search,
    refetch: () => {
      if (mutation.variables) {
        mutation.mutate(mutation.variables);
      }
    },
  };
}
