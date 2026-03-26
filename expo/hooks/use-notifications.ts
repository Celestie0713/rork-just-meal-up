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
    const decisionText = decision === 'fight_for_fries' 
      ? 'Fight for fries for life' 
      : decision === 'next_round' 
      ? "Let's do next round" 
      : 'Buddy pass';
    
    const message = isPremiumUser 
      ? `${userName} chose "${decisionText}" for your meal at ${venue}`
      : `${userName} made a decision for your meal at ${venue}`;
    
    addNotification({
      type: 'match_decision',
      title: `${userName} made a decision!`,
      message,
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