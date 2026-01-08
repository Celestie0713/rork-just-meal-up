import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '@/constants/colors';
import { getCurrencyFromAddress } from '@/constants/currencies';
import { GenerousBadge } from '@/components/GenerousBadge';


interface TipPopupProps {
  visible: boolean;
  onClose: () => void;
  onSendWithTip: (tipAmount: number) => void;
  onNoThanks?: () => void;
  userLocation?: string;
  mandatory?: boolean;
  minimumAmount?: number;
}

const { width } = Dimensions.get('window');

export function TipPopup({ visible, onClose, onSendWithTip, onNoThanks, userLocation, mandatory = false, minimumAmount = 5 }: TipPopupProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [tipAmount, setTipAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const currency = getCurrencyFromAddress(userLocation || '');

  console.log('[TipPopup] Component rendered with visible:', visible, 'mandatory:', mandatory);

  useEffect(() => {
    console.log('[TipPopup useEffect] visible changed to:', visible);
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleClose = () => {
    if (mandatory) {
      console.log('[TipPopup] Cannot close - mandatory tip required');
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTipAmount('');
      setError('');
      onClose();
    });
  };

  const handleNoThanks = () => {
    if (mandatory) {
      console.log('[TipPopup] Cannot skip - mandatory tip required');
      setError(`Minimum tip of ${currency}${minimumAmount} is required to continue`);
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTipAmount('');
      setError('');
      if (onNoThanks) {
        onNoThanks();
      }
    });
  };

  const handleSendWithTip = () => {
    const amount = parseFloat(tipAmount) || 0;
    
    if (amount < minimumAmount) {
      setError(`Minimum tip amount is ${currency}${minimumAmount}`);
      console.log('[TipPopup] Tip amount too low:', amount, 'Minimum:', minimumAmount);
      return;
    }
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTipAmount('');
      setError('');
      onSendWithTip(amount);
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={handleClose}
        disabled={mandatory}
      />
      <Animated.View
        style={[
          styles.popup,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <GenerousBadge size="large" />
        </View>
        {mandatory ? (
          <Text style={styles.message}>
            🎉 Your invitation was accepted! A minimum tip of {currency}{minimumAmount} is required to show appreciation and unlock the app.
          </Text>
        ) : (
          <Text style={styles.message}>
            Drop a tip and flex a generous badge on your invite—so they instantly know you&apos;re a rare catch 🤩
          </Text>
        )}
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            {mandatory ? `Enter tip amount (minimum ${currency}${minimumAmount})` : 'Enter tip amount'}
          </Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencySymbol}>{currency}</Text>
            <TextInput
              style={styles.input}
              value={tipAmount}
              onChangeText={(text) => {
                setTipAmount(text);
                setError('');
              }}
              placeholder={minimumAmount.toFixed(2)}
              placeholderTextColor={Colors.textLight}
              keyboardType="decimal-pad"
            />
          </View>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleSendWithTip} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              {mandatory ? 'Pay tip & continue' : 'Send with tip'}
            </Text>
          </TouchableOpacity>
          {!mandatory && (
            <TouchableOpacity onPress={handleNoThanks} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>No thanks</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  popup: {
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 20,
    maxWidth: width * 0.85,
    width: width * 0.85,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
    padding: 0,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginTop: 8,
    fontWeight: '500',
  },
});
