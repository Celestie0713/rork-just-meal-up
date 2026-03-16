import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { generateObject } from "@rork-ai/toolkit-sdk";

const PlaceSchema = z.object({
  name: z.string(),
  address: z.string(),
  city: z.string(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  rating: z.number().min(0).max(5),
  priceLevel: z.number().min(1).max(4),
  placeType: z.array(z.string()),
  cuisineEmoji: z.string(),
  phoneNumber: z.string().optional(),
  website: z.string().optional(),
  googleMapsUrl: z.string().optional(),
  openingHours: z.array(z.string()).optional(),
  description: z.string(),
  matchScore: z.number().min(0).max(100),
});

export const searchPlacesProcedure = publicProcedure
  .input(
    z.object({
      query: z.string().min(1),
      limit: z.number().optional().default(20),
    })
  )
  .query(async ({ input }) => {
    console.log("[Places AI Search] Query:", input.query);

    try {
      const result = await generateObject({
        messages: [
          {
            role: "user",
            content: `You are a restaurant and venue discovery assistant with access to real-world knowledge. A user is searching for: "${input.query}"

CRITICAL RULES:
1. Return restaurants/venues that you are reasonably confident exist and are currently operating.
2. Do NOT completely fabricate restaurants, but include both famous and lesser-known local favorites.
3. Every name and address should be as accurate as possible.
4. Include a wide variety: fine dining, casual, street food, cafes, bars, bakeries, food trucks, etc.
5. Try to return the MAXIMUM number of results (up to ${input.limit}). Cast a wide net.

Return up to ${input.limit} REAL, verified restaurants/venues.

For each place provide:
- name: The EXACT real name of the restaurant
- address: The REAL street address
- city, country: Location
- latitude/longitude: Accurate coordinates
- rating: Real rating (1-5)
- priceLevel: 1-4
- placeType: Array of types
- cuisineEmoji: A single emoji for the cuisine
- phoneNumber: Real phone (omit if unsure)
- website: Real URL (omit if unsure)
- googleMapsUrl: Google Maps search URL
- openingHours: Real hours (omit if unsure)
- description: 2-3 sentences about the place
- matchScore: 0-100

Sort by matchScore descending. MAXIMIZE RESULTS: return as many diverse places as possible up to ${input.limit}. Include popular local spots, hidden gems, and well-known chains.`,
          },
        ],
        schema: z.object({
          places: z.array(PlaceSchema),
        }),
      });

      console.log("[Places AI Search] Generated", result.places.length, "places");

      const results = result.places.map((place: z.infer<typeof PlaceSchema>, index: number) => ({
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
          cuisineEmoji: place.cuisineEmoji || '\ud83c\udf7d\ufe0f',
          phoneNumber: place.phoneNumber,
          website: place.website,
          googleMapsUrl: place.googleMapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(place.name + ' ' + place.city)}`,
          openingHours: place.openingHours,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        description: place.description,
        matchScore: place.matchScore,
      }));

      return {
        results,
        totalResults: results.length,
        source: "ai" as const,
      };
    } catch (error) {
      console.error("[Places AI Search] Error:", error);
      throw new Error("Failed to search places. Please try again.");
    }
  });
