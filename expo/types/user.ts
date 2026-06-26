export interface User {
  id: string;
  name: string;
  age: number;
  bio: string;
  photos: string[];
  location: string;
  membershipTier: 'free' | 'premium' | 'organizer';
  isOnline: boolean;
  sex?: string;
  country?: string;
  income?: number;
  languages?: string[];
  lastSeen?: Date;
  ethnicity?: string;
  favoritePlaces?: string[];
  joinedGroupIds?: string[];
  relationshipStatus?: 'single' | 'in_relationship';
  intention?: 'make_new_friends' | 'relationship' | 'casual' | 'marriage' | 'open_marriage' | 'figuring_it_out';
  partnerId?: string;
  preferences: {
    ageRange: [number, number];
    maxDistance: number;
    cuisinePreferences: string[];
    preferredEthnicity?: string[];
    incomeLevel?: string;
    preferredIncomeLevel?: string;
  };
}

export interface VoiceMessage {
  id: string;
  senderId: string;
  receiverId: string;
  audioUrl: string;
  duration: number;
  timestamp: Date;
  isPlayed: boolean;
  requiresTip?: boolean;
  tipAmount?: number;
  isPaid?: boolean;
}

export interface SystemMessage {
  id: string;
  type: 'invitation_declined' | 'invitation_accepted' | 'invitation_cancelled' | 'mixed_signals' | 'invitation_sent';
  content: string;
  timestamp: Date;
  relatedInvitationId?: string;
}

export type ChatMessage = VoiceMessage | SystemMessage;

export function isVoiceMessage(message: ChatMessage): message is VoiceMessage {
  return 'audioUrl' in message;
}

export function isSystemMessage(message: ChatMessage): message is SystemMessage {
  return 'type' in message;
}

export interface MealInvitation {
  id: string;
  inviterId: string;
  inviteeId: string;
  date: Date;
  time: string;
  venue: {
    name: string;
    address: string;
    city?: string;
    country?: string;
    cuisine: string;
    placeId?: string;
    googleMapsUrl?: string;
  };
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: Date;
  declinedAt?: Date;
}

export interface PostDateResponse {
  userId: string;
  mealId: string;
  choice: 'buddy_pass' | 'next_round' | 'fight_for_fries' | null;
  timestamp: Date;
}

export interface MealUp {
  id: string;
  organizerId: string;
  organizerName: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  venue: {
    name: string;
    address: string;
    cuisine: string;
  };
  maxAttendees: number;
  currentAttendees: string[];
  ticketPrice: number;
  imageUrl: string;
  images?: string[];
  group?: {
    id: string;
    name: string;
    isPaid?: boolean;
    memberDiscount?: string;
  };
  priceDetails: {
    includesFood: boolean;
    paymentType: 'go_dutch' | 'organizer_pays' | 'individual_pays';
    description?: string;
  };
}