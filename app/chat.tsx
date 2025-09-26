import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Heart } from 'lucide-react-native';
import { VoiceMessageBubble } from '@/components/VoiceMessageBubble';
import { SystemMessageBubble } from '@/components/SystemMessageBubble';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { Colors } from '@/constants/colors';
import { mockUsers } from '@/mocks/users';
import { useChat } from '@/hooks/use-chat';
import type { VoiceMessage, ChatMessage } from '@/types/user';
import { isVoiceMessage, isSystemMessage } from '@/types/user';

const mockMessages: ChatMessage[] = [
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

export default function ChatScreen() {
  const params = useLocalSearchParams<{ userId: string }>();
  const { getChatMessages, addVoiceMessage, initializeChat, isProfileMatched } = useChat();
  const currentUserId = '1';
  const chatId = `${currentUserId}-${params.userId}`;
  
  const messages = getChatMessages(chatId);
  
  const chatUser = mockUsers.find(user => user.id === params.userId);
  const isMatched = chatUser ? isProfileMatched(chatUser.id) : false;
  
  useEffect(() => {
    if (messages.length === 0) {
      initializeChat(chatId, mockMessages);
    }
  }, [chatId, initializeChat, messages.length]);
  
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
            {isMatched && (
              <TouchableOpacity 
                style={styles.loveIconContainer}
                onPress={() => router.push(`/user-profile?userId=${chatUser.id}`)}
                testID="chat-love-icon"
              >
                <Heart size={16} color="#FF1744" fill="#FF1744" />
                <Text style={styles.loveIconText}>T</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.headerSubtitle}>
            {chatUser.isOnline ? 'Online' : 'Voice messages only'}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>
      
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
  loveIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 16,
  },
  loveIconText: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    zIndex: 1,
  },
});