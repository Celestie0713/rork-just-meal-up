import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, DollarSign } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface TipSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  recipientName: string;
}

const TIP_AMOUNTS = [5, 10, 20, 50, 100];

export function TipSelectionModal({ visible, onClose, onConfirm, recipientName }: TipSelectionModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');

  const handleConfirm = () => {
    const amount = selectedAmount || parseFloat(customAmount);
    if (amount && amount > 0) {
      onConfirm(amount);
      setSelectedAmount(null);
      setCustomAmount('');
    }
  };

  const isValid = selectedAmount !== null || (customAmount && parseFloat(customAmount) > 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Send a Tip</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.textLight} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Tip the platform to view {recipientName}&apos;s decision
          </Text>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Select Amount</Text>
            
            <View style={styles.amountGrid}>
              {TIP_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.amountButton,
                    selectedAmount === amount && styles.amountButtonSelected
                  ]}
                  onPress={() => {
                    setSelectedAmount(amount);
                    setCustomAmount('');
                  }}
                >
                  <DollarSign 
                    size={20} 
                    color={selectedAmount === amount ? Colors.background : Colors.primary} 
                  />
                  <Text style={[
                    styles.amountText,
                    selectedAmount === amount && styles.amountTextSelected
                  ]}>
                    {amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[
                styles.customAmountButton,
                customAmount && styles.customAmountButtonActive
              ]}
              onPress={() => setSelectedAmount(null)}
            >
              <Text style={styles.customAmountLabel}>Custom Amount</Text>
              <View style={styles.customAmountInput}>
                <DollarSign size={18} color={Colors.textLight} />
                <Text style={styles.customAmountPlaceholder}>
                  {customAmount || 'Enter amount'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Your tip supports the platform to keep it running and helps you view their decision
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.confirmButton, !isValid && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={!isValid}
            >
              <Text style={styles.confirmButtonText}>
                Continue to Payment
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textLight,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  body: {
    padding: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  amountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    minWidth: 90,
    gap: 4,
  },
  amountButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  amountTextSelected: {
    color: Colors.background,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
  customAmountButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginBottom: 20,
  },
  customAmountButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  customAmountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  customAmountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customAmountPlaceholder: {
    fontSize: 16,
    color: Colors.textLight,
  },
  infoBox: {
    backgroundColor: '#FFF9F5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  infoText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
});
