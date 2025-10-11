import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '@/constants/colors';
import { getCurrencyFromAddress } from '@/constants/currencies';


interface TipPopupProps {
  visible: boolean;
  onClose: () => void;
  onSendWithTip: (tipAmount: number) => void;
  onNoThanks: () => void;
  userLocation?: string;
}

const { width } = Dimensions.get('window');

export function TipPopup({ visible, onClose, onSendWithTip, onNoThanks, userLocation }: TipPopupProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [tipAmount, setTipAmount] = useState<string>('');
  const currency = getCurrencyFromAddress(userLocation || '');

  console.log('[TipPopup] Component rendered with visible:', visible);

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
      onClose();
    });
  };

  const handleNoThanks = () => {
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
      onNoThanks();
    });
  };

  const handleSendWithTip = () => {
    const amount = parseFloat(tipAmount) || 0;
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
          <View style={styles.heartBadge}>
            <View style={styles.heartShape}>
              <View style={styles.heartLeft} />
              <View style={styles.heartRight} />
              <View style={styles.heartBottom} />
            </View>
            <Text style={styles.dollarSign}>$</Text>
          </View>
        </View>
        <Text style={styles.message}>
          Drop a tip and flex a generous badge on your invite—so they instantly know you&apos;re a rare catch 🤩
        </Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Enter tip amount (optional)</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencySymbol}>{currency}</Text>
            <TextInput
              style={styles.input}
              value={tipAmount}
              onChangeText={setTipAmount}
              placeholder="0.00"
              placeholderTextColor={Colors.textLight}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleSendWithTip} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Send with tip</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNoThanks} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>No thanks</Text>
          </TouchableOpacity>
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
  heartBadge: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heartShape: {
    position: 'absolute',
    width: 120,
    height: 120,
  },
  heartLeft: {
    position: 'absolute',
    top: 18,
    left: 24,
    width: 36,
    height: 58,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: '#FF1744',
    transform: [{ rotate: '-45deg' }],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  heartRight: {
    position: 'absolute',
    top: 18,
    left: 60,
    width: 36,
    height: 58,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: '#FF1744',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  heartBottom: {
    position: 'absolute',
    top: 46,
    left: 42,
    width: 36,
    height: 36,
    backgroundColor: '#FF1744',
    transform: [{ rotate: '45deg' }],
  },
  dollarSign: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    zIndex: 10,
    marginTop: -4,
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
});
