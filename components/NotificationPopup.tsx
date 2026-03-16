import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X, Heart, Clock, User } from 'lucide-react-native';
import { router } from 'expo-router';
import { useNotifications, type Notification } from '@/hooks/use-notifications';


interface NotificationPopupProps {
  visible: boolean;
  onClose: () => void;
}

const colors = {
  primary: '#FF6B35',
  text: '#2C2C2C',
  textLight: '#666666',
  background: '#FFFFFF',
  surface: '#F8F8F8',
  success: '#4CAF50',
  warning: '#FFA726',
  premium: '#FF6600',
  pink: '#FF6B35',
} as const;

export function NotificationPopup({ visible, onClose }: NotificationPopupProps) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'match_decision':
        return <Heart size={20} color={colors.pink} fill={colors.pink} />;
      case 'new_invitation':
        return <User size={20} color={colors.primary} />;
      case 'meal_reminder':
        return <Clock size={20} color={colors.warning} />;
      default:
        return <Heart size={20} color={colors.pink} />;
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.type === 'match_decision' && notification.userId) {
      // Navigate to chat with the user who made the decision
      router.push(`/chat?userId=${notification.userId}` as any);
      onClose();
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Heart size={24} color={colors.pink} fill={colors.pink} />
              <Text style={styles.title}>Notifications</Text>
            </View>
            <View style={styles.headerRight}>
              {notifications.some(n => !n.read) && (
                <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Heart size={48} color={colors.textLight} />
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptyText}>
                  You&apos;ll see notifications here when matches make decisions or send invitations.
                </Text>
              </View>
            ) : (
              <>
                {unreadNotifications.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>New</Text>
                    {unreadNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onPress={() => handleNotificationPress(notification)}
                        formatTimeAgo={formatTimeAgo}
                        getNotificationIcon={getNotificationIcon}
                      />
                    ))}
                  </>
                )}
                {readNotifications.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Earlier</Text>
                    {readNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onPress={() => handleNotificationPress(notification)}
                        formatTimeAgo={formatTimeAgo}
                        getNotificationIcon={getNotificationIcon}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
  formatTimeAgo: (timestamp: Date) => string;
  getNotificationIcon: (type: Notification['type']) => React.ReactNode;
}

function NotificationItem({ notification, onPress, formatTimeAgo, getNotificationIcon }: NotificationItemProps) {


  return (
    <TouchableOpacity
      style={[styles.notificationItem, !notification.read && styles.unreadNotification]}
      onPress={onPress}
    >
      <View style={styles.notificationIcon}>
        {getNotificationIcon(notification.type)}
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, !notification.read && styles.unreadText]}>
          {notification.title}
        </Text>
        <Text style={styles.notificationMessage}>
          {notification.message}
        </Text>
        <Text style={styles.notificationTime}>
          {formatTimeAgo(notification.timestamp)}
        </Text>
      </View>
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  markAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  unreadNotification: {
    backgroundColor: '#FFF0E6',
    borderWidth: 1,
    borderColor: colors.pink,
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  unreadText: {
    color: colors.primary,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pink,
    marginTop: 8,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});