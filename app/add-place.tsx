import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { X, MapPin, Check } from 'lucide-react-native';
import { usePlaces } from '@/hooks/use-places';
import { Colors } from '@/constants/colors';

const CATEGORIES = [
  'Cafe',
  'Japanese',
  'Italian',
  'Thai',
  'American',
  'Mexican',
  'Chinese',
  'Indian',
  'Korean',
  'Vietnamese',
  'French',
  'Mediterranean',
  'Healthy',
  'Dessert',
  'Bar',
  'Other',
];

export default function AddPlaceScreen() {
  const { addPlace, userLocation, getUserLocation } = usePlaces();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [customLatitude, setCustomLatitude] = useState('');
  const [customLongitude, setCustomLongitude] = useState('');

  useEffect(() => {
    if (!userLocation) {
      getUserLocation();
    }
  }, [userLocation, getUserLocation]);

  const handleSave = () => {
    console.log('Saving place...');
    
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a place name');
      return;
    }

    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    let latitude: number;
    let longitude: number;

    if (useCurrentLocation) {
      if (!userLocation) {
        Alert.alert('Error', 'Unable to get your location. Please try again.');
        return;
      }
      latitude = userLocation.latitude;
      longitude = userLocation.longitude;
    } else {
      const lat = parseFloat(customLatitude);
      const lon = parseFloat(customLongitude);
      
      if (isNaN(lat) || isNaN(lon)) {
        Alert.alert('Error', 'Please enter valid coordinates');
        return;
      }
      
      latitude = lat;
      longitude = lon;
    }

    addPlace({
      name: name.trim(),
      category,
      location: {
        latitude,
        longitude,
        address: address.trim() || 'Address not provided',
      },
      notes: notes.trim() || undefined,
    });

    Alert.alert('Success', 'Place added successfully!', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Place</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Check size={24} color="#FF1493" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Place Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. The Coffee Bean"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#999999"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipSelected,
                ]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === cat && styles.categoryChipTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location *</Text>
          <View style={styles.locationToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                useCurrentLocation && styles.toggleButtonActive,
              ]}
              onPress={() => setUseCurrentLocation(true)}
              activeOpacity={0.7}
            >
              <MapPin
                size={16}
                color={useCurrentLocation ? '#FFFFFF' : '#666666'}
              />
              <Text
                style={[
                  styles.toggleButtonText,
                  useCurrentLocation && styles.toggleButtonTextActive,
                ]}
              >
                Current Location
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                !useCurrentLocation && styles.toggleButtonActive,
              ]}
              onPress={() => setUseCurrentLocation(false)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  !useCurrentLocation && styles.toggleButtonTextActive,
                ]}
              >
                Custom Pin
              </Text>
            </TouchableOpacity>
          </View>

          {!useCurrentLocation && (
            <View style={styles.coordinatesContainer}>
              <View style={styles.coordinateInput}>
                <Text style={styles.coordinateLabel}>Latitude</Text>
                <TextInput
                  style={styles.coordinateField}
                  placeholder="37.7849"
                  value={customLatitude}
                  onChangeText={setCustomLatitude}
                  keyboardType="numeric"
                  placeholderTextColor="#999999"
                />
              </View>
              <View style={styles.coordinateInput}>
                <Text style={styles.coordinateLabel}>Longitude</Text>
                <TextInput
                  style={styles.coordinateField}
                  placeholder="-122.4094"
                  value={customLongitude}
                  onChangeText={setCustomLongitude}
                  keyboardType="numeric"
                  placeholderTextColor="#999999"
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Address (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 123 Market St, San Francisco"
            value={address}
            onChangeText={setAddress}
            placeholderTextColor="#999999"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Great coffee and pastries"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#999999"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  saveButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipSelected: {
    backgroundColor: '#FF1493',
    borderColor: '#FF1493',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  locationToggle: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#000000',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  coordinatesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
  },
  coordinateField: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000000',
  },
});
