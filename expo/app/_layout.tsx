import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StripeProviderWrapper } from "@/components/StripeProviderWrapper";
import { AuthProvider } from "@/hooks/use-auth";
import { ChatProvider } from "@/hooks/use-chat";
import { FavoritesProvider } from "@/hooks/use-favorites";
import { NotificationProvider } from "@/hooks/use-notifications";
import { InvitationsProvider } from "@/hooks/use-invitations";

import { trpc, trpcClient } from "@/lib/trpc";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Suppress the red error overlay for non-fatal runtime hiccups
LogBox.ignoreAllLogs();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="meal-up-attendees" options={{ headerShown: true }} />
      <Stack.Screen name="create-meal-up" options={{ headerShown: true }} />
      <Stack.Screen name="create-group" options={{ headerShown: true }} />
      <Stack.Screen name="chat" options={{ headerShown: true }} />
      <Stack.Screen name="create-invitation" options={{ headerShown: true }} />
      <Stack.Screen name="group-details" options={{ headerShown: true }} />
      <Stack.Screen name="meal-up-details" options={{ headerShown: true }} />
      <Stack.Screen name="user-profile" options={{ headerShown: true }} />
    </Stack>
  );
}

type ErrorHandler = (error: Error, isFatal?: boolean) => void;

type ErrorUtils = {
  getGlobalHandler: () => ErrorHandler | undefined;
  setGlobalHandler: (handler: ErrorHandler) => void;
};

export default function RootLayout() {
  useEffect(() => {
    // Catch unhandled errors outside the React tree to prevent the {} crash screen
    const g = global as typeof global & { ErrorUtils?: ErrorUtils };
    const defaultHandler = g.ErrorUtils?.getGlobalHandler();
    if (g.ErrorUtils) {
      g.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        console.log('[App] Unhandled error:', error?.message ?? 'unknown', 'isFatal:', isFatal);
        if (isFatal && defaultHandler) {
          defaultHandler(error, isFatal);
        }
      });
    }
    SplashScreen.hideAsync();
  }, []);

  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

  return (
    <StripeProviderWrapper publishableKey={publishableKey} merchantIdentifier="merchant.com.rork.app">
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationProvider>
              <InvitationsProvider>
                <ChatProvider>
                  <FavoritesProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <ErrorBoundary>
                        <RootLayoutNav />
                      </ErrorBoundary>
                    </GestureHandlerRootView>
                  </FavoritesProvider>
                </ChatProvider>
              </InvitationsProvider>
            </NotificationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </StripeProviderWrapper>
  );
}