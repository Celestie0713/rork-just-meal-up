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
      limit: z.number().optional().default(30),
    })
  )
  .query(async ({ input }) => {
    console.log("[Places AI Search] Query:", input.query);

    try {
      const result = await generateObject({
        messages: [
          {
            role: "user",
            content: `You are a restaurant and venue discovery assistant. A user is searching for: "${input.query}"

CRITICAL RELEVANCE RULES:
1. ONLY return restaurants that DIRECTLY match the search query. If the user searches for "wantan mee", return ONLY places known for wantan mee / wonton noodles. Do NOT return places serving different dishes (e.g. hokkien mee, char kuey teow, laksa) even if they are noodle places.
2. The dish or cuisine in the search query must be the PRIMARY specialty or a well-known menu item of the restaurant.
3. If the query is a specific dish name, focus on places FAMOUS for that exact dish.

CRITICAL ACCURACY RULES:
1. The NAME and ADDRESS of each restaurant MUST belong to the SAME real place. NEVER mix up names with wrong addresses.
2. ONLY return restaurants you are CERTAIN currently exist. Do NOT guess or fabricate.
3. Every field must be for the SAME restaurant.

Return up to ${input.limit} REAL restaurants/venues. Try to return as many relevant results as possible.
Include well-known places, popular local spots, hawker stalls, coffee shops, and hidden gems.
Cast a wide net across different areas and neighborhoods.

For each place provide:
- name: The EXACT official name
- address: The REAL street address of THAT SAME restaurant
- city, country: Location
- latitude/longitude: Coordinates
- rating: 1-5 (use 0 if unknown)
- priceLevel: 1-4 (use 0 if unknown)
- placeType: Array of types
- cuisineEmoji: A single emoji
- phoneNumber: Only if certain (omit if unsure)
- website: Only if certain (omit if unsure)
- googleMapsUrl: Google Maps search URL
- openingHours: Only if certain (omit if unsure)
- description: 2-3 sentences about the place
- matchScore: 0-100 how relevant to the EXACT search query (penalize places that serve a different dish)

Sort by matchScore descending.
If the query mentions a specific city/location, only return places in that area.
If no location specified, return places from popular cities for that cuisine.`,
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
