import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { DollarSign, Heart } from 'lucide-react-native';

interface PlatformTipsPopupProps {
  visible: boolean;
  onComplete: (amount: number) => void;
}

const colors = {
  primary: '#FF6B35',
  text: '#FFFFFF',
  textLight: '#CCCCCC',
  background: '#000000',
  surface: '#1A1A1A',
  success: '#4CAF50',
  error: '#EF5350',
  border: '#333333',
} as const;

const PRESET_AMOUNTS = [5, 10, 20, 50];
const MINIMUM_TIP = 5;

export function PlatformTipsPopup({ visible, onComplete }: PlatformTipsPopupProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [error, setError] = useState<string>('');

  const handlePresetSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount('');
    setError('');
  };

  const handleCustomAmountChange = (text: string) => {
    setIsCustom(true);
    setCustomAmount(text);
    setError('');
    
    const numValue = parseFloat(text);
    if (!isNaN(numValue)) {
      setSelectedAmount(numValue);
    }
  };

  const handleContinue = () => {
    const amount = isCustom ? parseFloat(customAmount) : selectedAmount;
    
    if (isNaN(amount) || amount < MINIMUM_TIP) {
      setError(`Minimum tip is $${MINIMUM_TIP}`);
      return;
    }
    
    onComplete(amount);
  };

  const currentAmount = isCustom ? parseFloat(customAmount) : selectedAmount;
  const isValidAmount = !isNaN(currentAmount) && currentAmount >= MINIMUM_TIP;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <Heart size={48} color={colors.primary} fill={colors.primary} />
          </View>
          <Text style={styles.title}>Support the Platform</Text>
          <Text style={styles.subtitle}>
            Help us keep connecting food lovers!{'\n'}
            Minimum tip: ${MINIMUM_TIP}
          </Text>
          <View style={styles.presetContainer}>
            {PRESET_AMOUNTS.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.presetButton,
                  !isCustom && selectedAmount === amount && styles.presetButtonActive
                ]}
                onPress={() => handlePresetSelect(amount)}
              >
                <Text style={[
                  styles.presetButtonText,
                  !isCustom && selectedAmount === amount && styles.presetButtonTextActive
                ]}>
                  ${amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.customInputContainer}>
            <DollarSign size={20} color={colors.textLight} style={styles.dollarIcon} />
            <TextInput
              style={[styles.customInput, isCustom && styles.customInputActive]}
              placeholder="Custom amount"
              placeholderTextColor={colors.textLight}
              keyboardType="decimal-pad"
              value={customAmount}
              onChangeText={handleCustomAmountChange}
              onFocus={() => setIsCustom(true)}
            />
          </View>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          <TouchableOpacity
            style={[
              styles.continueButton,
              !isValidAmount && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!isValidAmount}
          >
            <Text style={styles.continueButtonText}>
              Continue with ${isValidAmount ? currentAmount.toFixed(2) : '0.00'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.disclaimer}>
            This tip goes directly to supporting the platform.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  presetContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  presetButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textLight,
  },
  presetButtonTextActive: {
    color: colors.text,
  },
  customInputContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 24,
  },
  dollarIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },
  customInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 16,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 18,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
    fontWeight: '600',
  },
  customInputActive: {
    borderColor: colors.primary,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  continueButton: {
    width: '100%',
    backgroundColor: colors.success,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
});
