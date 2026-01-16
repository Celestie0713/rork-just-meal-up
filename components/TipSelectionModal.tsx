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

  const handleConfirm = () => {
    if (selectedAmount && selectedAmount > 0) {
      onConfirm(selectedAmount);
      setSelectedAmount(null);
    }
  };

  const isValid = selectedAmount !== null;

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
            <Text style={styles.minimumText}>Minimum $5</Text>
            
            <View style={styles.amountGrid}>
              {TIP_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.amountButton,
                    selectedAmount === amount && styles.amountButtonSelected
                  ]}
                  onPress={() => setSelectedAmount(amount)}
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

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Your tip supports the platform and helps you view their decision
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
  minimumText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 16,
    textAlign: 'center',
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
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
