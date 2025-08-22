import { Tabs } from "expo-router";
import { Search, MessageCircle, Calendar, Users, CheckCircle, User } from "lucide-react-native";
import React from "react";
import { Colors } from '@/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#FFFFFF',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size, focused }) => (
            <MessageCircle 
              color={focused ? '#FFA500' : color} 
              size={size} 
            />
          ),
          tabBarActiveTintColor: '#FFA500',
        }}
      />
      <Tabs.Screen
        name="invitations"
        options={{
          title: "Invitations",
          tabBarIcon: ({ color, size }) => <CheckCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Meal Ups",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="post-meal"
        options={{
          title: "Post Meal",
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}