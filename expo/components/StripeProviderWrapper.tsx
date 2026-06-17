import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';

interface Props {
  publishableKey: string;
  merchantIdentifier?: string;
  children: React.ReactElement | React.ReactElement[];
}

let StripeProvider: React.ComponentType<any> | null = null;
let initFailed = false;

export function StripeProviderWrapper({ publishableKey, merchantIdentifier, children }: Props) {
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'web' || initFailed) {
      setReady(true);
      return;
    }

    try {
      const mod = require('@stripe/stripe-react-native') as typeof import('@stripe/stripe-react-native');
      StripeProvider = mod.StripeProvider;
    } catch {
      initFailed = true;
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  if (Platform.OS === 'web' || !StripeProvider) {
    return <>{children}</>;
  }

  const Provider = StripeProvider;
  return (
    <Provider publishableKey={publishableKey} merchantIdentifier={merchantIdentifier}>
      {children}
    </Provider>
  );
}
