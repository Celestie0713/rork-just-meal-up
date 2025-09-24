import type { PostDateResponse } from '@/types/user';

export const mockPostDateResponses: PostDateResponse[] = [
  {
    userId: '2', // Emma Rodriguez
    mealId: '4', // Burger Palace date
    choice: 'next_round',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000) // 2 days ago + 12 hours
  },
  {
    userId: '3', // Marcus Johnson  
    mealId: '6', // Wine & Dine date
    choice: 'buddy_pass',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000) // 3 days ago + 12 hours
  },
  {
    userId: '4', // Sofia Kim
    mealId: '7', // Sakura Sushi date
    choice: 'fight_for_fries',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000) // 5 days ago + 12 hours
  }
];