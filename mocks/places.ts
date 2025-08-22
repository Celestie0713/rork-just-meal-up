import type { Place } from '@/types/place';

export const mockPlaces: Place[] = [
  {
    id: '1',
    name: 'The Italian Corner',
    address: '123 Main Street, Downtown',
    vicinity: '123 Main Street',
    rating: 4.5,
    priceLevel: 2,
    types: ['restaurant', 'food', 'establishment'],
    geometry: {
      location: {
        lat: 40.7128,
        lng: -74.0060,
      },
    },
    photos: [
      {
        photo_reference: 'mock_photo_1',
        height: 400,
        width: 600,
      },
    ],
    opening_hours: {
      open_now: true,
      periods: [
        {
          open: { day: 1, time: '1100' },
          close: { day: 1, time: '2200' }
        },
        {
          open: { day: 2, time: '1100' },
          close: { day: 2, time: '2200' }
        },
        {
          open: { day: 3, time: '1100' },
          close: { day: 3, time: '2200' }
        },
        {
          open: { day: 4, time: '1100' },
          close: { day: 4, time: '2200' }
        },
        {
          open: { day: 5, time: '1100' },
          close: { day: 5, time: '2300' }
        },
        {
          open: { day: 6, time: '1000' },
          close: { day: 6, time: '2300' }
        },
        {
          open: { day: 0, time: '1200' },
          close: { day: 0, time: '2100' }
        }
      ],
      weekday_text: [
        'Monday: 11:00 AM – 10:00 PM',
        'Tuesday: 11:00 AM – 10:00 PM',
        'Wednesday: 11:00 AM – 10:00 PM',
        'Thursday: 11:00 AM – 10:00 PM',
        'Friday: 11:00 AM – 11:00 PM',
        'Saturday: 10:00 AM – 11:00 PM',
        'Sunday: 12:00 PM – 9:00 PM'
      ]
    },
    place_id: 'mock_place_1',
  },
  {
    id: '2',
    name: 'Sushi Zen',
    address: '456 Oak Avenue, Midtown',
    vicinity: '456 Oak Avenue',
    rating: 4.8,
    priceLevel: 3,
    types: ['restaurant', 'food', 'establishment'],
    geometry: {
      location: {
        lat: 40.7589,
        lng: -73.9851,
      },
    },
    photos: [
      {
        photo_reference: 'mock_photo_2',
        height: 400,
        width: 600,
      },
    ],
    opening_hours: {
      open_now: false,
      periods: [
        {
          open: { day: 2, time: '1700' },
          close: { day: 2, time: '2200' }
        },
        {
          open: { day: 3, time: '1700' },
          close: { day: 3, time: '2200' }
        },
        {
          open: { day: 4, time: '1700' },
          close: { day: 4, time: '2200' }
        },
        {
          open: { day: 5, time: '1700' },
          close: { day: 5, time: '2300' }
        },
        {
          open: { day: 6, time: '1700' },
          close: { day: 6, time: '2300' }
        },
        {
          open: { day: 0, time: '1700' },
          close: { day: 0, time: '2200' }
        }
      ],
      weekday_text: [
        'Monday: Closed',
        'Tuesday: 5:00 PM – 10:00 PM',
        'Wednesday: 5:00 PM – 10:00 PM',
        'Thursday: 5:00 PM – 10:00 PM',
        'Friday: 5:00 PM – 11:00 PM',
        'Saturday: 5:00 PM – 11:00 PM',
        'Sunday: 5:00 PM – 10:00 PM'
      ]
    },
    place_id: 'mock_place_2',
  },
  {
    id: '3',
    name: 'Burger Palace',
    address: '789 Pine Road, Uptown',
    vicinity: '789 Pine Road',
    rating: 4.2,
    priceLevel: 1,
    types: ['restaurant', 'food', 'establishment'],
    geometry: {
      location: {
        lat: 40.7831,
        lng: -73.9712,
      },
    },
    photos: [
      {
        photo_reference: 'mock_photo_3',
        height: 400,
        width: 600,
      },
    ],
    opening_hours: {
      open_now: true,
      periods: [
        {
          open: { day: 1, time: '1000' },
          close: { day: 1, time: '2200' }
        },
        {
          open: { day: 2, time: '1000' },
          close: { day: 2, time: '2200' }
        },
        {
          open: { day: 3, time: '1000' },
          close: { day: 3, time: '2200' }
        },
        {
          open: { day: 4, time: '1000' },
          close: { day: 4, time: '2200' }
        },
        {
          open: { day: 5, time: '1000' },
          close: { day: 5, time: '2300' }
        },
        {
          open: { day: 6, time: '1000' },
          close: { day: 6, time: '2300' }
        },
        {
          open: { day: 0, time: '1100' },
          close: { day: 0, time: '2100' }
        }
      ],
      weekday_text: [
        'Monday: 10:00 AM – 10:00 PM',
        'Tuesday: 10:00 AM – 10:00 PM',
        'Wednesday: 10:00 AM – 10:00 PM',
        'Thursday: 10:00 AM – 10:00 PM',
        'Friday: 10:00 AM – 11:00 PM',
        'Saturday: 10:00 AM – 11:00 PM',
        'Sunday: 11:00 AM – 9:00 PM'
      ]
    },
    place_id: 'mock_place_3',
  },
  {
    id: '4',
    name: 'Cafe Mocha',
    address: '321 Elm Street, Arts District',
    vicinity: '321 Elm Street',
    rating: 4.6,
    priceLevel: 2,
    types: ['cafe', 'food', 'establishment'],
    geometry: {
      location: {
        lat: 40.7505,
        lng: -73.9934,
      },
    },
    opening_hours: {
      open_now: true,
      periods: [
        {
          open: { day: 1, time: '0700' },
          close: { day: 1, time: '1800' }
        },
        {
          open: { day: 2, time: '0700' },
          close: { day: 2, time: '1800' }
        },
        {
          open: { day: 3, time: '0700' },
          close: { day: 3, time: '1800' }
        },
        {
          open: { day: 4, time: '0700' },
          close: { day: 4, time: '1800' }
        },
        {
          open: { day: 5, time: '0700' },
          close: { day: 5, time: '1900' }
        },
        {
          open: { day: 6, time: '0800' },
          close: { day: 6, time: '1900' }
        },
        {
          open: { day: 0, time: '0800' },
          close: { day: 0, time: '1700' }
        }
      ],
      weekday_text: [
        'Monday: 7:00 AM – 6:00 PM',
        'Tuesday: 7:00 AM – 6:00 PM',
        'Wednesday: 7:00 AM – 6:00 PM',
        'Thursday: 7:00 AM – 6:00 PM',
        'Friday: 7:00 AM – 7:00 PM',
        'Saturday: 8:00 AM – 7:00 PM',
        'Sunday: 8:00 AM – 5:00 PM'
      ]
    },
    place_id: 'mock_place_4',
  },
  {
    id: '5',
    name: 'Taco Fiesta',
    address: '654 Maple Drive, South Side',
    vicinity: '654 Maple Drive',
    rating: 4.3,
    priceLevel: 1,
    types: ['restaurant', 'food', 'establishment'],
    geometry: {
      location: {
        lat: 40.7282,
        lng: -74.0776,
      },
    },
    photos: [
      {
        photo_reference: 'mock_photo_5',
        height: 400,
        width: 600,
      },
    ],
    opening_hours: {
      open_now: true,
      periods: [
        {
          open: { day: 1, time: '1100' },
          close: { day: 1, time: '2100' }
        },
        {
          open: { day: 2, time: '1100' },
          close: { day: 2, time: '2100' }
        },
        {
          open: { day: 3, time: '1100' },
          close: { day: 3, time: '2100' }
        },
        {
          open: { day: 4, time: '1100' },
          close: { day: 4, time: '2100' }
        },
        {
          open: { day: 5, time: '1100' },
          close: { day: 5, time: '2200' }
        },
        {
          open: { day: 6, time: '1100' },
          close: { day: 6, time: '2200' }
        },
        {
          open: { day: 0, time: '1200' },
          close: { day: 0, time: '2000' }
        }
      ],
      weekday_text: [
        'Monday: 11:00 AM – 9:00 PM',
        'Tuesday: 11:00 AM – 9:00 PM',
        'Wednesday: 11:00 AM – 9:00 PM',
        'Thursday: 11:00 AM – 9:00 PM',
        'Friday: 11:00 AM – 10:00 PM',
        'Saturday: 11:00 AM – 10:00 PM',
        'Sunday: 12:00 PM – 8:00 PM'
      ]
    },
    place_id: 'mock_place_5',
  },
];