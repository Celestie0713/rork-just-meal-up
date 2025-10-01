import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { mockPlaces } from '@/mocks/places';
import type { Place } from '@/types/place';

const FAVORITE_PLACES_KEY = 'favorite_places_data';

interface FavoritePlaceData {
  placeId: string;
  placeData: Place;
  addedAt: Date;
}

export const [FavoritesProvider, useFavorites] = createContextHook(() => {
  const { user, updateUser } = useAuth();
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
      // Add to user's favorite place IDs
      const updatedFavoriteIds = [...currentFavorites, place.place_id];
      console.log('Updated favorite IDs:', updatedFavoriteIds);
      
      await updateUser({ favoritePlaces: updatedFavoriteIds });
      console.log('User updated successfully');

      // Add place data to our local storage
      const newFavoriteData: FavoritePlaceData = {
        placeId: place.place_id,
        placeData: place,
        addedAt: new Date()
      };

      setFavoritePlacesData(prevData => {
        const updatedFavoritesData = [...prevData, newFavoriteData];
        console.log('Updating favorites data:', updatedFavoritesData.length, 'items');
        saveFavoritePlacesData(updatedFavoritesData);
        return updatedFavoritesData;
      });
      
      console.log('Favorites data saved successfully');
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  }, [user, updateUser]);

  const removeFromFavorites = useCallback(async (placeId: string) => {
    if (!user) return false;

    const currentFavorites = user.favoritePlaces || [];
    const updatedFavoriteIds = currentFavorites.filter(id => id !== placeId);
    await updateUser({ favoritePlaces: updatedFavoriteIds });

    // Remove from local data
    setFavoritePlacesData(prevData => {
      const updatedFavoritesData = prevData.filter(item => item.placeId !== placeId);
      saveFavoritePlacesData(updatedFavoritesData);
      return updatedFavoritesData;
    });

    return true;
  }, [user, updateUser]);

  const getFavoritePlaces = useMemo(() => {
    if (!user) return [];

    const userFavoriteIds = user.favoritePlaces || [];
    const places: Place[] = [];

    userFavoriteIds.forEach(placeId => {
      // First try to find in our stored data
      const storedPlace = favoritePlacesData.find(item => item.placeId === placeId);
      if (storedPlace) {
        places.push(storedPlace.placeData);
      } else {
        // Fallback to mock places for existing data
        const mockPlace = mockPlaces.find(place => place.place_id === placeId);
        if (mockPlace) {
          places.push(mockPlace);
        }
      }
    });

    return places;
  }, [favoritePlacesData, user]);

  const isPlaceInFavorites = useCallback((placeId: string) => {
    if (!user) return false;
    const currentFavorites = user.favoritePlaces || [];
    return currentFavorites.includes(placeId);
  }, [user]);

  return {
    favoritePlaces: getFavoritePlaces,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    isPlaceInFavorites,
  };
});