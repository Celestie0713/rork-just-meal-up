// ── Global error handler (MUST run at module level, before any React code) ──
// Prevents the opaque {} crash screen from appearing when native modules
// throw unserializable errors in the cloud simulator.
(() => {
  const g = global as typeof global & {
    ErrorUtils?: {
      setGlobalHandler: (h: (e: unknown, f?: boolean) => void) => void;
    };
  };
  if (g.ErrorUtils) {
    const prev = (g.ErrorUtils as any)._globalHandler;
    g.ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
      // Extract a readable message — {} errors are non-Error objects that
      // JSON.stringify fails on because they contain circular refs or
      // non-serializable native handles.
      let msg = 'unknown error';
      try {
        if (error instanceof Error) {
          msg = error.message || error.name || 'Error';
        } else if (typeof error === 'string') {
          msg = error;
        } else if (error && typeof error === 'object') {
          // Try to get something readable without blowing up
          msg = (error as any).message ?? (error as any).name ?? JSON.stringify(error).slice(0, 200);
        }
      } catch {
        msg = '[unserializable error]';
      }
      console.log('[App] Unhandled error (suppressed):', msg);
      // Call previous handler if it exists (for debugging)
      if (prev) {
        try { prev(error, isFatal); } catch { /* swallow */ }
      }
    });
  }
})();

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

export default function RootLayout() {
  useEffect(() => {
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