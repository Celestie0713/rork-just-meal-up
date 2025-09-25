import { useState, useCallback, useMemo, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import type { ChatMessage, VoiceMessage, SystemMessage } from '@/types/user';
import { mockPostDateResponses } from '@/mocks/post-date-responses';
import { mockInvitations } from '@/mocks/invitations';

type ChatState = {
  [chatId: string]: ChatMessage[];
};

type RemovedProfile = {
  userId: string;
  invitationId: string;
  removedAt: Date;
  reason: 'no_match' | 'expired';
};

type RemovedProfilesState = {
  [userId: string]: RemovedProfile;
};

export const [ChatProvider, useChat] = createContextHook(() => {
  const [chats, setChats] = useState<ChatState>({});
  const [removedProfiles, setRemovedProfiles] = useState<RemovedProfilesState>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const addVoiceMessage = useCallback((chatId: string, message: VoiceMessage) => {
    setChats(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message]
    }));
  }, []);

  const addSystemMessage = useCallback((chatId: string, message: SystemMessage) => {
    setChats(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message]
    }));
  }, []);

  const getChatMessages = useCallback((chatId: string): ChatMessage[] => {
    return chats[chatId] || [];
  }, [chats]);

  const initializeChat = useCallback((chatId: string, initialMessages: ChatMessage[]) => {
    setChats(prev => ({
      ...prev,
      [chatId]: initialMessages
    }));
  }, []);

  // Load removed profiles from storage on initialization
  useEffect(() => {
    const loadRemovedProfiles = async () => {
      try {
        // For now, we'll use in-memory storage
        // In a real app, you would use a proper storage solution
        console.log('Loading removed profiles from storage...');
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load removed profiles:', error);
        setIsLoaded(true);
      }
    };
    loadRemovedProfiles();
  }, []);

  // Save removed profiles to storage whenever it changes
  useEffect(() => {
    if (isLoaded && Object.keys(removedProfiles).length > 0) {
      console.log('Saving removed profiles to storage:', removedProfiles);
      // In a real app, you would persist this data
    }
  }, [removedProfiles, isLoaded]);

  const removeProfileFromChat = useCallback((userId: string, invitationId: string, reason: 'no_match' | 'expired') => {
    const removedProfile: RemovedProfile = {
      userId,
      invitationId,
      removedAt: new Date(),
      reason
    };
    
    setRemovedProfiles(prev => ({
      ...prev,
      [userId]: removedProfile
    }));
    
    console.log(`Profile ${userId} removed from chat due to: ${reason}`);
  }, []);

  const isProfileRemoved = useCallback((userId: string): boolean => {
    return !!removedProfiles[userId];
  }, [removedProfiles]);

  const checkAndRemoveNonMatchingProfiles = useCallback((userChoices: Record<string, { choice: string; timestamp: Date }>) => {
    // Validate input
    if (!userChoices || typeof userChoices !== 'object') {
      console.warn('Invalid userChoices provided to checkAndRemoveNonMatchingProfiles');
      return;
    }
    
    const now = new Date();
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
    
    Object.entries(userChoices).forEach(([eventId, userChoice]) => {
      // Validate each entry
      if (!eventId?.trim() || !userChoice?.choice?.trim() || !userChoice?.timestamp) {
        console.warn('Invalid userChoice entry:', { eventId, userChoice });
        return;
      }
      // Check if 24 hours have passed since the choice was made
      const timeSinceChoice = now.getTime() - userChoice.timestamp.getTime();
      
      if (timeSinceChoice >= twentyFourHoursInMs) {
        // Extract invitation ID from event ID
        const invitationId = eventId.replace('invitation-', '');
        const invitation = mockInvitations.find(inv => inv.id === invitationId);
        
        if (invitation) {
          // Get the other user's ID (the date partner)
          const dateUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
          
          // Get the date's choice
          const dateResponse = mockPostDateResponses.find(r => r.mealId === invitationId && r.userId === dateUserId);
          const dateChoice = dateResponse?.choice;
          
          // Check if it's a match
          const isMatch = userChoice.choice === dateChoice;
          
          if (!isMatch) {
            // Remove the profile from chat if it's not a match
            removeProfileFromChat(dateUserId, invitationId, 'no_match');
            console.log(`Removing non-matching profile ${dateUserId} from chat after 24 hours`);
          }
        }
      }
    });
  }, [removeProfileFromChat]);

  // Periodic check to remove expired profiles (runs every hour)
  useEffect(() => {
    if (!isLoaded) return;
    
    const checkExpiredProfiles = () => {
      console.log('Running periodic check for expired profiles...');
      // This would typically check stored user choices and remove expired ones
      // For now, we'll just log that the check is running
    };
    
    // Run immediately and then every hour
    checkExpiredProfiles();
    const interval = setInterval(checkExpiredProfiles, 60 * 60 * 1000); // 1 hour
    
    return () => clearInterval(interval);
  }, [isLoaded]);

  const getAvailableChats = useCallback((allChats: any[]) => {
    return allChats.filter(chat => !isProfileRemoved(chat.user.id));
  }, [isProfileRemoved]);

  return useMemo(() => ({
    addVoiceMessage,
    addSystemMessage,
    getChatMessages,
    initializeChat,
    removeProfileFromChat,
    isProfileRemoved,
    checkAndRemoveNonMatchingProfiles,
    getAvailableChats,
    isLoaded
  }), [addVoiceMessage, addSystemMessage, getChatMessages, initializeChat, removeProfileFromChat, isProfileRemoved, checkAndRemoveNonMatchingProfiles, getAvailableChats, isLoaded]);
});