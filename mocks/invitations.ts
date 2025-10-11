import type { MealInvitation } from '@/types/user';

export const mockInvitations: MealInvitation[] = [
  {
    id: '1',
    inviterId: '3',
    inviteeId: '1',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    time: '7:00 PM',
    venue: {
      name: 'The Italian Corner',
      address: '123 Main Street, Downtown',
      cuisine: 'Italian',
      placeId: 'mock_place_1'
    },
    status: 'accepted',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    tipAmount: 25
  },
  {
    id: '2',
    inviterId: '4',
    inviteeId: '1',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    time: '12:30 PM',
    venue: {
      name: 'Cafe Mocha',
      address: '321 Elm Street, Arts District',
      cuisine: 'Cafe',
      placeId: 'mock_place_4'
    },
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    tipAmount: 15
  },
  {
    id: '3',
    inviterId: '5',
    inviteeId: '1',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    time: '6:30 PM',
    venue: {
      name: 'Sushi Zen',
      address: '456 Oak Avenue, Midtown',
      cuisine: 'Japanese',
      placeId: 'mock_place_2'
    },
    status: 'pending',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
  },
  {
    id: '4',
    inviterId: '6',
    inviteeId: '1',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    time: '8:00 PM',
    venue: {
      name: 'Burger Palace',
      address: '789 Pine Road, Uptown',
      cuisine: 'Burger',
      placeId: 'mock_place_3'
    },
    status: 'completed',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: '5',
    inviterId: '7',
    inviteeId: '1',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    time: '1:00 PM',
    venue: {
      name: 'Taco Fiesta',
      address: '654 Maple Drive, South Side',
      cuisine: 'Mexican',
      placeId: 'mock_place_5'
    },
    status: 'declined',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    declinedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
  },
  {
    id: '6',
    inviterId: '4',
    inviteeId: '1',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    time: '7:30 PM',
    venue: {
      name: 'Wine & Dine',
      address: '789 Vintage Street, Wine District',
      cuisine: 'French',
      placeId: 'mock_place_6'
    },
    status: 'completed',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: '7',
    inviterId: '5',
    inviteeId: '1',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    time: '6:00 PM',
    venue: {
      name: 'Sakura Sushi',
      address: '456 Cherry Blossom Lane, Japan Town',
      cuisine: 'Japanese',
      placeId: 'mock_place_7'
    },
    status: 'completed',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: '8',
    inviterId: '1',
    inviteeId: '3',
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    time: '7:30 PM',
    venue: {
      name: 'Steakhouse Prime',
      address: '789 Beef Street, Downtown',
      cuisine: 'Steakhouse',
      placeId: 'mock_place_8'
    },
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    tipAmount: 50
  },
  {
    id: '9',
    inviterId: '1',
    inviteeId: '4',
    date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    time: '8:00 PM',
    venue: {
      name: 'Thai Spice',
      address: '321 Curry Lane, Chinatown',
      cuisine: 'Thai',
      placeId: 'mock_place_9'
    },
    status: 'accepted',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    tipAmount: 30
  },
  {
    id: '10',
    inviterId: '1',
    inviteeId: '6',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    time: '6:00 PM',
    venue: {
      name: 'Pizza Paradise',
      address: '456 Cheese Avenue, Little Italy',
      cuisine: 'Italian',
      placeId: 'mock_place_10'
    },
    status: 'declined',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    declinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  }
];