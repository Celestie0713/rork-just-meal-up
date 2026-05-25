import React from 'react';
import { Platform } from 'react-native';

interface Props {
  publishableKey: string;
  merchantIdentifier?: string;
  children: React.ReactNode;
}

export function StripeProviderWrapper({ publishableKey, merchantIdentifier, children }: Props) {
  if (Platform.OS === 'web') {
    return <>{children}</>;
  }
  const { StripeProvider } = require('@stripe/stripe-react-native') as typeof import('@stripe/stripe-react-native');
  return (
    <StripeProvider publishableKey={publishableKey} merchantIdentifier={merchantIdentifier}>
      {children}
    </StripeProvider>
  );
}
