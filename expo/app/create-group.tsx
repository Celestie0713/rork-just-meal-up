import React, { useState } from 'react';
import { safeGoBack } from '@/utils/navigation';
import {
  Text,
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Modal,
  FlatList,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, MapPin, Users, DollarSign, Image as ImageIcon, ChevronDown, Check, Percent } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { COUNTRY_CURRENCIES } from '@/constants/currencies';
import { useAuth } from '@/hooks/use-auth';

const CURRENCY_OPTIONS = (() => {
  const seen = new Set<string>();
  return Object.entries(COUNTRY_CURRENCIES)
    .filter(([, symbol]) => {
      if (seen.has(symbol)) return false;
      seen.add(symbol);
      return true;
    })
    .map(([country, symbol]) => ({ country, symbol }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
})();

const DISCOUNT_OPTIONS = ['10%', '20%', '35%', '50%', '70%', '100%'] as const;

export default function CreateGroupScreen() {
  const _auth = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    imageUrl: '',
    isPaid: false,
    monthlyFee: '',
    currency: '$',
    memberDiscount: '10%',
  });
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showDiscountPicker, setShowDiscountPicker] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!formData.location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }
    if (formData.isPaid && !formData.monthlyFee.trim()) {
      Alert.alert('Error', 'Please enter a monthly fee for paid groups');
      return;
    }

    console.log('Creating group:', formData);
    Alert.alert(
      'Group Created!',
      'Your group has been created successfully. Members can now discover and join your group!',
      [
        {
          text: 'OK',
          onPress: () => safeGoBack(),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen
        options={{
          title: 'Create Group',
          headerLeft: () => (
            <TouchableOpacity onPress={() => safeGoBack()} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Group Info</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Group Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Brooklyn Foodies"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholderTextColor={Colors.textLight}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell people what your group is about..."
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                multiline
                numberOfLines={4}
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location & Cover</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location *</Text>
              <View style={styles.inputWithIcon}>
                <MapPin size={20} color={Colors.textLight} />
                <TextInput
                  style={styles.inputWithIconText}
                  placeholder="e.g., New York, NY"
                  value={formData.location}
                  onChangeText={(value) => handleInputChange('location', value)}
                  placeholderTextColor={Colors.textLight}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cover Image URL</Text>
              <View style={styles.inputWithIcon}>
                <ImageIcon size={20} color={Colors.textLight} />
                <TextInput
                  style={styles.inputWithIconText}
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChangeText={(value) => handleInputChange('imageUrl', value)}
                  placeholderTextColor={Colors.textLight}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Membership</Text>
            <View style={styles.paidRow}>
              <View style={styles.paidInfo}>
                <DollarSign size={20} color={Colors.primary} />
                <View style={styles.paidTextContainer}>
                  <Text style={styles.paidLabel}>Paid Group</Text>
                  <Text style={styles.paidDescription}>Charge a monthly fee to join</Text>
                </View>
              </View>
              <Switch
                value={formData.isPaid}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isPaid: value }))}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            {formData.isPaid && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Monthly Fee</Text>
                <View style={styles.inputWithIcon}>
                  <TouchableOpacity
                    style={styles.currencySelector}
                    onPress={() => setShowCurrencyPicker(true)}
                  >
                    <Text style={styles.currencySign}>{formData.currency}</Text>
                    <ChevronDown size={14} color={Colors.textLight} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.inputWithIconText}
                    placeholder="0.00"
                    value={formData.monthlyFee}
                    onChangeText={(value) => handleInputChange('monthlyFee', value)}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>
              </View>
            )}
            {formData.isPaid && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Member discount for meal-up session:</Text>
                <TouchableOpacity
                  style={styles.discountSelector}
                  onPress={() => setShowDiscountPicker(true)}
                  activeOpacity={0.7}
                >
                  <Percent size={20} color={Colors.primary} />
                  <Text style={styles.discountValue}>{formData.memberDiscount}</Text>
                  <ChevronDown size={16} color={Colors.textLight} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.infoCard}>
            <Users size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              Once your group is created, members can join and you'll be able to create meal up sessions within it.
            </Text>
          </View>

          <TouchableOpacity style={styles.createButton} onPress={handleSubmit}>
            <Text style={styles.createButtonText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Currency Picker Modal */}
      <Modal
        visible={showCurrencyPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCurrencyPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCurrencyPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <FlatList
              data={CURRENCY_OPTIONS}
              keyExtractor={(item) => `${item.symbol}-${item.country}`}
              style={styles.currencyList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.currencyOption,
                    formData.currency === item.symbol && styles.currencyOptionSelected,
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, currency: item.symbol }));
                    setShowCurrencyPicker(false);
                  }}
                >
                  <Text style={styles.currencyOptionSymbol}>{item.symbol}</Text>
                  <Text style={styles.currencyOptionCountry}>{item.country}</Text>
                  {formData.currency === item.symbol && (
                    <Check size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Discount Picker Modal */}
      <Modal
        visible={showDiscountPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDiscountPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDiscountPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Discount</Text>
            <FlatList
              data={DISCOUNT_OPTIONS}
              keyExtractor={(item) => item}
              style={styles.currencyList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.currencyOption,
                    formData.memberDiscount === item && styles.currencyOptionSelected,
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, memberDiscount: item }));
                    setShowDiscountPicker(false);
                  }}
                >
                  <Text style={styles.currencyOptionSymbol}>{item}</Text>
                  <Text style={styles.currencyOptionCountry}>off each session</Text>
                  {formData.memberDiscount === item && (
                    <Check size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top' as const,
  },
  inputWithIcon: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputWithIconText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.text,
  },
  currencySelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  currencySign: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  paidRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  paidInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: 12,
  },
  paidTextContainer: {
    flex: 1,
  },
  paidLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  paidDescription: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: `${Colors.primary}15`,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center' as const,
    marginBottom: 40,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  // Currency picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  currencyList: {
    flexGrow: 0,
  },
  currencyOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 12,
  },
  currencyOptionSelected: {
    backgroundColor: `${Colors.primary}10`,
  },
  currencyOptionSymbol: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    width: 40,
  },
  currencyOptionCountry: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  discountSelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  discountValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
