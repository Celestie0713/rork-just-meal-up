import React, { useState, useMemo } from 'react';
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
  Image,
  Dimensions,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Calendar, Clock, MapPin, Users, ArrowLeft, Video, X, Plus } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import { getCurrencyFromAddress } from '@/constants/currencies';
import * as ImagePicker from 'expo-image-picker';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';

export default function CreateMealUpScreen() {
  useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    keywords: '',
    date: '',
    time: '',
    venue: {
      name: '',
      address: '',
    },
    maxAttendees: '',
    femaleTicketPrice: '',
    maleTicketPrice: '',
    femaleSoldOut: false,
    maleSoldOut: false,
    whatsIncluded: '',
    includesFood: true,
    includesDrinks: false,
    includesService: false,
  });

  const [mediaFiles, setMediaFiles] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const { width: screenWidth } = Dimensions.get('window');
  const mediaItemWidth = (screenWidth - 60) / 3;

  const currencySign = useMemo(() => getCurrencyFromAddress(formData.venue.address), [formData.venue.address]);

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

  const pickMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        videoMaxDuration: 30, // 30 seconds max
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check video duration
        if (asset.type === 'video' && asset.duration && asset.duration > 30000) {
          Alert.alert('Video too long', 'Please select a video that is 30 seconds or shorter');
          return;
        }
        
        setMediaFiles(prev => [...prev, asset]);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        videoMaxDuration: 30, // 30 seconds max
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check video duration
        if (asset.type === 'video' && asset.duration && asset.duration > 30000) {
          Alert.alert('Video too long', 'Please record a video that is 30 seconds or shorter');
          return;
        }
        
        setMediaFiles(prev => [...prev, asset]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const showMediaOptions = () => {
    Alert.alert(
      'Add Media',
      'Choose how you want to add photos or videos',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickMedia },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
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
      `Your meal up has been created successfully with ${mediaFiles.length} media files. Other users can now join!`,
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
              <ArrowLeft size={24} color="#FF0000" />
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
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Keywords</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., vegan, outdoor seating, live music"
                value={formData.keywords}
                onChangeText={(value) => handleInputChange('keywords', value)}
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
            <Text style={styles.sectionTitle}>What&apos;s included?</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Female Ticket Price</Text>
              <View style={styles.priceRow}>
                <View style={[styles.inputWithIcon, styles.priceInput]}>
                  <Text style={styles.currencySign}>{currencySign}</Text>
                  <TextInput
                    style={styles.inputWithIconText}
                    placeholder="0.00"
                    value={formData.femaleTicketPrice}
                    onChangeText={(value) => handleInputChange('femaleTicketPrice', value)}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.soldOutButton,
                    formData.femaleSoldOut && styles.soldOutButtonActive,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, femaleSoldOut: !prev.femaleSoldOut }))}
                >
                  <Text style={[
                    styles.soldOutButtonText,
                    formData.femaleSoldOut && styles.soldOutButtonTextActive,
                  ]}>
                    Sold Out
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Male Ticket Price</Text>
              <View style={styles.priceRow}>
                <View style={[styles.inputWithIcon, styles.priceInput]}>
                  <Text style={styles.currencySign}>{currencySign}</Text>
                  <TextInput
                    style={styles.inputWithIconText}
                    placeholder="0.00"
                    value={formData.maleTicketPrice}
                    onChangeText={(value) => handleInputChange('maleTicketPrice', value)}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.soldOutButton,
                    formData.maleSoldOut && styles.soldOutButtonActive,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, maleSoldOut: !prev.maleSoldOut }))}
                >
                  <Text style={[
                    styles.soldOutButtonText,
                    formData.maleSoldOut && styles.soldOutButtonTextActive,
                  ]}>
                    Sold Out
                  </Text>
                </TouchableOpacity>
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos & Videos</Text>
            <Text style={styles.sectionSubtitle}>Add photos and videos to showcase your meal up (videos max 30 seconds)</Text>
            <View style={styles.mediaGrid}>
              {mediaFiles.map((media, index) => (
                <View key={index} style={[styles.mediaItem, { width: mediaItemWidth, height: mediaItemWidth }]}>
                  {media.type === 'video' ? (
                    <View style={styles.videoContainer}>
                      {Platform.OS !== 'web' ? (
                        <ExpoVideo
                          source={{ uri: media.uri }}
                          style={styles.mediaPreview}
                          useNativeControls={false}
                          shouldPlay={false}
                          isLooping={false}
                          resizeMode={ResizeMode.COVER}
                        />
                      ) : (
                        <View style={[styles.mediaPreview, styles.videoPlaceholder]}>
                          <Video size={24} color={Colors.background} />
                        </View>
                      )}
                      <View style={styles.videoOverlay}>
                        <Video size={16} color={Colors.background} />
                      </View>
                    </View>
                  ) : (
                    <Image source={{ uri: media.uri }} style={styles.mediaPreview} />
                  )}
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => removeMedia(index)}
                  >
                    <X size={16} color={Colors.background} />
                  </TouchableOpacity>
                </View>
              ))}
              {mediaFiles.length < 9 && (
                <TouchableOpacity
                  style={[styles.addMediaButton, { width: mediaItemWidth, height: mediaItemWidth }]}
                  onPress={showMediaOptions}
                >
                  <Plus size={24} color={Colors.textLight} />
                  <Text style={styles.addMediaText}>Add Media</Text>
                </TouchableOpacity>
              )}
            </View>
            {mediaFiles.length > 0 && (
              <Text style={styles.mediaCount}>
                {mediaFiles.length} media file{mediaFiles.length !== 1 ? 's' : ''} added
              </Text>
            )}
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
  currencySign: {
    fontSize: 16,
    fontWeight: '600',
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
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
    lineHeight: 20,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mediaItem: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    backgroundColor: Colors.textLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  addMediaButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMediaText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  mediaCount: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 12,
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
  },
  soldOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  soldOutButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  soldOutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
  soldOutButtonTextActive: {
    color: Colors.background,
  },
});