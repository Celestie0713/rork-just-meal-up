import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Alert, Image, Linking, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MessageCircle, MapPin, DollarSign } from 'lucide-react-native';
import { ChatListItem } from '@/components/ChatListItem';
import { TipPopup } from '@/components/TipPopup';
import { Colors } from '@/constants/colors';
import { mockUsers } from '@/mocks/users';
import { useChat } from '@/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/types/user';

interface ChatData {
  user: User;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

const mockChats: ChatData[] = [
  {
    user: mockUsers.find(u => u.id === '5')!,
    lastMessage: '🎵 Voice message (8s)',
    lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
    unreadCount: 2,
  },
  {
    user: mockUsers.find(u => u.id === '4')!,
    lastMessage: '🎵 Voice message (15s)',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadCount: 0,
  },
  {
    user: mockUsers.find(u => u.id === '6')!,
    lastMessage: '🎵 Voice message (23s)',
    lastMessageTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
    unreadCount: 1,
  },
  {
    user: mockUsers.find(u => u.id === '7')!,
    lastMessage: '🎵 Voice message (12s)',
    lastMessageTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
  },
  {
    user: mockUsers.find(u => u.id === '8')!,
    lastMessage: '🎵 Voice message (7s)',
    lastMessageTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    unreadCount: 3,
  },
];

export default function MessagesScreen() {
  const { getAvailableChats, isLoaded } = useChat();
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams<{
    placeName?: string;
    placeAddress?: string;
    placeId?: string;
    date?: string;
    time?: string;
    fromInvitation?: string;
    fromMealUpShare?: string;
    mealUpId?: string;
    mealUpTitle?: string;
    mealUpVenue?: string;
    mealUpDate?: string;
    mealUpTime?: string;
    mealUpPrice?: string;
    mealUpImage?: string;
  }>();
  
  const [chats, setChats] = useState<ChatData[]>(mockChats);
  const [filteredChats, setFilteredChats] = useState<ChatData[]>(mockChats);
  const [isInvitationMode, setIsInvitationMode] = useState<boolean>(false);
  const [isMealUpShareMode, setIsMealUpShareMode] = useState<boolean>(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [mealUpData, setMealUpData] = useState<any>(null);
  const [showTipPopup, setShowTipPopup] = useState<boolean>(false);
  
  useEffect(() => {
    if (params.fromInvitation === 'true') {
      setIsInvitationMode(true);
      setInvitationData({
        placeName: params.placeName,
        placeAddress: params.placeAddress,
        placeId: params.placeId,
        date: params.date ? new Date(params.date) : null,
        time: params.time ? new Date(params.time) : null,
      });
    } else if (params.fromMealUpShare === 'true') {
      setIsMealUpShareMode(true);
      setMealUpData({
        id: params.mealUpId,
        title: params.mealUpTitle,
        venue: params.mealUpVenue,
        date: params.mealUpDate ? new Date(params.mealUpDate) : null,
        time: params.mealUpTime,
        price: params.mealUpPrice,
        image: params.mealUpImage,
      });
    }
  }, [params]);
  
  // Filter chats based on removed profiles
  React.useEffect(() => {
    if (isLoaded) {
      const availableChats = getAvailableChats(chats);
      setFilteredChats(availableChats);
      console.log(`Filtered chats: ${availableChats.length} out of ${chats.length} total chats`);
    }
  }, [chats, isLoaded, getAvailableChats]);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useEffect] showTipPopup changed to:', showTipPopup);
  }, [showTipPopup]);

  const handleChatPress = (user: User) => {
    console.log('[handleChatPress] User clicked:', user.name, 'ID:', user.id);
    console.log('[handleChatPress] isInvitationMode:', isInvitationMode);
    console.log('[handleChatPress] isMealUpShareMode:', isMealUpShareMode);
    console.log('[handleChatPress] invitationData:', JSON.stringify(invitationData));
    console.log('[handleChatPress] mealUpData:', JSON.stringify(mealUpData));
    
    if (isInvitationMode && invitationData) {
      console.log('[handleChatPress] Showing invitation alert for:', invitationData.placeName);
      
      setSelectedUserId(user.id);
      console.log('[handleChatPress] Setting showTipPopup to true immediately');
      setShowTipPopup(true);
    } else if (isMealUpShareMode && mealUpData) {
      console.log('[handleChatPress] Showing meal up share alert for:', mealUpData.title);
      
      Alert.alert(
        'Share Meal Up',
        `Share "${mealUpData.title}" with ${user.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share',
            onPress: () => {
              console.log('Meal up shared with:', user.name);
              Alert.alert(
                'Meal Up Shared!',
                `"${mealUpData.title}" has been shared with ${user.name}.`,
                [{ text: 'OK', onPress: () => router.back() }]
              );
            }
          }
        ]
      );
    } else {
      console.log('[handleChatPress] Opening chat with user:', user.id);
      router.push({
        pathname: '/chat',
        params: { userId: user.id }
      });
    }
  };
  
  const formatInvitationDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    if (compareDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };
  
  const formatInvitationTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const renderChatItem = ({ item }: { item: ChatData }) => {
    console.log('[renderChatItem] Rendering chat item for user:', item.user.name);
    return (
      <ChatListItem
        user={item.user}
        lastMessage={item.lastMessage}
        lastMessageTime={item.lastMessageTime}
        unreadCount={item.unreadCount}
        onPress={() => {
          console.log('[renderChatItem] onPress called for user:', item.user.name);
          handleChatPress(item.user);
        }}
      />
    );
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MessageCircle size={64} color={Colors.textLight} />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>Start chatting with other food lovers!</Text>
    </View>
  );


  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {(isInvitationMode || isMealUpShareMode) && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {isInvitationMode ? 'Send Invitation' : isMealUpShareMode ? 'Share Meal Up' : 'Messages'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isInvitationMode ? 'Choose a chat to send invitation' : isMealUpShareMode ? 'Choose who to share with' : 'Voice conversations'}
          </Text>
        </View>
        {(isInvitationMode || isMealUpShareMode) && <View style={styles.placeholder} />}
      </View>
      
      {isInvitationMode && invitationData && (
        <View style={styles.invitationSummary}>
          <Text style={styles.summaryTitle}>Meal Invitation</Text>
          <Text style={styles.summaryRestaurant}>{invitationData.placeName}</Text>
          <Text style={styles.summaryAddress}>{invitationData.placeAddress}</Text>
          <View style={styles.summaryDateTime}>
            <View style={styles.summaryDateTimeItem}>
              <Calendar size={16} color={Colors.primary} />
              <Text style={styles.summaryDateTimeText}>
                {invitationData.date ? formatInvitationDate(invitationData.date) : 'Date not set'}
              </Text>
            </View>
            <View style={styles.summaryDateTimeItem}>
              <Clock size={16} color={Colors.primary} />
              <Text style={styles.summaryDateTimeText}>
                {invitationData.time ? formatInvitationTime(invitationData.time) : 'Time not set'}
              </Text>
            </View>
          </View>
        </View>
      )}
      
      {isMealUpShareMode && mealUpData && (
        <View style={styles.mealUpSummary}>
          <View style={styles.mealUpHeader}>
            {mealUpData.image && (
              <Image source={{ uri: mealUpData.image }} style={styles.mealUpImage} />
            )}
            <View style={styles.mealUpInfo}>
              <Text style={styles.mealUpTitle}>{mealUpData.title}</Text>
              <View style={styles.mealUpVenueRow}>
                <MapPin size={14} color={Colors.textLight} />
                <Text style={styles.mealUpVenue}>{mealUpData.venue}</Text>
              </View>
              <View style={styles.mealUpDetailsRow}>
                <View style={styles.mealUpDetailItem}>
                  <Calendar size={14} color={Colors.primary} />
                  <Text style={styles.mealUpDetailText}>
                    {mealUpData.date ? formatInvitationDate(mealUpData.date) : 'Date not set'}
                  </Text>
                </View>
                <View style={styles.mealUpDetailItem}>
                  <Clock size={14} color={Colors.primary} />
                  <Text style={styles.mealUpDetailText}>
                    {mealUpData.time || 'Time not set'}
                  </Text>
                </View>
                <View style={styles.mealUpDetailItem}>
                  <DollarSign size={14} color={Colors.primary} />
                  <Text style={styles.mealUpDetailText}>
                    {mealUpData.price || 'Price not set'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
      
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item, index) => `${item.user.id}-${index}`}
        style={styles.chatsList}
        contentContainerStyle={filteredChats.length === 0 ? styles.emptyContainer : styles.chatsContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
      
      <TipPopup 
        visible={showTipPopup}
        userLocation={currentUser?.location}
        onClose={() => {
          console.log('[TipPopup onClose] No thanks clicked');
          console.log('[TipPopup onClose] selectedUserId:', selectedUserId);
          setShowTipPopup(false);
          if (selectedUserId) {
            console.log('[TipPopup onClose] Navigating to chat with user:', selectedUserId);
            router.push({
              pathname: '/chat',
              params: { userId: selectedUserId }
            });
          } else {
            console.log('[TipPopup onClose] No selectedUserId, going back');
            router.back();
          }
        }}
        onSendWithTip={async (tipAmount) => {
          console.log('[TipPopup onSendWithTip] Send with tip clicked, amount:', tipAmount);
          console.log('[TipPopup onSendWithTip] selectedUserId:', selectedUserId);
          setShowTipPopup(false);
          
          if (tipAmount > 0) {
            try {
              const stripeUrl = `https://buy.stripe.com/test_00g00000000000?prefilled_amount=${Math.round(tipAmount * 100)}`;
              console.log('[TipPopup onSendWithTip] Opening Stripe URL:', stripeUrl);
              
              const supported = await Linking.canOpenURL(stripeUrl);
              if (supported) {
                await Linking.openURL(stripeUrl);
                
                setTimeout(() => {
                  if (selectedUserId && invitationData) {
                    console.log('[TipPopup onSendWithTip] Initiating invitation after payment');
                    const selectedUser = mockUsers.find(u => u.id === selectedUserId);
                    Alert.alert(
                      'Invitation Sent!',
                      `Your meal invitation to ${selectedUser?.name} at ${invitationData.placeName} has been sent.`,
                      [
                        {
                          text: 'View Chat',
                          onPress: () => {
                            router.push({
                              pathname: '/chat',
                              params: { userId: selectedUserId, tipAmount: tipAmount.toString() }
                            });
                          }
                        },
                        {
                          text: 'OK',
                          onPress: () => router.back()
                        }
                      ]
                    );
                  }
                }, 2000);
              } else {
                console.error('[TipPopup onSendWithTip] Cannot open Stripe URL');
                Alert.alert('Error', 'Unable to open payment page');
              }
            } catch (error) {
              console.error('[TipPopup onSendWithTip] Error opening Stripe:', error);
              Alert.alert('Error', 'Failed to process payment');
            }
          } else {
            if (selectedUserId && invitationData) {
              const selectedUser = mockUsers.find(u => u.id === selectedUserId);
              Alert.alert(
                'Invitation Sent!',
                `Your meal invitation to ${selectedUser?.name} at ${invitationData.placeName} has been sent.`,
                [
                  {
                    text: 'View Chat',
                    onPress: () => {
                      router.push({
                        pathname: '/chat',
                        params: { userId: selectedUserId }
                      });
                    }
                  },
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]
              );
            } else {
              console.log('[TipPopup onSendWithTip] No selectedUserId, going back');
              router.back();
            }
          }
        }}
      />
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
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  chatsList: {
    flex: 1,
  },
  chatsContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  invitationSummary: {
    backgroundColor: Colors.surface,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  summaryRestaurant: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  summaryAddress: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 12,
  },
  summaryDateTime: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryDateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryDateTimeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  usersList: {
    flex: 1,
  },
  usersContent: {
    paddingVertical: 8,
  },
  mealUpSummary: {
    backgroundColor: Colors.surface,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  mealUpHeader: {
    flexDirection: 'row',
    padding: 16,
  },
  mealUpImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  mealUpInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mealUpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  mealUpVenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealUpVenue: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 4,
  },
  mealUpDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealUpDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealUpDetailText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 4,
  },
});