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
      
      const placesWithNames = data.elements.filter((element: any) => element.tags?.name);
      
      const placesWithDetails = await Promise.all(
        placesWithNames.slice(0, 20).map(async (element: any) => {
          const enrichedPlace = await this.enrichPlaceWithNominatim(element);
          return enrichedPlace || this.convertOSMToPlace(element);
        })
      );
      
      return placesWithDetails;
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
      
      const imageUrl = placeData.extratags?.image || placeData.extratags?.['image:url'];
      
      const details: PlaceDetails = {
        ...place,
        formatted_address: placeData.display_name,
        formatted_phone_number: placeData.extratags?.phone || placeData.address?.phone,
        website: placeData.extratags?.website || placeData.extratags?.url,
        photos: imageUrl ? [{ photo_reference: imageUrl, height: 400, width: 600 }] : [],
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
    
    const formattedAddress = this.formatAddress(tags);
    const vicinity = formattedAddress !== 'Location details unavailable' 
      ? formattedAddress 
      : `Near ${lat?.toFixed(4)}, ${lon?.toFixed(4)}`;
    
    const imageUrl = tags.image || tags['image:url'];
    
    return {
      id: `${element.type}/${element.id}`,
      place_id: `${element.type}/${element.id}`,
      name: tags.name || 'Unnamed Place',
      address: formattedAddress,
      vicinity: vicinity,
      rating: undefined,
      priceLevel: undefined,
      types: [amenityType, cuisine].filter(Boolean),
      geometry: {
        location: {
          lat: lat || 0,
          lng: lon || 0,
        },
      },
      photos: imageUrl ? [{ photo_reference: imageUrl, height: 400, width: 600 }] : [],
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
    
    const streetAddress = [
      address.house_number,
      address.road || address.street,
    ].filter(Boolean).join(' ');
    
    const cityAddress = [
      address.suburb || address.neighbourhood,
      address.city || address.town || address.village,
    ].filter(Boolean).join(', ');
    
    const vicinity = streetAddress || cityAddress || 'Location details unavailable';
    
    const imageUrl = tags.image || tags['image:url'];
    
    return {
      id: `${item.osm_type}/${item.osm_id}`,
      place_id: `${item.osm_type}/${item.osm_id}`,
      name: item.namedetails?.name || item.display_name?.split(',')[0] || 'Unnamed Place',
      address: item.display_name,
      vicinity: vicinity,
      rating: undefined,
      priceLevel: undefined,
      types: [amenityType],
      geometry: {
        location: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        },
      },
      photos: imageUrl ? [{ photo_reference: imageUrl, height: 400, width: 600 }] : [],
    };
  }

  private static async enrichPlaceWithNominatim(element: any): Promise<Place | null> {
    try {
      const osmType = element.type;
      const osmId = element.id;
      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;
      
      if (!lat || !lon) return null;
      
      const url = `${NOMINATIM_URL}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&extratags=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MealUpApp/1.0',
        },
      });
      
      const data = await response.json();
      
      if (!data || data.error) {
        return null;
      }
      
      const tags = element.tags || {};
      const address = data.address || {};
      const extratags = data.extratags || {};
      
      const streetAddress = [
        address.house_number,
        address.road || address.street,
      ].filter(Boolean).join(' ');
      
      const cityAddress = [
        address.suburb || address.neighbourhood,
        address.city || address.town || address.village,
      ].filter(Boolean).join(', ');
      
      const fullAddress = [streetAddress, cityAddress, address.country]
        .filter(Boolean)
        .join(', ');
      
      const amenityType = tags.amenity || extratags.amenity || 'restaurant';
      const cuisine = tags.cuisine || extratags.cuisine || '';
      
      const imageUrl = extratags.image || extratags['image:url'] || tags.image;
      
      return {
        id: `${osmType}/${osmId}`,
        place_id: `${osmType}/${osmId}`,
        name: tags.name || data.name || 'Unnamed Place',
        address: fullAddress || data.display_name,
        vicinity: streetAddress || cityAddress || 'Location details unavailable',
        rating: undefined,
        priceLevel: undefined,
        types: [amenityType, cuisine].filter(Boolean),
        geometry: {
          location: {
            lat: parseFloat(lat),
            lng: parseFloat(lon),
          },
        },
        photos: imageUrl ? [{ photo_reference: imageUrl, height: 400, width: 600 }] : [],
        opening_hours: tags.opening_hours ? {
          open_now: true,
          weekday_text: [tags.opening_hours],
        } : undefined,
      };
    } catch (error) {
      console.error('Error enriching place with Nominatim:', error);
      return null;
    }
  }

  private static formatAddress(tags: any): string {
    const parts = [
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:city'],
    ].filter(Boolean);
    
    if (parts.length > 0) {
      return parts.join(', ');
    }
    
    return 'Location details unavailable';
  }

  private static getPlacePhotos(name: string, tags: any): any[] {
    const imageUrl = tags.image || tags['image:url'];
    
    if (imageUrl) {
      return [
        { photo_reference: imageUrl, height: 400, width: 600 },
      ];
    }
    
    return [];
  }
}