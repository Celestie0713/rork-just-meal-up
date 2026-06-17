import React from 'react';

interface Props {
  publishableKey: string;
  merchantIdentifier?: string;
  children: React.ReactNode;
}

/**
 * Passthrough wrapper — the payment flow uses web-based Stripe Checkout
 * (via expo-web-browser), not native PaymentSheet, so no native Stripe
 * provider is needed.
 */
export function StripeProviderWrapper({ children }: Props) {
  return <>{children}</>;
}
