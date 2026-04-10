import type { PostDateResponse } from '@/types/user';

// This mock data represents the choices made by other users on post-meal events
// When the current user makes a choice, the system will compare it with these responses
// If there's no match after 24 hours, the profile will be removed from the chat list

export const mockPostDateResponses: PostDateResponse[] = [
  {
    userId: '5', // Sofia Kim
    mealId: '7',
    choice: 'next_round',
    timestamp: new Date('2024-01-15T20:30:00Z')
  },
  {
    userId: '4', // Marcus Johnson
    mealId: '6',
    choice: 'fight_for_fries',
    timestamp: new Date('2024-01-16T19:00:00Z')
  }
];

// Mock data for current user's choices (Alex Chen - id: '1')
// Start with NO previous choices - users must make choices through the Post Meal process
export const mockCurrentUserResponses: PostDateResponse[] = [
  // No initial responses - choices will be made through the Post Meal process
];

// Matched profiles will be created dynamically when matches occur through the Post Meal process
// Start with NO existing matches - users must go through the Post Meal process to create matches
// When there's a match, BOTH users should be added to this list
export const mockMatchedProfiles: {
  userId: string;
  mealId: string;
  matchType: 'fight_for_fries' | 'buddy_pass' | 'next_round';
  matchedAt: Date;
}[] = [
  {
    userId: '5',
    mealId: '7',
    matchType: 'buddy_pass',
    matchedAt: new Date('2024-01-15T20:30:00Z')
  },
  {
    userId: '4',
    mealId: '6',
    matchType: 'fight_for_fries',
    matchedAt: new Date('2024-01-16T19:00:00Z')
  },
  {
    userId: '1',
    mealId: '6',
    matchType: 'fight_for_fries',
    matchedAt: new Date('2024-01-16T19:00:00Z')
  }
];


