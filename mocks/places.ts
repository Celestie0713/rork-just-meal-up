import { Place } from '@/types/place';

export const mockPlaces: Place[] = [
  {
    id: 'p1',
    name: 'The Coffee Bean',
    category: 'Cafe',
    location: {
      latitude: 37.7849,
      longitude: -122.4094,
      address: '123 Market St, San Francisco, CA'
    },
    addedBy: ['u1', 'u3', 'u5'],
    createdAt: new Date('2024-01-15'),
    photos: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800'],
  },
  {
    id: 'p2',
    name: 'Sushi Paradise',
    category: 'Japanese',
    location: {
      latitude: 37.7899,
      longitude: -122.4034,
      address: '456 Mission St, San Francisco, CA'
    },
    addedBy: ['u2', 'u4'],
    createdAt: new Date('2024-01-20'),
    photos: ['https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800'],
  },
  {
    id: 'p3',
    name: 'Bella Italia',
    category: 'Italian',
    location: {
      latitude: 37.7879,
      longitude: -122.4074,
      address: '789 Powell St, San Francisco, CA'
    },
    addedBy: ['u1', 'u2', 'u3', 'u6'],
    notes: 'Great pasta and wine selection',
    createdAt: new Date('2024-02-01'),
    photos: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'],
  },
  {
    id: 'p4',
    name: 'Thai Street Food',
    category: 'Thai',
    location: {
      latitude: 37.7919,
      longitude: -122.4084,
      address: '321 Geary St, San Francisco, CA'
    },
    addedBy: ['u5', 'u7'],
    createdAt: new Date('2024-02-10'),
    photos: ['https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800'],
  },
  {
    id: 'p5',
    name: 'Burger Joint',
    category: 'American',
    location: {
      latitude: 37.7859,
      longitude: -122.4114,
      address: '654 Bush St, San Francisco, CA'
    },
    addedBy: ['u3', 'u4', 'u8'],
    notes: 'Best burgers in town',
    createdAt: new Date('2024-02-15'),
    photos: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800'],
  },
  {
    id: 'p6',
    name: 'Green Salad Bar',
    category: 'Healthy',
    location: {
      latitude: 37.7889,
      longitude: -122.4054,
      address: '987 California St, San Francisco, CA'
    },
    addedBy: ['u6'],
    createdAt: new Date('2024-03-01'),
    photos: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800'],
  },
  {
    id: 'p7',
    name: 'Taco Fiesta',
    category: 'Mexican',
    location: {
      latitude: 37.7839,
      longitude: -122.4104,
      address: '147 Valencia St, San Francisco, CA'
    },
    addedBy: ['u1', 'u2', 'u5', 'u7', 'u9'],
    notes: 'Authentic Mexican tacos',
    createdAt: new Date('2024-03-05'),
    photos: ['https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800'],
  },
  {
    id: 'p8',
    name: 'Ramen House',
    category: 'Japanese',
    location: {
      latitude: 37.7909,
      longitude: -122.4064,
      address: '258 Post St, San Francisco, CA'
    },
    addedBy: ['u4', 'u6', 'u8'],
    createdAt: new Date('2024-03-10'),
    photos: ['https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800'],
  },
  {
    id: 'p9',
    name: 'Pizza Corner',
    category: 'Italian',
    location: {
      latitude: 37.7869,
      longitude: -122.4124,
      address: '369 Columbus Ave, San Francisco, CA'
    },
    addedBy: ['u2', 'u3'],
    createdAt: new Date('2024-03-15'),
    photos: ['https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800'],
  },
  {
    id: 'p10',
    name: 'Dim Sum Palace',
    category: 'Chinese',
    location: {
      latitude: 37.7949,
      longitude: -122.4074,
      address: '741 Grant Ave, San Francisco, CA'
    },
    addedBy: ['u1', 'u5', 'u9'],
    createdAt: new Date('2024-03-20'),
    photos: ['https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800'],
  },
];
