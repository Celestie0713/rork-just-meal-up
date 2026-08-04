import type { PickerPlace } from '@/components/MealPickerModal';

/**
 * Mock "Food to bribe me with" — each user's favorite places.
 * Used by the Meal Picker "Choose from Food to bribe me with" flow.
 */
export const mockUserFavorites: Record<string, PickerPlace[]> = {
  '4': [
    { id: 'fav-4-1', name: 'Le Petit Bistro', emoji: '🇫🇷', city: 'San Francisco' },
    { id: 'fav-4-2', name: 'Sushi Zo', emoji: '🍣', city: 'San Francisco' },
    { id: 'fav-4-3', name: 'Tony\'s Pizza Napoletana', emoji: '🍕', city: 'San Francisco' },
    { id: 'fav-4-4', name: 'House of Prime Rib', emoji: '🥩', city: 'San Francisco' },
  ],
  '5': [
    { id: 'fav-5-1', name: 'Korean BBQ House', emoji: '🥘', city: 'San Francisco' },
    { id: 'fav-5-2', name: 'Bangkok Street Food', emoji: '🍜', city: 'San Francisco' },
    { id: 'fav-5-3', name: 'El Farolito', emoji: '🌮', city: 'San Francisco' },
  ],
  '6': [
    { id: 'fav-6-1', name: 'Acquerello', emoji: '🍝', city: 'San Francisco' },
    { id: 'fav-6-2', name: 'Benu', emoji: '🍽️', city: 'San Francisco' },
    { id: 'fav-6-3', name: 'Atelier Crenn', emoji: '🇫🇷', city: 'San Francisco' },
    { id: 'fav-6-4', name: 'Quince', emoji: '🍷', city: 'San Francisco' },
    { id: 'fav-6-5', name: 'Saison', emoji: '✨', city: 'San Francisco' },
  ],
  '7': [
    { id: 'fav-7-1', name: 'Ishikawa', emoji: '🍣', city: 'San Francisco' },
    { id: 'fav-7-2', name: 'Foreign Cinema', emoji: '🥂', city: 'San Francisco' },
    { id: 'fav-7-3', name: 'Zazie', emoji: '🥞', city: 'San Francisco' },
  ],
  '8': [
    { id: 'fav-8-1', name: 'Ramen Nagi', emoji: '🍜', city: 'San Francisco' },
    { id: 'fav-8-2', name: 'Shake Shack', emoji: '🍔', city: 'San Francisco' },
    { id: 'fav-8-3', name: 'Lungo\'s Pizza', emoji: '🍕', city: 'San Francisco' },
    { id: 'fav-8-4', name: 'Tartine Bakery', emoji: '🥐', city: 'San Francisco' },
  ],
};

/**
 * Get a user's favorite places (Food to bribe me with).
 * Returns an empty array if the user has no favorites.
 */
export function getUserFavorites(userId: string): PickerPlace[] {
  return mockUserFavorites[userId] ?? [];
}
