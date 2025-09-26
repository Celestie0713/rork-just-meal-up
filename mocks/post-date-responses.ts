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
    choice: 'fight_for_fries', // Fight for fries for life - will create a match if user also chooses 'fight_for_fries'
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000) // 3 days ago + 12 hours
  },
  {
    userId: '4', // Sofia Kim
    mealId: '7', // Sakura Sushi date
    choice: 'next_round', // This will create mixed signals if user chooses 'fight_for_fries'
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000) // 5 days ago + 12 hours
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
    userId: '6', // David Park - matched with buddy_pass
    invitationId: '8',
    matchType: 'buddy_pass' as const,
    matchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  }
];