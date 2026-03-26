export type Place = {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  rating?: number;
  priceLevel?: number;
  photoUrls: string[];
  placeType: string[];
  phoneNumber?: string;
  website?: string;
  openingHours?: string[];
  googlePlaceId?: string;
  createdAt: string;
  updatedAt: string;
};

export type PlaceSearchResult = {
  place: Place;
  description: string;
  matchScore: number;
};

export type PlaceSearchResponse = {
  results: PlaceSearchResult[];
  source: 'internal' | 'google' | 'hybrid';
  totalResults: number;
};
