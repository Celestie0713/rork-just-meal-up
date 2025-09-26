import React, { useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, MapPin, Users, Clock, ChevronRight, Star, X, Heart } from 'lucide-react-native';
import { router } from 'expo-router';
import ConfettiCannon from 'react-native-confetti-cannon';
import { mockInvitations } from '@/mocks/invitations';
import { mockMealUps } from '@/mocks/meal-ups';
import { mockUsers } from '@/mocks/users';
import { mockPostDateResponses } from '@/mocks/post-date-responses';
import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';

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
  const { checkAndRemoveNonMatchingProfiles, trackMixedSignalsCase, addMatchedProfile, getMatchType, matchedProfiles } = useChat();
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
    matchType: 'fight_for_fries' | 'buddy_pass' | 'next_round' | 'mixed_signals' | null;
    userChoice: string;
    dateChoice: string;
    eventId?: string;
  } | null>(null);
  const confettiRef = useRef<any>(null);
  const balloonAnimation = useRef(new Animated.Value(0)).current;

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

  const getDateChoice = (invitationId: string) => {
    const invitation = mockInvitations.find(inv => inv.id === invitationId);
    if (!invitation) return null;
    
    const dateUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
    const response = mockPostDateResponses.find(r => r.mealId === invitationId && r.userId === dateUserId);
    return response?.choice || null;
  };

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
        
        // If a choice was made, check if it's been less than 24 hours
        if (choiceTimestamp) {
          const timeSinceChoice = now.getTime() - choiceTimestamp.getTime();
          if (timeSinceChoice >= twentyFourHoursInMs) {
            // Remove from state if 24 hours have passed
            console.log(`Removing event ${eventId} - 24 hours have passed since choice was made`);
            return; // Skip this event
          }
        } else {
          // If no choice was made, check if 7 days have passed since the event became available (10 hours after meal)
          const timeSinceAvailable = now.getTime() - tenHoursAfterEvent.getTime();
          if (timeSinceAvailable >= sevenDaysInMs) {
            // Remove from state if 7 days have passed without a choice
            console.log(`Removing event ${eventId} - 7 days have passed without a choice`);
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
        
        // If a choice was made, check if it's been less than 24 hours
        if (choiceTimestamp) {
          const timeSinceChoice = now.getTime() - choiceTimestamp.getTime();
          if (timeSinceChoice >= twentyFourHoursInMs) {
            // Remove from state if 24 hours have passed
            console.log(`Removing event ${eventId} - 24 hours have passed since choice was made`);
            return; // Skip this event
          }
        } else {
          // If no choice was made, check if 7 days have passed since the event became available (10 hours after meal)
          const timeSinceAvailable = now.getTime() - tenHoursAfterEvent.getTime();
          if (timeSinceAvailable >= sevenDaysInMs) {
            // Remove from state if 7 days have passed without a choice
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
  }, [choiceTimestamps]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleChoiceSelect = (eventId: string, choice: string) => {
    // Don't allow changes if already finalized
    if (finalizedChoices[eventId]) {
      return;
    }



    const now = new Date();
    
    setSelectedChoices(prev => ({
      ...prev,
      [eventId]: choice
    }));
    
    // Mark this choice as finalized
    setFinalizedChoices(prev => ({
      ...prev,
      [eventId]: true
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
    console.log('Event will be automatically removed in 24 hours');
    console.log('Non-matching profiles will be removed from chat after 24 hours');
    
    // Check for match after user makes a choice
    const invitationId = eventId.replace('invitation-', '');
    const dateChoice = getDateChoice(invitationId);
    
    if (dateChoice) {
      const isMatch = choice === dateChoice;
      let matchType: 'fight_for_fries' | 'buddy_pass' | 'next_round' | 'mixed_signals' | null = null;
      
      if (isMatch) {
        matchType = choice as 'fight_for_fries' | 'buddy_pass' | 'next_round';
        // Track the match
        const invitation = mockInvitations.find(inv => inv.id === invitationId);
        if (invitation) {
          const dateUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
          addMatchedProfile(dateUserId, invitationId, matchType);
          console.log(`Added matched profile: ${dateUserId} with match type: ${matchType}`);
          

        }
      } else {
        // Check for mixed signals case: one wants next_round, other wants fight_for_fries
        if ((choice === 'next_round' && dateChoice === 'fight_for_fries') ||
            (choice === 'fight_for_fries' && dateChoice === 'next_round')) {
          matchType = 'mixed_signals';
        }
      }
      
      setMatchResult({
        isMatch,
        matchType,
        userChoice: choice,
        dateChoice,
        eventId
      });
      
      // Track mixed signals case when popup is shown
      if (matchType === 'mixed_signals') {
        const invitation = mockInvitations.find(inv => inv.id === invitationId);
        if (invitation) {
          const dateUserId = invitation.inviterId === '1' ? invitation.inviteeId : invitation.inviterId;
          trackMixedSignalsCase(dateUserId, invitationId);
          console.log(`Started tracking mixed signals case for user ${dateUserId}`);
        }
      }
      
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



  const renderPostMealEvent = (event: PostMealEvent) => {
    const isGroup = event.type === 'mealup';
    const invitationId = event.id.replace('invitation-', '');
    const dateChoice = !isGroup ? getDateChoice(invitationId) : null;
    const choiceDisplay = dateChoice ? getChoiceDisplay(dateChoice) : null;
    const userSelectedChoice = selectedChoices[event.id];
    const hasUserMadeChoice = !!userSelectedChoice;
    const isChoiceFinalized = finalizedChoices[event.id];
    
    // Check if there's a match (both users chose the same option)
    const isMatch = userSelectedChoice && dateChoice && userSelectedChoice === dateChoice;
    const matchType = isMatch ? userSelectedChoice as 'fight_for_fries' | 'buddy_pass' | 'next_round' : null;

    
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
                        {/* Show love icon if both users chose the same option */}
                        {isMatch && (
                          <View style={styles.loveIconContainer}>
                            <Heart size={20} color={colors.primary} fill={colors.primary} />
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })()}
              </TouchableOpacity>
            ) : (
              <Text style={styles.eventTitle}>{event.title}</Text>
            )}
            <View style={styles.eventTypeTag}>
              <Text style={styles.eventTypeText}>
                {event.type === 'invitation' ? 'Date' : 'Group'}
              </Text>
            </View>
          </View>
          
          <View style={styles.eventDetails}>
            <View style={styles.eventDetailRow}>
              <MapPin size={16} color={colors.textLight} />
              <Text style={styles.eventDetailText}>{event.venue}</Text>
            </View>
            
            <View style={styles.eventDetailRow}>
              <Calendar size={16} color={colors.textLight} />
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
                    <Text style={[styles.dateChoiceText, !isPremium && styles.blurredText]}>Your date chose</Text>
                  </View>
                </View>
                {isPremium && choiceDisplay ? (
                  <View style={[styles.choiceButton, styles.selectedChoice]}>
                    <Text style={[styles.choiceButtonText, styles.selectedChoiceText]}>
                      {choiceDisplay.text}
                    </Text>
                    <Text style={[styles.choiceSubtext, styles.selectedChoiceSubtext]}>
                      {choiceDisplay.subtext}
                    </Text>
                  </View>
                ) : isPremium ? (
                  <View style={styles.noDecisionContainer}>
                    <Text style={styles.noDecisionText}>No decision yet</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.upgradePromptInline}
                    onPress={handleUpgradeToPremium}
                  >
                    <Star size={14} color={colors.premium} />
                    <Text style={styles.upgradeTextInline}>
                      Upgrade to Premium to see your date's choice
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.userChoicesSection}>
                <Text style={styles.userChoicesTitle}>What&apos;s your decision? 🤘</Text>
                
                {/* Only show selected choice if finalized, otherwise show all choices */}
                {!isChoiceFinalized ? (
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
                        userSelectedChoice === 'fight_for_fries' && styles.selectedChoiceButton
                      ]}
                      onPress={() => handleChoiceSelect(event.id, 'fight_for_fries')}
                    >
                      <Text style={[
                        styles.choiceButtonText,
                        userSelectedChoice === 'fight_for_fries' && styles.selectedChoiceButtonText
                      ]}>Fight for fries for life</Text>
                      <Text style={[
                        styles.choiceSubtext,
                        userSelectedChoice === 'fight_for_fries' && styles.selectedChoiceButtonText
                      ]}>(Be my +1?)</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  /* Show only the selected choice when finalized */
                  <View style={[
                    styles.choiceButton, 
                    styles.finalizedBuddyPassButton
                  ]}>
                    <Text style={[styles.choiceButtonText, styles.finalizedChoiceText]}>
                      {userSelectedChoice === 'buddy_pass' && 'Buddy pass ✅'}
                      {userSelectedChoice === 'next_round' && "Let's do next round"}
                      {userSelectedChoice === 'fight_for_fries' && 'Fight for fries for life'}
                    </Text>
                    <Text style={[styles.choiceSubtext, styles.finalizedChoiceText]}>
                      {userSelectedChoice === 'buddy_pass' && '(Stay Friend)'}
                      {userSelectedChoice === 'next_round' && '(Next date)'}
                      {userSelectedChoice === 'fight_for_fries' && '(Be my +1?)'}
                    </Text>
                    <Text style={[
                      styles.finalizedLabel,
                      userSelectedChoice === 'buddy_pass' && styles.finalizedBuddyPassLabel
                    ]}>Your Choice</Text>
                  </View>
                )}
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
          <Text style={styles.infoText}>1. All the meal-ups (one-on-one / group meal up) will appear here after 10 hours of the scheduled date & time.</Text>
          <Text style={styles.infoText}>2. Once an option is selected, it will disappear from this page within 24 hours.</Text>
          <Text style={styles.infoText}>3. If there is no option is selected, it will disappear within 7 days.</Text>
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
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.matchModalContent]}>
            <TouchableOpacity 
              onPress={() => {
                setShowMatchModal(false);
                setMatchResult(null);
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
                  Two chopsticks finally found each other! Slurp slurp—it's a match!
                </Text>
              </>
            ) : matchResult?.matchType === 'buddy_pass' ? (
              <>
                <Text style={styles.noMatchEmoji}>🍻</Text>
                <Text style={styles.matchModalTitle}>Congrats—you just unlocked a new friend!</Text>
                <Text style={styles.matchModalDescription}>
                  Great minds think alike! You both chose to stay friends.
                </Text>
              </>
            ) : matchResult?.matchType === 'next_round' ? (
              <>
                <Text style={styles.noMatchEmoji}>🎯</Text>
                <Text style={styles.matchModalTitle}>You're both in for the Next Round!</Text>
                <Text style={styles.matchModalDescription}>
                  You both want to keep the adventure going!
                </Text>
              </>
            ) : matchResult?.matchType === 'mixed_signals' ? (
              <>
                <Text style={styles.noMatchEmoji}>🤔</Text>
                <Text style={styles.matchModalTitle}>One of you wants another round, the other is ready to go all in🌹Small matter</Text>
                <Text style={styles.matchModalDescription}>
                  Time to chat it out!
                </Text>
              </>
            ) : matchResult?.isMatch ? (
              <>
                <View style={styles.matchIconContainer}>
                  <Heart size={60} color={colors.primary} fill={colors.primary} />
                  <Heart size={40} color={colors.primary} fill={colors.primary} style={styles.smallHeart} />
                </View>
                <Text style={styles.matchModalTitle}>It's a Match! 🥢</Text>
                <Text style={styles.matchModalDescription}>
                  Two chopsticks finally found each other! Slurp slurp—it's a match!
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.noMatchEmoji}>✨</Text>
                <Text style={styles.matchModalTitle}>No Spark This Time ✨</Text>
                <Text style={styles.matchModalDescription}>
                  Go on to the next meal🍜
                </Text>
              </>
            )}
            
            {matchResult?.matchType === 'mixed_signals' ? (
              <TouchableOpacity 
                style={[styles.upgradeButton, styles.chatButton]}
                onPress={() => {
                  setShowMatchModal(false);
                  setMatchResult(null);
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
            ) : matchResult?.matchType === 'next_round' ? (
              <TouchableOpacity 
                style={[styles.upgradeButton]}
                onPress={() => {
                  setShowMatchModal(false);
                  setMatchResult(null);
                  // Navigate to search places page
                  router.push('/(tabs)/?tab=places');
                }}
              >
                <Text style={styles.upgradeButtonText}>
                  Invite to meal
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

                }}
              >
                <Text style={[
                  styles.upgradeButtonText,
                  !matchResult?.isMatch && styles.noMatchButtonText
                ]}>
                  {matchResult?.isMatch ? 'Amazing!' : 'Keep Looking'}
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
    gap: 2,
  },
  matchIcon: {
    padding: 2,
  },
  loveIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 32,
  },
  loveIconText: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    zIndex: 1,
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
  disabledChoiceButton: {
    backgroundColor: colors.surface,
    borderColor: colors.textLight,
    opacity: 0.5,
  },
  disabledChoiceText: {
    color: colors.textLight,
  },
  disabledLabel: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: colors.textLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: '600',
    color: colors.background,
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
});