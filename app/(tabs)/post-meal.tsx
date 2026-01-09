import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Animated, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Users, Clock, ChevronRight, Star, X, Heart, Timer } from 'lucide-react-native';
import { router } from 'expo-router';
import ConfettiCannon from 'react-native-confetti-cannon';
import { mockInvitations } from '@/mocks/invitations';
import { mockMealUps } from '@/mocks/meal-ups';
import { mockUsers } from '@/mocks/users';
import { mockPostDateResponses, hasMutualLoveMatch } from '@/mocks/post-date-responses';
import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';
import { useNotifications } from '@/hooks/use-notifications';


const colors = {
  primary: '#FF6B35',
  text: '#2C2C2C',
  textLight: '#666666',
  background: '#FFFFFF',
  surface: '#F8F8F8',
  success: '#4CAF50',
  warning: '#FFA726',
  premium: '#FF6600',
} as const;

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
  const { user, updateUser } = useAuth();
  const { checkAndRemoveNonMatchingProfiles, trackMixedSignalsCase, addMatchedProfile, getMatchType, matchedProfiles, addSystemMessage } = useChat();
  const { addMatchDecisionNotification } = useNotifications();
  const [mealCounters, setMealCounters] = useState<Record<string, number>>({});
  const insets = useSafeAreaInsets();
  const isPremium = user?.membershipTier === 'premium' || user?.membershipTier === 'organizer';
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
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
  const confettiRef = useRef<any>(null);
  const balloonAnimation = useRef(new Animated.Value(0)).current;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mixedSignalsExtensions, setMixedSignalsExtensions] = useState<Record<string, MixedSignalsExtension>>({});
  const [extendedChoices, setExtendedChoices] = useState<Record<string, string>>({});


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

  const handleUpgradeToPremium = () => {
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = async () => {
    try {
      await updateUser({ membershipTier: 'premium' });
      setShowUpgradeModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to upgrade:', error);
      setShowUpgradeModal(false);
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
        const choiceTimestamp = choiceTimestamps[eventId];
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
              // Special case: if both chose buddy_pass, treat it like a non-match for post-meal page
              // but keep the chat available (handled in useChat hook)
              if (userChoice === 'buddy_pass') {
                console.log(`Event ${eventId} - buddy pass match, removing from post-meal page but keeping chat`);
                return; // Skip this event (remove from post-meal page)
              } else if (userChoice === 'next_round') {
                // For next_round matches: profile stays on post-meal page and meal tracking continues
                console.log(`Event ${eventId} - next_round match, keeping profile on post-meal page for meal tracking`);
                // The profile will continue to show on post-meal page for future meal planning
              } else {
                // For fight_for_fries matches: profile stays on the post-meal page (no removal)
                console.log(`Event ${eventId} is a match - keeping profile on post-meal page`);
              }
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
                // and chat will also be removed (handled in useChat hook)
                console.log(`Removing event ${eventId} - both parties decided but no match`);
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
        
        // If it's a next_round match, initialize meal counter to 1 (first meal)
        if (matchType === 'next_round') {
          setMealCounters(prev => {
            const currentCount = prev[dateUserId] || 0;
            const newCount = currentCount + 1;
            console.log(`Setting meal counter for ${dateUserId} (extension): ${currentCount} -> ${newCount}`);
            return {
              ...prev,
              [dateUserId]: newCount
            };
          });
        }
        
        console.log(`Setting match result with isMatch=true, matchType=${matchType}`);
        setMatchResult({
          isMatch: true,
          matchType,
          userChoice: choice,
          dateChoice: dateExtendedChoice,
          eventId
        });
        
        setShowMatchModal(true);
        
        // Trigger confetti for matches
        setTimeout(() => {
          confettiRef.current?.start();
        }, 500);
        
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
          [eventId]: { choice, timestamp: now }
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
          
          // If it's a next_round match, initialize or increment meal counter
          if (matchType === 'next_round') {
            setMealCounters(prev => {
              const currentCount = prev[dateUserId] || 0; // Start with 0 if not set
              const newCount = currentCount + 1; // Increment for next meal (starts at 1)
              console.log(`Setting meal counter for ${dateUserId}: ${currentCount} -> ${newCount}`);
              return {
                ...prev,
                [dateUserId]: newCount
              };
            });
          }
          
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
            }
          }
        }
        // Note: For non-matches, the profile will be removed from post meal and chat immediately
        // This is handled by the checkAndRemoveNonMatchingProfiles function in useChat
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
        // Trigger confetti for matches
        setTimeout(() => {
          confettiRef.current?.start();
        }, 500);
        
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
      router.push(`/meal-up-attendees?mealUpId=${mealUpId}`);
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
    const hasUserMadeChoice = !!userSelectedChoice;
    const isChoiceFinalized = finalizedChoices[event.id];
    
    console.log(`[Render] Event ${event.id}: userSelectedChoice=${userSelectedChoice}, dateChoice=${dateChoice}`);
    
    // Check if there's a match (both users chose the same option)
    // CRITICAL: This should use the CURRENT choices (second decision if available)
    const isMatch = userSelectedChoice && dateChoice && userSelectedChoice === dateChoice;
    const matchType = isMatch ? userSelectedChoice as 'fight_for_fries' | 'buddy_pass' | 'next_round' : null;
    
    // Get meal number for next_round matches
    const getMealNumber = () => {
      if (matchType === 'next_round' && !isGroup) {
        const invitationId = event.id.replace('invitation-', '');
        const invitation = mockInvitations.find(inv => inv.id === invitationId);
        if (invitation) {
          const dateUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
          // Return the current meal counter, which starts at 1 for first meal
          return mealCounters[dateUserId] || 1;
        }
      }
      return 1;
    };
    
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
                      router.push(`/user-profile?userId=${inviter.id}`);
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
                        {(() => {
                          const invitationId = event.id.replace('invitation-', '');
                          const invitation = mockInvitations.find(inv => inv.id === invitationId);
                          if (invitation) {
                            const dateUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
                            const mealCount = mealCounters[dateUserId] || 1;
                            return (
                              <View style={styles.mealCountBadge}>
                                <Text style={styles.mealCountText}>Meal {mealCount}</Text>
                              </View>
                            );
                          }
                          return null;
                        })()}
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
              {!isGroup && matchType === 'next_round' && (timerInfo.type === 'match_permanent' || (() => {
                // Check if extension is completed with both parties matching on next_round
                const invitationId = event.id.replace('invitation-', '');
                const invitation = mockInvitations.find(inv => inv.id === invitationId);
                if (invitation) {
                  const dateUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
                  const extensionKey = `${invitationId}-${dateUserId}`;
                  const extension = mixedSignalsExtensions[extensionKey];
                  return extension && extension.hasUserReDecided && extension.hasDateReDecided && 
                         extension.userChoice === 'next_round' && extension.dateChoice === 'next_round';
                }
                return false;
              })()) && (
                <View style={styles.matchIndicator}>
                  <Text style={styles.matchIndicatorText}>Meal {getMealNumber()}</Text>
                </View>
              )}
              {!isGroup && timerInfo.type === 'match_permanent' && matchType === 'fight_for_fries' && (
                <View style={styles.loveIconContainer}>
                  <Heart size={16} color="#FF69B4" fill="#FF69B4" />
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
                    
                    // If there's an active extension but the date hasn't re-decided yet, show marinating message
                    if (extension && !extension.hasDateReDecided) {
                      return isPremium ? (
                        <View style={styles.noDecisionContainer}>
                          <Text style={styles.noDecisionText}>No decision yet — currently marinating 🍖 #patience</Text>
                        </View>
                      ) : null;
                    }
                    
                    // If there's an extension and the date has re-decided, show their new choice
                    if (extension && extension.hasDateReDecided && extension.dateChoice) {
                      displayChoice = getChoiceDisplay(extension.dateChoice);
                      console.log(`Displaying updated date choice: ${extension.dateChoice}`);
                    }
                  }
                  
                  return isPremium && displayChoice ? (
                    <View style={[styles.choiceButton, styles.selectedChoice]}>
                      <Text style={[styles.choiceButtonText, styles.selectedChoiceText]}>
                        {displayChoice.text}
                      </Text>
                      <Text style={[styles.choiceSubtext, styles.selectedChoiceSubtext]}>
                        {displayChoice.subtext}
                      </Text>
                    </View>
                  ) : isPremium ? (
                    <View style={styles.noDecisionContainer}>
                      <Text style={styles.noDecisionText}>No decision yet — currently marinating 🍖 #patience</Text>
                    </View>
                  ) : null;
                })()}
                {!isPremium && (
                  <TouchableOpacity 
                    style={styles.upgradePromptInline}
                    onPress={handleUpgradeToPremium}
                  >
                    <Star size={14} color={colors.premium} />
                    <Text style={styles.upgradeTextInline}>
                      Upgrade to Premium to see your date&apos;s choice
                    </Text>
                  </TouchableOpacity>
                )}
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

        {postMealEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={48} color={colors.textLight} />
            <Text style={styles.emptyStateTitle}>No Post-Meal Events Yet</Text>
            <Text style={styles.emptyStateText}>
              Your completed meals will appear here 10 hours after the scheduled time.
            </Text>
          </View>
        ) : (
          <View style={styles.eventsContainer}>
            {postMealEvents.map(renderPostMealEvent)}
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Post Meal:</Text>
          <Text style={styles.infoText}>Your meal-ups only show up here 10 hours after chow time — let the food settle and the drama cool.</Text>
          <Text style={styles.infoText}>{"\n"}You&apos;ve got 7 days to decide. If one person makes their decision while the other is still thinking (Life choices aren&apos;t instant noodles), the timer keeps ticking like a microwaved burrito.</Text>
          <Text style={styles.infoText}>{"\n"}When both have decided:</Text>
          <Text style={styles.infoText}>{"\n"}✅ It&apos;s a match? Profile stays and the chat lives on.</Text>
          <Text style={styles.infoText}>{"\n"}❌ No spark? Poof! Profile and chat vanish like a bad date story.</Text>
        </View>
      </ScrollView>

      {/* Upgrade Modal */}
      <Modal
        visible={showUpgradeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upgrade to Premium</Text>
              <TouchableOpacity 
                onPress={() => setShowUpgradeModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.textLight} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Unlock premium features including seeing your date&apos;s choices and more!
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowUpgradeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.upgradeButton}
                onPress={confirmUpgrade}
              >
                <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                  YAY! Another successful pairing. Your heart is full, let our tip jar be too?
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
                  Not a match. Go on to the next meal🍜
                  {matchResult?.eventId && (() => {
                    const eventId = matchResult.eventId;
                    const event = postMealEvents.find(e => e.id === eventId);
                    if (event) {
                      const timerInfo = getTimeRemaining(eventId, event.date, event.time);
                      const timeRemaining = formatTimeRemaining(timerInfo.timeLeft);
                      return `\n\nThis profile and chat have been removed immediately as there was no match.`;
                    }
                    return '';
                  })()}
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
                      router.push(`/chat?userId=${otherUserId}`);
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
                        router.push(`/chat?userId=${otherUserId}`);
                      }
                    }
                  } else if (matchResult?.isMatch) {
                    router.push('/profile');
                  }
                }}
              >
                <Text style={[
                  styles.upgradeButtonText,
                  !matchResult?.isMatch && styles.noMatchButtonText
                ]}>
                  {matchResult?.matchType === 'buddy_pass' ? 'Cheers🎉' : matchResult?.isMatch ? '❤ icon is on' : 'Keep Looking'}
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
        
        {/* Confetti */}
        {matchResult?.isMatch && (
          <ConfettiCannon
            ref={confettiRef}
            count={200}
            origin={{x: -10, y: 0}}
            autoStart={false}
            fadeOut={true}
          />
        )}
      </Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  eventsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  profileContainer: {
    flex: 1,
    marginRight: 12,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  clickableName: {
    color: colors.primary,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealCountBadge: {
    backgroundColor: '#FFE5CC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  mealCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B35',
  },
  matchIcon: {
    padding: 2,
  },

  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  eventTypeTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.textLight,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
  },
  expiredTimer: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF4444',
  },
  expiredTimerText: {
    color: '#FF4444',
  },
  choiceMadeTimer: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFA726',
  },
  choiceMadeTimerText: {
    color: '#FFA726',
  },
  eventDetails: {
    gap: 8,
    marginBottom: 16,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: colors.textLight,
    flex: 1,
  },

  choicesContainer: {
    gap: 8,
    marginTop: 12,
  },
  choiceButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  choiceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  choiceSubtext: {
    fontSize: 12,
    color: colors.textLight,
  },
  groupActionContainer: {
    marginTop: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  groupActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    flex: 1,
    marginRight: 8,
  },
  infoSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
    lineHeight: 20,
  },
  dateChoiceSection: {
    gap: 12,
  },
  dateChoiceHeader: {
    marginBottom: 4,
  },
  dateChoiceHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateChoiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  noDecisionContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.textLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  noDecisionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
  },
  upgradePromptInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.premium,
  },
  upgradeTextInline: {
    fontSize: 12,
    color: colors.premium,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedChoice: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    borderWidth: 2,
  },
  selectedChoiceText: {
    color: '#000000',
  },
  selectedChoiceSubtext: {
    color: '#000000',
    opacity: 0.8,
  },
  upgradePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginTop: 8,
  },
  upgradeText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  userChoicesSection: {
    gap: 8,
    marginTop: 16,
  },
  userChoicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  blurredText: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
    color: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 16,
    color: colors.textLight,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.textLight,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  upgradeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.premium,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  disabledContainer: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.textLight,
  },


  selectedChoiceButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectedChoiceButtonText: {
    color: colors.background,
  },
  matchModalContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  matchIconContainer: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallHeart: {
    position: 'absolute',
    top: -10,
    right: -15,
  },
  takenIconContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takenIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  takenIconText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.background,
  },
  noMatchEmoji: {
    fontSize: 60,
    marginBottom: 24,
  },
  matchModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  matchModalDescription: {
    fontSize: 16,
    color: colors.textLight,
    lineHeight: 22,
    marginBottom: 32,
    textAlign: 'center',
  },
  noMatchButton: {
    backgroundColor: colors.textLight,
  },
  noMatchButtonText: {
    color: colors.background,
  },
  chatButton: {
    backgroundColor: colors.primary,
  },
  balloonsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 50,
  },
  balloon: {
    fontSize: 40,
  },
  matchModalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  finalizedChoiceButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
    position: 'relative',
  },
  finalizedChoiceText: {
    color: colors.background,
  },
  finalizedLabel: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: '600',
    color: '#FF5C00',
  },
  finalizedBuddyPassButton: {
    backgroundColor: '#FF5C00',
    borderColor: '#FF5C00',
    position: 'relative',
  },
  finalizedBuddyPassLabel: {
    color: '#FF5C00',
  },
  matchPermanentTimer: {
    backgroundColor: '#E8F5E8',
    borderColor: colors.success,
  },
  matchPermanentTimerText: {
    color: colors.success,
  },
  matchIndicator: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchIndicatorText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.background,
  },
  loveIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIconButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF69B4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  mixedSignalsTimer: {
    backgroundColor: '#FFF0E6',
    borderColor: '#FF6B35',
  },
  mixedSignalsTimerText: {
    color: '#FF6B35',
  },
  retakeDecisionHeader: {
    backgroundColor: '#FFF0E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  retakeDecisionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 8,
    textAlign: 'center',
  },
  retakeDecisionSubtitle: {
    fontSize: 14,
    color: '#B8860B',
    lineHeight: 20,
    textAlign: 'center',
  },
  lastChanceText: {
    fontSize: 14,
    color: '#FF4444',
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  disabledChoiceButton: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    opacity: 0.6,
  },
  disabledChoiceText: {
    color: '#999999',
  },
  disabledReasonText: {
    fontSize: 11,
    color: '#FF6B35',
    fontStyle: 'italic',
    marginTop: 4,
  },
  tipButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  noThanksButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.textLight,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  noThanksButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  dropTipButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.premium,
    alignItems: 'center',
  },
  dropTipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});