import type { Place, PlaceDetails, GooglePlacesResponse, PlaceDetailsResponse } from '@/types/place';
import { mockPlaces } from '@/mocks/places';

const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY'; // Replace with your actual API key
const BASE_URL = 'https://maps.googleapis.com/maps/api/place';
const USE_MOCK_DATA = GOOGLE_PLACES_API_KEY === 'YOUR_GOOGLE_PLACES_API_KEY';

export class GooglePlacesService {
  static async searchNearby(
    latitude: number,
    longitude: number,
    radius: number = 1500,
    type: string = 'restaurant'
  ): Promise<Place[]> {
    if (USE_MOCK_DATA) {
      console.log('Using mock data for nearby places');
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockPlaces;
    }

    try {
      const url = `${BASE_URL}/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data: GooglePlacesResponse = await response.json();
      
      if (data.status === 'OK') {
        return data.results;
      } else {
        console.error('Google Places API error:', data.status);
        return [];
      }
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      return [];
    }
  }

  static async searchByText(
    query: string,
    latitude?: number,
    longitude?: number
  ): Promise<Place[]> {
    if (USE_MOCK_DATA) {
      console.log('Using mock data for text search:', query);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      // Filter mock places by query
      return mockPlaces.filter(place => 
        place.name.toLowerCase().includes(query.toLowerCase()) ||
        place.vicinity?.toLowerCase().includes(query.toLowerCase()) ||
        place.types.some(type => type.toLowerCase().includes(query.toLowerCase()))
      );
    }

    try {
      let url = `${BASE_URL}/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
      
      if (latitude && longitude) {
        url += `&location=${latitude},${longitude}&radius=50000`;
      }
      
      const response = await fetch(url);
      const data: GooglePlacesResponse = await response.json();
      
      if (data.status === 'OK') {
        return data.results;
      } else {
        console.error('Google Places API error:', data.status);
        return [];
      }
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }

  static async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (USE_MOCK_DATA) {
      console.log('Using mock data for place details:', placeId);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      const mockPlace = mockPlaces.find(place => place.place_id === placeId);
      if (mockPlace) {
        return {
          ...mockPlace,
          formatted_address: mockPlace.address,
          formatted_phone_number: '+1 (555) 123-4567',
          website: 'https://example.com',
          // Add multiple mock photos
          photos: [
            { photo_reference: 'mock_photo_1', height: 400, width: 600 },
            { photo_reference: 'mock_photo_2', height: 400, width: 600 },
            { photo_reference: 'mock_photo_3', height: 400, width: 600 },
            { photo_reference: 'mock_photo_4', height: 400, width: 600 },
            { photo_reference: 'mock_photo_5', height: 400, width: 600 },
          ],
          reviews: [
            {
              author_name: 'John Doe',
              rating: 5,
              text: 'Amazing food and great service! Highly recommended.',
              time: Date.now() - 86400000,
            },
            {
              author_name: 'Jane Smith',
              rating: 4,
              text: 'Good atmosphere and delicious meals. Will come back again.',
              time: Date.now() - 172800000,
            },
          ],
        };
      }
      return null;
    }

    try {
      const url = `${BASE_URL}/details/json?place_id=${placeId}&fields=name,rating,formatted_phone_number,formatted_address,opening_hours,website,reviews,photos,geometry&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data: PlaceDetailsResponse = await response.json();
      
      if (data.status === 'OK') {
        return data.result;
      } else {
        console.error('Google Places API error:', data.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  }

  static getPhotoUrl(
    photoReference: string,
    maxWidth: number = 400
  ): string {
    if (USE_MOCK_DATA || photoReference.startsWith('mock_')) {
      // Return a placeholder image from Unsplash for mock data
      // Use consistent mapping for each photo reference
      const photoImageMap: { [key: string]: string } = {
        'mock_photo_1': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop&auto=format',
        'mock_photo_2': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=400&fit=crop&auto=format',
        'mock_photo_3': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=400&fit=crop&auto=format',
        'mock_photo_4': 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=400&fit=crop&auto=format',
        'mock_photo_5': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop&auto=format',
      };
      
      // Return the specific image for this photo reference, or fallback to first image
      return photoImageMap[photoReference] || photoImageMap['mock_photo_1'];
    }
    return `${BASE_URL}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
  }

  static getPriceRangeText(priceLevel?: number): string {
    if (!priceLevel) return 'Price not available';
    return '$'.repeat(priceLevel);
  }

  static getCuisineFromTypes(types: string[]): string {
    const cuisineTypes = {
      'bakery': 'Bakery',
      'bar': 'Bar',
      'cafe': 'Cafe',
      'meal_delivery': 'Delivery',
      'meal_takeaway': 'Takeaway',
      'restaurant': 'Restaurant',
      'food': 'Food',
    };

    for (const type of types) {
      if (cuisineTypes[type as keyof typeof cuisineTypes]) {
        return cuisineTypes[type as keyof typeof cuisineTypes];
      }
    }
    
    return 'Restaurant';
  }
}