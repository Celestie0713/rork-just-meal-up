import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Image, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, Clock, X, Check, Calendar, MapPin, User, ChefHat, Pencil, Navigation, Map } from 'lucide-react-native';
import { router } from 'expo-router';
import { mockUsers } from '@/mocks/users';
import { useChat } from '@/hooks/use-chat';
import { useInvitations } from '@/hooks/use-invitations';
import type { MealInvitation, SystemMessage } from '@/types/user';
import { PlatformTipsPopup } from '@/components/PlatformTipsPopup';

const colors = {
  primary: '#FF6B35',
  text: '#FFFFFF',
  textLight: '#CCCCCC',
  background: '#000000',
  surface: '#1A1A1A',
  success: '#4CAF50',
  warning: '#FFA726',
  error: '#EF5350',
  border: '#333333',
} as const;

type InvitationCardProps = {
  invitation: MealInvitation;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onEdit?: (id: string) => void;
  showActions?: boolean;
};

function InvitationCard({ invitation, onAccept, onDecline, onEdit, showActions = true }: InvitationCardProps) {
  const [navModalVisible, setNavModalVisible] = useState(false);

  const openWaze = () => {
    const address = encodeURIComponent(invitation.venue.address);
    const wazeUrl = `https://waze.com/ul?q=${address}&navigate=yes`;
    Linking.openURL(wazeUrl);
    setNavModalVisible(false);
  };

  const openGoogleMaps = () => {
    const address = encodeURIComponent(invitation.venue.address);
    const url = Platform.select({
      ios: `comgooglemaps://?q=${address}`,
      android: `geo:0,0?q=${address}`,
      default: `https://www.google.com/maps/search/?api=1&query=${address}`,
    }) as string;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`);
    });
    setNavModalVisible(false);
  };
  const inviter = mockUsers.find(user => user.id === invitation.inviterId);
  const isPending = invitation.status === 'pending';
  const isConfirmed = invitation.status === 'accepted';

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getStatusConfig = () => {
    switch (invitation.status) {
      case 'accepted':
        return {
          icon: CheckCircle,
          color: colors.success,
          backgroundColor: colors.success + '20',
          text: 'Confirmed'
        };
      case 'pending':
        return {
          icon: Clock,
          color: colors.warning,
          backgroundColor: colors.warning + '20',
          text: 'Pending'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: colors.success,
          backgroundColor: colors.success + '20',
          text: 'Completed'
        };
      case 'declined':
        return {
          icon: X,
          color: colors.error,
          backgroundColor: colors.error + '20',
          text: 'Declined'
        };
      default:
        return {
          icon: Clock,
          color: colors.warning,
          backgroundColor: colors.warning + '20',
          text: 'Pending'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <View style={styles.invitationCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
          <StatusIcon size={14} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.text}
          </Text>
        </View>
        {isConfirmed && onEdit && (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => onEdit(invitation.id)}
          >
            <Pencil size={16} color={colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.inviterInfo}>
        <View style={styles.avatar}>
          {inviter?.photos?.[0] ? (
            <Image 
              source={{ uri: inviter.photos[0] }} 
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <User size={20} color={colors.textLight} />
          )}
        </View>
        <View style={styles.inviterDetails}>
          <TouchableOpacity onPress={() => inviter && router.push(`/user-profile?userId=${inviter.id}` as any)}>
            <Text style={[styles.inviterName, styles.clickableName]}>
              {inviter?.name || 'Unknown User'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.inviterAge}>
            {inviter?.age ? `${inviter.age} years old` : 'Age not specified'}
          </Text>
        </View>
      </View>
      <View style={styles.mealDetails}>
        <View style={styles.detailRow}>
          <Calendar size={16} color={colors.textLight} />
          <Text style={styles.detailText}>
            {formatDate(invitation.date)} at {invitation.time}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <ChefHat size={16} color={colors.textLight} />
          <Text style={styles.detailText}>
            {invitation.venue.name} • {invitation.venue.cuisine}
          </Text>
        </View>
        <TouchableOpacity style={styles.detailRow} onPress={() => setNavModalVisible(true)} activeOpacity={0.7}>
          <MapPin size={16} color={colors.primary} />
          <Text style={[styles.detailText, styles.addressText]}>
            {invitation.venue.address}
          </Text>
        </TouchableOpacity>
        <Modal
          visible={navModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setNavModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.navModalOverlay} 
            activeOpacity={1} 
            onPress={() => setNavModalVisible(false)}
          >
            <View style={styles.navModalContent}>
              <Text style={styles.navModalTitle}>Navigate to</Text>
              <Text style={styles.navModalAddress} numberOfLines={2}>{invitation.venue.address}</Text>
              <View style={styles.navOptions}>
                <TouchableOpacity style={styles.navOption} onPress={openWaze} activeOpacity={0.7}>
                  <View style={[styles.navIconCircle, { backgroundColor: '#33CCFF20' }]}>
                    <Navigation size={24} color="#33CCFF" />
                  </View>
                  <Text style={styles.navOptionLabel}>Waze</Text>
                  <Text style={styles.navOptionSub}>Live traffic</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navOption} onPress={openGoogleMaps} activeOpacity={0.7}>
                  <View style={[styles.navIconCircle, { backgroundColor: '#4285F420' }]}>
                    <Map size={24} color="#4285F4" />
                  </View>
                  <Text style={styles.navOptionLabel}>Google Maps</Text>
                  <Text style={styles.navOptionSub}>Directions</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.navCancelButton} onPress={() => setNavModalVisible(false)}>
                <Text style={styles.navCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
      {isPending && showActions && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => onDecline(invitation.id)}
          >
            <X size={16} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>
              Decline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => onAccept(invitation.id)}
          >
            <Check size={16} color={colors.success} />
            <Text style={[styles.actionButtonText, { color: colors.success }]}>
              Accept
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

type EditModalData = {
  id: string;
  date: string;
  time: string;
  venue: string;
};

type ConfirmModalData = {
  type: 'accept' | 'decline';
  invitationId: string;
  title: string;
  message: string;
};

export default function InvitationsScreen() {
  const { invitations, updateInvitation } = useInvitations();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState<EditModalData | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmData, setConfirmData] = useState<ConfirmModalData | null>(null);
  const [tipsModalVisible, setTipsModalVisible] = useState(false);
  const [pendingAcceptInvitationId, setPendingAcceptInvitationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'declined'>('all');
  const { addSystemMessage } = useChat();
  const currentUserId = '1';

  const handleAccept = (invitationId: string) => {
    setConfirmData({
      type: 'accept',
      invitationId,
      title: 'Accept Invitation',
      message: 'Are you sure you want to accept this meal invitation?'
    });
    setConfirmModalVisible(true);
  };

  const handleDecline = (invitationId: string) => {
    setConfirmData({
      type: 'decline',
      invitationId,
      title: 'Decline Invitation',
      message: 'Are you sure you want to decline this meal invitation?'
    });
    setConfirmModalVisible(true);
  };

  const handleEdit = (invitationId: string) => {
    const invitation = invitations.find(inv => inv.id === invitationId);
    if (invitation) {
      setEditData({
        id: invitationId,
        date: invitation.date.toISOString().split('T')[0],
        time: invitation.time,
        venue: invitation.venue.name
      });
      setEditModalVisible(true);
    }
  };

  const handleSaveEdit = () => {
    if (!editData) return;
    
    const invitation = invitations.find(inv => inv.id === editData.id);
    if (invitation) {
      updateInvitation(editData.id, {
        date: new Date(editData.date),
        time: editData.time,
        venue: { ...invitation.venue, name: editData.venue }
      });
    }
    
    setEditModalVisible(false);
    setEditData(null);
    
    // Show success feedback
    console.log('Invitation updated successfully!');
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setEditData(null);
  };

  const handleConfirmAction = () => {
    if (!confirmData) return;

    if (confirmData.type === 'accept') {
      setPendingAcceptInvitationId(confirmData.invitationId);
      setConfirmModalVisible(false);
      setConfirmData(null);
      setTipsModalVisible(true);
    } else if (confirmData.type === 'decline') {
      const invitation = invitations.find(inv => inv.id === confirmData.invitationId);
      if (invitation) {
        const inviter = mockUsers.find(user => user.id === invitation.inviterId);
        
        updateInvitation(confirmData.invitationId, { 
          status: 'declined', 
          declinedAt: new Date() 
        });
        
        // Add system message to chat
        if (inviter) {
          const chatId = `${currentUserId}-${inviter.id}`;
          const systemMessage: SystemMessage = {
            id: `system-${Date.now()}`,
            type: 'invitation_declined',
            content: `You declined the meal invitation for ${invitation.venue.name} on ${invitation.date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })} at ${invitation.time}.`,
            timestamp: new Date(),
            relatedInvitationId: confirmData.invitationId
          };
          
          addSystemMessage(chatId, systemMessage);
        }
      }
    }

    setConfirmModalVisible(false);
    setConfirmData(null);
  };

  const handleTipsComplete = (amount: number) => {
    console.log(`Platform tip of ${amount} received`);
    
    if (!pendingAcceptInvitationId) return;
    
    const invitation = invitations.find(inv => inv.id === pendingAcceptInvitationId);
    if (invitation) {
      const inviter = mockUsers.find(user => user.id === invitation.inviterId);
      
      updateInvitation(pendingAcceptInvitationId, { status: 'accepted' });
      
      if (inviter) {
        const chatId = `${currentUserId}-${inviter.id}`;
        const systemMessage: SystemMessage = {
          id: `system-${Date.now()}`,
          type: 'invitation_accepted',
          content: `You accepted the meal invitation for ${invitation.venue.name} on ${invitation.date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          })} at ${invitation.time}. Looking forward to it!`,
          timestamp: new Date(),
          relatedInvitationId: pendingAcceptInvitationId
        };
        
        addSystemMessage(chatId, systemMessage);
      }
    }
    
    setTipsModalVisible(false);
    setPendingAcceptInvitationId(null);
  };

  const handleCancelConfirm = () => {
    setConfirmModalVisible(false);
    setConfirmData(null);
  };

  const isInvitationDue = (invitation: MealInvitation) => {
    const now = new Date();
    const invitationDateTime = new Date(invitation.date);
    const [time, period] = invitation.time.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let adjustedHours = hours;
    
    if (period === 'PM' && hours !== 12) {
      adjustedHours = hours + 12;
    } else if (period === 'AM' && hours === 12) {
      adjustedHours = 0;
    }
    
    invitationDateTime.setHours(adjustedHours, minutes, 0, 0);
    
    return invitationDateTime <= now;
  };

  const shouldRemoveDeclined = (invitation: MealInvitation) => {
    if (invitation.status !== 'declined' || !invitation.declinedAt) {
      return false;
    }
    
    const now = new Date();
    const declinedTime = new Date(invitation.declinedAt);
    const hoursSinceDeclined = (now.getTime() - declinedTime.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceDeclined >= 24;
  };

  const sentInvitations = invitations.filter(inv => 
    inv.inviterId === currentUserId && !isInvitationDue(inv) && !shouldRemoveDeclined(inv)
  );
  
  const receivedInvitations = invitations.filter(inv => 
    inv.inviteeId === currentUserId && !isInvitationDue(inv) && !shouldRemoveDeclined(inv) && inv.status !== 'declined'
  );
  
  const pendingSent = sentInvitations.filter(inv => inv.status === 'pending');
  const confirmedSent = sentInvitations.filter(inv => inv.status === 'accepted');
  const declinedSent = sentInvitations.filter(inv => inv.status === 'declined');
  
  const pendingReceived = receivedInvitations.filter(inv => inv.status === 'pending');
  const confirmedReceived = receivedInvitations.filter(inv => inv.status === 'accepted');
  const declinedReceived = receivedInvitations.filter(inv => inv.status === 'declined');
  
  const getFilteredInvitations = (invitations: MealInvitation[]) => {
    if (statusFilter === 'all') return invitations;
    if (statusFilter === 'pending') return invitations.filter(inv => inv.status === 'pending');
    if (statusFilter === 'confirmed') return invitations.filter(inv => inv.status === 'accepted');
    if (statusFilter === 'declined') return invitations.filter(inv => inv.status === 'declined');
    return invitations;
  };
  
  const filteredSentInvitations = getFilteredInvitations(sentInvitations);
  const filteredReceivedInvitations = getFilteredInvitations(receivedInvitations);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meal Invitations</Text>
      </View>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            Invitation sent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
            Invitation received
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'sent' ? (
          <View style={styles.mainSection}>
            <View style={styles.filterContainer}>
              <TouchableOpacity 
                style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
                onPress={() => setStatusFilter('all')}
              >
                <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>
                  All ({sentInvitations.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, statusFilter === 'pending' && styles.filterChipActive]}
                onPress={() => setStatusFilter('pending')}
              >
                <Text style={[styles.filterChipText, statusFilter === 'pending' && styles.filterChipTextActive]}>
                  Pending ({pendingSent.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, statusFilter === 'confirmed' && styles.filterChipActive]}
                onPress={() => setStatusFilter('confirmed')}
              >
                <Text style={[styles.filterChipText, statusFilter === 'confirmed' && styles.filterChipTextActive]}>
                  Confirmed ({confirmedSent.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, statusFilter === 'declined' && styles.filterChipActive]}
                onPress={() => setStatusFilter('declined')}
              >
                <Text style={[styles.filterChipText, statusFilter === 'declined' && styles.filterChipTextActive]}>
                  Declined ({declinedSent.length})
                </Text>
              </TouchableOpacity>
            </View>
            {filteredSentInvitations.length > 0 ? (
              filteredSentInvitations.map(invitation => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onEdit={invitation.status === 'accepted' ? handleEdit : undefined}
                  showActions={false}
                />
              ))
            ) : (
              <View style={styles.emptyStateSmall}>
                <Text style={styles.emptySubtitle}>
                  No {statusFilter !== 'all' ? statusFilter : ''} invitations
                </Text>
              </View>
            )}
            {sentInvitations.length === 0 && (
              <View style={styles.emptyStateSmall}>
                <Text style={styles.emptySubtitle}>
                  No sent invitations yet
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.mainSection}>
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                Meal invitations aren't free. They tip us before they get here😘 #effort
              </Text>
            </View>
            <View style={styles.filterContainer}>
              <TouchableOpacity 
                style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
                onPress={() => setStatusFilter('all')}
              >
                <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>
                  All ({receivedInvitations.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, statusFilter === 'pending' && styles.filterChipActive]}
                onPress={() => setStatusFilter('pending')}
              >
                <Text style={[styles.filterChipText, statusFilter === 'pending' && styles.filterChipTextActive]}>
                  Pending ({pendingReceived.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, statusFilter === 'confirmed' && styles.filterChipActive]}
                onPress={() => setStatusFilter('confirmed')}
              >
                <Text style={[styles.filterChipText, statusFilter === 'confirmed' && styles.filterChipTextActive]}>
                  Confirmed ({confirmedReceived.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, statusFilter === 'declined' && styles.filterChipActive]}
                onPress={() => setStatusFilter('declined')}
              >
                <Text style={[styles.filterChipText, statusFilter === 'declined' && styles.filterChipTextActive]}>
                  Declined ({declinedReceived.length})
                </Text>
              </TouchableOpacity>
            </View>
            {filteredReceivedInvitations.length > 0 ? (
              filteredReceivedInvitations.map(invitation => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onEdit={invitation.status === 'accepted' ? handleEdit : undefined}
                />
              ))
            ) : (
              <View style={styles.emptyStateSmall}>
                <Text style={styles.emptySubtitle}>
                  No {statusFilter !== 'all' ? statusFilter : ''} invitations
                </Text>
              </View>
            )}
            {receivedInvitations.length === 0 && (
              <View style={styles.emptyStateSmall}>
                <Text style={styles.emptySubtitle}>
                  No received invitations yet
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Invitation</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput
                style={styles.input}
                value={editData?.date || ''}
                onChangeText={(text) => setEditData(prev => prev ? { ...prev, date: text } : null)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textLight}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Time</Text>
              <TextInput
                style={styles.input}
                value={editData?.time || ''}
                onChangeText={(text) => setEditData(prev => prev ? { ...prev, time: text } : null)}
                placeholder="7:00 PM"
                placeholderTextColor={colors.textLight}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Venue</Text>
              <TextInput
                style={styles.input}
                value={editData?.venue || ''}
                onChangeText={(text) => setEditData(prev => prev ? { ...prev, venue: text } : null)}
                placeholder="Restaurant name"
                placeholderTextColor={colors.textLight}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <Text style={[styles.modalButtonText, { color: colors.textLight }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelConfirm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmTitle}>{confirmData?.title}</Text>
            <Text style={styles.confirmMessage}>{confirmData?.message}</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.cancelConfirmButton]}
                onPress={handleCancelConfirm}
              >
                <Text style={[styles.confirmButtonText, { color: colors.textLight }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.confirmButton, 
                  confirmData?.type === 'decline' ? styles.declineConfirmButton : styles.acceptConfirmButton
                ]}
                onPress={handleConfirmAction}
              >
                <Text style={[
                  styles.confirmButtonText, 
                  { color: confirmData?.type === 'decline' ? colors.error : colors.success }
                ]}>
                  {confirmData?.type === 'decline' ? 'Decline' : 'Accept'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <PlatformTipsPopup
        visible={tipsModalVisible}
        onComplete={handleTipsComplete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeTabText: {
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mainSection: {
    marginBottom: 32,
  },
  mainSectionSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  infoBanner: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  infoBannerText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
  },
  filterChipTextActive: {
    color: colors.text,
  },
  subsection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  invitationCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  completedDate: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '500',
  },
  inviterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  inviterDetails: {
    flex: 1,
  },
  inviterName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  clickableName: {
    color: colors.primary,
  },
  inviterAge: {
    fontSize: 14,
    color: colors.textLight,
  },
  mealDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  clickableText: {
    color: colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  acceptButton: {
    backgroundColor: colors.success + '20',
    borderColor: colors.success,
  },
  declineButton: {
    backgroundColor: colors.error + '20',
    borderColor: colors.error,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateSmall: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primary + '20',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelConfirmButton: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  acceptConfirmButton: {
    backgroundColor: colors.success + '20',
    borderColor: colors.success,
  },
  declineConfirmButton: {
    backgroundColor: colors.error + '20',
    borderColor: colors.error,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addressText: {
    color: colors.primary,
  },
  navModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 32,
  },
  navModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  navModalAddress: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  navOptions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  navOption: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  navOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  navOptionSub: {
    fontSize: 12,
    color: colors.textLight,
  },
  navCancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
});