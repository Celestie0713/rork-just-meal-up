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
1. The NAME and ADDRESS of each restaurant MUST belong to the SAME real place. NEVER mix up names with wrong addresses.
2. ONLY return restaurants you are CERTAIN currently exist. Do NOT guess or fabricate.
3. Double-check: Does this exact restaurant name exist at this exact address? If not sure, SKIP it.
4. It is BETTER to return fewer accurate results than many inaccurate ones.
5. Include a variety: fine dining, casual, street food, cafes, bars, bakeries, etc.
6. Every field must be for the SAME restaurant. Do not copy an address from one place and pair it with a different restaurant's name.

Return up to ${limit} REAL restaurants/venues where you are confident the name and address match.

For each place provide:
- name: The EXACT official name of the restaurant
- address: The REAL street address OF THAT SAME restaurant (not a different one). If unsure of exact street number, provide the street name and area.
- city: The city where THIS restaurant is located
- country: The country
- latitude/longitude: Coordinates for THIS specific restaurant location
- rating: Approximate rating 1-5 (use 0 if unknown)
- priceLevel: 1-4 (1=budget, 4=fine dining, use 0 if unknown)
- placeType: Array like ["restaurant", "italian", "fine dining"]
- cuisineEmoji: Single emoji for the cuisine type
- phoneNumber: Only if you are certain it belongs to THIS restaurant (omit otherwise)
- website: Only if you are certain it belongs to THIS restaurant (omit otherwise)
- googleMapsUrl: Format "https://www.google.com/maps/search/RESTAURANT+NAME+CITY"
- openingHours: Only if you are certain (omit otherwise)
- description: 2-3 sentences about what makes this place special
- matchScore: 0-100 how well it fits the query

BEFORE returning each result, verify: "Is this name at this address correct?" If not, remove it.

Sort by matchScore descending.
If the query mentions a specific city/location, only return places in that area.
If no location specified, return places from major cities worldwide.`,
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
