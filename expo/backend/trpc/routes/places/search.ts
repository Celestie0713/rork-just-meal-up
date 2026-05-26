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

CRITICAL QUANTITY REQUIREMENT:
- You MUST return at least 20 REAL restaurants/venues. Aim for the full ${input.limit}.
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
- name: The EXACT official name
- address: Only include street number+name if 100% certain. Otherwise use area/neighborhood/mall/hawker center description. Include stall numbers for hawker stalls.
- city, country: Location
- latitude/longitude: Coordinates
- rating: 1-5 (use 0 if unknown)
- priceLevel: 1-4 (use 0 if unknown)
- placeType: Array of types
- cuisineEmoji: A single emoji
- phoneNumber: Only if certain (omit if unsure)
- website: Only if certain (omit if unsure)
- googleMapsUrl: CRITICAL — this is the primary way users will find the restaurant. ALWAYS provide a working Google Maps search URL. Format: "https://www.google.com/maps/search/?api=1&query=RESTAURANT+NAME+CITY+COUNTRY". Keep it simple — just the restaurant name + city + country is enough for Google Maps to find it.
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
        maxOutputTokens: 16000,
        temperature: 0.7,
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
          googleMapsUrl: place.latitude && place.longitude
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ', ' + place.city)}&center=${place.latitude},${place.longitude}&zoom=17`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ', ' + place.city + ', ' + place.country)}`,
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
