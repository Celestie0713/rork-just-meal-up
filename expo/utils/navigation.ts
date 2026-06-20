import { Platform } from 'react-native';
import { router } from 'expo-router';

export function safeGoBack() {
  if (Platform.OS === 'web') {
    router.replace('/');
    return;
  }
  try {
    router.back();
  } catch {
    router.replace('/');
  }
}
