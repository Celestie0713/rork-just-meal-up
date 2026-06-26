import { Platform } from 'react-native';
import { router } from 'expo-router';

export function safeGoBack() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/');
}
