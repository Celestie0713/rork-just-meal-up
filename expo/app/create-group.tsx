import React, { useState } from 'react';
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
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, MapPin, Users, DollarSign, Image as ImageIcon } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';

export default function CreateGroupScreen() {
  const _auth = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    imageUrl: '',
    isPaid: false,
    monthlyFee: '',
  });

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
          onPress: () => router.back(),
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
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
                <Text style={styles.label}>Monthly Fee ($)</Text>
                <View style={styles.inputWithIcon}>
                  <Text style={styles.currencySign}>$</Text>
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
});
