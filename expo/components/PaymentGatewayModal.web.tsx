import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { X, Lock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface PaymentGatewayModalProps {
  visible: boolean;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentGatewayModal({ visible, amount, onClose }: PaymentGatewayModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Lock size={18} color={Colors.textLight} />
              <Text style={styles.headerTitle}>Payments unavailable on web</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={Colors.textLight} />
            </TouchableOpacity>
          </View>
          <Text style={styles.body}>
            Stripe payments are only available in the mobile app. Open this on iOS or Android to
            pay ${amount.toFixed(2)}.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>OK</Text>
          </TouchableOpacity>
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
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  closeBtn: { padding: 4 },
  body: {
    color: Colors.textLight,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
});
