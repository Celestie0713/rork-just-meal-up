import type { PostDateResponse } from '@/types/user';

// This mock data represents the choices made by other users on post-meal events
// When the current user makes a choice, the system will compare it with these responses
// If there's no match after 24 hours, the profile will be removed from the chat list

export const mockPostDateResponses: PostDateResponse[] = [
  {
    userId: '2', // Emma Rodriguez
    mealId: '4', // Burger Palace date
    choice: 'fight_for_fries', // This will create a match if user also chooses 'fight_for_fries'
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000) // 2 days ago + 12 hours
  },
  {
    userId: '3', // Marcus Johnson  
    mealId: '6', // Wine & Dine date
    choice: 'next_round', // This will create a match if user also chooses 'next_round'
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000) // 3 days ago + 12 hours
  },
  {
    userId: '4', // Sofia Kim
    mealId: '7', // Sakura Sushi date
    choice: 'fight_for_fries', // This will create a match if user also chooses 'fight_for_fries'
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000) // 5 days ago + 12 hours
  }
];

// Mock data for current user's choices (Alex Chen - id: '0')
export const mockCurrentUserResponses: PostDateResponse[] = [
  {
    userId: '0', // Alex Chen
    mealId: '4', // Burger Palace date with Emma Rodriguez
    choice: 'fight_for_fries', // This creates a mutual match with Emma
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    userId: '0', // Alex Chen
    mealId: '6', // Wine & Dine date with Marcus Johnson
    choice: 'buddy_pass', // This doesn't create a love match (Marcus chose next_round)
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  },
  {
    userId: '0', // Alex Chen
    mealId: '7', // Sakura Sushi date with Sofia Kim
    choice: 'buddy_pass', // This doesn't create a love match (Sofia chose fight_for_fries)
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  }
];

// Pre-populate some matched profiles for demonstration
// In a real app, these would be created when matches occur
export const mockMatchedProfiles = [
  {
    userId: '2', // Emma Rodriguez - matched with fight_for_fries
    invitationId: '4',
    matchType: 'fight_for_fries' as const,
    matchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    userId: '6', // Isabella Chen - matched with buddy_pass
    invitationId: '8',
    matchType: 'buddy_pass' as const,
    matchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  }
];

// Utility function to check if two users have a mutual "fight for fries" match
export function hasMutualLoveMatch(userId1: string, userId2: string): boolean {
  // Find responses for both users
  const user1Responses = userId1 === '0' ? mockCurrentUserResponses : mockPostDateResponses.filter(r => r.userId === userId1);
  const user2Responses = userId2 === '0' ? mockCurrentUserResponses : mockPostDateResponses.filter(r => r.userId === userId2);
  
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

// Get the current user's love match (only one allowed)
export function getCurrentUserLoveMatch(): string | null {
  // Alex Chen (id: '0') has a mutual fight_for_fries match with Emma Rodriguez (id: '2')
  return hasMutualLoveMatch('0', '2') ? '2' : null;
}