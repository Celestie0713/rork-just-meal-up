import type { MealInvitation } from '@/types/user';

export const mockInvitations: MealInvitation[] = [
  {
    id: '1',
    inviterId: '2',
    inviteeId: '1',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    time: '7:00 PM',
    venue: {
      name: 'Olive Garden',
      address: '123 Main St, Downtown',
      cuisine: 'Italian'
    },
    status: 'accepted',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    inviterId: '3',
    inviteeId: '1',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    time: '12:30 PM',
    venue: {
      name: 'Cafe Bistro',
      address: '456 Oak Ave, Midtown',
      cuisine: 'French'
    },
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    inviterId: '4',
    inviteeId: '1',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    time: '6:30 PM',
    venue: {
      name: 'Sakura Sushi',
      address: '789 Pine St, Uptown',
      cuisine: 'Japanese'
    },
    status: 'pending',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
  },
  {
    id: '4',
    inviterId: '5',
    inviteeId: '1',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    time: '8:00 PM',
    venue: {
      name: 'The Steakhouse',
      address: '321 Elm St, Downtown',
      cuisine: 'American'
    },
    status: 'completed',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: '5',
    inviterId: '6',
    inviteeId: '1',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    time: '1:00 PM',
    venue: {
      name: 'Taco Libre',
      address: '654 Maple Ave, Southside',
      cuisine: 'Mexican'
    },
    status: 'declined',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
  }
];