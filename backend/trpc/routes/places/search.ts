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
  phoneNumber: z.string().optional(),
  website: z.string().optional(),
  openingHours: z.array(z.string()).optional(),
  description: z.string(),
  matchScore: z.number().min(0).max(100),
  photoKeyword: z.string(),
});

export const searchPlacesProcedure = publicProcedure
  .input(
    z.object({
      query: z.string().min(1),
      limit: z.number().optional().default(8),
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

IMPORTANT: You MUST only return REAL restaurants and venues that actually exist and are currently operating as of 2025. Do NOT invent or fabricate any place. Every restaurant name, address, and detail must be factual and verifiable.

Return ${input.limit} REAL, existing restaurants/venues that match this query.

For each place:
- Use the REAL name of an actual restaurant/venue
- Use the REAL full street address, city, and country
- Use ACCURATE latitude/longitude coordinates for the actual location
- Rating: use the real approximate rating (e.g. from Google Maps or Yelp)
- Price level 1-4 (1=budget, 4=fine dining) based on real pricing
- Relevant place types (e.g. restaurant, cafe, bar, sushi, italian, etc.)
- Real phone number and website if known (omit if unsure)
- Real opening hours if known (omit if unsure)
- A 2-3 sentence description of what makes this place special, based on real reviews and reputation
- A match score (0-100) based on how well it fits the search query
- A photoKeyword (one word like "sushi", "italian", "cafe", "romantic", "rooftop", "bar", "seafood", "steak", "ramen", "korean", "thai", "chinese", "indian", "mexican", "french", "vegan", "pizza", "bbq", "brunch", "dessert", "modern", "cozy") that best describes the cuisine/vibe

Sort by match score descending. Include a mix of popular well-known spots and hidden gems.
If the query mentions a specific city or location, only return places in that area. If no location is specified, focus on well-known places in major cities.

Do NOT make up restaurant names or addresses. Only include places you are confident actually exist.`,
          },
        ],
        schema: z.object({
          places: z.array(PlaceSchema),
        }),
      });

      console.log("[Places AI Search] Generated", result.places.length, "places");

      const photoKeywords: Record<string, string> = {
        sushi: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800",
        italian: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
        cafe: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
        romantic: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
        rooftop: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
        bar: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800",
        seafood: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800",
        steak: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
        brunch: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800",
        asian: "https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=800",
        mexican: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
        french: "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800",
        indian: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
        pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
        vegan: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
        dessert: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800",
        ramen: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
        bbq: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800",
        thai: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800",
        chinese: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800",
        mediterranean: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
        korean: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800",
        wine: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800",
        cocktail: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800",
        cozy: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800",
        modern: "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800",
        garden: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800",
        breakfast: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800",
        vietnamese: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=800",
      };
      const defaultPhoto = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800";

      const results = result.places.map((place, index) => ({
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
          photoUrls: [photoKeywords[place.photoKeyword.toLowerCase()] || defaultPhoto],
          placeType: place.placeType,
          phoneNumber: place.phoneNumber,
          website: place.website,
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
