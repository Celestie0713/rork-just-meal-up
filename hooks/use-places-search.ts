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
        content: `You are a restaurant and venue discovery assistant with access to real-world knowledge. A user is searching for: "${query}"

CRITICAL RULES:
1. ONLY return restaurants/venues that you are HIGHLY CONFIDENT actually exist and are currently operating as of 2026.
2. Do NOT invent or guess any restaurant. If you're not sure a place exists, DO NOT include it.
3. Every name, address, phone number, website, and detail MUST be real and accurate.
4. Prefer well-known, established restaurants that are easy to verify.
5. If you cannot find ${limit} real places matching the query, return fewer. Quality over quantity.

Return up to ${limit} REAL, verified restaurants/venues.

For each place provide:
- name: The EXACT real name of the restaurant (not an approximation)
- address: The REAL street address
- city: The city where it's located
- country: The country
- latitude/longitude: Accurate coordinates
- rating: Approximate real rating from Google/Yelp (1-5 scale)
- priceLevel: 1-4 (1=budget, 4=fine dining)
- placeType: Array of types like ["restaurant", "italian", "fine dining"]
- cuisineEmoji: A single emoji that represents the cuisine (e.g. "🍣" for sushi, "🍕" for pizza, "🥩" for steak, "☕" for cafe, "🍜" for ramen, "🌮" for mexican, "🍷" for wine bar, "🥘" for indian, "🍔" for burgers, "🥗" for healthy, "🍰" for desserts/bakery, "🍺" for pub/bar)
- phoneNumber: Real phone number (omit if not confident)
- website: Real website URL (omit if not confident)
- googleMapsUrl: A Google Maps search URL in format "https://www.google.com/maps/search/RESTAURANT+NAME+CITY" (URL-encode the name)
- openingHours: Real hours if known (omit if not confident)
- description: 2-3 sentences about what makes this place special, based on real reputation
- matchScore: 0-100 how well it fits the query

Sort by matchScore descending.
If the query mentions a specific city/location, only return places there.
If no location specified, include places from popular cities worldwide.

BE CONSERVATIVE: It's better to return 3 real places than 8 made-up ones.`,
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
    mutationFn: (query: string) => searchPlacesAI(query, 8),
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
