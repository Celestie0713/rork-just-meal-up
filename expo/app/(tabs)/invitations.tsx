import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Image, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CheckCircle, Clock, X, Check, Calendar, MapPin, User, ChefHat, Pencil, Navigation, Map, Shuffle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { mockUsers } from '@/mocks/users';
import { useChat } from '@/hooks/use-chat';
import { useInvitations } from '@/hooks/use-invitations';
import type { MealInvitation, SystemMessage } from '@/types/user';
import { MealPickerModal } from '@/components/MealPickerModal';
import type { PickerPlace } from '@/components/MealPickerModal';

const tomorrowNoon = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(12, 0, 0, 0);
  return d;
};

const tomorrowEvening = () => {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  t.setHours(19, 0, 0, 0);
  return t;
};

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
  /** Present on the received tab — opens the invitee Meal Shuffle picker. */
  onShuffle?: (invitation: MealInvitation) => void;
};

function InvitationCard({ invitation, onAccept, onDecline, onEdit, showActions = true, onShuffle }: InvitationCardProps) {
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
  // "Invitee will shuffle & pick" invitation — the pick still belongs to the
  // invitee until they shuffle, so the venue row is replaced by the shuffle panel.
  const isShufflePending =
    !!invitation.pickerPlaces &&
    invitation.pickerPlaces.length >= 2 &&
    isPending &&
    !invitation.pickerPickedId;

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
        {isShufflePending ? (
          <View style={styles.shufflePanel}>
            <Text style={styles.shufflePanelTitle}>🎴 Meal Shuffle</Text>
            {showActions && (
              <TouchableOpacity
                style={styles.shuffleButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onShuffle?.(invitation);
                }}
                activeOpacity={0.8}
              >
                <Shuffle size={16} color="#FFFFFF" />
                <Text style={styles.shuffleButtonText}>Shuffle & pick</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
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
            {!!invitation.pickerPickedId && (
              <Text style={styles.pickerNote}>Picked via Meal Shuffle 🎴</Text>
            )}
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
          </>
        )}
      </View>
      {isPending && showActions && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => onDecline(invitation.id)}
          >
            <X size={16} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
              Decline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => onAccept(invitation.id)}
          >
            <Check size={16} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
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
  // Received "Invitee will shuffle & pick" invitation currently being shuffled
  const [shuffleInvitation, setShuffleInvitation] = useState<MealInvitation | null>(null);
  // Date & time the invitee sets on this page after locking in a Meal Shuffle pick
  const [scheduleData, setScheduleData] = useState<{
    invitationId: string;
    place: PickerPlace;
    inviterId: string;
    inviterName: string;
    date: string;
    time: string;
  } | null>(null);
  const [scheduleError, setScheduleError] = useState<string>('');
  const [showScheduleDatePicker, setShowScheduleDatePicker] = useState(false);
  const [showScheduleTimePicker, setShowScheduleTimePicker] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date>(() => tomorrowNoon());
  const [scheduleTime, setScheduleTime] = useState<Date>(() => tomorrowEvening());
  const [scheduleCalendarMonth, setScheduleCalendarMonth] = useState<Date>(() => tomorrowNoon());
  const [scheduleTempHour, setScheduleTempHour] = useState<number>(19);
  const [scheduleTempMinute, setScheduleTempMinute] = useState<number>(0);
  const [scheduleTempPeriod, setScheduleTempPeriod] = useState<'AM' | 'PM'>('PM');
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
      const invitation = invitations.find(inv => inv.id === confirmData.invitationId);
      if (invitation) {
        const inviter = mockUsers.find(user => user.id === invitation.inviterId);

        updateInvitation(confirmData.invitationId, { status: 'accepted' });

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
            relatedInvitationId: confirmData.invitationId
          };

          addSystemMessage(chatId, systemMessage);
        }
      }
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

  const handleCancelConfirm = () => {
    setConfirmModalVisible(false);
    setConfirmData(null);
  };

  const handleOpenShuffle = (invitation: MealInvitation) => {
    setShuffleInvitation(invitation);
  };

  // Invitee locked in their pick from the sender's Meal Shuffle deck —
  // next they choose the date & time on this page before it's confirmed.
  const handleShuffleConfirm = (place: PickerPlace) => {
    if (!shuffleInvitation) return;
    const inviter = mockUsers.find(user => user.id === shuffleInvitation.inviterId);

    setScheduleData({
      invitationId: shuffleInvitation.id,
      place,
      inviterId: inviter?.id ?? '',
      inviterName: inviter?.name ?? 'them',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '7:00 PM',
    });
    setScheduleDate(tomorrowNoon());
    setScheduleTime(tomorrowEvening());
    setScheduleCalendarMonth(tomorrowNoon());
    setScheduleError('');
    setShuffleInvitation(null);
  };

  const handleCancelSchedule = () => {
    setScheduleData(null);
    setScheduleError('');
  };

  // Date & Time pickers mirror the Create invitation page: same row buttons,
  // same calendar sheet on iOS/web, same hour/minute/period picker for web time.
  const formatScheduleDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatScheduleTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const scheduleIsToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const scheduleIsSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  };

  const scheduleIsPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compare = new Date(date);
    compare.setHours(0, 0, 0, 0);
    return compare < today;
  };

  const changeScheduleMonth = (direction: 'prev' | 'next') => {
    const next = new Date(scheduleCalendarMonth);
    next.setMonth(next.getMonth() + (direction === 'prev' ? -1 : 1));
    setScheduleCalendarMonth(next);
  };

  const applyScheduleDate = (date: Date) => {
    setScheduleDate(date);
    setScheduleCalendarMonth(date);
    setScheduleData(prev => (prev ? { ...prev, date: date.toISOString().split('T')[0] } : prev));
    setScheduleError('');
  };

  const handleScheduleDateChange = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowScheduleDatePicker(false);
    }
    if (selected) {
      applyScheduleDate(selected);
    }
  };

  const handleScheduleTimePickerOpen = () => {
    const hours = scheduleTime.getHours();
    setScheduleTempHour(hours % 12 || 12);
    setScheduleTempMinute(scheduleTime.getMinutes());
    setScheduleTempPeriod(hours >= 12 ? 'PM' : 'AM');
    setShowScheduleTimePicker(true);
  };

  const handleScheduleTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === 'android') {
      setShowScheduleTimePicker(false);
    }
    if (time) {
      setScheduleTime(time);
      setScheduleData(prev => (prev ? { ...prev, time: formatScheduleTime(time) } : prev));
      setScheduleError('');
    }
  };

  const handleScheduleTimeDone = () => {
    const newTime = new Date(scheduleTime);
    let hours = scheduleTempHour;
    if (scheduleTempPeriod === 'PM' && hours !== 12) {
      hours += 12;
    } else if (scheduleTempPeriod === 'AM' && hours === 12) {
      hours = 0;
    }
    newTime.setHours(hours, scheduleTempMinute, 0, 0);
    setScheduleTime(newTime);
    setScheduleData(prev => (prev ? { ...prev, time: formatScheduleTime(newTime) } : prev));
    setScheduleError('');
    setShowScheduleTimePicker(false);
  };

  const renderScheduleCalendar = () => {
    const year = scheduleCalendarMonth.getFullYear();
    const month = scheduleCalendarMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = new Date(year, month, 1).getDay();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return (
      <View style={styles.calendar}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => changeScheduleMonth('prev')} style={styles.monthButton}>
            <ChevronLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthYearText}>
            {scheduleCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => changeScheduleMonth('next')} style={styles.monthButton}>
            <ChevronRight size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.weekDaysRow}>
          {weekDays.map((day) => (
            <View key={day} style={styles.weekDayCell}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {days.map((date, index) => {
            if (!date) {
              return <View key={`empty-${index}`} style={styles.dayCell} />;
            }

            const isSelected = scheduleIsSameDay(date, scheduleDate);
            const isTodayDate = scheduleIsToday(date);
            const isPast = scheduleIsPast(date);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  isSelected && styles.selectedDayCell,
                  isTodayDate && !isSelected && styles.todayDayCell,
                ]}
                onPress={() => !isPast && applyScheduleDate(date)}
                disabled={isPast}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.selectedDayText,
                    isTodayDate && !isSelected && styles.todayDayText,
                    isPast && styles.pastDayText,
                  ]}
                >
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderScheduleTimeColumns = () => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    return (
      <View style={styles.customTimePickerContainer}>
        <View style={styles.timePickerRow}>
          <View style={styles.timePickerColumn}>
            <Text style={styles.timePickerColumnLabel}>Hour</Text>
            <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
              {hours.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[styles.timePickerItem, scheduleTempHour === hour && styles.timePickerItemSelected]}
                  onPress={() => setScheduleTempHour(hour)}
                >
                  <Text
                    style={[
                      styles.timePickerItemText,
                      scheduleTempHour === hour && styles.timePickerItemTextSelected,
                    ]}
                  >
                    {hour}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.timePickerColumn}>
            <Text style={styles.timePickerColumnLabel}>Minute</Text>
            <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
              {minutes.map((minute) => (
                <TouchableOpacity
                  key={minute}
                  style={[styles.timePickerItem, scheduleTempMinute === minute && styles.timePickerItemSelected]}
                  onPress={() => setScheduleTempMinute(minute)}
                >
                  <Text
                    style={[
                      styles.timePickerItemText,
                      scheduleTempMinute === minute && styles.timePickerItemTextSelected,
                    ]}
                  >
                    {minute.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.timePickerColumn}>
            <Text style={styles.timePickerColumnLabel}>Period</Text>
            <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
              {(['AM', 'PM'] as const).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[styles.timePickerItem, scheduleTempPeriod === period && styles.timePickerItemSelected]}
                  onPress={() => setScheduleTempPeriod(period)}
                >
                  <Text
                    style={[
                      styles.timePickerItemText,
                      scheduleTempPeriod === period && styles.timePickerItemTextSelected,
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  };

  const renderScheduleDateTimePicker = () => {
    if (Platform.OS === 'android') {
      return (
        <>
          {showScheduleDatePicker && (
            <DateTimePicker
              value={scheduleDate}
              mode="date"
              display="default"
              onChange={handleScheduleDateChange}
              minimumDate={new Date()}
            />
          )}
          {showScheduleTimePicker && (
            <DateTimePicker
              value={scheduleTime}
              mode="time"
              display="default"
              onChange={handleScheduleTimeChange}
              is24Hour={false}
            />
          )}
        </>
      );
    }

    if (showScheduleDatePicker) {
      return (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowScheduleDatePicker(false)}>
          <View style={styles.iosModalOverlay}>
            <TouchableOpacity style={styles.iosModalBackdrop} activeOpacity={1} onPress={() => setShowScheduleDatePicker(false)} />
            <View style={styles.iosModalContainer}>
              <View style={styles.iosModalHeader}>
                <TouchableOpacity onPress={() => setShowScheduleDatePicker(false)}>
                  <Text style={styles.iosModalCancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.iosModalTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowScheduleDatePicker(false)}>
                  <Text style={styles.iosModalDoneButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.calendarWrapper}>{renderScheduleCalendar()}</View>
            </View>
          </View>
        </Modal>
      );
    }

    if (showScheduleTimePicker) {
      if (Platform.OS === 'ios') {
        return (
          <Modal visible transparent animationType="slide" onRequestClose={() => setShowScheduleTimePicker(false)}>
            <View style={styles.iosModalOverlay}>
              <TouchableOpacity style={styles.iosModalBackdrop} activeOpacity={1} onPress={() => setShowScheduleTimePicker(false)} />
              <View style={styles.iosModalContainer}>
                <View style={styles.iosModalHeader}>
                  <TouchableOpacity onPress={() => setShowScheduleTimePicker(false)}>
                    <Text style={styles.iosModalCancelButton}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.iosModalTitle}>Select Time</Text>
                  <TouchableOpacity onPress={() => setShowScheduleTimePicker(false)}>
                    <Text style={styles.iosModalDoneButton}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.iosPickerWrapper}>
                  <DateTimePicker
                    value={scheduleTime}
                    mode="time"
                    display="spinner"
                    onChange={handleScheduleTimeChange}
                    textColor="#000000"
                    style={styles.iosPicker}
                  />
                </View>
              </View>
            </View>
          </Modal>
        );
      }
      return (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowScheduleTimePicker(false)}>
          <View style={styles.iosModalOverlay}>
            <TouchableOpacity style={styles.iosModalBackdrop} activeOpacity={1} onPress={() => setShowScheduleTimePicker(false)} />
            <View style={styles.iosModalContainer}>
              <View style={styles.iosModalHeader}>
                <TouchableOpacity onPress={() => setShowScheduleTimePicker(false)}>
                  <Text style={styles.iosModalCancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.iosModalTitle}>Select Time</Text>
                <TouchableOpacity onPress={handleScheduleTimeDone}>
                  <Text style={styles.iosModalDoneButton}>Done</Text>
                </TouchableOpacity>
              </View>
              {renderScheduleTimeColumns()}
            </View>
          </View>
        </Modal>
      );
    }

    return null;
  };

  // Saves the picked place together with the invitee-chosen date & time.
  const handleSaveSchedule = () => {
    if (!scheduleData) return;
    const { invitationId, place, inviterId, inviterName, date, time } = scheduleData;
    const trimmedDate = date.trim();
    const trimmedTime = time.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate) || !trimmedTime) {
      setScheduleError('Enter a date as YYYY-MM-DD and a time (e.g. 7:00 PM).');
      return;
    }
    const chosenDate = new Date(trimmedDate);

    // Setting date & time after the Meal Shuffle pick auto-accepts the
    // invitation — no separate Accept/Decline tap needed.
    updateInvitation(invitationId, {
      status: 'accepted',
      venue: {
        name: place.name,
        address: place.city,
        cuisine: 'Meal Shuffle pick',
        placeId: place.id,
      },
      pickerPickedId: place.id,
      date: chosenDate,
      time: trimmedTime,
    });

    if (inviterId) {
      const chatId = `${currentUserId}-${inviterId}`;
      const systemMessage: SystemMessage = {
        id: `system-${Date.now()}`,
        type: 'invitation_accepted',
        content: `You picked ${place.name} from ${inviterName}'s Meal Shuffle 🎴 Meeting on ${chosenDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })} at ${trimmedTime}. Fate has spoken!`,
        timestamp: new Date(),
        relatedInvitationId: invitationId,
      };
      addSystemMessage(chatId, systemMessage);
    }

    setScheduleData(null);
    setScheduleError('');
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
                  onShuffle={handleOpenShuffle}
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
        visible={!!scheduleData}
        transparent
        animationType="slide"
        onRequestClose={handleCancelSchedule}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Date & Time</Text>
            <Text style={styles.scheduleSubtitle}>
              You picked {scheduleData?.place.emoji} {scheduleData?.place.name} — when are you meeting?
            </Text>
            <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowScheduleDatePicker(true)} activeOpacity={0.7}>
              <View style={styles.dateTimeButtonContent}>
                <View style={styles.iconWrapper}>
                  <Calendar size={20} color={colors.primary} />
                </View>
                <View style={styles.dateTimeTextContainer}>
                  <Text style={styles.dateTimeLabel}>Date</Text>
                  <Text style={styles.dateTimeValue}>{formatScheduleDate(scheduleDate)}</Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateTimeButton} onPress={handleScheduleTimePickerOpen} activeOpacity={0.7}>
              <View style={styles.dateTimeButtonContent}>
                <View style={styles.iconWrapper}>
                  <Clock size={20} color={colors.primary} />
                </View>
                <View style={styles.dateTimeTextContainer}>
                  <Text style={styles.dateTimeLabel}>Time</Text>
                  <Text style={styles.dateTimeValue}>{formatScheduleTime(scheduleTime)}</Text>
                </View>
              </View>
            </TouchableOpacity>
            {!!scheduleError && <Text style={styles.scheduleError}>{scheduleError}</Text>}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelSchedule}
              >
                <Text style={[styles.modalButtonText, { color: colors.textLight }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveSchedule}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {renderScheduleDateTimePicker()}
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
                  { color: '#FFFFFF' }
                ]}>
                  {confirmData?.type === 'decline' ? 'Decline' : 'Accept'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <MealPickerModal
        visible={!!shuffleInvitation}
        places={shuffleInvitation?.pickerPlaces ?? []}
        inviteeMode
        bribeMode={false}
        mineAdded={false}
        lockedWinner={null}
        onClose={() => setShuffleInvitation(null)}
        onAddPlace={() => {}}
        onRemovePlace={() => {}}
        onPick={handleShuffleConfirm}
        onShuffleComplete={() => {}}
        onInviteePick={() => {}}
        onBribeMe={() => {}}
        onAddMine={() => {}}
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  declineButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  declineConfirmButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addressText: {
    color: colors.primary,
  },
  shufflePanel: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    padding: 12,
    marginBottom: 8,
  },
  shufflePanelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  shufflePanelText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  shuffleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pickerNote: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 24,
    marginBottom: 8,
  },
  scheduleSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  scheduleError: {
    fontSize: 12,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateTimeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimeTextContainer: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 2,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  iosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  iosModalBackdrop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iosModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  iosModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  iosModalTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#000000',
  },
  iosModalCancelButton: {
    fontSize: 17,
    color: '#888888',
  },
  iosModalDoneButton: {
    fontSize: 17,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  iosPickerWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 0,
    minHeight: 260,
  },
  iosPicker: {
    width: '100%',
    height: 260,
  },
  calendarWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 400,
  },
  calendar: {
    backgroundColor: '#FFFFFF',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  monthButton: {
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000000',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#999999',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 2,
  },
  dayCell: {
    width: '14.285%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  selectedDayCell: {
    backgroundColor: colors.primary,
    borderRadius: 24,
  },
  todayDayCell: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 24,
  },
  dayText: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '500' as const,
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  todayDayText: {
    color: colors.primary,
    fontWeight: '700' as const,
  },
  pastDayText: {
    color: '#D0D0D0',
    fontWeight: '400' as const,
  },
  customTimePickerContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 16,
    minHeight: 300,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerColumnLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666666',
    marginBottom: 12,
  },
  timePickerScroll: {
    maxHeight: 200,
  },
  timePickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 4,
  },
  timePickerItemSelected: {
    backgroundColor: colors.primary,
  },
  timePickerItemText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '500' as const,
  },
  timePickerItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
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