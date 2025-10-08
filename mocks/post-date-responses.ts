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
  }
];

// Mock data for current user's choices (Alex Chen - id: '1')
// Start with NO previous choices - users must make choices through the Post Meal process
export const mockCurrentUserResponses: PostDateResponse[] = [
  // No initial responses - choices will be made through the Post Meal process
];

// Matched profiles will be created dynamically when matches occur through the Post Meal process
// Start with NO existing matches - users must go through the Post Meal process to create matches
export const mockMatchedProfiles: {
  userId: string;
  mealId: string;
  matchType: 'fight_for_fries' | 'buddy_pass' | 'next_round';
  matchedAt: Date;
}[] = [
  // No existing matches - ready for testing
];

// Utility function to check if two users have a mutual "fight for fries" match
// This should only return true if the match was confirmed through the Post Meal process
export function hasMutualLoveMatch(userId1: string, userId2: string): boolean {
  // Check if there's a confirmed match in the matched profiles
  // This ensures the love icon only shows after the Post Meal matching process
  const matchKey1 = userId1 === '1' ? userId2 : userId1;
  const matchKey2 = userId2 === '1' ? userId1 : userId2;
  
  // Check if either user has the other as a fight_for_fries match
  const hasMatch = mockMatchedProfiles.some(profile => 
    (profile.userId === matchKey1 || profile.userId === matchKey2) && 
    profile.matchType === 'fight_for_fries'
  );
  
  return hasMatch;
}

// Get the current user's love match (if any)
export function getCurrentUserLoveMatch(): string | null {
  // Check all users to see if current user (id: '1') has a mutual love match with anyone
  const allUserIds = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11']; // All other user IDs
  
  for (const userId of allUserIds) {
    if (hasMutualLoveMatch('1', userId)) {
      return userId;
    }
  }
  
  return null;
}

// Check if current user has any love match (used to disable fight_for_fries option)
export function hasCurrentUserLoveMatch(): boolean {
  return getCurrentUserLoveMatch() !== null;
}

