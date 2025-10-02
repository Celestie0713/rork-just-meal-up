import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';

export type NotificationType = 'match_decision' | 'new_invitation' | 'meal_reminder';

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
  const [notifications, setNotifications] = useState<Notification[]>([
    // Mock notification for Sofia Kim making a decision
    {
      id: '1',
      type: 'match_decision',
      title: 'Sofia Kim made a decision!',
      message: 'Sofia chose "Fight for fries for life" for your dinner at Olive Garden',
      userId: '5',
      mealId: '7',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: false
    }
  ]);

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

  const addMatchDecisionNotification = useCallback((userName: string, decision: string, venue: string, userId: string, mealId: string, isPremium: boolean) => {
    const decisionText = decision === 'fight_for_fries' 
      ? 'Fight for fries for life' 
      : decision === 'next_round' 
      ? "Let's do next round" 
      : 'Buddy pass';
    
    const message = isPremium 
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

  return useMemo(() => ({
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    addMatchDecisionNotification
  }), [notifications, addNotification, markAsRead, markAllAsRead, getUnreadCount, addMatchDecisionNotification]);
});