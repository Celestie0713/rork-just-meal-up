import type { MealUp } from '@/types/user';

export const mockMealUps: MealUp[] = [
  {
    id: '6',
    organizerId: '3',
    organizerName: 'Sophie Laurent',
    title: 'Parisian Bistro Night',
    description: 'Authentic French bistro experience with classic dishes and great conversation in the heart of Paris.',
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    time: '8:00 PM',
    venue: {
      name: 'Le Procope',
      address: '13 Rue de l\'Ancienne Comédie, Paris',
      country: 'France',
      cuisine: 'French'
    },
    maxAttendees: 10,
    currentAttendees: ['3', '7'],
    ticketPrice: 90,
    imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop'
    ],
    group: {
      id: '5',
      name: 'NYC Book Club Dinners',
      isPaid: true,
      memberDiscount: '25%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'individual_pays',
      description: '3-course prix fixe with wine. Each person pays for their own meal.'
    }
  },
  {
    id: '7',
    organizerId: '6',
    organizerName: 'David Kim',
    title: 'Tokyo Ramen Crawl',
    description: 'Explore Tokyo\'s best hidden ramen spots with fellow food lovers. 3 shops in one night!',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    time: '6:00 PM',
    venue: {
      name: 'Ichiran Shibuya',
      address: '1-22-7 Jinnan, Shibuya, Tokyo',
      country: 'Japan',
      cuisine: 'Japanese'
    },
    maxAttendees: 6,
    currentAttendees: ['6', '9'],
    ticketPrice: 55,
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=400&fit=crop'
    ],
    group: {
      id: '6',
      name: 'Jazz Night Enthusiasts',
      isPaid: true,
      memberDiscount: '30%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'go_dutch',
      description: 'Covers 3 bowls of ramen across 3 shops. We\'ll split transportation costs evenly.'
    }
  },
  {
    id: '1',
    organizerId: '4',
    organizerName: 'Marcus Johnson',
    title: 'Farm-to-Table Dinner Experience',
    description: 'Join us for an intimate dinner featuring locally sourced ingredients and seasonal flavors. Perfect for meeting fellow food enthusiasts!',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    time: '7:00 PM',
    venue: {
      name: 'Green Table',
      address: '1234 Mission St, San Francisco, CA',
      country: 'United States',
      cuisine: 'Farm-to-table'
    },
    maxAttendees: 8,
    currentAttendees: ['1', '4', '5'],
    ticketPrice: 85,
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=400&fit=crop'
    ],
    group: {
      id: '1',
      name: '35+ singles in NY with cats',
      isPaid: true,
      memberDiscount: '20%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'individual_pays',
      description: 'Price includes 4-course dinner with wine pairings. Each person pays for their own meal.'
    }
  },
  {
    id: '2',
    organizerId: '4',
    organizerName: 'Marcus Johnson',
    title: 'Wine & Tapas Social',
    description: 'Casual evening of Spanish tapas and wine pairings. Great for breaking the ice and making new connections!',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    time: '6:30 PM',
    venue: {
      name: 'Barcelona Tapas',
      address: '567 Valencia St, San Francisco, CA',
      country: 'United States',
      cuisine: 'Spanish'
    },
    maxAttendees: 12,
    currentAttendees: ['1', '6'],
    ticketPrice: 65,
    imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=400&fit=crop'
    ],
    group: {
      id: '4',
      name: 'Manhattan Wine Lovers',
      isPaid: true,
      memberDiscount: '20%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'go_dutch',
      description: 'Price covers shared tapas and 2 glasses of wine per person. We\'ll split the bill evenly.'
    }
  },
  {
    id: '3',
    organizerId: '6',
    organizerName: 'David Kim',
    title: 'Sushi Making Workshop',
    description: 'Learn the art of sushi making while meeting amazing people. All skill levels welcome!',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    time: '5:00 PM',
    venue: {
      name: 'Sakura Kitchen',
      address: '890 Fillmore St, San Francisco, CA',
      country: 'United States',
      cuisine: 'Japanese'
    },
    maxAttendees: 10,
    currentAttendees: ['1', '3', '4', '5'],
    ticketPrice: 95,
    imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800&h=400&fit=crop'
    ],
    group: {
      id: '2',
      name: 'Golden retriever owner in NY',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'organizer_pays',
      description: 'Workshop fee includes all ingredients, tools, and sake tasting. Organizer covers the cost - just bring yourself!'
    }
  },
  {
    id: '4',
    organizerId: '4',
    organizerName: 'Marcus Johnson',
    title: 'Italian Cooking Class',
    description: 'Master the art of authentic Italian pasta making in this hands-on cooking experience.',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    time: '6:00 PM',
    venue: {
      name: 'Nonna\'s Kitchen',
      address: '234 Little Italy St, San Francisco, CA',
      country: 'United States',
      cuisine: 'Italian'
    },
    maxAttendees: 12,
    currentAttendees: ['1', '3', '6', '7', '8'],
    ticketPrice: 75,
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800&h=400&fit=crop'
    ],
    group: {
      id: '3',
      name: 'Brooklyn Foodies',
      isPaid: true,
      memberDiscount: '35%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'individual_pays',
      description: 'Class includes all ingredients and a 3-course meal. Each person pays for their own experience.'
    }
  },
  {
    id: '5',
    organizerId: '4',
    organizerName: 'Marcus Johnson',
    title: 'Rooftop BBQ Social',
    description: 'Summer BBQ with city views, great food, and even better company!',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    time: '4:00 PM',
    venue: {
      name: 'Sky Deck Lounge',
      address: '567 High Rise Ave, San Francisco, CA',
      country: 'United States',
      cuisine: 'BBQ'
    },
    maxAttendees: 20,
    currentAttendees: ['1', '4', '5', '6', '7', '9', '10', '11'],
    ticketPrice: 45,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop'
    ],
    group: {
      id: '11',
      name: 'Rooftop Sunset Socials',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'go_dutch',
      description: 'BBQ feast with drinks included. We\'ll split the total bill evenly among all attendees.'
    }
  },
  {
    id: '8',
    organizerId: '5',
    organizerName: 'Isabella Rossi',
    title: 'Rome Pasta & Wine Night',
    description: 'A Roman evening of handmade pasta, local wines, and passionate food talk in Trastevere.',
    date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    time: '8:00 PM',
    venue: {
      name: 'Da Enzo al 29',
      address: 'Via dei Vascellari 29, Rome',
      country: 'Italy',
      cuisine: 'Italian'
    },
    maxAttendees: 8,
    currentAttendees: ['5', '8'],
    ticketPrice: 65,
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800&h=400&fit=crop'
    ],
    group: {
      id: '5',
      name: 'NYC Book Club Dinners',
      isPaid: true,
      memberDiscount: '25%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'individual_pays',
      description: '3-course pasta tasting menu with paired wines. Each person pays for their own meal.'
    }
  },
  {
    id: '9',
    organizerId: '7',
    organizerName: 'Yuki Tanaka',
    title: 'Kyoto Tea Ceremony & Kaiseki',
    description: 'Traditional tea ceremony followed by an exquisite kaiseki dinner in a historic machiya.',
    date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    time: '4:00 PM',
    venue: {
      name: 'Gion Karyo',
      address: '570-235 Gionmachi, Kyoto',
      country: 'Japan',
      cuisine: 'Japanese'
    },
    maxAttendees: 6,
    currentAttendees: [],
    ticketPrice: 120,
    imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&h=400&fit=crop'
    ],
    group: {
      id: '6',
      name: 'Jazz Night Enthusiasts',
      isPaid: true,
      memberDiscount: '30%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'organizer_pays',
      description: 'Full kaiseki experience with tea ceremony. Organizer covers the cost.'
    }
  },
  {
    id: '10',
    organizerId: '8',
    organizerName: 'Carlos Mendez',
    title: 'Barcelona Tapas Crawl',
    description: 'Hop through Barcelona\'s best tapas bars in El Born — one drink, one bite at each stop.',
    date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    time: '7:00 PM',
    venue: {
      name: 'El Xampanyet',
      address: 'Carrer de Montcada 22, Barcelona',
      country: 'Spain',
      cuisine: 'Spanish'
    },
    maxAttendees: 10,
    currentAttendees: ['8', '10'],
    ticketPrice: 50,
    imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&h=400&fit=crop'
    ],
    group: {
      id: '4',
      name: 'Manhattan Wine Lovers',
      isPaid: true,
      memberDiscount: '20%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'go_dutch',
      description: 'Covers one drink and one tapa at each stop (4 stops total). We\'ll split transport costs evenly.'
    }
  },
  {
    id: '11',
    organizerId: '9',
    organizerName: 'Liam O\'Brien',
    title: 'Dublin Whiskey & Steak Night',
    description: 'Premium Irish whiskey tasting paired with dry-aged steaks in a cosy Victorian pub.',
    date: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
    time: '7:30 PM',
    venue: {
      name: 'The Palace Bar',
      address: '21 Fleet Street, Dublin',
      country: 'Ireland',
      cuisine: 'Irish'
    },
    maxAttendees: 8,
    currentAttendees: ['9'],
    ticketPrice: 85,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop'
    ],
    group: {
      id: '1',
      name: '35+ singles in NY with cats',
      isPaid: true,
      memberDiscount: '20%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'individual_pays',
      description: '4 whiskey flights + dry-aged ribeye. Each person pays for their own meal.'
    }
  },
  {
    id: '12',
    organizerId: '10',
    organizerName: 'Amara Okafor',
    title: 'Lagos Suya Street Feast',
    description: 'Vibrant Nigerian street food feast featuring spicy suya, jollof rice, and ice-cold palm wine.',
    date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    time: '6:00 PM',
    venue: {
      name: 'Nok by Alara',
      address: '12A Akin Olugbade St, Lagos',
      country: 'Nigeria',
      cuisine: 'Nigerian'
    },
    maxAttendees: 12,
    currentAttendees: ['10'],
    ticketPrice: 40,
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=400&fit=crop'
    ],
    group: {
      id: '7',
      name: 'Craft Beer Tasting Group',
      isPaid: true,
      memberDiscount: '25%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'go_dutch',
      description: 'All-you-can-eat Nigerian street food with palm wine. We\'ll split evenly.'
    }
  },
  {
    id: '13',
    organizerId: '11',
    organizerName: 'Priya Sharma',
    title: 'Mumbai Street Food Safari',
    description: 'Navigate Mumbai\'s legendary street food scene — from vada pav to kulfi — with a local guide.',
    date: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
    time: '5:30 PM',
    venue: {
      name: 'Swati Snacks',
      address: '248 Karai Estate, Tardeo, Mumbai',
      country: 'India',
      cuisine: 'Indian'
    },
    maxAttendees: 8,
    currentAttendees: ['11', '12'],
    ticketPrice: 30,
    imageUrl: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&h=400&fit=crop'
    ],
    group: {
      id: '8',
      name: 'NYC Brunch Club',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'individual_pays',
      description: 'Covers tasting portions at 6 street food stalls. Each person pays for their own experience.'
    }
  },
  {
    id: '14',
    organizerId: '12',
    organizerName: 'Hana Park',
    title: 'Seoul K-BBQ & Soju Night',
    description: 'Endless Korean BBQ, flowing soju, and late-night noraebang (karaoke) in Hongdae.',
    date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    time: '7:00 PM',
    venue: {
      name: 'Maple Tree House',
      address: '26 Itaewon-ro 27ga-gil, Seoul',
      country: 'South Korea',
      cuisine: 'Korean'
    },
    maxAttendees: 10,
    currentAttendees: ['10', '5', '12'],
    ticketPrice: 55,
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=400&fit=crop'
    ],
    group: {
      id: '9',
      name: 'International Foodies NYC',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'go_dutch',
      description: 'All-you-can-eat K-BBQ with unlimited soju. We\'ll split the bill evenly.'
    }
  },
  {
    id: '15',
    organizerId: '5',
    organizerName: 'Michael Rodriguez',
    title: 'Mexico City Street Taco Tour',
    description: 'Taste your way through Mexico City\'s best street taco spots — al pastor, carnitas, suadero, and more.',
    date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
    time: '5:00 PM',
    venue: {
      name: 'Taquería Los Cocuyos',
      address: 'Simón Bolívar 59, Centro, Mexico City',
      country: 'Mexico',
      cuisine: 'Mexican'
    },
    maxAttendees: 10,
    currentAttendees: ['5', '7'],
    ticketPrice: 35,
    imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1613514785940-daed0779c9fc?w=800&h=400&fit=crop'
    ],
    group: {
      id: '12',
      name: 'Craft Beer Tasting Group',
      isPaid: true,
      memberDiscount: '25%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'individual_pays',
      description: 'Covers tasting portions at 6 legendary taco stands. Each person pays for their own experience.'
    }
  },
  {
    id: '16',
    organizerId: '8',
    organizerName: 'Carlos Mendez',
    title: 'São Paulo Churrascaria Feast',
    description: 'All-you-can-eat Brazilian barbecue at a top rodízio — endless cuts of picanha, sausages, and grilled pineapple.',
    date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    time: '8:00 PM',
    venue: {
      name: 'Fogo de Chão Jardins',
      address: 'Rua Augusta 2077, São Paulo',
      country: 'Brazil',
      cuisine: 'Brazilian'
    },
    maxAttendees: 14,
    currentAttendees: ['8', '10'],
    ticketPrice: 70,
    imageUrl: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop'
    ],
    group: {
      id: '3',
      name: 'Brooklyn Foodies',
      isPaid: true,
      memberDiscount: '35%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'go_dutch',
      description: 'Rodízio-style all-you-can-eat experience with drinks. We\'ll split the bill evenly.'
    }
  },
  {
    id: '17',
    organizerId: '9',
    organizerName: 'Liam O\'Brien',
    title: 'Bangkok Floating Market Feast',
    description: 'Cruise the canals of Bangkok sampling boat noodles, mango sticky rice, and fresh coconut ice cream.',
    date: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000),
    time: '9:00 AM',
    venue: {
      name: 'Khlong Lat Mayom Floating Market',
      address: 'Bang Lamad Road, Taling Chan, Bangkok',
      country: 'Thailand',
      cuisine: 'Thai'
    },
    maxAttendees: 8,
    currentAttendees: ['9', '2'],
    ticketPrice: 25,
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&h=400&fit=crop'
    ],
    group: {
      id: '9',
      name: 'International Foodies NYC',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'individual_pays',
      description: 'Covers boat rental and guide. Food at each stall is pay-as-you-go.'
    }
  },
  {
    id: '18',
    organizerId: '4',
    organizerName: 'Marcus Johnson',
    title: 'Melbourne Brunch & Coffee Crawl',
    description: 'Melbourne takes brunch seriously. Flat whites, smashed avo, and the best eggs benny you\'ll ever have.',
    date: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
    time: '10:00 AM',
    venue: {
      name: 'Higher Ground',
      address: '650 Little Bourke St, Melbourne',
      country: 'Australia',
      cuisine: 'Australian'
    },
    maxAttendees: 8,
    currentAttendees: ['4', '6'],
    ticketPrice: 55,
    imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=400&fit=crop'
    ],
    group: {
      id: '7',
      name: 'Coffee & Conversation',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'individual_pays',
      description: 'Covers brunch and coffee at 3 venues. Each person pays for their own meal.'
    }
  },
  {
    id: '19',
    organizerId: '6',
    organizerName: 'David Kim',
    title: 'Marrakech Riad Dinner Experience',
    description: 'A magical evening in a traditional riad with tagine, couscous, live music, and mint tea under the stars.',
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    time: '7:30 PM',
    venue: {
      name: 'Riad Kniza',
      address: '34 Derb l\'Hotel, Bab Doukala, Marrakech',
      country: 'Morocco',
      cuisine: 'Moroccan'
    },
    maxAttendees: 10,
    currentAttendees: ['6', '1'],
    ticketPrice: 80,
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop'
    ],
    group: {
      id: '1',
      name: '35+ singles in NY with cats',
      isPaid: true,
      memberDiscount: '20%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'organizer_pays',
      description: 'Full Moroccan feast with live entertainment. Organizer covers the cost.'
    }
  },
  {
    id: '20',
    organizerId: '11',
    organizerName: 'Priya Sharma',
    title: 'Lima Ceviche & Pisco Sour Night',
    description: 'Fresh ceviche, tiraditos, and perfectly shaken pisco sours at Lima\'s most celebrated seafood spot.',
    date: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
    time: '8:00 PM',
    venue: {
      name: 'La Mar Cebichería',
      address: 'Av. La Mar 770, Miraflores, Lima',
      country: 'Peru',
      cuisine: 'Peruvian'
    },
    maxAttendees: 10,
    currentAttendees: ['11', '6'],
    ticketPrice: 60,
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop'
    ],
    group: {
      id: '4',
      name: 'Manhattan Wine Lovers',
      isPaid: true,
      memberDiscount: '20%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'individual_pays',
      description: 'Covers ceviche tasting menu and 2 pisco sours. Each person pays for their own meal.'
    }
  },
  {
    id: '21',
    organizerId: '12',
    organizerName: 'Hana Park',
    title: 'Hanoi Pho & Bia Hoi Night',
    description: 'Slurp legendary pho, then join locals on plastic stools for fresh bia hoi at Hanoi\'s buzzing beer corner.',
    date: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
    time: '6:00 PM',
    venue: {
      name: 'Pho Gia Truyen',
      address: '49 Bat Dan, Hoan Kiem, Hanoi',
      country: 'Vietnam',
      cuisine: 'Vietnamese'
    },
    maxAttendees: 8,
    currentAttendees: ['12', '3'],
    ticketPrice: 20,
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=400&fit=crop'
    ],
    group: {
      id: '2',
      name: 'Golden retriever owner in NY',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'go_dutch',
      description: 'Covers pho dinner and first round of bia hoi. We\'ll split the rest evenly.'
    }
  },
  {
    id: '22',
    organizerId: '10',
    organizerName: 'Amara Okafor',
    title: 'Cairo Street Food & Nile View',
    description: 'Koshari, ful medames, and grilled kofta followed by shisha with a stunning Nile view at sunset.',
    date: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000),
    time: '5:30 PM',
    venue: {
      name: 'Abou Tarek',
      address: '16 Maarouf St, Downtown Cairo',
      country: 'Egypt',
      cuisine: 'Egyptian'
    },
    maxAttendees: 10,
    currentAttendees: ['10', '5'],
    ticketPrice: 30,
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=400&fit=crop'
    ],
    group: {
      id: '8',
      name: 'NYC Book Club Dinners',
      isPaid: true,
      memberDiscount: '25%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'individual_pays',
      description: 'Full street food tour covering 5 stops. Each person pays for their own experience.'
    }
  },
  {
    id: '23',
    organizerId: '7',
    organizerName: 'Yuki Tanaka',
    title: 'Istanbul Spice Market & Bosphorus Dinner',
    description: 'Explore the Grand Bazaar, sample Turkish delight and baklava, then cruise the Bosphorus for a meze dinner.',
    date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    time: '4:00 PM',
    venue: {
      name: 'Hamdi Restaurant',
      address: 'Tahmis Kalçin Sokak 17, Eminönü, Istanbul',
      country: 'Turkey',
      cuisine: 'Turkish'
    },
    maxAttendees: 12,
    currentAttendees: ['7', '1', '3'],
    ticketPrice: 55,
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=400&fit=crop'
    ],
    group: {
      id: '3',
      name: 'Brooklyn Foodies',
      isPaid: true,
      memberDiscount: '35%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'go_dutch',
      description: 'Covers market tour, Bosphorus cruise, and meze dinner. We\'ll split drinks evenly.'
    }
  },
  {
    id: '24',
    organizerId: '3',
    organizerName: 'Emma Wilson',
    title: 'Berlin Beer Garden & Currywurst Tour',
    description: 'Hop between Berlin\'s best beer gardens, sampling currywurst, pretzels, and craft brews along the way.',
    date: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
    time: '6:00 PM',
    venue: {
      name: 'Prater Garten',
      address: 'Kastanienallee 7-9, Berlin',
      country: 'Germany',
      cuisine: 'German'
    },
    maxAttendees: 12,
    currentAttendees: ['3', '8'],
    ticketPrice: 45,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=400&fit=crop'
    ],
    group: {
      id: '5',
      name: 'Vegan Singles NYC',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'go_dutch',
      description: 'Covers beer garden entry and first drink. Food and additional drinks split evenly.'
    }
  },
  {
    id: '25',
    organizerId: '5',
    organizerName: 'Michael Rodriguez',
    title: 'Lisbon Pastel de Nata & Port Wine Walk',
    description: 'Wander through Lisbon\'s Alfama district tasting custard tarts, port wine, and petiscos at hidden tabernas.',
    date: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
    time: '3:00 PM',
    venue: {
      name: 'Manteigaria',
      address: 'Rua do Loreto 2, Lisbon',
      country: 'Portugal',
      cuisine: 'Portuguese'
    },
    maxAttendees: 8,
    currentAttendees: ['5', '2'],
    ticketPrice: 40,
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=400&fit=crop'
    ],
    group: {
      id: '4',
      name: 'Manhattan Wine Lovers',
      isPaid: true,
      memberDiscount: '20%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'individual_pays',
      description: 'Covers pasteis de nata, 3 port wine tastings, and petiscos. Each person pays for their own experience.'
    }
  },
  {
    id: '26',
    organizerId: '8',
    organizerName: 'Carlos Mendez',
    title: 'Buenos Aires Asado & Malbec Night',
    description: 'A proper Argentine asado in a Palermo courtyard — fire-grilled beef, chimichurri, and bottomless Malbec.',
    date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    time: '9:00 PM',
    venue: {
      name: 'Don Julio',
      address: 'Guatemala 4699, Palermo, Buenos Aires',
      country: 'Argentina',
      cuisine: 'Argentine'
    },
    maxAttendees: 10,
    currentAttendees: ['8', '10', '1'],
    ticketPrice: 90,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop'
    ],
    group: {
      id: '12',
      name: 'Craft Beer Tasting Group',
      isPaid: true,
      memberDiscount: '25%',
    },
    priceDetails: {
      includesFood: true,
      paymentType: 'go_dutch',
      description: 'Full asado experience with premium cuts and wine pairings. We\'ll split the bill evenly.'
    }
  }
];