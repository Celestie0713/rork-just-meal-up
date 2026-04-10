import { router } from 'expo-router';

export function safeGoBack() {
  try {
    router.back();
  } catch {
    router.replace('/');
  }
}
