export interface Place {
  id: string;
  name: string;
  address: string;
  vicinity?: string;
  rating?: number;
  priceLevel?: number;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: {
    photo_reference: string;
    height: number;
    width: number;
  }[];
  opening_hours?: {
    open_now: boolean;
    periods?: {
      close: {
        day: number;
        time: string;
      };
      open: {
        day: number;
        time: string;
      };
    }[];
    weekday_text?: string[];
  };
  place_id: string;
}

export interface PlaceDetails extends Place {
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  reviews?: {
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }[];
}

export interface GooglePlacesResponse {
  results: Place[];
  status: string;
  next_page_token?: string;
}

export interface PlaceDetailsResponse {
  result: PlaceDetails;
  status: string;
}