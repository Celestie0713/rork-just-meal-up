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
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Calendar, Clock, MapPin, Users, DollarSign, ArrowLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';

export default function CreateMealUpScreen() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: {
      name: '',
      address: '',
      cuisine: '',
    },
    maxAttendees: '',
    ticketPrice: '',
    whatsIncluded: '',
    includesFood: true,
    includesDrinks: false,
    includesService: false,
  });

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('venue.')) {
      const venueField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        venue: {
          ...prev.venue,
          [venueField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title for your meal up');
      return;
    }
    if (!formData.venue.name.trim()) {
      Alert.alert('Error', 'Please enter a venue name');
      return;
    }
    if (!formData.date.trim()) {
      Alert.alert('Error', 'Please enter a date');
      return;
    }
    if (!formData.time.trim()) {
      Alert.alert('Error', 'Please enter a time');
      return;
    }

    // Show success message and navigate back
    Alert.alert(
      'Meal Up Created!',
      'Your meal up has been created successfully. Other users can now join!',
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
          title: 'Create Meal Up',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Sunday Brunch at The Garden"
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell people what to expect..."
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>When & Where</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Date *</Text>
                <View style={styles.inputWithIcon}>
                  <Calendar size={20} color={Colors.textLight} />
                  <TextInput
                    style={styles.inputWithIconText}
                    placeholder="MM/DD/YYYY"
                    value={formData.date}
                    onChangeText={(value) => handleInputChange('date', value)}
                    placeholderTextColor={Colors.textLight}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Time *</Text>
                <View style={styles.inputWithIcon}>
                  <Clock size={20} color={Colors.textLight} />
                  <TextInput
                    style={styles.inputWithIconText}
                    placeholder="7:00 PM"
                    value={formData.time}
                    onChangeText={(value) => handleInputChange('time', value)}
                    placeholderTextColor={Colors.textLight}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Venue Name *</Text>
              <View style={styles.inputWithIcon}>
                <MapPin size={20} color={Colors.textLight} />
                <TextInput
                  style={styles.inputWithIconText}
                  placeholder="Restaurant name"
                  value={formData.venue.name}
                  onChangeText={(value) => handleInputChange('venue.name', value)}
                  placeholderTextColor={Colors.textLight}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Full address"
                value={formData.venue.address}
                onChangeText={(value) => handleInputChange('venue.address', value)}
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cuisine Type</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Italian, Japanese, Mexican"
                value={formData.venue.cuisine}
                onChangeText={(value) => handleInputChange('venue.cuisine', value)}
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Group Settings</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Max Attendees</Text>
              <View style={styles.inputWithIcon}>
                <Users size={20} color={Colors.textLight} />
                <TextInput
                  style={styles.inputWithIconText}
                  placeholder="e.g., 8"
                  value={formData.maxAttendees}
                  onChangeText={(value) => handleInputChange('maxAttendees', value)}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textLight}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's included?</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ticket Price (Optional)</Text>
              <View style={styles.inputWithIcon}>
                <DollarSign size={20} color={Colors.textLight} />
                <TextInput
                  style={styles.inputWithIconText}
                  placeholder="0.00"
                  value={formData.ticketPrice}
                  onChangeText={(value) => handleInputChange('ticketPrice', value)}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textLight}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Inclusions</Text>
              
              <TouchableOpacity
                style={[
                  styles.checkboxOption,
                  formData.includesFood && styles.checkboxOptionSelected,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, includesFood: !prev.includesFood }))}
              >
                <View style={styles.checkboxOptionContent}>
                  <Text style={[
                    styles.checkboxOptionTitle,
                    formData.includesFood && styles.checkboxOptionTitleSelected,
                  ]}>
                    Food
                  </Text>
                  <Text style={[
                    styles.checkboxOptionDescription,
                    formData.includesFood && styles.checkboxOptionDescriptionSelected,
                  ]}>
                    Meal is included in the price
                  </Text>
                </View>
                <View style={[
                  styles.checkbox,
                  formData.includesFood && styles.checkboxSelected,
                ]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.checkboxOption,
                  formData.includesDrinks && styles.checkboxOptionSelected,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, includesDrinks: !prev.includesDrinks }))}
              >
                <View style={styles.checkboxOptionContent}>
                  <Text style={[
                    styles.checkboxOptionTitle,
                    formData.includesDrinks && styles.checkboxOptionTitleSelected,
                  ]}>
                    Drinks
                  </Text>
                  <Text style={[
                    styles.checkboxOptionDescription,
                    formData.includesDrinks && styles.checkboxOptionDescriptionSelected,
                  ]}>
                    Beverages are included in the price
                  </Text>
                </View>
                <View style={[
                  styles.checkbox,
                  formData.includesDrinks && styles.checkboxSelected,
                ]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.checkboxOption,
                  formData.includesService && styles.checkboxOptionSelected,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, includesService: !prev.includesService }))}
              >
                <View style={styles.checkboxOptionContent}>
                  <Text style={[
                    styles.checkboxOptionTitle,
                    formData.includesService && styles.checkboxOptionTitleSelected,
                  ]}>
                    Service & Tips
                  </Text>
                  <Text style={[
                    styles.checkboxOptionDescription,
                    formData.includesService && styles.checkboxOptionDescriptionSelected,
                  ]}>
                    Service charges and tips are covered
                  </Text>
                </View>
                <View style={[
                  styles.checkbox,
                  formData.includesService && styles.checkboxSelected,
                ]} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Details</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe what else is included or any special arrangements..."
                value={formData.whatsIncluded}
                onChangeText={(value) => handleInputChange('whatsIncluded', value)}
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.createButton} onPress={handleSubmit}>
            <Text style={styles.createButtonText}>Create Meal Up</Text>
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
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
    height: 80,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkboxOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  checkboxOptionContent: {
    flex: 1,
  },
  checkboxOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  checkboxOptionTitleSelected: {
    color: Colors.primary,
  },
  checkboxOptionDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
  checkboxOptionDescriptionSelected: {
    color: Colors.primary,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    marginLeft: 12,
  },
  checkboxSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.background,
  },
});