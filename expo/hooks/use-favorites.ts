import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface Place {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  cuisineEmoji?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  photos?: { photo_reference: string; height: number; width: number }[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
}

const FAVORITE_PLACES_KEY = 'favorite_places_data';

interface FavoritePlaceData {
  placeId: string;
  placeData: Place;
  addedAt: Date;
}

export const [FavoritesProvider, useFavorites] = createContextHook(() => {
  const auth = useAuth();
  const user = auth?.user ?? null;
  const updateUser = useMemo(() => auth?.updateUser ?? (async () => {}), [auth?.updateUser]);
  const [favoritePlacesData, setFavoritePlacesData] = useState<FavoritePlaceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFavoritePlacesData();
  }, []);

  const loadFavoritePlacesData = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITE_PLACES_KEY);
      if (stored) {
        const parsedData = JSON.parse(stored);
        // Convert date strings back to Date objects
        const dataWithDates = parsedData.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }));
        setFavoritePlacesData(dataWithDates);
      }
    } catch (error) {
      console.error('Failed to load favorite places data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFavoritePlacesData = async (data: FavoritePlaceData[]) => {
    try {
      await AsyncStorage.setItem(FAVORITE_PLACES_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save favorite places data:', error);
    }
  };

  const addToFavorites = useCallback(async (place: Place) => {
    console.log('=== FAVORITES HOOK: addToFavorites called ===');
    console.log('Place:', place.name, place.place_id);
    console.log('Current user:', user?.name, user?.id);
    
    if (!user) {
      console.log('No user found, returning false');
      return false;
    }

    const currentFavorites = user.favoritePlaces || [];
    console.log('Current favorites:', currentFavorites);
    
    // Check if already in favorites
    if (currentFavorites.includes(place.place_id)) {
      console.log('Place already in favorites');
      return false;
    }

    try {
      // Add place data to our local storage first
      const newFavoriteData: FavoritePlaceData = {
        placeId: place.place_id,
        placeData: place,
        addedAt: new Date()
      };

      setFavoritePlacesData(prevData => {
        const updatedFavoritesData = [...prevData, newFavoriteData];
        saveFavoritePlacesData(updatedFavoritesData);
        return updatedFavoritesData;
      });
      console.log('Favorites data saved successfully');

      // Then update user's favorite place IDs
      const updatedFavoriteIds = [...currentFavorites, place.place_id];
      console.log('Updated favorite IDs:', updatedFavoriteIds);
      
      await updateUser({ favoritePlaces: updatedFavoriteIds });
      console.log('User updated successfully');
      
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  }, [user, updateUser]);

  const removeFromFavorites = useCallback(async (placeId: string) => {
    if (!user) return false;

    try {
      // Remove from local data first
      setFavoritePlacesData(prevData => {
        const updatedFavoritesData = prevData.filter(item => item.placeId !== placeId);
        saveFavoritePlacesData(updatedFavoritesData);
        return updatedFavoritesData;
      });

      // Then update user's favorite place IDs
      const currentFavorites = user.favoritePlaces || [];
      const updatedFavoriteIds = currentFavorites.filter(id => id !== placeId);
      await updateUser({ favoritePlaces: updatedFavoriteIds });

      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  }, [user, updateUser]);

  const getFavoritePlaces = useMemo(() => {
    if (!user) return [];

    const userFavoriteIds = user.favoritePlaces || [];
    const places: Place[] = [];

    userFavoriteIds.forEach(placeId => {
      const storedPlace = favoritePlacesData.find(item => item.placeId === placeId);
      if (storedPlace) {
        places.push(storedPlace.placeData);
      }
    });

    return places;
  }, [user, favoritePlacesData]);

  const isPlaceInFavorites = useCallback((placeId: string) => {
    if (!user) return false;
    const currentFavorites = user.favoritePlaces || [];
    return currentFavorites.includes(placeId);
  }, [user]);

  return useMemo(() => ({
    favoritePlaces: getFavoritePlaces,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    isPlaceInFavorites,
  }), [getFavoritePlaces, isLoading, addToFavorites, removeFromFavorites, isPlaceInFavorites]);
});