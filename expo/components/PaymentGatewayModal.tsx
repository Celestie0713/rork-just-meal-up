import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { X, CreditCard, Lock, CheckCircle2 } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface PaymentGatewayModalProps {
  visible: boolean;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentMethod = 'card' | 'apple' | 'google';

export function PaymentGatewayModal({ visible, amount, onClose, onSuccess }: PaymentGatewayModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiry, setExpiry] = useState<string>('');
  const [cvc, setCvc] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);

  const formatCardNumber = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length < 3) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const cardDigits = cardNumber.replace(/\s/g, '');
  const isCardValid =
    method !== 'card' ||
    (cardDigits.length === 16 && expiry.length === 5 && cvc.length >= 3 && name.trim().length > 1);

  const handlePay = async () => {
    if (!isCardValid || processing) return;
    setProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, 1600));
      setDone(true);
      await new Promise((r) => setTimeout(r, 900));
      reset();
      onSuccess();
    } catch (e) {
      console.log('Payment error', e);
      setProcessing(false);
    }
  };

  const reset = () => {
    setProcessing(false);
    setDone(false);
    setCardNumber('');
    setExpiry('');
    setCvc('');
    setName('');
    setMethod('card');
  };

  const handleClose = () => {
    if (processing) return;
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
                <TouchableOpacity onPress={handleClose} disabled={processing} style={styles.closeBtn}>
                  <X size={22} color={Colors.textLight} />
                </TouchableOpacity>
              </View>

              <View style={styles.amountCard}>
                <Text style={styles.amountLabel}>Total</Text>
                <Text style={styles.amountValue}>${amount.toFixed(2)}</Text>
              </View>

              <View style={styles.methodRow}>
                <TouchableOpacity
                  style={[styles.methodBtn, method === 'card' && styles.methodBtnActive]}
                  onPress={() => setMethod('card')}
                >
                  <CreditCard size={18} color={method === 'card' ? Colors.background : Colors.text} />
                  <Text style={[styles.methodText, method === 'card' && styles.methodTextActive]}>Card</Text>
                </TouchableOpacity>
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={[styles.methodBtn, method === 'apple' && styles.methodBtnActive]}
                    onPress={() => setMethod('apple')}
                  >
                    <Text style={[styles.methodText, method === 'apple' && styles.methodTextActive]}>
                       Pay
                    </Text>
                  </TouchableOpacity>
                )}
                {Platform.OS !== 'ios' && (
                  <TouchableOpacity
                    style={[styles.methodBtn, method === 'google' && styles.methodBtnActive]}
                    onPress={() => setMethod('google')}
                  >
                    <Text style={[styles.methodText, method === 'google' && styles.methodTextActive]}>
                      G Pay
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {method === 'card' ? (
                <View style={styles.form}>
                  <Text style={styles.label}>Card number</Text>
                  <TextInput
                    style={styles.input}
                    value={cardNumber}
                    onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="number-pad"
                    maxLength={19}
                  />
                  <View style={styles.row}>
                    <View style={styles.col}>
                      <Text style={styles.label}>Expiry</Text>
                      <TextInput
                        style={styles.input}
                        value={expiry}
                        onChangeText={(t) => setExpiry(formatExpiry(t))}
                        placeholder="MM/YY"
                        placeholderTextColor={Colors.textLight}
                        keyboardType="number-pad"
                        maxLength={5}
                      />
                    </View>
                    <View style={styles.col}>
                      <Text style={styles.label}>CVC</Text>
                      <TextInput
                        style={styles.input}
                        value={cvc}
                        onChangeText={(t) => setCvc(t.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        placeholderTextColor={Colors.textLight}
                        keyboardType="number-pad"
                        maxLength={4}
                        secureTextEntry
                      />
                    </View>
                  </View>
                  <Text style={styles.label}>Cardholder name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Name on card"
                    placeholderTextColor={Colors.textLight}
                    autoCapitalize="words"
                  />
                </View>
              ) : (
                <View style={styles.walletBox}>
                  <Text style={styles.walletText}>
                    You'll be prompted to confirm with {method === 'apple' ? 'Apple Pay' : 'Google Pay'}.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.payBtn, (!isCardValid || processing) && styles.payBtnDisabled]}
                onPress={handlePay}
                disabled={!isCardValid || processing}
              >
                {processing ? (
                  <ActivityIndicator color={Colors.background} />
                ) : (
                  <>
                    <Lock size={16} color={Colors.background} />
                    <Text style={styles.payBtnText}>Pay ${amount.toFixed(2)}</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                Payments are encrypted and securely processed.
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
  methodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  methodBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  methodText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  methodTextActive: {
    color: Colors.background,
  },
  form: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: Colors.surface ?? '#1A1A1A',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  walletBox: {
    backgroundColor: Colors.surface ?? '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  walletText: {
    color: Colors.textLight,
    fontSize: 14,
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
