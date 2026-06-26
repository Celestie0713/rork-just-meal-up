import { router } from 'expo-router';

/** Navigate back safely — router.back() falls back to root when history is empty. */
export function safeGoBack() {
  router.back();
}
