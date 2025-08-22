import { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import type { ChatMessage, VoiceMessage, SystemMessage } from '@/types/user';

type ChatState = {
  [chatId: string]: ChatMessage[];
};

export const [ChatProvider, useChat] = createContextHook(() => {
  const [chats, setChats] = useState<ChatState>({});

  const addVoiceMessage = useCallback((chatId: string, message: VoiceMessage) => {
    setChats(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message]
    }));
  }, []);

  const addSystemMessage = useCallback((chatId: string, message: SystemMessage) => {
    setChats(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message]
    }));
  }, []);

  const getChatMessages = useCallback((chatId: string): ChatMessage[] => {
    return chats[chatId] || [];
  }, [chats]);

  const initializeChat = useCallback((chatId: string, initialMessages: ChatMessage[]) => {
    setChats(prev => ({
      ...prev,
      [chatId]: initialMessages
    }));
  }, []);

  return useMemo(() => ({
    addVoiceMessage,
    addSystemMessage,
    getChatMessages,
    initializeChat
  }), [addVoiceMessage, addSystemMessage, getChatMessages, initializeChat]);
});