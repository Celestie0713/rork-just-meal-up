export interface Place {
  id: string;
  name: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  addedBy: string[];
  notes?: string;
  createdAt: Date;
  photos?: string[];
}

export interface PlaceDistance {
  place: Place;
  distanceFromUser: number;
  distanceFromInvitee?: number;
  totalDistance?: number;
  balanceScore?: number;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}
