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
    choice: 'buddy_pass', // Changed from fight_for_fries to remove the match
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  }
];

// Pre-populate some matched profiles for demonstration
// In a real app, these would be created when matches occur
export const mockMatchedProfiles = [
  {
    userId: '5', // Sofia Kim - matched with fight_for_fries (only one fight_for_fries match allowed)
    invitationId: '7',
    matchType: 'fight_for_fries' as const,
    matchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    userId: '3', // Emma Rodriguez - matched with next_round instead
    invitationId: '4',
    matchType: 'next_round' as const,
    matchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    userId: '7', // Isabella Chen - matched with buddy_pass
    invitationId: '8',
    matchType: 'buddy_pass' as const,
    matchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  }
];

// Utility function to check if two users have a mutual "fight for fries" match
export function hasMutualLoveMatch(userId1: string, userId2: string): boolean {
  // Find responses for both users
  const user1Responses = userId1 === '1' ? mockCurrentUserResponses : mockPostDateResponses.filter(r => r.userId === userId1);
  const user2Responses = userId2 === '1' ? mockCurrentUserResponses : mockPostDateResponses.filter(r => r.userId === userId2);
  
  // Check if they have matching meal IDs where both chose 'fight_for_fries'
  for (const response1 of user1Responses) {
    for (const response2 of user2Responses) {
      if (response1.mealId === response2.mealId && 
          response1.choice === 'fight_for_fries' && 
          response2.choice === 'fight_for_fries') {
        return true;
      }
    }
  }
  
  return false;
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

