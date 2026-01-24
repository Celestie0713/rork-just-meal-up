import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { generateObject } from "@rork-ai/toolkit-sdk";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

export const searchPlacesProcedure = publicProcedure
  .input(
    z.object({
      query: z.string().min(1),
      limit: z.number().optional().default(10),
    })
  )
  .query(async ({ input }) => {
    console.log('Searching places for query:', input.query);

    const internalPlaces = searchInternalDB(input.query);
    console.log('Internal DB results:', internalPlaces.length);

    let allPlaces = internalPlaces;
    let source: 'internal' | 'google' | 'hybrid' = 'internal';

    if (internalPlaces.length < 5) {
      console.log('Not enough internal results, falling back to Google Places API');
      const googlePlaces = await fetchGooglePlaces(input.query);
      console.log('Google Places results:', googlePlaces.length);
      
      if (googlePlaces.length > 0) {
        allPlaces = [...internalPlaces, ...googlePlaces];
        source = internalPlaces.length > 0 ? 'hybrid' : 'google';
        
        await saveNewPlacesToDB(googlePlaces);
      }
    }

    if (allPlaces.length === 0) {
      return {
        results: [],
        source,
        totalResults: 0,
      };
    }

    const rankedResults = await rankPlacesWithGPT(input.query, allPlaces, input.limit);

    return {
      results: rankedResults,
      source,
      totalResults: rankedResults.length,
    };
  });

function searchInternalDB(query: string) {
  const mockPlaces = [
    {
      id: 'place-1',
      name: 'Sushi Hanoi',
      address: '45 Xuan Dieu Street, Tay Ho District',
      city: 'Hanoi',
      country: 'Vietnam',
      latitude: 21.0583,
      longitude: 105.8239,
      rating: 4.5,
      priceLevel: 3,
      photoUrls: [
        'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
        'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800',
      ],
      placeType: ['restaurant', 'sushi', 'japanese'],
      phoneNumber: '+84 24 3718 1018',
      website: 'https://sushihanoi.com',
      openingHours: ['Mon-Sun: 11:00 AM - 10:00 PM'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'place-2',
      name: 'Westlake Sushi Bar',
      address: '89 To Ngoc Van, Tay Ho District',
      city: 'Hanoi',
      country: 'Vietnam',
      latitude: 21.0645,
      longitude: 105.8186,
      rating: 4.3,
      priceLevel: 2,
      photoUrls: [
        'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=800',
        'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800',
      ],
      placeType: ['restaurant', 'sushi', 'japanese', 'bar'],
      phoneNumber: '+84 24 3719 2020',
      openingHours: ['Mon-Sun: 5:00 PM - 11:00 PM'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'place-3',
      name: 'Chill Sushi Lounge',
      address: '12 Quang An Street, Tay Ho District',
      city: 'Hanoi',
      country: 'Vietnam',
      latitude: 21.0621,
      longitude: 105.8205,
      rating: 4.7,
      priceLevel: 3,
      photoUrls: [
        'https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=800',
        'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
      ],
      placeType: ['restaurant', 'sushi', 'lounge', 'japanese'],
      phoneNumber: '+84 24 3715 3030',
      website: 'https://chillsushi.vn',
      openingHours: ['Tue-Sun: 12:00 PM - 11:00 PM', 'Mon: Closed'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'place-4',
      name: 'The Sushi Club',
      address: '34 Yen Phu Street, Tay Ho District',
      city: 'Hanoi',
      country: 'Vietnam',
      latitude: 21.0598,
      longitude: 105.8223,
      rating: 4.6,
      priceLevel: 4,
      photoUrls: [
        'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800',
        'https://images.unsplash.com/photo-1564489563601-c53cfc451e93?w=800',
      ],
      placeType: ['restaurant', 'sushi', 'fine_dining', 'japanese'],
      phoneNumber: '+84 24 3717 4040',
      website: 'https://thesushiclub.vn',
      openingHours: ['Mon-Sun: 11:30 AM - 2:30 PM, 6:00 PM - 10:30 PM'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'place-5',
      name: 'Sakura Sushi Hanoi',
      address: '56 Au Co Street, Tay Ho District',
      city: 'Hanoi',
      country: 'Vietnam',
      latitude: 21.0610,
      longitude: 105.8195,
      rating: 4.4,
      priceLevel: 2,
      photoUrls: [
        'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
        'https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=800',
      ],
      placeType: ['restaurant', 'sushi', 'japanese', 'casual'],
      phoneNumber: '+84 24 3716 5050',
      openingHours: ['Mon-Sun: 11:00 AM - 10:30 PM'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const lowerQuery = query.toLowerCase();
  return mockPlaces.filter((place) => {
    const searchableText = `${place.name} ${place.address} ${place.city} ${place.placeType.join(' ')}`.toLowerCase();
    return searchableText.includes(lowerQuery);
  });
}

async function fetchGooglePlaces(query: string) {
  if (!GOOGLE_PLACES_API_KEY) {
    console.log('Google Places API key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`
    );

    const data = await response.json();

    if (data.status !== 'OK') {
      console.log('Google Places API error:', data.status);
      return [];
    }

    return data.results.map((result: any) => ({
      id: `google-${result.place_id}`,
      name: result.name,
      address: result.formatted_address,
      city: extractCity(result.formatted_address),
      country: extractCountry(result.formatted_address),
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      rating: result.rating,
      priceLevel: result.price_level,
      photoUrls: result.photos
        ? result.photos.slice(0, 2).map(
            (photo: any) =>
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
          )
        : [],
      placeType: result.types || [],
      googlePlaceId: result.place_id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching Google Places:', error);
    return [];
  }
}

function extractCity(address: string): string {
  const parts = address.split(',');
  return parts.length > 1 ? parts[parts.length - 2].trim() : '';
}

function extractCountry(address: string): string {
  const parts = address.split(',');
  return parts.length > 0 ? parts[parts.length - 1].trim() : '';
}

async function saveNewPlacesToDB(places: any[]) {
  console.log(`Saving ${places.length} new places to DB`);
}

async function rankPlacesWithGPT(query: string, places: any[], limit: number) {
  try {
    const result = await generateObject({
      messages: [
        {
          role: 'user',
          content: `You are a dating app assistant. A user searched for: "${query}"

Here are the available places:
${places.map((p, i) => `${i + 1}. ${p.name} - ${p.address} (Rating: ${p.rating || 'N/A'}, Types: ${p.placeType.join(', ')})`).join('\n')}

Rank the top ${limit} places that best match this search query for a date. For each place, provide:
1. A short, engaging description (2-3 sentences) about why it's good for a date
2. A match score (0-100)
3. A virtual gift suggestion with name, description, and emoji that would be perfect for this place/date

Return the results in order of best match to worst.`,
        },
      ],
      schema: z.object({
        rankedPlaces: z.array(
          z.object({
            placeIndex: z.number().describe('Index of the place from the list (0-based)'),
            description: z.string().describe('Short engaging description for the date'),
            matchScore: z.number().min(0).max(100).describe('How well it matches the query'),
            suggestedGift: z.object({
              name: z.string().describe('Name of the virtual gift'),
              description: z.string().describe('Why this gift fits the place'),
              emoji: z.string().describe('Emoji representing the gift'),
            }),
          })
        ),
      }),
    });

    return result.rankedPlaces
      .filter((r) => r.placeIndex >= 0 && r.placeIndex < places.length)
      .map((ranked) => ({
        place: places[ranked.placeIndex],
        description: ranked.description,
        matchScore: ranked.matchScore,
        suggestedGift: ranked.suggestedGift,
      }))
      .slice(0, limit);
  } catch (error) {
    console.error('Error ranking places with GPT:', error);
    
    return places.slice(0, limit).map((place) => ({
      place,
      description: `${place.name} is a great spot in ${place.city}. Perfect for a memorable meal!`,
      matchScore: 75,
      suggestedGift: {
        name: 'Rose Bouquet',
        description: 'A classic romantic gesture',
        emoji: '🌹',
      },
    }));
  }
}
