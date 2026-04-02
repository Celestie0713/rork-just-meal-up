export interface GroupPost {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  content: string;
  imageUrl?: string;
  timestamp: Date;
  likes: number;
}

export interface Group {
  id: string;
  name: string;
  memberCount: number;
  imageUrl: string;
  isPaid: boolean;
  monthlyFee?: number;
  location: string;
  description: string;
  posts: GroupPost[];
  upcomingMealUps: string[];
  hostedBy: {
    userId: string;
    name: string;
    avatar: string;
  };
}

export const mockGroups: Group[] = [
  {
    id: '1',
    name: '35+ singles in NY with cats',
    memberCount: 124,
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
    isPaid: true,
    monthlyFee: 15,
    location: 'New York, NY',
    description: 'A vibrant community of cat-loving singles in their 30s and beyond. Share stories, meet for coffee, and organize group dinners. Whether you have one cat or five, you\'ll find your tribe here!',
    posts: [
      {
        id: 'p1',
        userId: '2',
        userName: 'Sarah Chen',
        userImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
        content: 'Had an amazing time at last night\'s dinner! Can\'t wait for the next one. My cat Whiskers approves 😺',
        imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=400&fit=crop',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        likes: 24,
      },
      {
        id: 'p2',
        userId: '5',
        userName: 'Michael Rodriguez',
        userImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
        content: 'Anyone interested in organizing a cat cafe meetup this weekend?',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        likes: 18,
      },
    ],
    upcomingMealUps: ['1', '2'],
    hostedBy: { userId: '2', name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
  },
  {
    id: '2',
    name: 'Golden retriever owner in NY',
    memberCount: 89,
    imageUrl: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400&h=400&fit=crop',
    isPaid: false,
    location: 'New York, NY',
    description: 'Golden retriever owners unite! From puppy playdates to group hikes, this is your space to connect with fellow golden parents. All goldens welcome!',
    posts: [
      {
        id: 'p3',
        userId: '3',
        userName: 'Emma Wilson',
        userImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
        content: 'Central Park meetup was a blast! Our pups had so much fun 🐕',
        imageUrl: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=600&h=400&fit=crop',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        likes: 35,
      },
    ],
    upcomingMealUps: ['3'],
    hostedBy: { userId: '3', name: 'Emma Wilson', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop' },
  },
  {
    id: '3',
    name: 'Brooklyn Foodies',
    memberCount: 156,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop',
    isPaid: true,
    monthlyFee: 20,
    location: 'Brooklyn, NY',
    description: 'Exploring Brooklyn\'s incredible food scene, one meal at a time. From hidden gems to Michelin stars, we eat it all!',
    posts: [],
    upcomingMealUps: ['1'],
    hostedBy: { userId: '1', name: 'Alex Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
  },
  {
    id: '4',
    name: 'Manhattan Wine Lovers',
    memberCount: 203,
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop',
    isPaid: true,
    monthlyFee: 25,
    location: 'Manhattan, NY',
    description: 'For those who appreciate fine wine and great company. Monthly tastings, winery tours, and sophisticated dining experiences.',
    posts: [],
    upcomingMealUps: ['2'],
    hostedBy: { userId: '5', name: 'Michael Rodriguez', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
  },
  {
    id: '5',
    name: 'Vegan Singles NYC',
    memberCount: 97,
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
    isPaid: false,
    location: 'New York, NY',
    description: 'Plant-based dating and dining. Meet fellow vegans for meals, cooking classes, and ethical living discussions.',
    posts: [],
    upcomingMealUps: [],
    hostedBy: { userId: '3', name: 'Emma Wilson', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop' },
  },
  {
    id: '6',
    name: 'Dog Park Meetups',
    memberCount: 178,
    imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop',
    isPaid: false,
    location: 'New York, NY',
    description: 'Dog lovers unite for park meetups, brunch dates, and pup-friendly adventures across NYC.',
    posts: [],
    upcomingMealUps: [],
    hostedBy: { userId: '2', name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
  },
  {
    id: '7',
    name: 'Coffee & Conversation',
    memberCount: 142,
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop',
    isPaid: false,
    location: 'New York, NY',
    description: 'Casual coffee meetups for meaningful conversations. Perfect for introverts and deep thinkers.',
    posts: [],
    upcomingMealUps: [],
    hostedBy: { userId: '1', name: 'Alex Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
  },
  {
    id: '8',
    name: 'NYC Book Club Dinners',
    memberCount: 85,
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop',
    isPaid: true,
    monthlyFee: 18,
    location: 'New York, NY',
    description: 'Combining our love of literature and food. Monthly book discussions over dinner at cozy restaurants.',
    posts: [],
    upcomingMealUps: [],
    hostedBy: { userId: '5', name: 'Michael Rodriguez', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
  },
  {
    id: '9',
    name: 'Fitness & Brunch Crew',
    memberCount: 119,
    imageUrl: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&h=400&fit=crop',
    isPaid: false,
    location: 'New York, NY',
    description: 'Work out together, then brunch together. Yoga, runs, and the best brunch spots in NYC.',
    posts: [],
    upcomingMealUps: [],
    hostedBy: { userId: '2', name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
  },
  {
    id: '10',
    name: 'Jazz Night Enthusiasts',
    memberCount: 76,
    imageUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=400&fit=crop',
    isPaid: true,
    monthlyFee: 22,
    location: 'New York, NY',
    description: 'Appreciating live jazz over dinner and drinks. From smooth classics to avant-garde performances.',
    posts: [],
    upcomingMealUps: [],
    hostedBy: { userId: '3', name: 'Emma Wilson', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop' },
  },
  {
    id: '11',
    name: 'Rooftop Sunset Socials',
    memberCount: 134,
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=400&fit=crop',
    isPaid: false,
    location: 'New York, NY',
    description: 'Enjoying NYC\'s best rooftop views during golden hour. Sunset gatherings with drinks and small bites.',
    posts: [],
    upcomingMealUps: [],
    hostedBy: { userId: '1', name: 'Alex Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
  },
  {
    id: '12',
    name: 'Craft Beer Tasting Group',
    memberCount: 167,
    imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop',
    isPaid: true,
    monthlyFee: 20,
    location: 'New York, NY',
    description: 'Exploring NYC\'s craft beer scene. Brewery tours, tastings, and pub crawls with fellow beer enthusiasts.',
    posts: [],
    upcomingMealUps: [],
    hostedBy: { userId: '5', name: 'Michael Rodriguez', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
  },
];
