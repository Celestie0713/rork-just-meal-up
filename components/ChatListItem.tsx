import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

import { getCurrentUserLoveMatch, subscribeLoveMatchChanges } from '@/mocks/post-date-responses';

import type { User } from '@/types/user';

interface ChatListItemProps {
  user: User;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  onPress: () => void;
}

export function ChatListItem({ user, lastMessage, lastMessageTime, unreadCount = 0, onPress }: ChatListItemProps) {
  const [loveMatchUserId, setLoveMatchUserId] = React.useState<string | null>(getCurrentUserLoveMatch());
  
  // Subscribe to love match changes
  React.useEffect(() => {
    const unsubscribe = subscribeLoveMatchChanges(() => {
      setLoveMatchUserId(getCurrentUserLoveMatch());
    });
    return unsubscribe;
  }, []);
  
  // Check if this user is the one the current user has a love match with
  const hasLoveMatch = loveMatchUserId === user.id;
  
  const handleLoveIconPress = () => {
    // Navigate to this user's profile since they are the love match
    router.push({
      pathname: '/user-profile',
      params: { userId: user.id }
    });
  };
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else if (days < 7) {
      return `${days}d`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };
  
  const getStatusColor = () => {
    if (user.isOnline) return Colors.success;
    return Colors.textLight;
  };
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: user.photos[0] }} style={styles.avatar} />
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
          {lastMessageTime && (
            <Text style={styles.time}>{formatTime(lastMessageTime)}</Text>
          )}
        </View>
        
        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage || 'No messages yet'}
          </Text>
          <View style={styles.rightSection}>
            {hasLoveMatch && (
              <TouchableOpacity 
                style={styles.loveIcon} 
                onPress={handleLoveIconPress}
                testID={`chat-love-icon-${user.id}`}
              >
                <Heart size={16} color="#FF69B4" fill="#FF69B4" />
              </TouchableOpacity>
            )}
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },

  time: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textLight,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.background,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loveIcon: {
    backgroundColor: 'rgba(255, 105, 180, 0.1)',
    borderRadius: 12,
    padding: 4,
  },
});