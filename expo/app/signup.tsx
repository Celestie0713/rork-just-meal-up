import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  UtensilsCrossed,
  ChevronDown,
  Check,
  Phone,
  Globe,
  User as UserIcon,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import { getCurrencyFromCountry } from '@/constants/currencies';
import { ALL_COUNTRIES } from '@/constants/countries';

const COUNTRY_DIAL_CODES: Record<string, string> = {
  'United States': '+1',
  'United Kingdom': '+44',
  Canada: '+1',
  Australia: '+61',
  Germany: '+49',
  France: '+33',
  Italy: '+39',
  Spain: '+34',
  Japan: '+81',
  China: '+86',
  India: '+91',
  Brazil: '+55',
  Mexico: '+52',
  'South Korea': '+82',
  Netherlands: '+31',
  Sweden: '+46',
  Switzerland: '+41',
  Singapore: '+65',
  'Hong Kong': '+852',
  Thailand: '+66',
  'United Arab Emirates': '+971',
  'Saudi Arabia': '+966',
  Turkey: '+90',
  Russia: '+7',
  Poland: '+48',
  'Czech Republic': '+420',
  Hungary: '+36',
  Greece: '+30',
  Portugal: '+351',
  Ireland: '+353',
  Belgium: '+32',
  Austria: '+43',
  Denmark: '+45',
  Norway: '+47',
  Finland: '+358',
  'New Zealand': '+64',
  'South Africa': '+27',
  Israel: '+972',
  Indonesia: '+62',
  Malaysia: '+60',
  Philippines: '+63',
  Vietnam: '+84',
  Argentina: '+54',
  Chile: '+56',
  Colombia: '+57',
  Peru: '+51',
  Ukraine: '+380',
  Romania: '+40',
  Pakistan: '+92',
  Bangladesh: '+880',
  Egypt: '+20',
  Morocco: '+212',
  Nigeria: '+234',
  Kenya: '+254',
};

function getDialCode(country: string): string {
  return COUNTRY_DIAL_CODES[country] ?? '+';
}

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [country, setCountry] = useState('United States');
  const [phone, setPhone] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialCode = useMemo(() => getDialCode(country), [country]);
  const currencySymbol = useMemo(() => getCurrencyFromCountry(country), [country]);

  const phoneValid = phone.trim().length >= 6 && /^\d[\d\s-]*$/.test(phone.trim());
  const nameValid = name.trim().length >= 2;
  const canSubmit = nameValid && phoneValid && !isSubmitting;

  function handleCountrySelect(c: string) {
    setCountry(c);
    setShowCountryPicker(false);
  }

  async function handleSignUp() {
    if (!nameValid) {
      Alert.alert('Missing name', 'Please enter your name to continue.');
      return;
    }
    if (!phoneValid) {
      Alert.alert('Invalid phone number', 'Please enter a valid phone number.');
      return;
    }
    setIsSubmitting(true);
    try {
      const fullPhone = `${dialCode} ${phone.trim()}`;
      await signUp({ name: name.trim(), country, phone: fullPhone });
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Sign up failed', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View style={styles.brandWrap}>
          <View style={styles.brandIconWrap}>
            <UtensilsCrossed size={30} color={Colors.primary} />
          </View>
          <Text style={styles.brandTitle}>Meal Up</Text>
          <Text style={styles.brandTagline}>
            Meet people over great food.{'\n'}Start by telling us about you.
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Sparkles size={16} color={Colors.primary} />
            <Text style={styles.cardTitle}>Create your account</Text>
          </View>

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.inputWrap}>
              <UserIcon size={18} color="#888888" />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#666666"
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Country */}
          <View style={styles.field}>
            <Text style={styles.label}>Country</Text>
            <TouchableOpacity
              style={styles.inputWrap}
              onPress={() => setShowCountryPicker(true)}
              activeOpacity={0.7}
            >
              <Globe size={18} color="#888888" />
              <Text style={styles.selectValue} numberOfLines={1}>
                {country}
              </Text>
              <View style={styles.currencyPreview}>
                <Text style={styles.currencyPreviewText}>{currencySymbol}</Text>
              </View>
              <ChevronDown size={18} color="#888888" />
            </TouchableOpacity>
            <Text style={styles.hint}>
              We use your country to show earnings in the right currency.
            </Text>
          </View>

          {/* Phone */}
          <View style={styles.field}>
            <Text style={styles.label}>Phone number</Text>
            <View style={styles.inputWrap}>
              <Phone size={18} color="#888888" />
              <Text style={styles.dialCode}>{dialCode}</Text>
              <View style={styles.dialDivider} />
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 415 555 0142"
                placeholderTextColor="#666666"
                keyboardType="phone-pad"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSignUp}
            disabled={!canSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? 'Creating account…' : 'Continue'}
            </Text>
            {!isSubmitting && <ArrowRight size={18} color="#FFFFFF" />}
          </TouchableOpacity>

          <Text style={styles.legal}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <TouchableOpacity
            style={styles.pickerBackdrop}
            onPress={() => setShowCountryPicker(false)}
            activeOpacity={1}
          />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select your country</Text>
              <TouchableOpacity
                onPress={() => setShowCountryPicker(false)}
                hitSlop={8}
              >
                <Text style={styles.pickerCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={ALL_COUNTRIES as unknown as string[]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const selected = item === country;
                const symbol = getCurrencyFromCountry(item);
                const code = getDialCode(item);
                return (
                  <TouchableOpacity
                    style={[styles.countryRow, selected && styles.countryRowSelected]}
                    onPress={() => handleCountrySelect(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.countryRowLeft}>
                      <Text style={styles.countryName}>{item}</Text>
                      <Text style={styles.countryMeta}>
                        {code} · {symbol}
                      </Text>
                    </View>
                    {selected && <Check size={18} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: 36,
  },
  brandIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  brandTagline: {
    fontSize: 15,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 21,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 22,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#111111',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 54,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    padding: 0,
  },
  selectValue: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    color: '#777777',
    marginTop: 8,
  },
  dialCode: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    minWidth: 34,
  },
  dialDivider: {
    width: 1,
    height: 22,
    backgroundColor: Colors.border,
    marginHorizontal: 2,
  },
  phoneInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    padding: 0,
  },
  currencyPreview: {
    backgroundColor: `${Colors.primary}1A`,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  currencyPreviewText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 54,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  legal: {
    fontSize: 11,
    color: '#777777',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 15,
  },
  // Picker modal
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerBackdrop: {
    flex: 1,
  },
  pickerSheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  pickerCancel: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  countryRowSelected: {
    backgroundColor: `${Colors.primary}0D`,
  },
  countryRowLeft: {
    flex: 1,
  },
  countryName: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  countryMeta: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
  },
});
