import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { X, Lock, CheckCircle2 } from 'lucide-react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';

interface PaymentGatewayModalProps {
  visible: boolean;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentGatewayModal({ visible, amount, onClose, onSuccess }: PaymentGatewayModalProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [ready, setReady] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<boolean>(false);

  const createIntent = trpc.payments.createIntent.useMutation();

  const setupPaymentSheet = useCallback(async () => {
    if (!visible || amount <= 0) return;

    setLoading(true);
    setReady(false);
    setError(null);
    setDone(false);

    try {
      const { clientSecret } = await createIntent.mutateAsync({ amount });

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Rork App',
        allowsDelayedPaymentMethods: false,
      });

      if (initError) {
        setError(initError.message);
      } else {
        setReady(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to set up payment');
    } finally {
      setLoading(false);
    }
  }, [visible, amount]);

  useEffect(() => {
    setupPaymentSheet();
  }, [setupPaymentSheet]);

  const handlePay = async () => {
    if (!ready) return;

    setLoading(true);
    setError(null);

    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {
      if (presentError.code === 'Canceled') {
        handleClose();
        return;
      }
      setError(presentError.message);
      setLoading(false);
    } else {
      setLoading(false);
      setDone(true);
      await new Promise((r) => setTimeout(r, 1200));
      reset();
      onSuccess();
    }
  };

  const reset = () => {
    setReady(false);
    setLoading(false);
    setDone(false);
    setError(null);
  };

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
                  <TouchableOpacity style={styles.retryBtn} onPress={setupPaymentSheet}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Preparing payment...</Text>
                </View>
              ) : (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    Tap below to pay securely with Stripe. Apple Pay and Google Pay are available
                    on supported devices.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.payBtn, (!ready || loading) && styles.payBtnDisabled]}
                onPress={handlePay}
                disabled={!ready || loading}
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
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    color: Colors.textLight,
    fontSize: 14,
    marginTop: 12,
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
    marginBottom: 10,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,107,0.2)',
  },
  retryText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 13,
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
