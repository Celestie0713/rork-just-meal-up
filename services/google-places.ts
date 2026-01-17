import type { Place, PlaceDetails } from '@/types/place';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export class GooglePlacesService {
  static async searchNearby(
    latitude: number,
    longitude: number,
    radius: number = 1500,
    type: string = 'restaurant'
  ): Promise<Place[]> {
    try {
      console.log('Searching nearby places with OSM:', { latitude, longitude, radius, type });
      
      const amenityType = type === 'restaurant' ? 'restaurant|cafe|fast_food|bar|pub' : type;
      const radiusInMeters = radius;
      
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"~"${amenityType}"](around:${radiusInMeters},${latitude},${longitude});
          way["amenity"~"${amenityType}"](around:${radiusInMeters},${latitude},${longitude});
        );
        out body;
        >;
        out skel qt;
      `;
      
      const response = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });
      
      const data = await response.json();
      console.log('OSM nearby results:', data.elements?.length || 0, 'places found');
      
      if (!data.elements || data.elements.length === 0) {
        return [];
      }
      
      const places: Place[] = data.elements
        .filter((element: any) => element.tags?.name)
        .map((element: any) => this.convertOSMToPlace(element))
        .slice(0, 20);
      
      return places;
    } catch (error) {
      console.error('Error fetching nearby places from OSM:', error);
      return [];
    }
  }

  static async searchByText(
    query: string,
    latitude?: number,
    longitude?: number
  ): Promise<Place[]> {
    try {
      console.log('Searching places by text with OSM:', query);
      
      let url = `${NOMINATIM_URL}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=20`;
      
      if (latitude && longitude) {
        url += `&viewbox=${longitude - 0.5},${latitude - 0.5},${longitude + 0.5},${latitude + 0.5}&bounded=1`;
      }
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MealUpApp/1.0',
        },
      });
      
      const data = await response.json();
      console.log('OSM text search results:', data.length, 'places found');
      
      if (!data || data.length === 0) {
        return [];
      }
      
      const places: Place[] = data
        .filter((item: any) => item.display_name)
        .map((item: any) => this.convertNominatimToPlace(item));
      
      return places;
    } catch (error) {
      console.error('Error searching places from OSM:', error);
      return [];
    }
  }

  static async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
      console.log('Fetching place details from OSM:', placeId);
      
      const [osmType, osmId] = placeId.split('/');
      
      if (!osmType || !osmId) {
        console.error('Invalid OSM place ID format:', placeId);
        return null;
      }
      
      const url = `${NOMINATIM_URL}/lookup?osm_ids=${osmType[0].toUpperCase()}${osmId}&format=json&addressdetails=1&extratags=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MealUpApp/1.0',
        },
      });
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        console.error('No details found for place:', placeId);
        return null;
      }
      
      const placeData = data[0];
      const place = this.convertNominatimToPlace(placeData);
      
      const details: PlaceDetails = {
        ...place,
        formatted_address: placeData.display_name,
        formatted_phone_number: placeData.extratags?.phone || placeData.address?.phone,
        website: placeData.extratags?.website || placeData.extratags?.url,
        photos: this.getPlacePhotos(place.name, placeData.extratags),
        reviews: [],
      };
      
      return details;
    } catch (error) {
      console.error('Error fetching place details from OSM:', error);
      return null;
    }
  }

  static getPhotoUrl(
    photoReference: string,
    maxWidth: number = 400
  ): string {
    return photoReference;
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
      'fast_food': 'Fast Food',
      'pub': 'Pub',
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

  private static convertOSMToPlace(element: any): Place {
    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;
    const tags = element.tags || {};
    
    const amenityType = tags.amenity || 'restaurant';
    const cuisine = tags.cuisine || '';
    
    return {
      id: `${element.type}/${element.id}`,
      place_id: `${element.type}/${element.id}`,
      name: tags.name || 'Unnamed Place',
      address: this.formatAddress(tags),
      vicinity: this.formatAddress(tags),
      rating: undefined,
      priceLevel: undefined,
      types: [amenityType, cuisine].filter(Boolean),
      geometry: {
        location: {
          lat: lat || 0,
          lng: lon || 0,
        },
      },
      photos: this.getPlacePhotos(tags.name, tags),
      opening_hours: tags.opening_hours ? {
        open_now: true,
        weekday_text: [tags.opening_hours],
      } : undefined,
    };
  }

  private static convertNominatimToPlace(item: any): Place {
    const address = item.address || {};
    const tags = item.extratags || {};
    const amenityType = tags.amenity || item.type || 'restaurant';
    
    return {
      id: `${item.osm_type}/${item.osm_id}`,
      place_id: `${item.osm_type}/${item.osm_id}`,
      name: item.namedetails?.name || item.display_name?.split(',')[0] || 'Unnamed Place',
      address: item.display_name,
      vicinity: `${address.road || ''} ${address.city || address.town || ''}`.trim(),
      rating: undefined,
      priceLevel: undefined,
      types: [amenityType],
      geometry: {
        location: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        },
      },
      photos: this.getPlacePhotos(item.display_name, tags),
    };
  }

  private static formatAddress(tags: any): string {
    const parts = [
      tags['addr:street'],
      tags['addr:housenumber'],
      tags['addr:city'],
    ].filter(Boolean);
    
    return parts.join(', ') || 'Address not available';
  }

  private static getPlacePhotos(name: string, tags: any): any[] {
    const restaurantImages = [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop&auto=format',
    ];
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const imageUrl = restaurantImages[hash % restaurantImages.length];
    
    return [
      { photo_reference: imageUrl, height: 400, width: 600 },
    ];
  }
}