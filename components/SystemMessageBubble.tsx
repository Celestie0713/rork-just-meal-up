import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Info } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import type { SystemMessage } from '@/types/user';

interface SystemMessageBubbleProps {
  message: SystemMessage;
}

export function SystemMessageBubble({ message }: SystemMessageBubbleProps) {
  const getMessageIcon = () => {
    switch (message.type) {
      case 'invitation_declined':
        return <Info size={14} color={Colors.textLight} />;
      case 'invitation_accepted':
        return <Info size={14} color={Colors.success} />;
      case 'invitation_cancelled':
        return <Info size={14} color={Colors.warning} />;
      default:
        return <Info size={14} color={Colors.textLight} />;
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.iconContainer}>
          {getMessageIcon()}
        </View>
        <View style={styles.content}>
          <Text style={styles.messageText}>{message.content}</Text>
          <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    marginRight: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
    opacity: 0.7,
  },
});