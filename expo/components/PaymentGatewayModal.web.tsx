import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { X, Lock, CheckCircle2 } from 'lucide-react-native';
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
 * Web Stripe Checkout flow.
 * Opens Stripe's hosted checkout in a popup window and polls the Cloudflare
 * Worker backend for the session's payment status until it completes.
 */
export function PaymentGatewayModal({ visible, amount, onClose, onSuccess }: PaymentGatewayModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const popupRef = useRef<Window | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    setLoading(false);
    setDone(false);
    setError(null);
    setCheckoutUrl(null);
    sessionIdRef.current = null;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }
    if (popupRef.current && !popupRef.current.closed) {
      try {
        popupRef.current.close();
      } catch {}
    }
    popupRef.current = null;
    setRetryCount(0);
  }, []);

  useEffect(() => {
    if (!visible) reset();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [visible, reset]);

  const startPolling = useCallback(
    (sessionId: string, popup: Window | null) => {
      pollRef.current = setInterval(async () => {
        try {
          if (popup && popup.closed) {
            const status = await getCheckoutSession(sessionId);
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            if (status.paymentStatus === 'paid') {
              setLoading(false);
              setDone(true);
              await new Promise((r) => setTimeout(r, 1200));
              onSuccess();
              reset();
            } else {
              setLoading(false);
            }
            return;
          }

          const status = await getCheckoutSession(sessionId);
          if (status.paymentStatus === 'paid') {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            if (popup) {
              try {
                popup.close();
              } catch {}
            }
            setLoading(false);
            setDone(true);
            await new Promise((r) => setTimeout(r, 1200));
            onSuccess();
            reset();
          }
        } catch (err) {
          console.log('[PaymentGatewayModal.web] poll error', err);
        }
      }, 1500);
    },
    [onSuccess, reset]
  );

  /** Attempt to create a Stripe Checkout session with exponential backoff (max 3 retries). */
  const attemptCreateSession = useCallback(
    async (attempt: number, popup: Window | null, origin: string): Promise<void> => {
      const MAX_RETRIES = 3;
      const BASE_DELAY = 1000; // 1s → 2s → 4s

      if (attempt > MAX_RETRIES) {
        setLoading(false);
        setRetryCount(0);
        if (popup && !popup.closed) {
          try { popup.close(); } catch {}
        }
        setError("Couldn't reach the payment server. Please check your connection and try again.");
        return;
      }

      setRetryCount(attempt);

      try {
        const successUrl = `${origin}/?stripe=success`;
        const cancelUrl = `${origin}/?stripe=cancel`;

        const { url, sessionId } = await createCheckoutSession({
          amount,
          successUrl,
          cancelUrl,
          description: `Tip $${amount.toFixed(2)}`,
        });

        sessionIdRef.current = sessionId;
        setCheckoutUrl(url);
        setRetryCount(0);

        if (popup && !popup.closed) {
          try {
            popup.location.href = url;
          } catch {
            // Cross-origin write may fail in some browsers; show fallback link
          }
        }

        startPolling(sessionId, popup);
      } catch (e) {
        console.log(`[PaymentGatewayModal.web] attempt ${attempt} failed`, e);
        const msg = e instanceof Error ? e.message : String(e);
        const isRetriable = /failed to fetch|networkerror|load failed|timeout|502|503|504/i.test(msg);

        if (isRetriable && attempt < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, attempt - 1);
          retryRef.current = setTimeout(() => {
            attemptCreateSession(attempt + 1, popup, origin);
          }, delay);
        } else {
          if (popup && !popup.closed) {
            try { popup.close(); } catch {}
          }
          setLoading(false);
          setRetryCount(0);
          const isNetwork = /failed to fetch|networkerror|load failed/i.test(msg);
          setError(
            isNetwork
              ? "Couldn't reach the payment server. Please check your connection and try again."
              : msg || 'Failed to open payment'
          );
        }
      }
    },
    [amount, startPolling]
  );

  const handlePay = useCallback(async () => {
    if (amount <= 0) return;
    setLoading(true);
    setError(null);
    setRetryCount(0);

    // Open popup SYNCHRONOUSLY in the click handler so browsers don't block it.
    const popup = typeof window !== 'undefined'
      ? window.open('about:blank', 'stripe-checkout', 'width=480,height=720')
      : null;
    if (popup) popupRef.current = popup;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    attemptCreateSession(1, popup, origin);
  }, [amount, attemptCreateSession]);

  const handleOpenInNewTab = useCallback(() => {
    if (!checkoutUrl) return;
    const w = window.open(checkoutUrl, '_blank');
    if (w) popupRef.current = w;
    if (sessionIdRef.current && !pollRef.current) {
      startPolling(sessionIdRef.current, w);
    }
  }, [checkoutUrl, startPolling]);

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
                    {retryCount > 0
                      ? `Connecting to payment server... (attempt ${retryCount})`
                      : loading
                        ? 'Complete your payment in the Stripe window. This page will update automatically.'
                        : "Tap below to open Stripe's secure checkout. Pay with card, Apple Pay, Google Pay, or Link."}
                  </Text>
                </View>
              )}

              {checkoutUrl && loading ? (
                <TouchableOpacity onPress={handleOpenInNewTab} style={styles.linkBtn} testID="reopen-checkout">
                  <Text style={styles.linkBtnText}>Checkout window didn't open? Open in new tab</Text>
                </TouchableOpacity>
              ) : null}

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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  closeBtn: { padding: 4 },
  amountCard: {
    backgroundColor: Colors.surface ?? '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: { fontSize: 14, color: Colors.textLight, fontWeight: '600' },
  amountValue: { fontSize: 26, fontWeight: '800', color: Colors.primary },
  infoBox: {
    backgroundColor: Colors.surface ?? '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: { color: Colors.textLight, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  errorBox: {
    backgroundColor: '#2D1B1B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: { color: '#FF6B6B', fontSize: 13, textAlign: 'center' },
  payBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: Colors.background, fontSize: 16, fontWeight: '700' },
  disclaimer: { fontSize: 11, color: Colors.textLight, textAlign: 'center', marginTop: 12 },
  successWrap: { alignItems: 'center', paddingVertical: 32 },
  successTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 16 },
  successSub: { fontSize: 15, color: Colors.textLight, marginTop: 6 },
  linkBtn: { paddingVertical: 10, alignItems: 'center' },
  linkBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
});
