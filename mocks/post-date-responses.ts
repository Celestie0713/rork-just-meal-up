import type { PostDateResponse } from '@/types/user';

// This mock data represents the choices made by other users on post-meal events
// When the current user makes a choice, the system will compare it with these responses
// If there's no match after 24 hours, the profile will be removed from the chat list

export const mockPostDateResponses: PostDateResponse[] = [
  {
    userId: '3', // Emma Rodriguez
    mealId: '4', // Burger Palace date
    choice: 'next_round', // Changed to match Alex's choice for next_round match
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000) // 2 days ago + 12 hours
  },
  {
    userId: '4', // Marcus Johnson  
    mealId: '6', // Wine & Dine date
    choice: 'next_round', // This will create a match if user also chooses 'next_round'
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000) // 3 days ago + 12 hours
  },
  {
    userId: '5', // Sofia Kim
    mealId: '7', // Sakura Sushi date
    choice: 'fight_for_fries', // This will create a match if user also chooses 'fight_for_fries'
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000) // 5 days ago + 12 hours
  }
];

// Mock data for current user's choices (Alex Chen - id: '1')
export const mockCurrentUserResponses: PostDateResponse[] = [
  {
    userId: '1', // Alex Chen
    mealId: '4', // Burger Palace date with Emma Rodriguez
    choice: 'next_round', // Changed from fight_for_fries to avoid multiple matches
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    userId: '1', // Alex Chen
    mealId: '6', // Wine & Dine date with Marcus Johnson
    choice: 'buddy_pass', // This doesn't create a love match (Marcus chose next_round)
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  },
  {
    userId: '1', // Alex Chen
    mealId: '7', // Sakura Sushi date with Sofia Kim
    choice: 'fight_for_fries', // Match with Sofia Kim's choice
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  }
];

// Matched profiles will be created dynamically when matches occur through the Post Meal process
// Start with existing matches based on the current user responses
export const mockMatchedProfiles: {
  userId: string;
  invitationId: string;
  matchType: 'fight_for_fries' | 'buddy_pass' | 'next_round';
  matchedAt: Date;
}[] = [
  {
    userId: '5', // Sofia Kim
    invitationId: '7', // Sakura Sushi date
    matchType: 'fight_for_fries', // Both Alex and Sofia chose fight_for_fries
    matchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago when match occurred
  },
  {
    userId: '3', // Emma Rodriguez
    invitationId: '4', // Burger Palace date
    matchType: 'next_round', // Both Alex and Emma chose next_round
    matchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago when match occurred
  }
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

