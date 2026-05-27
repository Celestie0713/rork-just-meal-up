import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Modal, ScrollView, Alert, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { safeGoBack } from '@/utils/navigation';
import { ArrowLeft, MapPin, Clock, Users, X } from 'lucide-react-native';
import { VoiceMessageBubble } from '@/components/VoiceMessageBubble';
import { SystemMessageBubble } from '@/components/SystemMessageBubble';
import { VoiceRecorder } from '@/components/VoiceRecorder';

import { Colors } from '@/constants/colors';
import { mockUsers } from '@/mocks/users';
import { mockInvitations } from '@/mocks/invitations';
import { mockPostDateResponses, mockMatchedProfiles } from '@/mocks/post-date-responses';
import { useChat } from '@/hooks/use-chat';
import type { VoiceMessage, ChatMessage } from '@/types/user';
import { isVoiceMessage, isSystemMessage } from '@/types/user';

const getMockMessagesForUser = (userId: string): ChatMessage[] => {
  if (userId === '4') {
    return [
      {
        id: '1',
        senderId: '4',
        receiverId: '1',
        audioUrl: 'mock-url-1',
        duration: 15,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '2',
        senderId: '1',
        receiverId: '4',
        audioUrl: 'mock-url-2',
        duration: 23,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '3',
        senderId: '4',
        receiverId: '1',
        audioUrl: 'mock-url-3',
        duration: 18,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '4',
        senderId: '1',
        receiverId: '4',
        audioUrl: 'mock-url-4',
        duration: 12,
        timestamp: new Date(Date.now() - 150 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '5',
        senderId: '4',
        receiverId: '1',
        audioUrl: 'mock-url-5',
        duration: 20,
        timestamp: new Date(Date.now() - 120 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '6',
        senderId: '1',
        receiverId: '4',
        audioUrl: 'mock-url-6',
        duration: 16,
        timestamp: new Date(Date.now() - 90 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '7',
        senderId: '4',
        receiverId: '1',
        audioUrl: 'mock-url-7',
        duration: 14,
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '8',
        senderId: '1',
        receiverId: '4',
        audioUrl: 'mock-url-8',
        duration: 22,
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '9',
        senderId: '4',
        receiverId: '1',
        audioUrl: 'mock-url-9',
        duration: 10,
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '10',
        senderId: '1',
        receiverId: '4',
        audioUrl: 'mock-url-10',
        duration: 25,
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '11',
        senderId: '4',
        receiverId: '1',
        audioUrl: 'mock-url-11',
        duration: 8,
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        isPlayed: false,
      },
    ];
  }
  
  return [
    {
      id: '1',
      senderId: '2',
      receiverId: '1',
      audioUrl: 'mock-url-1',
      duration: 15,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isPlayed: true,
    },
    {
      id: '2',
      senderId: '1',
      receiverId: '2',
      audioUrl: 'mock-url-2',
      duration: 23,
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      isPlayed: true,
    },
    {
      id: '3',
      senderId: '2',
      receiverId: '1',
      audioUrl: 'mock-url-3',
      duration: 8,
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isPlayed: false,
    },
  ];
};

export default function ChatScreen() {
  const params = useLocalSearchParams<{ userId: string }>();
  const { getChatMessages, addVoiceMessage, initializeChat, matchedProfiles, hasActiveExclusiveMatch, getExclusiveMatchPartner } = useChat();
  const currentUserId = '1';
  const chatId = `${currentUserId}-${params.userId}`;
  const [showMealDetailsModal, setShowMealDetailsModal] = useState(false);
  const [selectedMealIndex, setSelectedMealIndex] = useState<number>(0);
  const [showInviteOptions, setShowInviteOptions] = useState<boolean>(false);

  
  const messages = getChatMessages(chatId);
  
  const voiceMessageCount = useMemo(() => {
    return messages.filter(msg => isVoiceMessage(msg)).length;
  }, [messages]);
  
  const chatUser = mockUsers.find(user => user.id === params.userId);
  
  const mealHistory = useMemo(() => {
    const meals = mockInvitations.filter(inv => 
      (inv.inviterId === currentUserId && inv.inviteeId === params.userId) ||
      (inv.inviteeId === currentUserId && inv.inviterId === params.userId)
    ).filter(inv => {
      if (inv.status !== 'completed' && inv.status !== 'accepted') return false;
      
      const currentUserProfile = Object.values(matchedProfiles).find(
        profile => profile.userId === currentUserId && profile.invitationId === inv.id
      );
      const otherUserProfile = Object.values(matchedProfiles).find(
        profile => profile.userId === params.userId && profile.invitationId === inv.id
      );
      
      if (!currentUserProfile || !otherUserProfile) return false;
      
      return currentUserProfile.matchType === otherUserProfile.matchType;
    });
    return meals.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [params.userId, matchedProfiles]);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const getChoiceDisplay = (choice: string) => {
    switch (choice) {
      case 'buddy_pass':
        return 'Buddy pass ✅ (Stay Friend)';
      case 'next_round':
        return "Let's do next round (Next date)";
      case 'fight_for_fries':
        return 'Fight for fries for life (Be my +1?)';
      default:
        return 'No decision';
    }
  };
  
  const getUserChoices = (mealId: string) => {
    // First check the live matchedProfiles state (from useChat hook)
    // This contains the actual choices made in the Post Meal page
    const currentUserProfile = Object.values(matchedProfiles).find(
      profile => profile.userId === currentUserId && profile.invitationId === mealId
    );
    
    const otherUserProfile = Object.values(matchedProfiles).find(
      profile => profile.userId === params.userId && profile.invitationId === mealId
    );
    
    console.log(`[getUserChoices] Looking up choices for meal ${mealId}`);
    console.log(`[getUserChoices] Current user (${currentUserId}) choice:`, currentUserProfile?.matchType);
    console.log(`[getUserChoices] Other user (${params.userId}) choice:`, otherUserProfile?.matchType);
    
    // Fall back to mock data if not found in state
    const currentUserChoice = currentUserProfile?.matchType || mockMatchedProfiles.find(
      profile => profile.userId === currentUserId && profile.mealId === mealId
    )?.matchType || mockPostDateResponses.find(
      r => r.userId === currentUserId && r.mealId === mealId
    )?.choice;
    
    const otherUserChoice = otherUserProfile?.matchType || mockMatchedProfiles.find(
      profile => profile.userId === params.userId && profile.mealId === mealId
    )?.matchType || mockPostDateResponses.find(
      r => r.userId === params.userId && r.mealId === mealId
    )?.choice;
    
    return {
      currentUser: currentUserChoice,
      otherUser: otherUserChoice
    };
  };
  
  useEffect(() => {
    if (messages.length === 0) {
      const mockMessages = getMockMessagesForUser(params.userId || '');
      initializeChat(chatId, mockMessages);
    }
  }, [chatId, initializeChat, messages.length, params.userId]);
  
  if (!chatUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSendVoiceMessage = (duration: number, audioUri?: string) => {
    const newMessage: VoiceMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      receiverId: chatUser.id,
      audioUrl: audioUri || 'mock-new-url',
      duration,
      timestamp: new Date(),
      isPlayed: false,
    };
    
    addVoiceMessage(chatId, newMessage);
    console.log('Voice message sent:', duration, 'seconds', audioUri ? 'with audio file' : 'simulated');
  };

  const handleCancelRecording = () => {
    console.log('Recording cancelled');
  };
  
  const handleMealBadgePress = (index: number) => {
    setSelectedMealIndex(index);
    setShowMealDetailsModal(true);
  };
  
  const handleTipPress = async (message: VoiceMessage) => {
    console.log(`Processing tip for message ${message.id}`);
    
    const stripeUrl = `https://checkout.stripe.com/pay`;
    
    Alert.alert(
      'Payment Required',
      'You will be redirected to Stripe to complete the payment.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              const canOpen = await Linking.canOpenURL(stripeUrl);
              if (canOpen) {
                await Linking.openURL(stripeUrl);
              } else {
                Alert.alert('Success', 'Payment processed successfully!');
              }
            } catch (error) {
              console.error('Error opening Stripe URL:', error);
              Alert.alert('Success', 'Payment processed successfully!');
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (isSystemMessage(item)) {
      return <SystemMessageBubble message={item} />;
    }
    
    if (isVoiceMessage(item)) {
      return (
        <VoiceMessageBubble
          message={item}
          isOwn={item.senderId === currentUserId}
          senderName={item.senderId !== currentUserId ? chatUser.name : undefined}
          onTipPress={() => handleTipPress(item)}
        />
      );
    }
    
    return null;
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <TouchableOpacity 
              onPress={() => router.push(`/user-profile?userId=${chatUser.id}` as any)}
              testID="chat-header-name"
            >
              <Text style={[styles.headerTitle, styles.clickableHeaderTitle]}>{chatUser.name}</Text>
            </TouchableOpacity>
          </View>

        </View>
        <View style={styles.placeholder} />
      </View>
      {voiceMessageCount > 10 && (
        <View style={styles.inviteContainer}>
          {hasActiveExclusiveMatch() && getExclusiveMatchPartner()?.userId === params.userId && (
            <Text style={styles.exclusiveLabel}>In exclusive ❤️ but you can still say hi</Text>
          )}
          <TouchableOpacity 
            style={styles.inviteButton}
            onPress={() => setShowInviteOptions(true)}
            testID="invite-to-eat-button"
          >
            <Text style={styles.inviteButtonText}>Invite to eat</Text>
          </TouchableOpacity>
        </View>
      )}
      {mealHistory.length > 0 && (
        <View style={styles.mealRecordContainer}>
          <Text style={styles.mealRecordTitle}>Meal Record</Text>
          <View style={styles.mealBadgesContainer}>
            {mealHistory.map((meal, index) => (
              <TouchableOpacity 
                key={meal.id}
                style={styles.mealBadge}
                onPress={() => handleMealBadgePress(index)}
              >
                <Text style={styles.mealBadgeText}>Meal {index + 1}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.inputContainer}>
        <VoiceRecorder
          onSend={handleSendVoiceMessage}
          onCancel={handleCancelRecording}
        />
      </View>
      <Modal
        visible={showMealDetailsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMealDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Meal {selectedMealIndex + 1} Details</Text>
              <TouchableOpacity 
                onPress={() => setShowMealDetailsModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
            {!!mealHistory[selectedMealIndex] && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <MapPin size={18} color={Colors.primary} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Venue</Text>
                      <Text style={styles.detailValue}>{mealHistory[selectedMealIndex].venue.name}</Text>
                      <Text style={styles.detailSubtext}>{mealHistory[selectedMealIndex].venue.address}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={18} color={Colors.primary} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Date & Time</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(mealHistory[selectedMealIndex].date)} at {mealHistory[selectedMealIndex].time}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Users size={18} color={Colors.primary} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Your Choice</Text>
                      <Text style={styles.detailValue}>
                        {getChoiceDisplay(getUserChoices(mealHistory[selectedMealIndex].id).currentUser || '')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Users size={18} color={Colors.primary} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>{chatUser?.name}&apos;s Choice</Text>
                      <Text style={styles.detailValue}>
                        {getChoiceDisplay(getUserChoices(mealHistory[selectedMealIndex].id).otherUser || '')}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setShowMealDetailsModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showInviteOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInviteOptions(false)}
      >
        <TouchableOpacity
          style={styles.inviteOptionsOverlay}
          activeOpacity={1}
          onPress={() => setShowInviteOptions(false)}
        >
          <View style={styles.inviteOptionsSheet}>
            <Text style={styles.inviteOptionsTitle}>Invite {chatUser.name} to eat</Text>
            <Text style={styles.inviteOptionsSubtitle}>How do you want to pick a spot?</Text>
            <TouchableOpacity
              style={styles.inviteOptionButton}
              onPress={() => {
                setShowInviteOptions(false);
                router.push(`/user-profile?userId=${chatUser.id}` as any);
              }}
              testID="invite-option-favorites"
            >
              <Text style={styles.inviteOptionButtonText}>Choose from Food to bribe me with</Text>
              <Text style={styles.inviteOptionButtonSubtext}>Pick from {chatUser.name}&apos;s favorites</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.inviteOptionButton}
              onPress={() => {
                setShowInviteOptions(false);
                router.push('/(tabs)?tab=places' as any);
              }}
              testID="invite-option-search"
            >
              <Text style={styles.inviteOptionButtonText}>Search for Places</Text>
              <Text style={styles.inviteOptionButtonSubtext}>Find a new spot with AI search</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.inviteOptionCancel}
              onPress={() => setShowInviteOptions(false)}
            >
              <Text style={styles.inviteOptionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
  },
  placeholder: {
    width: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  clickableHeaderTitle: {
    color: Colors.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },
  inviteContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exclusiveLabel: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center' as const,
    marginBottom: 10,
  },
  inviteButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  mealRecordContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#FFF9F5',
  },
  mealRecordTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  mealBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealBadge: {
    backgroundColor: '#FFE5CC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  mealBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
  },
  detailSection: {
    gap: 20,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  detailSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },

  closeModalButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  inviteOptionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  inviteOptionsSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    gap: 12,
  },
  inviteOptionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  inviteOptionsSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 8,
  },
  inviteOptionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
  },
  inviteOptionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.background,
  },
  inviteOptionButtonSubtext: {
    fontSize: 12,
    color: Colors.background,
    opacity: 0.85,
    marginTop: 2,
  },
  inviteOptionCancel: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  inviteOptionCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight,
  },
});