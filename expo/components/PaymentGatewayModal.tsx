import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { X, Lock, CheckCircle2 } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '@/constants/colors';

const BACKEND_URL = process.env.EXPO_PUBLIC_RORK_FUNCTIONS_URL!;

interface PaymentGatewayModalProps {
  visible: boolean;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

async function createCheckoutSession(input: {
  amount: number;
  successUrl: string;
  cancelUrl: string;
  description?: string;
}): Promise<{ url: string; sessionId: string }> {
  const res = await fetch(`${BACKEND_URL}/checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error(typeof body.error === 'string' ? body.error : `Server error ${res.status}`);
  }

  return res.json() as Promise<{ url: string; sessionId: string }>;
}

async function getCheckoutSession(sessionId: string): Promise<{
  paymentStatus: string;
  status: string;
  amountTotal: number | null;
}> {
  const res = await fetch(
    `${BACKEND_URL}/checkout-session?sessionId=${encodeURIComponent(sessionId)}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to verify payment (${res.status})`);
  }

  return res.json() as Promise<{
    paymentStatus: string;
    status: string;
    amountTotal: number | null;
  }>;
}

/**
 * Cross-platform Stripe payment modal.
 * Uses Stripe Checkout via the Cloudflare Worker backend and expo-web-browser,
 * so it works in Rork's cloud simulator, Expo Go, real devices, and web.
 */
export function PaymentGatewayModal({ visible, amount, onClose, onSuccess }: PaymentGatewayModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<boolean>(false);

  const reset = useCallback(() => {
    setLoading(false);
    setDone(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (!visible) reset();
  }, [visible, reset]);

  const handlePay = useCallback(async () => {
    if (amount <= 0) return;
    setLoading(true);
    setError(null);

    try {
      const successUrl = Linking.createURL('stripe-success');
      const cancelUrl = Linking.createURL('stripe-cancel');

      const { url, sessionId } = await createCheckoutSession({
        amount,
        successUrl,
        cancelUrl,
        description: `Tip $${amount.toFixed(2)}`,
      });

      const result = await WebBrowser.openAuthSessionAsync(url, successUrl);

      if (result.type !== 'success') {
        setLoading(false);
        return;
      }

      // Verify payment server-side
      const status = await getCheckoutSession(sessionId);

      if (status.paymentStatus === 'paid') {
        setLoading(false);
        setDone(true);
        await new Promise((r) => setTimeout(r, 1200));
        onSuccess();
        reset();
      } else {
        setError('Payment was not completed. Please try again.');
        setLoading(false);
      }
    } catch (e) {
      console.log('[PaymentGatewayModal] error', e);
      setError(e instanceof Error ? e.message : 'Failed to open payment');
      setLoading(false);
    }
  }, [amount, onSuccess, reset]);

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {done ? (
            <View style={styles.successWrap}>
              <CheckCircle2 size={72} color={Colors.primary} />
              <Text style={styles.successTitle}>Payment Successful</Text>
              <Text style={styles.successSub}>${amount.toFixed(2)} charged</Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Lock size={18} color={Colors.textLight} />
                  <Text style={styles.headerTitle}>Secure Checkout</Text>
                </View>
                <TouchableOpacity onPress={handleClose} disabled={loading} style={styles.closeBtn}>
                  <X size={22} color={Colors.textLight} />
                </TouchableOpacity>
              </View>

              <View style={styles.amountCard}>
                <Text style={styles.amountLabel}>Total</Text>
                <Text style={styles.amountValue}>${amount.toFixed(2)}</Text>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    Tap below to open Stripe&apos;s secure checkout page. Pay with card, Apple Pay,
                    Google Pay, or Link.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.payBtn, loading && styles.payBtnDisabled]}
                onPress={handlePay}
                disabled={loading}
                testID="pay-button"
              >
                {loading ? (
                  <ActivityIndicator color={Colors.background} />
                ) : (
                  <>
                    <Lock size={16} color={Colors.background} />
                    <Text style={styles.payBtnText}>Pay ${amount.toFixed(2)}</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                Payments are encrypted and securely processed by Stripe.
              </Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  amountCard: {
    backgroundColor: Colors.surface ?? '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
  },
  infoBox: {
    backgroundColor: Colors.surface ?? '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    color: Colors.textLight,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#2D1B1B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    textAlign: 'center',
  },
  payBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payBtnDisabled: {
    opacity: 0.5,
  },
  payBtnText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 12,
  },
  successWrap: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 16,
  },
  successSub: {
    fontSize: 15,
    color: Colors.textLight,
    marginTop: 6,
  },
});
