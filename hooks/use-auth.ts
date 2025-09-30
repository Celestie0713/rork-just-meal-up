import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/user';

const CURRENT_USER_KEY = 'current_user';

const mockCurrentUser: User = {
  id: '1',
  name: 'Alex Chen',
  age: 28,
  bio: 'Food enthusiast who believes the best conversations happen over great meals. Love trying new cuisines and meeting interesting people!',
  photos: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop'
  ],
  location: 'San Francisco, CA',
  membershipTier: 'free',
  isOnline: true,
  ethnicity: 'english, mandarin, cantonese',
  favoritePlaces: [], // Start with empty array, user can add places
  preferences: {
    ageRange: [25, 35],
    maxDistance: 25,
    cuisinePreferences: ['Italian', 'Japanese', 'Mexican'],
    preferredEthnicity: ['english', 'mandarin', 'cantonese'],
    incomeLevel: '$75k - $100k',
    preferredIncomeLevel: '$50k - $100k'
  }
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // For demo purposes, set mock user
        setUser(mockCurrentUser);
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mockCurrentUser));
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = useCallback(async (updates: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      
      const updatedUser = { ...prevUser, ...updates };
      AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  return {
    user,
    isLoading,
    updateUser,
    isAuthenticated: !!user,
  };
});