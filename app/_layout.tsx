import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/hooks/use-auth";
import { ChatProvider } from "@/hooks/use-chat";
import { FavoritesProvider } from "@/hooks/use-favorites";
import { NotificationProvider } from "@/hooks/use-notifications";
import { InvitationsProvider } from "@/hooks/use-invitations";

import { trpc, trpcClient } from "@/lib/trpc";


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="meal-up-attendees" options={{ headerShown: true }} />
      <Stack.Screen name="create-meal-up" options={{ headerShown: true }} />

    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
            <InvitationsProvider>
              <ChatProvider>
                <FavoritesProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <RootLayoutNav />
                  </GestureHandlerRootView>
                </FavoritesProvider>
              </ChatProvider>
            </InvitationsProvider>
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}