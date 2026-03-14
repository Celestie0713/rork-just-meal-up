import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, Animated, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Users, Clock, ChevronRight, Star, X, Heart, Timer } from 'lucide-react-native';
import { router } from 'expo-router';

import { mockInvitations } from '@/mocks/invitations';
import { mockMealUps } from '@/mocks/meal-ups';
import { mockUsers } from '@/mocks/users';
import { mockPostDateResponses } from '@/mocks/post-date-responses';
import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';
import { useNotifications } from '@/hooks/use-notifications';
import { TipSelectionModal } from '@/components/TipSelectionModal';
import { postMealStyles as styles, postMealColors as colors } from '@/constants/post-meal-styles';

type PostMealEvent = {
  id: string;
  type: 'invitation' | 'mealup';
  title: string;
  venue: string;
  address: string;
  date: Date;
  time: string;
  attendees?: string[];
  imageUrl?: string;
  cuisine: string;
};

type MixedSignalsExtension = {
  userId: string;
  invitationId: string;
  startedAt: Date;
  userChoice: string;
  dateChoice: string | null;
  hasUserReDecided: boolean;
  hasDateReDecided: boolean;
};

function parseDateTime(date: Date, time: string): Date {
  const [timeStr, period] = time.split(' ');
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  let hour24 = hours;
  if (period === 'PM' && hours !== 12) {
    hour24 += 12;
  } else if (period === 'AM' && hours === 12) {
    hour24 = 0;
  }
  
  const dateTime = new Date(date);
  dateTime.setHours(hour24, minutes, 0, 0);
  return dateTime;
}

function isPostMeal(date: Date, time: string): boolean {
  const eventDateTime = parseDateTime(date, time);
  const now = new Date();
  const tenHoursAfter = new Date(eventDateTime.getTime() + (10 * 60 * 60 * 1000));
  return now >= tenHoursAfter;
}

export default function PostMealScreen() {
  const { user } = useAuth();
  const { checkAndRemoveNonMatchingProfiles, trackMixedSignalsCase, addMatchedProfile, matchedProfiles, removeProfileFromChat } = useChat();
  const { addMatchDecisionNotification, addMixedSignalsNotification } = useNotifications();
  const insets = useSafeAreaInsets();
  const isPremium = user?.membershipTier === 'premium' || user?.membershipTier === 'organizer';

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  const [finalizedChoices, setFinalizedChoices] = useState<Record<string, boolean>>({});
  const [choiceTimestamps, setChoiceTimestamps] = useState<Record<string, Date>>({});
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchResult, setMatchResult] = useState<{
    isMatch: boolean;
    matchType: 'fight_for_fries' | 'buddy_pass' | 'next_round' | 'mixed_signals' | 'mixed_signals_extension' | 'no_decision' | 'match_permanent' | null;
    userChoice: string;
    dateChoice: string | null;
    eventId?: string;
  } | null>(null);

  const balloonAnimation = useRef(new Animated.Value(0)).current;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mixedSignalsExtensions, setMixedSignalsExtensions] = useState<Record<string, MixedSignalsExtension>>({});
  const [extendedChoices, setExtendedChoices] = useState<Record<string, string>>({});
  const [selectedTab, setSelectedTab] = useState<'1on1' | 'group'>('1on1');
  const [paidToViewChoices, setPaidToViewChoices] = useState<Record<string, boolean>>({});
  const [profilesToRemove, setProfilesToRemove] = useState<{ userId: string; invitationId: string }[]>([]);
  const [showTipModal, setShowTipModal] = useState(false);
  const [selectedEventForTip, setSelectedEventForTip] = useState<string | null>(null);


  // Log when matchedProfiles changes
  useEffect(() => {
    console.log('[PostMealScreen] matchedProfiles changed:', Object.keys(matchedProfiles).map(key => ({
      userId: key,
      matchType: matchedProfiles[key].matchType
    })));
  }, [matchedProfiles]);

  // Update current time every second for timer display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Debug: Log when mixedSignalsExtensions changes
  useEffect(() => {
    console.log('mixedSignalsExtensions updated:', mixedSignalsExtensions);
    Object.entries(mixedSignalsExtensions).forEach(([key, ext]) => {
      console.log(`Extension ${key}: startedAt=${ext.startedAt.toISOString()}, userChoice=${ext.userChoice}, dateChoice=${ext.dateChoice}`);
    });
  }, [mixedSignalsExtensions]);

  // Debug: Log when choiceTimestamps changes
  useEffect(() => {
    console.log('choiceTimestamps updated:', choiceTimestamps);
    Object.entries(choiceTimestamps).forEach(([key, timestamp]) => {
      console.log(`Timestamp ${key}: ${timestamp.toISOString()}`);
    });
  }, [choiceTimestamps]);

  // Handle profile removal after render to avoid setState during render
  useEffect(() => {
    if (profilesToRemove.length > 0) {
      profilesToRemove.forEach(({ userId, invitationId }) => {
        removeProfileFromChat(userId, invitationId, 'no_match');
        console.log(`Removed profile ${userId} from chat due to no match`);
      });
      setProfilesToRemove([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilesToRemove]);

  const handlePayToViewChoice = (eventId: string) => {
    setSelectedEventForTip(eventId);
    setShowTipModal(true);
  };

  const handleTipConfirm = (amount: number) => {
    console.log(`User selected tip amount: ${amount}`);
    setShowTipModal(false);
    
    if (selectedEventForTip) {
      setPaidToViewChoices(prev => ({
        ...prev,
        [selectedEventForTip]: true
      }));
      
      Linking.openURL('https://buy.stripe.com/test_00g03p9CUb6H3eM8ww');
      setSelectedEventForTip(null);
    }
  };

  const getDateChoice = useCallback((invitationId: string) => {
    const invitation = mockInvitations.find(inv => inv.id === invitationId);
    if (!invitation) return null;
    
    const dateUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
    const extensionKey = `${invitationId}-${dateUserId}`;
    const extension = mixedSignalsExtensions[extensionKey];
    
    // If there's an active extension
    if (extension) {
      // CRITICAL: During extension period, we should NOT show the old choice
      // Only show the NEW choice after the date has re-decided
      if (extension.hasDateReDecided) {
        console.log(`[Extension] Returning date's NEW choice for ${invitationId}: ${extension.dateChoice}`);
        return extension.dateChoice;
      }
      // If the extension is active but date hasn't re-decided, return null
      console.log(`[Extension] Active for ${invitationId}, date hasn't re-decided yet - returning null`);
      return null;
    }
    
    // Otherwise, return the original choice
    const response = mockPostDateResponses.find(r => r.mealId === invitationId && r.userId === dateUserId);
    const originalChoice = response?.choice || null;
    console.log(`Returning original choice for ${invitationId}: ${originalChoice}`);
    return originalChoice;
  }, [mixedSignalsExtensions]);

  const getChoiceDisplay = (choice: string) => {
    switch (choice) {
      case 'buddy_pass':
        return { text: 'Buddy pass ✅', subtext: '(Stay Friend)' };
      case 'next_round':
        return { text: "Let's do next round", subtext: '(Next date)' };
      case 'fight_for_fries':
        return { text: 'Fight for fries for life', subtext: '(Be my +1?)' };
      default:
        return null;
    }
  };

  // Check if "fight for fries" option should be disabled for a specific event
  const isFightForFriesDisabled = (eventId: string) => {
    // Disable if user has already chosen fight_for_fries for ANY other event
    // This makes the option exclusive - only available for one date at a time
    const hasChosenForOtherEvent = Object.entries(selectedChoices).some(
      ([id, choice]) => id !== eventId && choice === 'fight_for_fries'
    );
    
    // Also check extended choices (second decisions during mixed signals)
    const hasExtendedChoiceForOtherEvent = Object.entries(extendedChoices).some(
      ([id, choice]) => id !== eventId && choice === 'fight_for_fries'
    );
    
    // Disable if user already has an exclusive match (love icon on profile)
    // IMPORTANT: This checks the matchedProfiles state, which is updated when love icon is removed
    const hasExistingLoveMatch = Object.values(matchedProfiles).some(
      profile => profile.matchType === 'fight_for_fries'
    );
    
    console.log(`[isFightForFriesDisabled] eventId=${eventId}, hasChosenForOtherEvent=${hasChosenForOtherEvent}, hasExtendedChoiceForOtherEvent=${hasExtendedChoiceForOtherEvent}, hasExistingLoveMatch=${hasExistingLoveMatch}`);
    console.log(`[isFightForFriesDisabled] matchedProfiles:`, Object.values(matchedProfiles).map(p => ({ userId: p.userId, matchType: p.matchType })));
    
    return hasChosenForOtherEvent || hasExtendedChoiceForOtherEvent || hasExistingLoveMatch;
  };

  const postMealEvents = useMemo(() => {
    const events: PostMealEvent[] = [];
    const now = new Date();
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    
    // Add completed invitations that are 10+ hours past
    mockInvitations
      .filter(invitation => 
        (invitation.status === 'completed' || invitation.status === 'accepted') &&
        isPostMeal(invitation.date, invitation.time)
      )
      .forEach(invitation => {
        const eventId = `invitation-${invitation.id}`;
        const eventDateTime = parseDateTime(invitation.date, invitation.time);
        const tenHoursAfterEvent = new Date(eventDateTime.getTime() + (10 * 60 * 60 * 1000));
        const invitationId = invitation.id;
        const dateChoice = getDateChoice(invitationId);
        const userChoice = selectedChoices[eventId];
        
        // Check if both parties have made decisions
        const bothPartiesDecided = userChoice && dateChoice;
        
        if (bothPartiesDecided) {
          // Check if there's an active mixed signals extension
          const dateUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
          const extensionKey = `${invitationId}-${dateUserId}`;
          const extension = mixedSignalsExtensions[extensionKey];
          
          // If there's an extension, check if both parties have made their second decisions
          if (extension) {
            if (extension.hasUserReDecided && extension.hasDateReDecided) {
              // Both parties have made their second decisions, check if they match
              const secondDecisionMatch = extension.userChoice === extension.dateChoice;
              
              console.log(`Event ${eventId} - Extension completed. User: ${extension.userChoice}, Date: ${extension.dateChoice}, Match: ${secondDecisionMatch}`);
              
              if (!secondDecisionMatch) {
                // Second decisions don't match - remove the profile completely
                console.log(`Event ${eventId} - second decisions don't match (${extension.userChoice} vs ${extension.dateChoice}), removing profile`);
                return; // Skip this event
              }
              
              // Second decisions match - handle based on match type
              console.log(`Event ${eventId} - second decisions match: ${extension.userChoice}`);
              
              // Handle buddy_pass matches (remove from post-meal page but keep chat)
              if (extension.userChoice === 'buddy_pass') {
                console.log(`Event ${eventId} - buddy pass match after extension, removing from post-meal page`);
                return; // Skip this event (remove from post-meal page)
              }
              // For fight_for_fries and next_round matches, keep the profile on post-meal page
              console.log(`Event ${eventId} - keeping profile on post-meal page after extension match`);
            } else {
              // Extension is active but not both parties have re-decided yet
              // Check if 24 hours have passed since the extension started
              const timeSinceExtension = now.getTime() - extension.startedAt.getTime();
              const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
              
              if (timeSinceExtension >= twentyFourHoursInMs) {
                // Extension period is over, remove the profile
                console.log(`Removing event ${eventId} - mixed signals extension period ended`);
                return; // Skip this event
              }
              // Extension is still active, keep the event
              console.log(`Event ${eventId} - extension active, waiting for decisions. User decided: ${extension.hasUserReDecided}, Date decided: ${extension.hasDateReDecided}`);
            }
          } else {
            // No extension, check original decisions
            const isMatch = userChoice === dateChoice;
            
            if (isMatch) {
              // When there's a match, remove the profile from post-meal page to keep it clean
              // The chat remains available in the Messages tab
              console.log(`Event ${eventId} - match detected (${userChoice}), removing from post-meal page but keeping chat`);
              return; // Skip this event (remove from post-meal page)
            } else {
              // Check for mixed signals case: one wants next_round, other wants fight_for_fries
              const isMixedSignals = (userChoice === 'next_round' && dateChoice === 'fight_for_fries') ||
                                   (userChoice === 'fight_for_fries' && dateChoice === 'next_round');
              
              if (isMixedSignals) {
                // This should trigger a mixed signals extension, but since we're in the filtering logic,
                // we'll keep the event to allow the extension to be created
                console.log(`Event ${eventId} - mixed signals detected, keeping for extension`);
              } else {
                // For non-matches: profile disappears immediately from post meal page
                // and chat is also removed immediately
                console.log(`Removing event ${eventId} - both parties decided but no match (${userChoice} vs ${dateChoice})`);
                
                return; // Skip this event
              }
            }
          }
        } else {
          // If not both parties decided, check if 7 days have passed since the event became available
          const timeSinceAvailable = now.getTime() - tenHoursAfterEvent.getTime();
          if (timeSinceAvailable >= sevenDaysInMs) {
            console.log(`Removing event ${eventId} - 7 days have passed without both parties deciding`);
            return; // Skip this event
          }
        }
        
        const inviter = mockUsers.find(u => u.id === invitation.inviterId);
        events.push({
          id: eventId,
          type: 'invitation',
          title: `Dinner with ${inviter?.name || 'Someone'}`,
          venue: invitation.venue.name,
          address: invitation.venue.address,
          date: invitation.date,
          time: invitation.time,
          cuisine: invitation.venue.cuisine,
        });
      });
    
    // Add meal ups that are 10+ hours past and user attended
    mockMealUps
      .filter(mealUp => 
        mealUp.currentAttendees.includes('1') && // Current user attended
        isPostMeal(mealUp.date, mealUp.time)
      )
      .forEach(mealUp => {
        const eventId = `mealup-${mealUp.id}`;
        const choiceTimestamp = choiceTimestamps[eventId];
        const eventDateTime = parseDateTime(mealUp.date, mealUp.time);
        const tenHoursAfterEvent = new Date(eventDateTime.getTime() + (10 * 60 * 60 * 1000));
        
        // For group events, we don't have date choices, so just use the original 7-day logic
        if (choiceTimestamp) {
          const timeSinceChoice = now.getTime() - choiceTimestamp.getTime();
          if (timeSinceChoice >= twentyFourHoursInMs) {
            console.log(`Removing event ${eventId} - 24 hours have passed since choice was made`);
            return; // Skip this event
          }
        } else {
          const timeSinceAvailable = now.getTime() - tenHoursAfterEvent.getTime();
          if (timeSinceAvailable >= sevenDaysInMs) {
            console.log(`Removing event ${eventId} - 7 days have passed without a choice`);
            return; // Skip this event
          }
        }
        
        events.push({
          id: eventId,
          type: 'mealup',
          title: mealUp.title,
          venue: mealUp.venue.name,
          address: mealUp.venue.address,
          date: mealUp.date,
          time: mealUp.time,
          attendees: mealUp.currentAttendees,
          imageUrl: mealUp.imageUrl,
          cuisine: mealUp.venue.cuisine,
        });
      });
    
    // Sort by date (most recent first)
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [choiceTimestamps, selectedChoices, mixedSignalsExtensions, getDateChoice]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleMixedSignalsExtensionChoice = (eventId: string, choice: string) => {
    const invitationId = eventId.replace('invitation-', '');
    const invitation = mockInvitations.find(inv => inv.id === invitationId);
    
    if (!invitation) return;
    
    const dateUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
    const extensionKey = `${invitationId}-${dateUserId}`;
    const extension = mixedSignalsExtensions[extensionKey];
    
    if (!extension) return;
    
    const now = new Date();
    
    // Get the date's current choice in the extension period
    const currentDateChoice = getDateChoice(invitationId);
    
    // Simulate Sofia's second choice based on realistic scenarios
    // For proper testing of mixed signals resolution
    let dateExtendedChoice: string | null;
    
    // If date hasn't decided yet, keep it as null
    if (!currentDateChoice) {
      dateExtendedChoice = null;
    } else {
      // Simulate Sofia choosing the SAME option as the user for testing
      // This ensures both parties match on their second decision
      dateExtendedChoice = choice;
    }
    
    // CRITICAL: Update selectedChoices with the NEW choice (second decision)
    // This ensures the system uses the second decision, not the first
    setSelectedChoices(prev => ({
      ...prev,
      [eventId]: choice // Use the NEW choice
    }));
    console.log(`Updated selectedChoices with NEW choice for ${eventId}: ${choice}`);
    
    // Update all states together to ensure synchronous UI update
    // This ensures the "Your date chose" section updates immediately when the popup shows
    setExtendedChoices(prev => ({
      ...prev,
      [eventId]: choice
    }));
    
    setFinalizedChoices(prev => ({
      ...prev,
      [eventId]: true
    }));
    
    // CRITICAL: Reset the timer to 24 hours from NOW for the extension period
    const extensionStartTime = new Date();
    
    // Update the extension with both user and date decisions
    // This single update ensures the UI refreshes with both choices at once
    setMixedSignalsExtensions(prev => {
      const updated = {
        ...prev,
        [extensionKey]: {
          ...extension,
          startedAt: extensionStartTime, // Reset timer to NOW
          hasUserReDecided: true,
          userChoice: choice, // Use the NEW choice, not the old one
          hasDateReDecided: true,
          dateChoice: dateExtendedChoice // Use the NEW date choice
        }
      };
      console.log(`Updated extension for ${extensionKey}:`, updated[extensionKey]);
      console.log(`Timer reset to: ${extensionStartTime.toISOString()}`);
      return updated;
    });
    
    // Note: We don't need to update choiceTimestamps here because
    // the timer calculation now uses extension.startedAt directly
    console.log(`Extension timer will use startedAt: ${extensionStartTime.toISOString()}`);
    
    console.log(`Mixed signals extension choice made for ${eventId}: ${choice} at ${now.toISOString()}`);
    console.log(`Date's second choice: ${dateExtendedChoice}`);
    console.log(`Following SECOND decision: User=${choice}, Date=${dateExtendedChoice}`);
    
    // Add notification for the date's extended decision (only if they've decided)
    if (invitation && dateExtendedChoice) {
      const dateUser = mockUsers.find(u => u.id === (invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId));
      if (dateUser) {
        addMatchDecisionNotification(
          dateUser.name,
          dateExtendedChoice,
          invitation.venue.name,
          dateUser.id,
          invitationId,
          isPremium
        );
      }
    }
    
    if (dateExtendedChoice !== null) {
      // Both parties have made their extended decisions
      // CRITICAL: Use the NEW choices (choice and dateExtendedChoice), not the old ones
      const isExtendedMatch = choice === dateExtendedChoice;
      let matchType: 'fight_for_fries' | 'buddy_pass' | 'next_round' | null = null;
      
      console.log(`Extension resolution: User chose ${choice}, Date chose ${dateExtendedChoice}, Match: ${isExtendedMatch}`);
      console.log(`This is based on SECOND decisions, not first decisions`);
      
      if (isExtendedMatch) {
        matchType = choice as 'fight_for_fries' | 'buddy_pass' | 'next_round';
        console.log(`Extended match found! User: ${choice}, Date: ${dateExtendedChoice}`);
        console.log(`Match type set to: ${matchType}`);
        
        // Track the match with the NEW match type for BOTH users
        addMatchedProfile(dateUserId, invitationId, matchType);
        addMatchedProfile('1', invitationId, matchType); // Add current user to matched profiles
        console.log(`Added matched profile after extension: ${dateUserId} with match type: ${matchType}`);
        console.log(`Added current user (1) to matched profiles with match type: ${matchType}`);
        
        console.log(`Setting match result with isMatch=true, matchType=${matchType}`);
        setMatchResult({
          isMatch: true,
          matchType,
          userChoice: choice,
          dateChoice: dateExtendedChoice,
          eventId
        });
        
        setShowMatchModal(true);
        
        // Animate balloons
        Animated.sequence([
          Animated.timing(balloonAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(balloonAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          })
        ]).start();
        

      } else {
        // No match after extension - remove profile and chat immediately
        console.log(`No match after extension period for ${eventId} - removing profile and chat`);
        console.log(`User's second choice: ${choice}, Date's second choice: ${dateExtendedChoice}`);
        const userChoices: Record<string, { choice: string; timestamp: Date }> = {
          [eventId]: { choice, timestamp: new Date(0) } // Use epoch to trigger immediate removal
        };
        checkAndRemoveNonMatchingProfiles(userChoices);
        
        // Clear the extension immediately to trigger profile removal from post-meal page
        setMixedSignalsExtensions(prev => {
          const updated = { ...prev };
          delete updated[extensionKey];
          console.log(`Cleared extension for ${extensionKey} - profile should be removed from post-meal page`);
          return updated;
        });
        
        setMatchResult({
          isMatch: false,
          matchType: null,
          userChoice: choice,
          dateChoice: dateExtendedChoice,
          eventId
        });
        
        setShowMatchModal(true);
      }
    } else {
      // Date hasn't made their extended choice yet - show waiting message
      console.log(`User made extended choice during mixed signals: ${choice}, waiting for date's decision`);
      
      // CRITICAL: Don't finalize the choice - allow the user to change it
      // Clear BOTH finalized flag AND extended choice to reset the UI
      setFinalizedChoices(prev => {
        const updated = { ...prev };
        delete updated[eventId];
        console.log(`Cleared finalized choice for ${eventId} - date hasn't decided yet`);
        return updated;
      });
      
      // Clear the extended choice too so user can reselect
      setExtendedChoices(prev => {
        const updated = { ...prev };
        delete updated[eventId];
        console.log(`Cleared extended choice for ${eventId} - date hasn't decided yet`);
        return updated;
      });
      
      // Clear from selectedChoices as well
      setSelectedChoices(prev => {
        const updated = { ...prev };
        delete updated[eventId];
        console.log(`Cleared selected choice for ${eventId} - date hasn't decided yet`);
        return updated;
      });
      
      setMatchResult({
        isMatch: false,
        matchType: 'no_decision',
        userChoice: choice,
        dateChoice: null,
        eventId
      });
      
      setShowMatchModal(true);
    }
  };

  const handleChoiceSelect = (eventId: string, choice: string) => {
    // Check if this is a mixed signals extension case
    const invitationId = eventId.replace('invitation-', '');
    const invitation = mockInvitations.find(inv => inv.id === invitationId);
    
    if (invitation) {
      const dateUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
      const extensionKey = `${invitationId}-${dateUserId}`;
      const extension = mixedSignalsExtensions[extensionKey];
      
      if (extension) {
        // This is a mixed signals extension case - handle differently
        handleMixedSignalsExtensionChoice(eventId, choice);
        return;
      }
    }
    
    // Don't allow changes if already finalized (user can only choose once, except during mixed signals)
    if (finalizedChoices[eventId]) {
      console.log(`Choice already finalized for ${eventId}, cannot change`);
      return;
    }
    
    // Don't allow changes if user has already made a choice (prevent multiple selections)
    if (selectedChoices[eventId]) {
      console.log(`User has already made a choice for ${eventId}, cannot change`);
      return;
    }



    const now = new Date();
    
    // Mark as finalized immediately to prevent changing the choice
    // Exception: if it's a mixed signals case, we'll clear this later
    setFinalizedChoices(prev => ({
      ...prev,
      [eventId]: true
    }));
    
    setSelectedChoices(prev => ({
      ...prev,
      [eventId]: choice
    }));
    
    // Record the timestamp when the choice was made
    setChoiceTimestamps(prev => {
      const updated = {
        ...prev,
        [eventId]: now
      };
      
      // Check and remove non-matching profiles after updating timestamps
      setTimeout(() => {
        const userChoices: Record<string, { choice: string; timestamp: Date }> = {};
        Object.entries(updated).forEach(([id, timestamp]) => {
          const selectedChoice = id === eventId ? choice : selectedChoices[id];
          if (selectedChoice) {
            userChoices[id] = { choice: selectedChoice, timestamp };
          }
        });
        checkAndRemoveNonMatchingProfiles(userChoices);
      }, 100);
      
      return updated;
    });
    
    console.log(`Choice made for ${eventId}: ${choice} at ${now.toISOString()}`);
    console.log('Waiting for other party to make their decision...');
    
    // Check for match after user makes a choice
    const dateChoice = getDateChoice(invitationId);
    
    if (dateChoice) {
      // Add notification for the date's decision (if not already notified)
      if (invitation) {
        const dateUser = mockUsers.find(u => u.id === (invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId));
        if (dateUser) {
          addMatchDecisionNotification(
            dateUser.name,
            dateChoice,
            invitation.venue.name,
            dateUser.id,
            invitationId,
            isPremium
          );
        }
      }
      const isMatch = choice === dateChoice;
      let matchType: 'fight_for_fries' | 'buddy_pass' | 'next_round' | 'mixed_signals' | 'mixed_signals_extension' | 'match_permanent' | null = null;
      
      if (isMatch) {
        matchType = choice as 'fight_for_fries' | 'buddy_pass' | 'next_round';
        // Track the match for BOTH users
        if (invitation) {
          const dateUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
          addMatchedProfile(dateUserId, invitationId, matchType);
          addMatchedProfile('1', invitationId, matchType); // Add current user to matched profiles
          console.log(`Added matched profile: ${dateUserId} with match type: ${matchType}`);
          console.log(`Added current user (1) to matched profiles with match type: ${matchType}`);
          
          // Special handling for buddy_pass: it's a match but profile gets removed from post-meal
          // Chat remains available (handled in useChat hook)
        }
      } else {
        // Check for mixed signals case: one wants next_round, other wants fight_for_fries
        if ((choice === 'next_round' && dateChoice === 'fight_for_fries') ||
            (choice === 'fight_for_fries' && dateChoice === 'next_round')) {
          
          if (invitation) {
            const dateUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
            const extensionKey = `${invitationId}-${dateUserId}`;
            
            // Check if we already have an extension for this case
            if (mixedSignalsExtensions[extensionKey]) {
              matchType = 'mixed_signals_extension';
            } else {
              // Start a new 24-hour extension period
              // IMPORTANT: Use the current time as the extension start time
              const extensionStartTime = new Date();
              const extension: MixedSignalsExtension = {
                userId: dateUserId,
                invitationId,
                startedAt: extensionStartTime,
                userChoice: choice,
                dateChoice,
                hasUserReDecided: false,
                hasDateReDecided: false
              };
              
              // CRITICAL: Clear ALL states related to the old decision
              // This ensures the UI shows a clean slate for retaking decisions
              
              // 1. Clear the finalized choice flag to allow retaking
              setFinalizedChoices(prev => {
                const updated = { ...prev };
                delete updated[eventId];
                console.log(`[Mixed Signals] Cleared finalized choice for ${eventId}`);
                return updated;
              });
              
              // 2. Clear the old choice from selectedChoices
              setSelectedChoices(prev => {
                const updated = { ...prev };
                delete updated[eventId];
                console.log(`[Mixed Signals] Cleared old choice from selectedChoices for ${eventId}`);
                return updated;
              });
              
              // 3. Reset the timer to 24 hours from NOW
              setChoiceTimestamps(prev => {
                const updated = {
                  ...prev,
                  [eventId]: extensionStartTime
                };
                console.log(`[Mixed Signals] Reset timer to 24 hours from: ${extensionStartTime.toISOString()}`);
                return updated;
              });
              
              // 4. Create the extension state
              setMixedSignalsExtensions(prev => {
                const updated = {
                  ...prev,
                  [extensionKey]: extension
                };
                console.log(`[Mixed Signals] Created extension:`, extension);
                return updated;
              });
              
              matchType = 'mixed_signals_extension';
              console.log(`[Mixed Signals] Started 24-hour extension for ${extensionKey}`);
              console.log(`[Mixed Signals] Old decisions cleared. Users can now retake their decisions.`);
              
              // Track mixed signals case immediately when extension is created
              trackMixedSignalsCase(dateUserId, invitationId);
              console.log(`[Mixed Signals] Started tracking case for user ${dateUserId}`);
              
              // Add notification for the first user about mixed signals
              const dateUser = mockUsers.find(u => u.id === dateUserId);
              if (dateUser) {
                addMixedSignalsNotification(
                  dateUser.name,
                  invitation.venue.name,
                  dateUserId,
                  invitationId
                );
                console.log(`[Mixed Signals] Added notification for user about mixed signals with ${dateUser.name}`);
              }
            }
          }
        }
        // Note: For non-matches, the profile is removed from post meal and chat immediately
      }
      
      // Choice is already finalized at the start of handleChoiceSelect
      // For mixed signals cases, we clear the finalized flag to allow retaking
      // (This is already handled in the mixed signals extension creation code above)
      
      // Show modal for all cases where both parties have decided
      setMatchResult({
        isMatch,
        matchType,
        userChoice: choice,
        dateChoice,
        eventId
      });
      
      setShowMatchModal(true);
      
      if (isMatch) {
        // Animate balloons
        Animated.sequence([
          Animated.timing(balloonAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(balloonAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          })
        ]).start();
        

      }
    } else {
      // Date hasn't made a decision yet - show the "no decision yet" popup
      setMatchResult({
        isMatch: false,
        matchType: 'no_decision',
        userChoice: choice,
        dateChoice: null,
        eventId
      });
      
      setShowMatchModal(true);
      
      // Simulate the date making a decision after a short delay (for demo purposes)
      setTimeout(() => {
        if (invitation) {
          const dateUser = mockUsers.find(u => u.id === (invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId));
          if (dateUser) {
            // Simulate Sofia making a decision
            const simulatedDateChoice = 'fight_for_fries';
            addMatchDecisionNotification(
              dateUser.name,
              simulatedDateChoice,
              invitation.venue.name,
              dateUser.id,
              invitationId,
              isPremium
            );
          }
        }
      }, 5000); // 5 seconds delay for demo
    }
  };

  const handleEventPress = (event: PostMealEvent) => {
    if (event.type === 'mealup') {
      // Extract the original meal up ID by removing the prefix
      const mealUpId = event.id.replace('mealup-', '');
      // Navigate to attendees page for group events
      router.push(`/meal-up-attendees?mealUpId=${mealUpId}` as any);
    }
  };



  const getTimeRemaining = (eventId: string, eventDate: Date, eventTime: string) => {
    const choiceTimestamp = choiceTimestamps[eventId];
    const eventDateTime = parseDateTime(eventDate, eventTime);
    const tenHoursAfterEvent = new Date(eventDateTime.getTime() + (10 * 60 * 60 * 1000));
    const now = currentTime;
    
    // For invitations, check if both parties have decided
    const isInvitation = eventId.startsWith('invitation-');
    if (isInvitation) {
      const invitationId = eventId.replace('invitation-', '');
      const invitation = mockInvitations.find(inv => inv.id === invitationId);
      
      // CRITICAL: Check for active extension FIRST before checking choices
      if (invitation) {
        const dateUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
        const extensionKey = `${invitationId}-${dateUserId}`;
        const extension = mixedSignalsExtensions[extensionKey];
        
        // If there's an active extension, use the extension's timer
        if (extension) {
          console.log(`[Timer] Using extension timer for ${eventId}. Extension started at: ${extension.startedAt.toISOString()}`);
          const twentyFourHoursAfterExtension = new Date(extension.startedAt.getTime() + (24 * 60 * 60 * 1000));
          const timeLeft = twentyFourHoursAfterExtension.getTime() - now.getTime();
          console.log(`[Timer] Time left: ${timeLeft}ms (${Math.floor(timeLeft / 1000 / 60 / 60)}h ${Math.floor((timeLeft / 1000 / 60) % 60)}m)`);
          return {
            timeLeft: Math.max(0, timeLeft),
            type: 'mixed_signals_extension' as const,
            totalTime: 24 * 60 * 60 * 1000
          };
        }
      }
      
      // No active extension, proceed with normal logic
      const dateChoice = getDateChoice(invitationId);
      const userChoice = selectedChoices[eventId];
      const bothPartiesDecided = userChoice && dateChoice;
      
      if (bothPartiesDecided) {
        // If both parties decided, check if it's a match
        const isMatch = userChoice === dateChoice;
        
        if (isMatch) {
          // Special case: buddy_pass matches are removed from post-meal page
          if (userChoice === 'buddy_pass') {
            return {
              timeLeft: 0,
              type: 'no_match_removed' as const,
              totalTime: 0
            };
          } else {
            // For other matches: no timer needed, profile stays permanently
            return {
              timeLeft: Infinity,
              type: 'match_permanent' as const,
              totalTime: Infinity
            };
          }
        } else {
          // For non-matches: profile should already be removed
          return {
            timeLeft: 0,
            type: 'no_match_removed' as const,
            totalTime: 0
          };
        }
      } else {
        // If not both parties decided, show 7 day countdown from when event became available
        const sevenDaysAfterAvailable = new Date(tenHoursAfterEvent.getTime() + (7 * 24 * 60 * 60 * 1000));
        const timeLeft = sevenDaysAfterAvailable.getTime() - now.getTime();
        return {
          timeLeft: Math.max(0, timeLeft),
          type: 'waiting_for_decision' as const,
          totalTime: 7 * 24 * 60 * 60 * 1000
        };
      }
    } else {
      // For group events, use original logic
      if (choiceTimestamp) {
        const twentyFourHoursAfterChoice = new Date(choiceTimestamp.getTime() + (24 * 60 * 60 * 1000));
        const timeLeft = twentyFourHoursAfterChoice.getTime() - now.getTime();
        return {
          timeLeft: Math.max(0, timeLeft),
          type: 'choice_made' as const,
          totalTime: 24 * 60 * 60 * 1000
        };
      } else {
        const sevenDaysAfterAvailable = new Date(tenHoursAfterEvent.getTime() + (7 * 24 * 60 * 60 * 1000));
        const timeLeft = sevenDaysAfterAvailable.getTime() - now.getTime();
        return {
          timeLeft: Math.max(0, timeLeft),
          type: 'no_choice' as const,
          totalTime: 7 * 24 * 60 * 60 * 1000
        };
      }
    }
  };

  const formatTimeRemaining = (milliseconds: number) => {
    if (milliseconds <= 0) return '00:00:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderPostMealEvent = (event: PostMealEvent) => {
    const isGroup = event.type === 'mealup';
    const invitationId = event.id.replace('invitation-', '');
    const dateChoice = !isGroup ? getDateChoice(invitationId) : null;
    const choiceDisplay = dateChoice ? getChoiceDisplay(dateChoice) : null;
    
    // CRITICAL: Use extendedChoices if available (second decision), otherwise use selectedChoices (first decision)
    const userSelectedChoice = extendedChoices[event.id] || selectedChoices[event.id];
    const isChoiceFinalized = finalizedChoices[event.id];
    
    console.log(`[Render] Event ${event.id}: userSelectedChoice=${userSelectedChoice}, dateChoice=${dateChoice}`);
    
    // Check if there's a match (both users chose the same option)
    // CRITICAL: This should use the CURRENT choices (second decision if available)
    const isMatch = userSelectedChoice && dateChoice && userSelectedChoice === dateChoice;
    const matchType = isMatch ? userSelectedChoice as 'fight_for_fries' | 'buddy_pass' | 'next_round' : null;
    
    // Get timer information
    const timerInfo = getTimeRemaining(event.id, event.date, event.time);
    const timeRemaining = formatTimeRemaining(timerInfo.timeLeft);
    const isExpired = timerInfo.timeLeft <= 0;

    
    return (
      <TouchableOpacity 
        key={event.id} 
        style={styles.eventCard}
        onPress={() => handleEventPress(event)}
        disabled={!isGroup}
      >
        {event.imageUrl && (
          <Image source={{ uri: event.imageUrl }} style={styles.eventImage} />
        )}
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            {event.type === 'invitation' ? (
              <TouchableOpacity 
                onPress={() => {
                  const invitationId = event.id.replace('invitation-', '');
                  const invitation = mockInvitations.find(inv => inv.id === invitationId);
                  if (invitation) {
                    const inviter = mockUsers.find(u => u.id === invitation.inviterId);
                    if (inviter) {
                      router.push(`/user-profile?userId=${inviter.id}` as any);
                    }
                  }
                }}
                style={styles.profileContainer}
              >
                {(() => {
                  const invitationId = event.id.replace('invitation-', '');
                  const invitation = mockInvitations.find(inv => inv.id === invitationId);
                  const inviter = invitation ? mockUsers.find(u => u.id === invitation.inviterId) : null;
                  return (
                    <View style={styles.profileInfo}>
                      {inviter?.photos?.[0] && (
                        <Image 
                          source={{ uri: inviter.photos[0] }} 
                          style={styles.profileImage} 
                        />
                      )}
                      <View style={styles.nameContainer}>
                        <Text style={[styles.eventTitle, styles.clickableName]}>
                          {event.title.replace('Dinner with ', '')}
                        </Text>
                      </View>
                    </View>
                  );
                })()}
              </TouchableOpacity>
            ) : (
              <Text style={styles.eventTitle}>{event.title}</Text>
            )}
            <View style={styles.headerRight}>
              {event.type === 'mealup' && (
                <View style={styles.eventTypeTag}>
                  <Text style={styles.eventTypeText}>Group</Text>
                </View>
              )}
              {!isGroup && timerInfo.type !== 'match_permanent' && timerInfo.type !== 'no_match_removed' && (
                <View style={[
                  styles.timerContainer,
                  isExpired && styles.expiredTimer,
                  (timerInfo.type === 'choice_made') && styles.choiceMadeTimer,
                  (timerInfo.type === 'mixed_signals_extension') && styles.mixedSignalsTimer
                ]}>
                  <Timer size={12} color={
                    isExpired ? '#FF4444' : 
                    (timerInfo.type === 'choice_made') ? '#FFA726' : 
                    (timerInfo.type === 'mixed_signals_extension') ? '#FF6B35' :
                    colors.textLight
                  } />
                  <Text style={[
                    styles.timerText,
                    isExpired && styles.expiredTimerText,
                    (timerInfo.type === 'choice_made') && styles.choiceMadeTimerText,
                    (timerInfo.type === 'mixed_signals_extension') && styles.mixedSignalsTimerText
                  ]}>
                    {timeRemaining}
                  </Text>
                </View>
              )}
              {!isGroup && (
                <View style={styles.matchIndicator}>
                  <Text style={styles.matchIndicatorText}>Meal 1</Text>
                </View>
              )}
              {!isGroup && timerInfo.type === 'match_permanent' && matchType === 'fight_for_fries' && (
                <View style={styles.loveIconContainer}>
                  <Heart size={16} color={colors.primary} fill={colors.primary} />
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.eventDetails}>
            <View style={styles.eventDetailRow}>
              <MapPin size={16} color={colors.textLight} />
              <Text style={styles.eventDetailText}>{event.venue}</Text>
            </View>
            
            <View style={styles.eventDetailRow}>
              <Clock size={16} color={colors.textLight} />
              <Text style={styles.eventDetailText}>
                {formatDate(event.date)} at {event.time}
              </Text>
            </View>
            
            {event.attendees && event.attendees.length > 1 && (
              <View style={styles.eventDetailRow}>
                <Users size={16} color={colors.textLight} />
                <Text style={styles.eventDetailText}>
                  {event.attendees.length} attendees
                </Text>
              </View>
            )}
          </View>
          
          {isGroup ? (
            <View style={styles.groupActionContainer}>
              <View style={styles.groupActionContent}>
                <Text style={styles.groupActionText}>Tap to view attendees and send voice notes</Text>
                <ChevronRight size={20} color={colors.primary} />
              </View>
            </View>
          ) : (
            <View style={styles.choicesContainer}>
              <View style={styles.dateChoiceSection}>
                <View style={styles.dateChoiceHeader}>
                  <View style={styles.dateChoiceHeaderContent}>
                    <Star size={14} color={colors.premium} />
                    <Text style={styles.dateChoiceText}>Your date chose:</Text>
                  </View>
                </View>
                {(() => {
                  // Check if this is a mixed signals extension case and get the updated choice
                  const invitationId = event.id.replace('invitation-', '');
                  const invitation = mockInvitations.find(inv => inv.id === invitationId);
                  let displayChoice = choiceDisplay;
                  
                  if (invitation) {
                    const dateUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
                    const extensionKey = `${invitationId}-${dateUserId}`;
                    const extension = mixedSignalsExtensions[extensionKey];
                    
                    // If there's an extension and the date has re-decided, show their new choice
                    if (extension && extension.hasDateReDecided && extension.dateChoice) {
                      displayChoice = getChoiceDisplay(extension.dateChoice);
                      console.log(`Displaying updated date choice: ${extension.dateChoice}`);
                    }
                  }
                  
                  const hasPaid = paidToViewChoices[event.id];
                  
                  return (
                    <View>
                      <View style={[styles.choiceButton, styles.selectedChoice, !hasPaid && styles.blurredChoiceContainer]}>
                        <Text style={[styles.choiceButtonText, styles.selectedChoiceText, !hasPaid && styles.blurredChoiceText]}>
                          {displayChoice ? displayChoice.text : 'No decision yet — currently marinating 🍖 #patience'}
                        </Text>
                        {displayChoice && (
                          <Text style={[styles.choiceSubtext, styles.selectedChoiceSubtext, !hasPaid && styles.blurredChoiceText]}>
                            {displayChoice.subtext}
                          </Text>
                        )}
                      </View>
                      {!hasPaid && (
                        <View style={styles.blurOverlay}>
                          <TouchableOpacity 
                            style={styles.payToViewButton}
                            onPress={() => handlePayToViewChoice(event.id)}
                          >
                            <Text style={styles.payToViewButtonText}>💰 Tip us to view</Text>
                            <Text style={styles.payToViewSubtext}>Min $5</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })()}
              </View>
              
              <View style={styles.userChoicesSection}>
                <Text style={styles.userChoicesTitle}>What&apos;s your decision? 🤘</Text>
                
                {/* Check if this is a mixed signals extension case where user can retake decision */}
                {(() => {
                  const invitationId = event.id.replace('invitation-', '');
                  const invitation = mockInvitations.find(inv => inv.id === invitationId);
                  if (invitation) {
                    const dateUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
                    const extensionKey = `${invitationId}-${dateUserId}`;
                    const extension = mixedSignalsExtensions[extensionKey];
                    
                    // If there's an active extension and user HAS re-decided, show only their selected choice
                    if (extension && extension.hasUserReDecided && timerInfo.type === 'mixed_signals_extension' && timerInfo.timeLeft > 0) {
                      const userExtendedChoice = extension.userChoice;
                      return (
                        <View style={[
                          styles.choiceButton, 
                          styles.finalizedBuddyPassButton
                        ]}>
                          <Text style={[styles.choiceButtonText, styles.finalizedChoiceText]}>
                            {userExtendedChoice === 'buddy_pass' && 'Buddy pass ✅'}
                            {userExtendedChoice === 'next_round' && "Let's do next round"}
                            {userExtendedChoice === 'fight_for_fries' && 'Fight for fries for life'}
                          </Text>
                          <Text style={[styles.choiceSubtext, styles.finalizedChoiceText]}>
                            {userExtendedChoice === 'buddy_pass' && '(Stay Friend)'}
                            {userExtendedChoice === 'next_round' && '(Next date)'}
                            {userExtendedChoice === 'fight_for_fries' && '(Be my +1?)'}
                          </Text>
                          <Text style={[
                            styles.finalizedLabel,
                            styles.finalizedBuddyPassLabel
                          ]}>New Choice</Text>
                        </View>
                      );
                    }
                    
                    // If there's an active extension and user hasn't re-decided, allow retaking decision
                    if (extension && !extension.hasUserReDecided && timerInfo.type === 'mixed_signals_extension' && timerInfo.timeLeft > 0) {
                      return (
                        <>
                          <View style={styles.retakeDecisionHeader}>
                            <Text style={styles.retakeDecisionTitle}>🤔 Mixed signals detected!</Text>
                            <Text style={[styles.retakeDecisionSubtitle, styles.lastChanceText]}>
                              • ⚠️ Last 24 hours to decide again.{"\n"}• No match = chat gone forever.{"\n"}• Chat it out 💝
                            </Text>
                          </View>
                          
                          <TouchableOpacity 
                            style={[
                              styles.choiceButton,
                              extendedChoices[event.id] === 'buddy_pass' && styles.selectedChoiceButton
                            ]}
                            onPress={() => handleChoiceSelect(event.id, 'buddy_pass')}
                          >
                            <Text style={[
                              styles.choiceButtonText,
                              extendedChoices[event.id] === 'buddy_pass' && styles.selectedChoiceButtonText
                            ]}>Buddy pass ✅</Text>
                            <Text style={[
                              styles.choiceSubtext,
                              extendedChoices[event.id] === 'buddy_pass' && styles.selectedChoiceButtonText
                            ]}>(Stay Friend)</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[
                              styles.choiceButton,
                              extendedChoices[event.id] === 'next_round' && styles.selectedChoiceButton
                            ]}
                            onPress={() => handleChoiceSelect(event.id, 'next_round')}
                          >
                            <Text style={[
                              styles.choiceButtonText,
                              extendedChoices[event.id] === 'next_round' && styles.selectedChoiceButtonText
                            ]}>Let&apos;s do next round</Text>
                            <Text style={[
                              styles.choiceSubtext,
                              extendedChoices[event.id] === 'next_round' && styles.selectedChoiceButtonText
                            ]}>(Next date)</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[
                              styles.choiceButton,
                              extendedChoices[event.id] === 'fight_for_fries' && styles.selectedChoiceButton,
                              isFightForFriesDisabled(event.id) && styles.disabledChoiceButton
                            ]}
                            onPress={() => {
                              if (!isFightForFriesDisabled(event.id)) {
                                handleChoiceSelect(event.id, 'fight_for_fries');
                              }
                            }}
                            disabled={isFightForFriesDisabled(event.id)}
                          >
                            <Text style={[
                              styles.choiceButtonText,
                              extendedChoices[event.id] === 'fight_for_fries' && styles.selectedChoiceButtonText,
                              isFightForFriesDisabled(event.id) && styles.disabledChoiceText
                            ]}>Fight for fries for life</Text>
                            <Text style={[
                              styles.choiceSubtext,
                              extendedChoices[event.id] === 'fight_for_fries' && styles.selectedChoiceButtonText,
                              isFightForFriesDisabled(event.id) && styles.disabledChoiceText
                            ]}>(Be my +1?)</Text>
                            {isFightForFriesDisabled(event.id) && (
                              <Text style={styles.disabledReasonText}>
                                Already chosen for another date
                              </Text>
                            )}
                          </TouchableOpacity>
                        </>
                      );
                    }
                  }
                  
                  // Show original choice if finalized or no extension
                  return !isChoiceFinalized ? (
                  <>
                    <TouchableOpacity 
                      style={[
                        styles.choiceButton,
                        userSelectedChoice === 'buddy_pass' && styles.selectedChoiceButton
                      ]}
                      onPress={() => handleChoiceSelect(event.id, 'buddy_pass')}
                    >
                      <Text style={[
                        styles.choiceButtonText,
                        userSelectedChoice === 'buddy_pass' && styles.selectedChoiceButtonText
                      ]}>Buddy pass ✅</Text>
                      <Text style={[
                        styles.choiceSubtext,
                        userSelectedChoice === 'buddy_pass' && styles.selectedChoiceButtonText
                      ]}>(Stay Friend)</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.choiceButton,
                        userSelectedChoice === 'next_round' && styles.selectedChoiceButton
                      ]}
                      onPress={() => handleChoiceSelect(event.id, 'next_round')}
                    >
                      <Text style={[
                        styles.choiceButtonText,
                        userSelectedChoice === 'next_round' && styles.selectedChoiceButtonText
                      ]}>Let&apos;s do next round</Text>
                      <Text style={[
                        styles.choiceSubtext,
                        userSelectedChoice === 'next_round' && styles.selectedChoiceButtonText
                      ]}>(Next date)</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.choiceButton,
                        userSelectedChoice === 'fight_for_fries' && styles.selectedChoiceButton,
                        isFightForFriesDisabled(event.id) && styles.disabledChoiceButton
                      ]}
                      onPress={() => {
                        if (!isFightForFriesDisabled(event.id)) {
                          handleChoiceSelect(event.id, 'fight_for_fries');
                        }
                      }}
                      disabled={isFightForFriesDisabled(event.id)}
                    >
                      <Text style={[
                        styles.choiceButtonText,
                        userSelectedChoice === 'fight_for_fries' && styles.selectedChoiceButtonText,
                        isFightForFriesDisabled(event.id) && styles.disabledChoiceText
                      ]}>Fight for fries for life</Text>
                      <Text style={[
                        styles.choiceSubtext,
                        userSelectedChoice === 'fight_for_fries' && styles.selectedChoiceButtonText,
                        isFightForFriesDisabled(event.id) && styles.disabledChoiceText
                      ]}>(Be my +1?)</Text>
                      {isFightForFriesDisabled(event.id) && (
                        <Text style={styles.disabledReasonText}>
                          Already chosen for another date
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  /* Show only the selected choice when finalized */
                  <View style={[
                    styles.choiceButton, 
                    styles.finalizedBuddyPassButton
                  ]}>
                    <Text style={[styles.choiceButtonText, styles.finalizedChoiceText]}>
                      {(extendedChoices[event.id] || userSelectedChoice) === 'buddy_pass' && 'Buddy pass ✅'}
                      {(extendedChoices[event.id] || userSelectedChoice) === 'next_round' && "Let's do next round"}
                      {(extendedChoices[event.id] || userSelectedChoice) === 'fight_for_fries' && 'Fight for fries for life'}
                    </Text>
                    <Text style={[styles.choiceSubtext, styles.finalizedChoiceText]}>
                      {(extendedChoices[event.id] || userSelectedChoice) === 'buddy_pass' && '(Stay Friend)'}
                      {(extendedChoices[event.id] || userSelectedChoice) === 'next_round' && '(Next date)'}
                      {(extendedChoices[event.id] || userSelectedChoice) === 'fight_for_fries' && '(Be my +1?)'}
                    </Text>
                    <Text style={[
                      styles.finalizedLabel,
                      (extendedChoices[event.id] || userSelectedChoice) === 'buddy_pass' && styles.finalizedBuddyPassLabel
                    ]}>{extendedChoices[event.id] ? 'New Choice' : 'Your Choice'}</Text>
                  </View>
                );
                })()}
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Post Meal</Text>
          <Text style={styles.subtitle}>
            Your completed dining experiences (10+ hours after the meal)
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === '1on1' && styles.activeTab]}
            onPress={() => setSelectedTab('1on1')}
          >
            <Text style={[styles.tabText, selectedTab === '1on1' && styles.activeTabText]}>
              1 on 1
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'group' && styles.activeTab]}
            onPress={() => setSelectedTab('group')}
          >
            <Text style={[styles.tabText, selectedTab === 'group' && styles.activeTabText]}>
              Group Meal Up
            </Text>
          </TouchableOpacity>
        </View>

        {postMealEvents.filter(event => 
          selectedTab === '1on1' ? event.type === 'invitation' : event.type === 'mealup'
        ).length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={48} color={colors.textLight} />
            <Text style={styles.emptyStateTitle}>
              {selectedTab === '1on1' ? 'No 1 on 1 Meals Yet' : 'No Group Meal Ups Yet'}
            </Text>
            <Text style={styles.emptyStateText}>
              Your completed {selectedTab === '1on1' ? '1 on 1 meals' : 'group meal ups'} will appear here 10 hours after the scheduled time.
            </Text>
          </View>
        ) : (
          <View style={styles.eventsContainer}>
            {postMealEvents
              .filter(event => 
                selectedTab === '1on1' ? event.type === 'invitation' : event.type === 'mealup'
              )
              .map(renderPostMealEvent)}
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Post Meal:</Text>
          <Text style={styles.infoText}>Your post-meal-ups only show up here after 10 hours of the meal time.</Text>
          <Text style={styles.infoText}>{"\n"}You&apos;ve got 7 days to decide. If one person makes their decision while the other is still thinking (Life choices aren&apos;t instant noodles), the timer keeps ticking like a microwaved burrito.</Text>
          <Text style={styles.infoText}>{"\n"}When both have decided:</Text>
          <Text style={styles.infoText}>{"\n"}✅ It&apos;s a match? Profile stays and the chat lives on.</Text>
          <Text style={styles.infoText}>{"\n"}❌ No spark? Poof! Profile and chat vanish like a bad date story.</Text>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Success! 🎉</Text>
              <TouchableOpacity 
                onPress={() => setShowSuccessModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.textLight} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              You&apos;ve been upgraded to Premium!
            </Text>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.upgradeButtonText}>Great!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Tip Selection Modal */}
      <TipSelectionModal
        visible={showTipModal}
        onClose={() => {
          setShowTipModal(false);
          setSelectedEventForTip(null);
        }}
        onConfirm={handleTipConfirm}
        recipientName={(() => {
          if (selectedEventForTip) {
            const invitationId = selectedEventForTip.replace('invitation-', '');
            const invitation = mockInvitations.find(inv => inv.id === invitationId);
            if (invitation) {
              const dateUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
              const dateUser = mockUsers.find(u => u.id === dateUserId);
              return dateUser?.name || 'your date';
            }
          }
          return 'your date';
        })()}
      />

      {/* Match/No Match Modal */}
      <Modal
        visible={showMatchModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowMatchModal(false);
          setMatchResult(null);
          // Force a re-render to update the UI after closing the modal
          setCurrentTime(new Date());
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.matchModalContent]}>
            <TouchableOpacity 
              onPress={() => {
                setShowMatchModal(false);
                setMatchResult(null);
                // Force a re-render to update the UI after closing the modal
                setCurrentTime(new Date());
              }}
              style={styles.matchModalCloseButton}
            >
              <X size={24} color={colors.textLight} />
            </TouchableOpacity>
            {matchResult?.matchType === 'fight_for_fries' ? (
              <>
                <View style={styles.takenIconContainer}>
                  <View style={styles.takenIcon}>
                    <Text style={styles.takenIconText}>T</Text>
                  </View>
                </View>
                <Text style={styles.matchModalTitle}>Taken! 💕</Text>
                <Text style={styles.matchModalDescription}>
                  Exclusive match detected. Even the stars just winked at each other. A tiny tip to keep the universe spinning?
                </Text>
              </>
            ) : matchResult?.matchType === 'buddy_pass' ? (
              <>
                <Text style={styles.noMatchEmoji}>🍻</Text>
                <Text style={styles.matchModalTitle}>Congrats—you just unlocked a new friend!</Text>
                <Text style={styles.matchModalDescription}>
                  Great minds think alike! You both chose to stay friends.{"\n\n"}Heads up: This profile will be removed from the Post Meal page, but your chat is still available in Messages.
                </Text>
              </>
            ) : matchResult?.isMatch && matchResult?.matchType === 'next_round' ? (
              <>
                <Text style={styles.noMatchEmoji}>🎯</Text>
                <Text style={styles.matchModalTitle}>You&apos;re both in for the Next Round!</Text>
                <Text style={styles.matchModalDescription}>
                  YAY! Another successful pairing. Your heart is full, let our ice cream fund be too?
                </Text>
              </>
            ) : matchResult?.matchType === 'mixed_signals' || matchResult?.matchType === 'mixed_signals_extension' ? (
              <>
                <Text style={styles.noMatchEmoji}>🤔</Text>
                <Text style={styles.matchModalTitle}>One of you wants another round, the other is ready to go all in🌹</Text>
                <Text style={styles.matchModalDescription}>
                  {matchResult?.matchType === 'mixed_signals_extension' 
                    ? '⚠️ Last 24 hours to decide again.\nNo match = chat gone forever.\nChat it out 💝' 
                    : 'Time to chat it out!'}
                </Text>
              </>
            ) : matchResult?.matchType === 'no_decision' ? (
              <>
                <Text style={styles.noMatchEmoji}>🥩</Text>
                <Text style={styles.matchModalDescription}>
                  No decision yet — currently marinating 🍖 #patience
                  {matchResult?.eventId && (() => {
                    const eventId = matchResult.eventId;
                    const event = postMealEvents.find(e => e.id === eventId);
                    if (event) {
                      const timerInfo = getTimeRemaining(eventId, event.date, event.time);
                      const timeRemaining = formatTimeRemaining(timerInfo.timeLeft);
                      return `\n\nTime left to make a decision: ${timeRemaining}`;
                    }
                    return '';
                  })()}
                </Text>
              </>
            ) : matchResult?.isMatch ? (
              <>
                <View style={styles.matchIconContainer}>
                  <Heart size={60} color={colors.primary} fill={colors.primary} />
                  <Heart size={40} color={colors.primary} fill={colors.primary} style={styles.smallHeart} />
                </View>
                <Text style={styles.matchModalTitle}>It&apos;s a Match! 🥢</Text>
                <Text style={styles.matchModalDescription}>
                  Two chopsticks finally found each other! Slurp slurp—it&apos;s a match!
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.noMatchEmoji}>✨</Text>
                <Text style={styles.matchModalTitle}>No Spark This Time ✨</Text>
                <Text style={styles.matchModalDescription}>
                  Not a match. Go on to the next meal🍜 This profile and chat will be removed now.
                </Text>
              </>
            )}
            
            {matchResult?.matchType === 'mixed_signals_extension' ? (
              <TouchableOpacity 
                style={[styles.upgradeButton, styles.chatButton]}
                onPress={() => {
                  setShowMatchModal(false);
                  
                  // Clear the finalized choice to allow retaking decision
                  if (matchResult?.eventId) {
                    const eventId = matchResult.eventId;
                    setFinalizedChoices(prev => {
                      const updated = { ...prev };
                      delete updated[eventId];
                      console.log(`Cleared finalized choice for ${eventId} to allow retaking`);
                      return updated;
                    });
                  }
                  
                  setMatchResult(null);
                  
                  // Force a re-render to update the UI after closing the modal
                  setCurrentTime(new Date());
                  // Navigate to chat page
                  if (matchResult?.eventId) {
                    const invitationId = matchResult.eventId.replace('invitation-', '');
                    const invitation = mockInvitations.find(inv => inv.id === invitationId);
                    if (invitation) {
                      const otherUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
                      router.push(`/chat?userId=${otherUserId}` as any);
                    }
                  }
                }}
              >
                <Text style={styles.upgradeButtonText}>
                  Chat
                </Text>
              </TouchableOpacity>
            ) : matchResult?.matchType === 'next_round' || matchResult?.matchType === 'fight_for_fries' ? (
              <View style={styles.tipButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.noThanksButton]}
                  onPress={() => {
                    setShowMatchModal(false);
                    setMatchResult(null);
                    setCurrentTime(new Date());
                  }}
                >
                  <Text style={styles.noThanksButtonText}>
                    No thanks
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.dropTipButton]}
                  onPress={() => {
                    setShowMatchModal(false);
                    setMatchResult(null);
                    setCurrentTime(new Date());
                    Linking.openURL('https://buy.stripe.com/test_00g03p9CUb6H3eM8ww');
                  }}
                >
                  <Text style={styles.dropTipButtonText}>
                    Drop a tip
                  </Text>
                </TouchableOpacity>
              </View>
            ) : matchResult?.matchType === 'no_decision' ? (
              <TouchableOpacity 
                style={[styles.upgradeButton, styles.noMatchButton]}
                onPress={() => {
                  setShowMatchModal(false);
                  setMatchResult(null);
                  // Force a re-render to update the UI after closing the modal
                  setCurrentTime(new Date());
                }}
              >
                <Text style={[styles.upgradeButtonText, styles.noMatchButtonText]}>
                  Got it
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.upgradeButton,
                  !matchResult?.isMatch && styles.noMatchButton
                ]}
                onPress={() => {
                  setShowMatchModal(false);
                  setMatchResult(null);
                  setCurrentTime(new Date());
                  if (matchResult?.matchType === 'buddy_pass') {
                    // Navigate to chat page for buddy pass match
                    if (matchResult?.eventId) {
                      const invitationId = matchResult.eventId.replace('invitation-', '');
                      const invitation = mockInvitations.find(inv => inv.id === invitationId);
                      if (invitation) {
                        const otherUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
                        router.push(`/chat?userId=${otherUserId}` as any);
                      }
                    }
                  } else if (matchResult?.isMatch) {
                    router.push('/(tabs)/profile' as any);
                  }
                }}
              >
                <Text style={[
                  styles.upgradeButtonText,
                  !matchResult?.isMatch && styles.noMatchButtonText
                ]}>
                  {matchResult?.matchType === 'buddy_pass' ? 'Cheers🎉' : matchResult?.isMatch ? '❤ icon is on' : 'OK'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Animated Balloons */}
          {matchResult?.isMatch && (
            <Animated.View 
              style={[
                styles.balloonsContainer,
                {
                  transform: [{
                    translateY: balloonAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, -200]
                    })
                  }],
                  opacity: balloonAnimation.interpolate({
                    inputRange: [0, 0.2, 0.8, 1],
                    outputRange: [0, 1, 1, 0]
                  })
                }
              ]}
            >
              <Text style={styles.balloon}>🎈</Text>
              <Text style={styles.balloon}>🎈</Text>
              <Text style={styles.balloon}>🎈</Text>
            </Animated.View>
          )}
        </View>
        

      </Modal>


    </View>
  );
}