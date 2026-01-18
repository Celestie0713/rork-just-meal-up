import { Place } from '@/types/place';

export const mockPlaces: Place[] = [
  {
    id: 'p1',
    name: 'Blue Bottle Coffee',
    category: 'Cafe',
    location: {
      latitude: 37.7833,
      longitude: -122.4167,
      address: '66 Mint Plaza, San Francisco, CA 94103'
    },
    addedBy: ['u1', 'u3', 'u5'],
    createdAt: new Date('2024-01-15'),
    photos: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800'],
  },
  {
    id: 'p2',
    name: 'Akiko\'s Restaurant',
    category: 'Japanese',
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '431 Bush St, San Francisco, CA 94108'
    },
    addedBy: ['u2', 'u4'],
    createdAt: new Date('2024-01-20'),
    photos: ['https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800'],
  },
  {
    id: 'p3',
    name: 'Flour + Water',
    category: 'Italian',
    location: {
      latitude: 37.7599,
      longitude: -122.4148,
      address: '2401 Harrison St, San Francisco, CA 94110'
    },
    addedBy: ['u1', 'u2', 'u3', 'u6'],
    notes: 'Great pasta and wine selection',
    createdAt: new Date('2024-02-01'),
    photos: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'],
  },
  {
    id: 'p4',
    name: 'Kin Khao',
    category: 'Thai',
    location: {
      latitude: 37.7867,
      longitude: -122.4027,
      address: '55 Cyril Magnin St, San Francisco, CA 94102'
    },
    addedBy: ['u5', 'u7'],
    createdAt: new Date('2024-02-10'),
    photos: ['https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800'],
  },
  {
    id: 'p5',
    name: 'Super Duper Burgers',
    category: 'American',
    location: {
      latitude: 37.7886,
      longitude: -122.4076,
      address: '721 Market St, San Francisco, CA 94103'
    },
    addedBy: ['u3', 'u4', 'u8'],
    notes: 'Best burgers in town',
    createdAt: new Date('2024-02-15'),
    photos: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800'],
  },
  {
    id: 'p6',
    name: 'Sweetgreen',
    category: 'Healthy',
    location: {
      latitude: 37.7911,
      longitude: -122.4008,
      address: '1 Front St, San Francisco, CA 94111'
    },
    addedBy: ['u6'],
    createdAt: new Date('2024-03-01'),
    photos: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800'],
  },
  {
    id: 'p7',
    name: 'La Taqueria',
    category: 'Mexican',
    location: {
      latitude: 37.7489,
      longitude: -122.4178,
      address: '2889 Mission St, San Francisco, CA 94110'
    },
    addedBy: ['u1', 'u2', 'u5', 'u7', 'u9'],
    notes: 'Authentic Mexican tacos',
    createdAt: new Date('2024-03-05'),
    photos: ['https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800'],
  },
  {
    id: 'p8',
    name: 'Marufuku Ramen',
    category: 'Japanese',
    location: {
      latitude: 37.7806,
      longitude: -122.4101,
      address: '1581 Webster St, San Francisco, CA 94115'
    },
    addedBy: ['u4', 'u6', 'u8'],
    createdAt: new Date('2024-03-10'),
    photos: ['https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800'],
  },
  {
    id: 'p9',
    name: 'Tony\'s Pizza Napoletana',
    category: 'Italian',
    location: {
      latitude: 37.7988,
      longitude: -122.4098,
      address: '1570 Stockton St, San Francisco, CA 94133'
    },
    addedBy: ['u2', 'u3'],
    createdAt: new Date('2024-03-15'),
    photos: ['https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800'],
  },
  {
    id: 'p10',
    name: 'Good Mong Kok Bakery',
    category: 'Chinese',
    location: {
      latitude: 37.7946,
      longitude: -122.4078,
      address: '1039 Stockton St, San Francisco, CA 94108'
    },
    addedBy: ['u1', 'u5', 'u9'],
    createdAt: new Date('2024-03-20'),
    photos: ['https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800'],
  },
];
