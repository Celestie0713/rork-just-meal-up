import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';

export type NotificationType = 'match_decision' | 'new_invitation' | 'meal_reminder' | 'mixed_signals';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId?: string;
  mealId?: string;
  timestamp: Date;
  read: boolean;
}

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    console.log('Added notification:', newNotification);
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const addMatchDecisionNotification = useCallback((userName: string, decision: string, venue: string, userId: string, mealId: string, isPremiumUser: boolean) => {
    addNotification({
      type: 'match_decision',
      title: 'Make your decision before the timer runs out!',
      message: `Your date at ${venue} is waiting for your decision.`,
      userId,
      mealId
    });
  }, [addNotification]);

  const addMixedSignalsNotification = useCallback((userName: string, venue: string, userId: string, mealId: string) => {
    addNotification({
      type: 'mixed_signals',
      title: 'Mixed Signals!',
      message: `Mixed signal with ${userName}. One chooses all in versus the other wants to go for the next round. Last 24 hours to decide again.`,
      userId,
      mealId
    });
  }, [addNotification]);

  return useMemo(() => ({
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    addMatchDecisionNotification,
    addMixedSignalsNotification
  }), [notifications, addNotification, markAsRead, markAllAsRead, getUnreadCount, addMatchDecisionNotification, addMixedSignalsNotification]);
});