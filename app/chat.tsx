import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { VoiceMessageBubble } from '@/components/VoiceMessageBubble';
import { SystemMessageBubble } from '@/components/SystemMessageBubble';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { Colors } from '@/constants/colors';
import { mockUsers } from '@/mocks/users';
import { useChat } from '@/hooks/use-chat';
import type { VoiceMessage, ChatMessage } from '@/types/user';
import { isVoiceMessage, isSystemMessage } from '@/types/user';

const getMockMessagesForUser = (userId: string): ChatMessage[] => {
  if (userId === '4') {
    return [
      {
        id: '1',
        senderId: '4',
        receiverId: '1',
        audioUrl: 'mock-url-1',
        duration: 15,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '2',
        senderId: '1',
        receiverId: '4',
        audioUrl: 'mock-url-2',
        duration: 23,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '3',
        senderId: '4',
        receiverId: '1',
        audioUrl: 'mock-url-3',
        duration: 18,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '4',
        senderId: '1',
        receiverId: '4',
        audioUrl: 'mock-url-4',
        duration: 12,
        timestamp: new Date(Date.now() - 150 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '5',
        senderId: '4',
        receiverId: '1',
        audioUrl: 'mock-url-5',
        duration: 20,
        timestamp: new Date(Date.now() - 120 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '6',
        senderId: '1',
        receiverId: '4',
        audioUrl: 'mock-url-6',
        duration: 16,
        timestamp: new Date(Date.now() - 90 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '7',
        senderId: '4',
        receiverId: '1',
        audioUrl: 'mock-url-7',
        duration: 14,
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '8',
        senderId: '1',
        receiverId: '4',
        audioUrl: 'mock-url-8',
        duration: 22,
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '9',
        senderId: '4',
        receiverId: '1',
        audioUrl: 'mock-url-9',
        duration: 10,
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '10',
        senderId: '1',
        receiverId: '4',
        audioUrl: 'mock-url-10',
        duration: 25,
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
        isPlayed: true,
      },
      {
        id: '11',
        senderId: '4',
        receiverId: '1',
        audioUrl: 'mock-url-11',
        duration: 8,
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        isPlayed: false,
      },
    ];
  }
  
  return [
    {
      id: '1',
      senderId: '2',
      receiverId: '1',
      audioUrl: 'mock-url-1',
      duration: 15,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isPlayed: true,
    },
    {
      id: '2',
      senderId: '1',
      receiverId: '2',
      audioUrl: 'mock-url-2',
      duration: 23,
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      isPlayed: true,
    },
    {
      id: '3',
      senderId: '2',
      receiverId: '1',
      audioUrl: 'mock-url-3',
      duration: 8,
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isPlayed: false,
    },
  ];
};

export default function ChatScreen() {
  const params = useLocalSearchParams<{ userId: string }>();
  const { getChatMessages, addVoiceMessage, initializeChat } = useChat();
  const currentUserId = '1';
  const chatId = `${currentUserId}-${params.userId}`;
  
  const messages = getChatMessages(chatId);
  
  const voiceMessageCount = useMemo(() => {
    return messages.filter(msg => isVoiceMessage(msg)).length;
  }, [messages]);
  
  const chatUser = mockUsers.find(user => user.id === params.userId);
  
  useEffect(() => {
    if (messages.length === 0) {
      const mockMessages = getMockMessagesForUser(params.userId || '');
      initializeChat(chatId, mockMessages);
    }
  }, [chatId, initializeChat, messages.length, params.userId]);
  
  if (!chatUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSendVoiceMessage = (duration: number, audioUri?: string) => {
    const newMessage: VoiceMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      receiverId: chatUser.id,
      audioUrl: audioUri || 'mock-new-url',
      duration,
      timestamp: new Date(),
      isPlayed: false,
    };
    
    addVoiceMessage(chatId, newMessage);
    console.log('Voice message sent:', duration, 'seconds', audioUri ? 'with audio file' : 'simulated');
  };

  const handleCancelRecording = () => {
    console.log('Recording cancelled');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (isSystemMessage(item)) {
      return <SystemMessageBubble message={item} />;
    }
    
    if (isVoiceMessage(item)) {
      return (
        <VoiceMessageBubble
          message={item}
          isOwn={item.senderId === currentUserId}
          senderName={item.senderId !== currentUserId ? chatUser.name : undefined}
        />
      );
    }
    
    return null;
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <TouchableOpacity 
              onPress={() => router.push(`/user-profile?userId=${chatUser.id}`)}
              testID="chat-header-name"
            >
              <Text style={[styles.headerTitle, styles.clickableHeaderTitle]}>{chatUser.name}</Text>
            </TouchableOpacity>

          </View>
          <Text style={styles.headerSubtitle}>
            {chatUser.isOnline ? 'Online' : 'Voice messages only'}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>
      
      {voiceMessageCount > 10 && (
        <View style={styles.inviteContainer}>
          <TouchableOpacity 
            style={styles.inviteButton}
            onPress={() => router.push('/places')}
          >
            <Text style={styles.inviteButtonText}>Invite to eat</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />
      
      <View style={styles.inputContainer}>
        <VoiceRecorder
          onSend={handleSendVoiceMessage}
          onCancel={handleCancelRecording}
        />
      </View>
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
  clickableHeaderTitle: {
    color: Colors.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },
  inviteContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  inviteButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
});