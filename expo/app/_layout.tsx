import Head from "expo-router/head";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StripeProviderWrapper } from "@/components/StripeProviderWrapper";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ChatProvider } from "@/hooks/use-chat";
import { FavoritesProvider } from "@/hooks/use-favorites";
import { NotificationProvider } from "@/hooks/use-notifications";
import { InvitationsProvider } from "@/hooks/use-invitations";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/** PWA: install the service worker so the web app works offline and is
 * installable. Web-only — no-ops on iOS/Android. */
function useServiceWorker() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);
}

/** PWA metadata: manifest, icons, theme color, and iOS home-screen tags.
 * Rendered only on web — native builds ignore <Head>. */
function PwaHead() {
  if (Platform.OS !== "web") return null;
  return (
    <Head>
      <title>Just Meal Up</title>
      <meta name="theme-color" content="#FF6B35" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="icon" href="/pwa-icon-192.png" />
      <link rel="apple-touch-icon" href="/pwa-icon-192.png" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Meal Up" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </Head>
  );
}

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Auth gate: send unauthenticated users to /signup (unless they're already there)
  useEffect(() => {
    if (isLoading) return;
    const inSignupRoute = segments[0] === "signup";
    if (!user && !inSignupRoute) {
      router.replace("/signup");
    } else if (user && inSignupRoute) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000000", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!user) {
    // Only render the signup route when not authenticated.
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="signup" options={{ headerShown: false }} />
      </Stack>
    );
  }

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
      <Stack.Screen name="withdrawal" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useServiceWorker();

  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

  return (
    <StripeProviderWrapper publishableKey={publishableKey} merchantIdentifier="merchant.com.rork.app">
      <PwaHead />
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
    </StripeProviderWrapper>
  );
}
