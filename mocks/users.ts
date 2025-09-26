import type { User } from '@/types/user';

export const mockUsers: User[] = [
  {
    id: '0',
    name: 'Alex Chen',
    age: 28,
    bio: 'Food enthusiast who believes the best conversations happen over great meals. Love trying new cuisines and meeting interesting people!',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop'
    ],
    location: 'San Francisco, CA',
    membershipTier: 'premium',
    isOnline: true,
    ethnicity: 'english, mandarin, cantonese',
    preferences: {
      ageRange: [25, 35],
      maxDistance: 25,
      cuisinePreferences: ['Italian', 'Japanese', 'Mexican'],
      preferredEthnicity: ['english', 'mandarin', 'cantonese'],
      incomeLevel: '$75k - $100k',
      preferredIncomeLevel: '$50k - $100k'
    }
  },
  {
    id: '1',
    name: 'Sarah Johnson',
    age: 25,
    bio: 'Food enthusiast and amateur chef. Love trying new cuisines and meeting fellow foodies!',
    photos: [
      'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop'
    ],
    location: 'San Francisco, CA',
    membershipTier: 'premium',
    isOnline: true,
    ethnicity: 'English, Mandarin',
    preferences: {
      ageRange: [23, 30],
      maxDistance: 20,
      cuisinePreferences: ['Farm-to-table', 'Italian', 'Asian'],
      preferredEthnicity: ['English', 'Cantonese']
    }
  },
  {
    id: '2',
    name: 'Emma Rodriguez',
    age: 26,
    bio: 'Passionate about sustainable dining and local ingredients. Always up for discovering hidden gems in the city!',
    photos: [
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop'
    ],
    location: 'San Francisco, CA',
    membershipTier: 'organizer',
    isOnline: true,
    ethnicity: 'English, Cantonese',
    preferences: {
      ageRange: [24, 32],
      maxDistance: 20,
      cuisinePreferences: ['Farm-to-table', 'Vegan', 'Mediterranean'],
      preferredEthnicity: ['English', 'Mandarin']
    }
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    age: 31,
    bio: 'Chef by day, food explorer by night. Love sharing stories over good wine and even better company.',
    photos: [
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop'
    ],
    location: 'San Francisco, CA',
    membershipTier: 'premium',
    isOnline: false,
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    ethnicity: 'English, Mandarin',
    preferences: {
      ageRange: [25, 35],
      maxDistance: 30,
      cuisinePreferences: ['French', 'Italian', 'Asian Fusion'],
      preferredEthnicity: ['English', 'Cantonese']
    }
  },
  {
    id: '4',
    name: 'Sofia Kim',
    age: 29,
    bio: 'Travel writer with a serious case of wanderlust and an even more serious love for street food.',
    photos: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop'
    ],
    location: 'San Francisco, CA',
    membershipTier: 'free',
    isOnline: true,
    ethnicity: 'English, Cantonese',
    preferences: {
      ageRange: [26, 34],
      maxDistance: 15,
      cuisinePreferences: ['Korean', 'Thai', 'Mexican'],
      preferredEthnicity: ['English', 'Mandarin']
    }
  },
  {
    id: '5',
    name: 'David Park',
    age: 33,
    bio: 'Wine sommelier who believes every meal tells a story. Looking for someone to share those stories with.',
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=600&fit=crop'
    ],
    location: 'San Francisco, CA',
    membershipTier: 'premium',
    isOnline: true,
    ethnicity: 'English, Mandarin',
    preferences: {
      ageRange: [28, 38],
      maxDistance: 25,
      cuisinePreferences: ['Fine Dining', 'Wine Bar', 'French'],
      preferredEthnicity: ['English', 'Cantonese']
    }
  },
  {
    id: '6',
    name: 'Isabella Chen',
    age: 27,
    bio: 'Food photographer capturing the art of dining. Always looking for the perfect shot and the perfect bite.',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop'
    ],
    location: 'San Francisco, CA',
    membershipTier: 'organizer',
    isOnline: false,
    lastSeen: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    ethnicity: 'English, Cantonese',
    preferences: {
      ageRange: [24, 32],
      maxDistance: 18,
      cuisinePreferences: ['Japanese', 'Brunch'],
      preferredEthnicity: ['English', 'Mandarin']
    }
  },
  {
    id: '7',
    name: 'Alex Thompson',
    age: 30,
    bio: 'Startup founder who codes by day and explores the city\'s food scene by night. Always down for late-night eats.',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=600&fit=crop'
    ],
    location: 'San Francisco, CA',
    membershipTier: 'premium',
    isOnline: true,
    ethnicity: 'English, Mandarin',
    preferences: {
      ageRange: [25, 35],
      maxDistance: 22,
      cuisinePreferences: ['Ramen', 'Burgers', 'Pizza'],
      preferredEthnicity: ['English', 'Cantonese']
    }
  },
  {
    id: '8',
    name: 'Maya Patel',
    age: 28,
    bio: 'Yoga instructor with a passion for healthy, colorful food. Believes in mindful eating and great conversations.',
    photos: [
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop'
    ],
    location: 'San Francisco, CA',
    membershipTier: 'free',
    isOnline: true,
    ethnicity: 'English, Cantonese',
    preferences: {
      ageRange: [25, 33],
      maxDistance: 12,
      cuisinePreferences: ['Vegetarian', 'Indian', 'Smoothie Bowls'],
      preferredEthnicity: ['English', 'Mandarin']
    }
  },
  {
    id: '9',
    name: 'James Wilson',
    age: 35,
    bio: 'Architect who appreciates good design in both buildings and food. Looking for someone who shares my love for craft cocktails.',
    photos: [
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558203728-00f45181dd84?w=400&h=600&fit=crop'
    ],
    location: 'San Francisco, CA',
    membershipTier: 'premium',
    isOnline: false,
    lastSeen: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    ethnicity: 'English, Mandarin',
    preferences: {
      ageRange: [28, 40],
      maxDistance: 28,
      cuisinePreferences: ['Cocktail Bar', 'Steakhouse'],
      preferredEthnicity: ['English', 'Cantonese']
    }
  },
  {
    id: '10',
    name: 'Zoe Martinez',
    age: 24,
    bio: 'Art student who sees food as another form of creative expression. Always excited to try something new and Instagram-worthy.',
    photos: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=600&fit=crop'
    ],
    location: 'San Francisco, CA',
    membershipTier: 'free',
    isOnline: true,
    ethnicity: 'English, Cantonese',
    preferences: {
      ageRange: [22, 30],
      maxDistance: 15,
      cuisinePreferences: ['Dessert', 'Brunch', 'Fusion'],
      preferredEthnicity: ['English', 'Mandarin']
    }
  }
];