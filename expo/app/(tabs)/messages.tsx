import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Alert, Image, Platform, Modal, TextInput, KeyboardAvoidingView, ScrollView, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { safeGoBack } from '@/utils/navigation';
import { ArrowLeft, Calendar, Clock, MessageCircle, MapPin, DollarSign, Pencil, X, ExternalLink } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChatListItem } from '@/components/ChatListItem';
import { Colors } from '@/constants/colors';
import { mockUsers } from '@/mocks/users';
import { useChat } from '@/hooks/use-chat';
import { useInvitations } from '@/hooks/use-invitations';
import { TipSelectionModal } from '@/components/TipSelectionModal';
import { PaymentGatewayModal } from '@/components/PaymentGatewayModal';
import type { User, SystemMessage } from '@/types/user';

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
  const { getAvailableChats, isLoaded, addSystemMessage, hasActiveExclusiveMatch, getExclusiveMatchPartner } = useChat();
  const { addInvitation } = useInvitations();
  const params = useLocalSearchParams<{
    placeName?: string;
    placeAddress?: string;
    placeCity?: string;
    placeCountry?: string;
    placeGoogleMapsUrl?: string;
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
  
  const [chats] = useState<ChatData[]>(mockChats);
  const [filteredChats, setFilteredChats] = useState<ChatData[]>(mockChats);
  const exclusivePartner = getExclusiveMatchPartner();
  const [isInvitationMode, setIsInvitationMode] = useState<boolean>(false);
  const [isMealUpShareMode, setIsMealUpShareMode] = useState<boolean>(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [mealUpData, setMealUpData] = useState<any>(null);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingTipAmount, setPendingTipAmount] = useState<number>(0);
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editDraft, setEditDraft] = useState<{ placeName: string; placeAddress: string; placeCity: string; placeCountry: string; date: Date; time: Date } | null>(null);
  
  useEffect(() => {
    if (params.fromInvitation === 'true') {
      setIsInvitationMode(true);
      setInvitationData({
        placeName: params.placeName,
        placeAddress: params.placeAddress,
        placeCity: params.placeCity,
        placeCountry: params.placeCountry,
        placeGoogleMapsUrl: params.placeGoogleMapsUrl,
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
  }, [params.fromInvitation, params.fromMealUpShare, params.placeName, params.placeAddress, params.placeCity, params.placeCountry, params.placeGoogleMapsUrl, params.placeId, params.date, params.time, params.mealUpId, params.mealUpTitle, params.mealUpVenue, params.mealUpDate, params.mealUpTime, params.mealUpPrice, params.mealUpImage]);
  
  // Filter chats based on removed profiles
  React.useEffect(() => {
    if (isLoaded) {
      const availableChats = getAvailableChats(chats);
      setFilteredChats(availableChats);
      console.log(`Filtered chats: ${availableChats.length} out of ${chats.length} total chats`);
    }
  }, [chats, isLoaded, getAvailableChats]);

  const handleChatPress = (user: User) => {
    console.log('[handleChatPress] User clicked:', user.name, 'ID:', user.id);
    console.log('[handleChatPress] isInvitationMode:', isInvitationMode);
    console.log('[handleChatPress] isMealUpShareMode:', isMealUpShareMode);
    console.log('[handleChatPress] invitationData:', JSON.stringify(invitationData));
    console.log('[handleChatPress] mealUpData:', JSON.stringify(mealUpData));
    
    if (isInvitationMode && invitationData) {
      console.log('[handleChatPress] Showing tip modal for:', user.name);
      setSelectedRecipient(user);
      setShowTipModal(true);
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
                [{ text: 'OK', onPress: () => safeGoBack() }]
              );
            }
          }
        ]
      );
    } else {
      console.log('[handleChatPress] Opening chat with user:', user.id);
      router.push({
        pathname: '/chat' as any,
        params: { userId: user.id }
      });
    }
  };
  
  const formatInvitationDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const formatInvitationTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event?.type === 'dismissed') {
      return;
    }
    if (date) {
      setEditDraft((prev) => (prev ? { ...prev, date } : prev));
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event?.type === 'dismissed') {
      return;
    }
    if (time) {
      setEditDraft((prev) => (prev ? { ...prev, time } : prev));
    }
  };

  const openEditModal = () => {
    if (!invitationData) return;
    setEditDraft({
      placeName: invitationData.placeName ?? '',
      placeAddress: invitationData.placeAddress ?? '',
      placeCity: invitationData.placeCity ?? '',
      placeCountry: invitationData.placeCountry ?? '',
      date: invitationData.date ?? new Date(),
      time: invitationData.time ?? new Date(),
    });
    setShowEditModal(true);
  };

  const saveEditModal = () => {
    if (!editDraft) return;
    setInvitationData((prev: any) => ({
      ...prev,
      placeName: editDraft.placeName.trim() || prev?.placeName,
      placeAddress: editDraft.placeAddress.trim() || prev?.placeAddress,
      placeCity: editDraft.placeCity.trim() || prev?.placeCity,
      placeCountry: editDraft.placeCountry.trim() || prev?.placeCountry,
      date: editDraft.date,
      time: editDraft.time,
    }));
    setShowEditModal(false);
  };

  const renderInvitationDateTimePickers = () => {
    if (Platform.OS === 'android') {
      return (
        <>
          {showDatePicker && (
            <DateTimePicker
              value={editDraft?.date ?? new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={editDraft?.time ?? new Date()}
              mode="time"
              display="default"
              onChange={handleTimeChange}
              is24Hour={true}
            />
          )}
        </>
      );
    }
    return (
      <>
        {showDatePicker && (
          <Modal visible transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
            <View style={styles.iosModalOverlay}>
              <TouchableOpacity style={styles.iosModalBackdrop} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
              <View style={styles.iosModalContainer}>
                <View style={styles.iosModalHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.iosModalCancelButton}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.iosModalTitle}>Select Date</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.iosModalDoneButton}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={editDraft?.date ?? new Date()}
                  mode="date"
                  display="inline"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  themeVariant="dark"
                />
              </View>
            </View>
          </Modal>
        )}
        {showTimePicker && (
          <Modal visible transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
            <View style={styles.iosModalOverlay}>
              <TouchableOpacity style={styles.iosModalBackdrop} activeOpacity={1} onPress={() => setShowTimePicker(false)} />
              <View style={styles.iosModalContainer}>
                <View style={styles.iosModalHeader}>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.iosModalCancelButton}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.iosModalTitle}>Select Time</Text>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.iosModalDoneButton}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={editDraft?.time ?? new Date()}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  textColor={Colors.text}
                />
              </View>
            </View>
          </Modal>
        )}
      </>
    );
  };

  const renderEditModal = () => {
    if (!editDraft) return null;
    return (
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.iosModalOverlay}
        >
          <TouchableOpacity style={styles.iosModalBackdrop} activeOpacity={1} onPress={() => setShowEditModal(false)} />
          <View style={styles.editModalContainer}>
            <View style={styles.iosModalHeader}>
              <TouchableOpacity onPress={() => setShowEditModal(false)} testID="edit-modal-cancel">
                <Text style={styles.iosModalCancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.iosModalTitle}>Edit Invitation</Text>
              <TouchableOpacity onPress={saveEditModal} testID="edit-modal-save">
                <Text style={styles.iosModalDoneButton}>Save</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.editModalContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Place</Text>
              <TextInput
                value={editDraft.placeName}
                onChangeText={(t) => setEditDraft((prev) => (prev ? { ...prev, placeName: t } : prev))}
                placeholder="Restaurant name"
                placeholderTextColor={Colors.textLight}
                style={styles.textInput}
                testID="edit-place-name"
              />

              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                value={editDraft.placeAddress}
                onChangeText={(t) => setEditDraft((prev) => (prev ? { ...prev, placeAddress: t } : prev))}
                placeholder="Street, neighborhood"
                placeholderTextColor={Colors.textLight}
                style={[styles.textInput, styles.textInputMultiline]}
                multiline
                testID="edit-place-address"
              />

              <View style={styles.editRowTwoCol}>
                <View style={styles.editCol}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <TextInput
                    value={editDraft.placeCity}
                    onChangeText={(t) => setEditDraft((prev) => (prev ? { ...prev, placeCity: t } : prev))}
                    placeholder="City"
                    placeholderTextColor={Colors.textLight}
                    style={styles.textInput}
                    testID="edit-place-city"
                  />
                </View>
                <View style={styles.editCol}>
                  <Text style={styles.fieldLabel}>Country</Text>
                  <TextInput
                    value={editDraft.placeCountry}
                    onChangeText={(t) => setEditDraft((prev) => (prev ? { ...prev, placeCountry: t } : prev))}
                    placeholder="Country"
                    placeholderTextColor={Colors.textLight}
                    style={styles.textInput}
                    testID="edit-place-country"
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Date</Text>
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => setShowDatePicker(true)}
                testID="edit-open-date"
                activeOpacity={0.7}
              >
                <Calendar size={18} color={Colors.primary} />
                <Text style={styles.pickerRowText}>{formatInvitationDate(editDraft.date)}</Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Time</Text>
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => setShowTimePicker(true)}
                testID="edit-open-time"
                activeOpacity={0.7}
              >
                <Clock size={18} color={Colors.primary} />
                <Text style={styles.pickerRowText}>{formatInvitationTime(editDraft.time)}</Text>
              </TouchableOpacity>
            </ScrollView>
            {renderInvitationDateTimePickers()}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const renderChatItem = ({ item }: { item: ChatData }) => {
    console.log('[renderChatItem] Rendering chat item for user:', item.user.name);
    const isExclusive = exclusivePartner?.userId === item.user.id;
    return (
      <ChatListItem
        user={item.user}
        lastMessage={item.lastMessage}
        lastMessageTime={item.lastMessageTime}
        unreadCount={item.unreadCount}
        isExclusive={isExclusive}
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
          <TouchableOpacity onPress={() => safeGoBack()} style={styles.backButton}>
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
      {isInvitationMode && !!invitationData && (
        <View style={styles.invitationSummary}>
          <View style={styles.summaryTitleRow}>
            <Text style={styles.summaryTitle}>Meal Invitation</Text>
            <View style={styles.summaryTitleActions}>
              <TouchableOpacity
                onPress={openEditModal}
                style={styles.editButton}
                testID="edit-invitation-button"
                activeOpacity={0.8}
              >
                <Pencil size={14} color={Colors.text} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setIsInvitationMode(false);
                  setInvitationData(null);
                }}
                style={styles.closeButton}
                testID="close-invitation-button"
                activeOpacity={0.7}
              >
                <X size={18} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryRestaurant}>{invitationData.placeName}</Text>
            <Text style={styles.summaryAddress}>{invitationData.placeAddress}</Text>
            {(invitationData.placeCity || invitationData.placeCountry) && (
              <Text style={styles.summaryCityCountry}>
                {[invitationData.placeCity, invitationData.placeCountry].filter(Boolean).join(', ')}
              </Text>
            )}
            {invitationData.placeGoogleMapsUrl ? (
              <TouchableOpacity
                style={styles.summaryMapsButton}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    window.open(invitationData.placeGoogleMapsUrl, '_blank');
                  } else {
                    Linking.openURL(invitationData.placeGoogleMapsUrl);
                  }
                }}
                activeOpacity={0.7}
              >
                <ExternalLink size={12} color={Colors.primary} />
                <Text style={styles.summaryMapsText}>View on Google Maps</Text>
              </TouchableOpacity>
            ) : null}
          </View>
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
          {renderEditModal()}
        </View>
      )}
      {isMealUpShareMode && !!mealUpData && (
        <View style={styles.mealUpSummary}>
          <View style={styles.mealUpHeader}>
            {!!mealUpData.image && (
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
      <TipSelectionModal
        visible={showTipModal}
        onClose={() => {
          setShowTipModal(false);
          setSelectedRecipient(null);
        }}
        onConfirm={(amount) => {
          console.log(`Tip amount selected: ${amount}`);
          setPendingTipAmount(amount);
          setShowTipModal(false);
          setShowPaymentModal(true);
        }}
        recipientName={selectedRecipient?.name || ''}
      />
      <PaymentGatewayModal
        visible={showPaymentModal}
        amount={pendingTipAmount}
        onClose={() => {
          setShowPaymentModal(false);
          setPendingTipAmount(0);
          setSelectedRecipient(null);
        }}
        onSuccess={() => {
          setShowPaymentModal(false);
          const recipient = selectedRecipient;
          const amount = pendingTipAmount;
          if (recipient && invitationData) {
            const newInvitationId = `inv-${Date.now()}`;
            addInvitation({
              id: newInvitationId,
              inviterId: '1',
              inviteeId: recipient.id,
              date: invitationData.date,
              time: formatInvitationTime(invitationData.time),
              venue: {
                name: invitationData.placeName,
                address: invitationData.placeAddress,
                city: invitationData.placeCity,
                country: invitationData.placeCountry,
                googleMapsUrl: invitationData.placeGoogleMapsUrl,
                cuisine: 'Restaurant',
                placeId: invitationData.placeId,
              },
              status: 'pending',
              createdAt: new Date(),
            });

            const chatId = `1-${recipient.id}`;
            const systemMessage: SystemMessage = {
              id: Date.now().toString(),
              type: 'invitation_sent',
              content: `Payment of ${amount.toFixed(2)} successful. Meal invitation sent.${invitationData.placeGoogleMapsUrl ? '\n\n📍 View on map: ' + invitationData.placeGoogleMapsUrl : ''} Now pick an outfit you can still breathe in after dessert while you wait🤘`,
              timestamp: new Date(),
            };
            addSystemMessage(chatId, systemMessage);

            router.push({
              pathname: '/chat' as any,
              params: { userId: recipient.id },
            });
          }
          setPendingTipAmount(0);
          setSelectedRecipient(null);
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
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryTitleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.border,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryHint: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryBlock: {
    marginBottom: 12,
  },
  editModalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    maxHeight: '85%',
  },
  editModalContent: {
    padding: 20,
    paddingBottom: 32,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 15,
    marginBottom: 4,
  },
  textInputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top' as const,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  pickerRowText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  editableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: -10,
    borderRadius: 10,
    backgroundColor: Colors.primary + '08',
    marginBottom: 12,
  },
  editableRowContent: {
    flex: 1,
  },
  editIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '20',
    marginLeft: 8,
  },
  summaryRestaurant: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  summaryAddress: {
    fontSize: 14,
    color: Colors.textLight,
  },
  summaryCityCountry: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  summaryMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 165, 0, 0.08)',
    gap: 4,
  },
  summaryMapsText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  editRowTwoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  editCol: {
    flex: 1,
  },
  summaryDateTime: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryDateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.primary + '12',
  },
  iosModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  iosModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iosModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  iosModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iosModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  iosModalCancelButton: {
    fontSize: 16,
    color: Colors.textLight,
  },
  iosModalDoneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
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