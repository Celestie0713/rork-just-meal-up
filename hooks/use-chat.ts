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
  reason: 'no_match' | 'expired' | 'mixed_signals_no_chat';
};

type MixedSignalsCase = {
  userId: string;
  invitationId: string;
  popupShownAt: Date;
  chatDetected: boolean;
};

type MixedSignalsState = {
  [userId: string]: MixedSignalsCase;
};

type RemovedProfilesState = {
  [userId: string]: RemovedProfile;
};

export const [ChatProvider, useChat] = createContextHook(() => {
  const [chats, setChats] = useState<ChatState>({});
  const [removedProfiles, setRemovedProfiles] = useState<RemovedProfilesState>({});
  const [mixedSignalsCases, setMixedSignalsCases] = useState<MixedSignalsState>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const addVoiceMessage = useCallback((chatId: string, message: VoiceMessage) => {
    setChats(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message]
    }));
    
    // Check if this is a mixed signals case and mark chat as detected
    const userId = chatId; // Assuming chatId is the userId
    if (mixedSignalsCases[userId] && !mixedSignalsCases[userId].chatDetected) {
      setMixedSignalsCases(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          chatDetected: true
        }
      }));
      console.log(`Chat detected for mixed signals case with user ${userId}`);
    }
  }, [mixedSignalsCases]);

  const addSystemMessage = useCallback((chatId: string, message: SystemMessage) => {
    setChats(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message]
    }));
    
    // Check if this is a mixed signals case and mark chat as detected
    const userId = chatId; // Assuming chatId is the userId
    if (mixedSignalsCases[userId] && !mixedSignalsCases[userId].chatDetected) {
      setMixedSignalsCases(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          chatDetected: true
        }
      }));
      console.log(`Chat detected for mixed signals case with user ${userId}`);
    }
  }, [mixedSignalsCases]);

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

  const removeProfileFromChat = useCallback((userId: string, invitationId: string, reason: 'no_match' | 'expired' | 'mixed_signals_no_chat') => {
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
            // Check for mixed signals case: one wants next_round, other wants fight_for_fries
            const isMixedSignals = (userChoice.choice === 'next_round' && dateChoice === 'fight_for_fries') ||
                                 (userChoice.choice === 'fight_for_fries' && dateChoice === 'next_round');
            
            if (isMixedSignals) {
              // Check if this is a mixed signals case that was already tracked
              const mixedSignalsCase = mixedSignalsCases[dateUserId];
              if (mixedSignalsCase && !mixedSignalsCase.chatDetected) {
                // No chat detected after mixed signals popup - remove profile
                removeProfileFromChat(dateUserId, invitationId, 'mixed_signals_no_chat');
                console.log(`Removing mixed signals profile ${dateUserId} from chat - no chat detected after 24 hours`);
                
                // Clean up the mixed signals case
                setMixedSignalsCases(prev => {
                  const updated = { ...prev };
                  delete updated[dateUserId];
                  return updated;
                });
              }
            } else {
              // Regular no match case
              removeProfileFromChat(dateUserId, invitationId, 'no_match');
              console.log(`Removing non-matching profile ${dateUserId} from chat after 24 hours`);
            }
          }
        }
      }
    });
  }, [removeProfileFromChat, mixedSignalsCases, setMixedSignalsCases]);

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

  const trackMixedSignalsCase = useCallback((userId: string, invitationId: string) => {
    const mixedSignalsCase: MixedSignalsCase = {
      userId,
      invitationId,
      popupShownAt: new Date(),
      chatDetected: false
    };
    
    setMixedSignalsCases(prev => ({
      ...prev,
      [userId]: mixedSignalsCase
    }));
    
    console.log(`Tracking mixed signals case for user ${userId}`);
  }, []);

  // Periodic check for mixed signals cases without chat activity
  useEffect(() => {
    if (!isLoaded) return;
    
    const checkMixedSignalsCases = () => {
      const now = new Date();
      const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
      
      Object.entries(mixedSignalsCases).forEach(([userId, mixedCase]) => {
        const timeSincePopup = now.getTime() - mixedCase.popupShownAt.getTime();
        
        if (timeSincePopup >= twentyFourHoursInMs && !mixedCase.chatDetected) {
          // Remove profile if no chat detected after 24 hours
          removeProfileFromChat(userId, mixedCase.invitationId, 'mixed_signals_no_chat');
          console.log(`Removing mixed signals profile ${userId} - no chat detected after 24 hours`);
          
          // Clean up the mixed signals case
          setMixedSignalsCases(prev => {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
          });
        }
      });
    };
    
    // Check every hour
    const interval = setInterval(checkMixedSignalsCases, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isLoaded, mixedSignalsCases, removeProfileFromChat]);

  return useMemo(() => ({
    addVoiceMessage,
    addSystemMessage,
    getChatMessages,
    initializeChat,
    removeProfileFromChat,
    isProfileRemoved,
    checkAndRemoveNonMatchingProfiles,
    getAvailableChats,
    trackMixedSignalsCase,
    isLoaded
  }), [addVoiceMessage, addSystemMessage, getChatMessages, initializeChat, removeProfileFromChat, isProfileRemoved, checkAndRemoveNonMatchingProfiles, getAvailableChats, trackMixedSignalsCase, isLoaded]);
});