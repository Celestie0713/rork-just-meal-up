import type { MealUp } from '@/types/user';

export const mockMealUps: MealUp[] = [
  {
    id: '1',
    organizerId: '2',
    title: 'Farm-to-Table Dinner Experience',
    description: 'Join us for an intimate dinner featuring locally sourced ingredients and seasonal flavors. Perfect for meeting fellow food enthusiasts!',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    time: '7:00 PM',
    venue: {
      name: 'Green Table',
      address: '1234 Mission St, San Francisco, CA',
      cuisine: 'Farm-to-table'
    },
    maxAttendees: 8,
    currentAttendees: ['1', '3', '4'],
    ticketPrice: 85,
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=400&fit=crop'
    ],
    priceDetails: {
      includesFood: true,
      paymentType: 'individual_pays',
      description: 'Price includes 4-course dinner with wine pairings. Each person pays for their own meal.'
    }
  },
  {
    id: '2',
    organizerId: '2',
    title: 'Wine & Tapas Social',
    description: 'Casual evening of Spanish tapas and wine pairings. Great for breaking the ice and making new connections!',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    time: '6:30 PM',
    venue: {
      name: 'Barcelona Tapas',
      address: '567 Valencia St, San Francisco, CA',
      cuisine: 'Spanish'
    },
    maxAttendees: 12,
    currentAttendees: ['1', '5'],
    ticketPrice: 65,
    imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=400&fit=crop'
    ],
    priceDetails: {
      includesFood: true,
      paymentType: 'go_dutch',
      description: 'Price covers shared tapas and 2 glasses of wine per person. We\'ll split the bill evenly.'
    }
  },
  {
    id: '3',
    organizerId: '5',
    title: 'Sushi Making Workshop',
    description: 'Learn the art of sushi making while meeting amazing people. All skill levels welcome!',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    time: '5:00 PM',
    venue: {
      name: 'Sakura Kitchen',
      address: '890 Fillmore St, San Francisco, CA',
      cuisine: 'Japanese'
    },
    maxAttendees: 10,
    currentAttendees: ['1', '2', '3', '4'],
    ticketPrice: 95,
    imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800&h=400&fit=crop'
    ],
    priceDetails: {
      includesFood: true,
      paymentType: 'organizer_pays',
      description: 'Workshop fee includes all ingredients, tools, and sake tasting. Organizer covers the cost - just bring yourself!'
    }
  }
];