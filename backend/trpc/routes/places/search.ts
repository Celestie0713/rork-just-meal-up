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

CRITICAL ACCURACY RULES:
1. The NAME and ADDRESS of each restaurant MUST belong to the SAME real place. NEVER mix up names with wrong addresses.
2. ONLY return restaurants you are CERTAIN currently exist. Do NOT guess or fabricate.
3. Double-check: Does this exact restaurant name exist at this exact address? If not sure, SKIP it.
4. It is BETTER to return fewer accurate results than many inaccurate ones.
5. Include a variety: fine dining, casual, street food, cafes, bars, bakeries, food trucks, etc.
6. Every field must be for the SAME restaurant. Do not copy an address from one place and pair it with a different restaurant's name.

Return up to ${input.limit} REAL restaurants/venues where you are confident the name and address match.

For each place provide:
- name: The EXACT official name of the restaurant
- address: The REAL street address OF THAT SAME restaurant. If unsure of exact street number, provide the street name and area.
- city, country: Location of THIS restaurant
- latitude/longitude: Coordinates for THIS specific restaurant
- rating: Real rating (1-5, use 0 if unknown)
- priceLevel: 1-4 (use 0 if unknown)
- placeType: Array of types
- cuisineEmoji: A single emoji for the cuisine
- phoneNumber: Only if certain it belongs to THIS restaurant (omit if unsure)
- website: Only if certain it belongs to THIS restaurant (omit if unsure)
- googleMapsUrl: Google Maps search URL
- openingHours: Real hours (omit if unsure)
- description: 2-3 sentences about the place
- matchScore: 0-100

BEFORE returning each result, verify: "Is this name at this address correct?" If not, remove it.
Sort by matchScore descending. Include popular local spots, hidden gems, and well-known chains.`,
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
