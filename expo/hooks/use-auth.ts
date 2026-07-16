import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/user';
import { getCurrencyFromCountry } from '@/constants/currencies';

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
  country: 'United States',
  phone: '+1 (415) 555-0142',
  currency: '$',
  membershipTier: 'premium',
  isOnline: true,
  ethnicity: ['English', 'Mandarin', 'Cantonese'],
  favoritePlaces: ['mock_place_1', 'mock_place_2', 'mock_place_3'],
  joinedGroupIds: ['3'],
  relationshipStatus: 'single',
  intention: 'relationship' as const,
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
        const parsed = JSON.parse(stored) as User;

        // One-time migration: the old signUp hardcoded age: 25.
        // Strip it so existing cached users see "Not specified" until they
        // set their own age on the profile page.
        const AGE_MIGRATION_KEY = 'user_schema_v2_age_fix';
        const ageMigrated = await AsyncStorage.getItem(AGE_MIGRATION_KEY);
        if (!ageMigrated) {
          if (parsed.age != null) {
            delete (parsed as Partial<User>).age;
            await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(parsed));
          }
          await AsyncStorage.setItem(AGE_MIGRATION_KEY, 'done');
        }

        // One-time migration: ethnicity changed from string to string[].
        // Convert any old comma-separated string values to arrays.
        const ETHNICITY_MIGRATION_KEY = 'user_schema_v3_ethnicity_array';
        const ethnicityMigrated = await AsyncStorage.getItem(ETHNICITY_MIGRATION_KEY);
        if (!ethnicityMigrated) {
          if (typeof parsed.ethnicity === 'string') {
            const parsedEthnicity = (parsed.ethnicity as string)
              .split(',')
              .map((e: string) => e.trim())
              .filter((e: string) => e.length > 0)
              .map((e: string) => e.charAt(0).toUpperCase() + e.slice(1));
            (parsed as Partial<User>).ethnicity = parsedEthnicity;
            await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(parsed));
          }
          await AsyncStorage.setItem(ETHNICITY_MIGRATION_KEY, 'done');
        }

        setUser(parsed);
      }
      // No auto mock-user: user must sign up first.
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new user from the sign-up form (name, country, phone).
   * Currency is derived from the selected country.
   */
  const signUp = useCallback(async (data: {
    name: string;
    country: string;
    phone: string;
    age?: number;
  }) => {
    const newUser: User = {
      id: Date.now().toString(),
      name: data.name,
      bio: '',
      photos: [],
      location: data.country,
      country: data.country,
      phone: data.phone,
      currency: getCurrencyFromCountry(data.country),
      membershipTier: 'free',
      isOnline: true,
      favoritePlaces: [],
      joinedGroupIds: [],
      relationshipStatus: 'single',
      // intention left undefined — user picks it on the profile page
      preferences: {
        ageRange: [21, 45],
        maxDistance: 25,
        cuisinePreferences: [],
      },
    };
    setUser(newUser);
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      
      const updatedUser = { ...prevUser, ...updates };
      // Don't await this to avoid blocking the state update
      AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser)).catch(error => {
        console.error('Failed to save user to storage:', error);
      });
      return updatedUser;
    });
  }, []);

  const joinGroup = useCallback(async (groupId: string) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      const currentIds = prevUser.joinedGroupIds ?? [];
      if (currentIds.includes(groupId)) return prevUser;
      const updatedUser = { ...prevUser, joinedGroupIds: [...currentIds, groupId] };
      AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser)).catch(error => {
        console.error('Failed to save user to storage:', error);
      });
      return updatedUser;
    });
  }, []);

  const leaveGroup = useCallback(async (groupId: string) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      const currentIds = prevUser.joinedGroupIds ?? [];
      if (!currentIds.includes(groupId)) return prevUser;
      const updatedUser = { ...prevUser, joinedGroupIds: currentIds.filter(id => id !== groupId) };
      AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser)).catch(error => {
        console.error('Failed to save user to storage:', error);
      });
      return updatedUser;
    });
  }, []);

  const isGroupMember = useCallback((groupId: string) => {
    return (user?.joinedGroupIds ?? []).includes(groupId);
  }, [user]);

  return {
    user,
    isLoading,
    updateUser,
    joinGroup,
    leaveGroup,
    isGroupMember,
    isAuthenticated: !!user,
    signUp,
    signOut,
  };
});