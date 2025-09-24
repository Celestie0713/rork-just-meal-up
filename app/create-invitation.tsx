import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Calendar, Clock, Send, AlertCircle, User } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesService } from '@/services/google-places';
import type { PlaceDetails } from '@/types/place';

export default function CreateInvitationScreen() {
  const { placeName, placeAddress, placeId } = useLocalSearchParams<{
    placeName: string;
    placeAddress: string;
    placeId: string;
  }>();

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    const time = new Date();
    time.setHours(19, 0, 0, 0);
    return time;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  useEffect(() => {
    const loadPlaceDetails = async () => {
      if (placeId) {
        try {
          const details = await GooglePlacesService.getPlaceDetails(placeId);
          if (details) {
            setPlaceDetails(details);
          }
        } catch (error) {
          console.error('Error loading place details:', error);
        }
      }
    };
    
    loadPlaceDetails();
  }, [placeId]);

  const isPlaceOpenAtDateTime = (date: Date, time: Date): { isOpen: boolean; message?: string } => {
    if (!placeDetails?.opening_hours?.periods) {
      return { isOpen: true };
    }

    const dayOfWeek = date.getDay();
    const timeString = time.toTimeString().slice(0, 5).replace(':', '');
    const timeNumber = parseInt(timeString);

    const dayPeriods = placeDetails.opening_hours.periods.filter(period => period.open.day === dayOfWeek);
    
    if (dayPeriods.length === 0) {
      return { 
        isOpen: false, 
        message: `${placeName} is closed on ${date.toLocaleDateString('en-US', { weekday: 'long' })}` 
      };
    }

    for (const period of dayPeriods) {
      const openTime = parseInt(period.open.time);
      const closeTime = parseInt(period.close.time);
      
      if (timeNumber >= openTime && timeNumber <= closeTime) {
        return { isOpen: true };
      }
    }

    const openingHoursText = placeDetails.opening_hours.weekday_text?.[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
    return { 
      isOpen: false, 
      message: `${placeName} is closed at this time. ${openingHoursText || ''}` 
    };
  };

  const validateDateTime = () => {
    const validation = isPlaceOpenAtDateTime(selectedDate, selectedTime);
    if (!validation.isOpen) {
      setValidationError(validation.message || 'Restaurant is closed at selected time');
      setAvailabilityMessage(null);
      return false;
    }
    setValidationError(null);
    setAvailabilityMessage(null);
    return true;
  };

  const checkAvailability = async () => {
    setIsCheckingAvailability(true);
    setValidationError(null);
    setAvailabilityMessage(null);
    
    // Add a small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const validation = isPlaceOpenAtDateTime(selectedDate, selectedTime);
    
    if (!validation.isOpen) {
      setValidationError(validation.message || 'Restaurant is closed at selected time');
    } else {
      setAvailabilityMessage(`✅ ${placeName} is open at ${formatDisplayTime(selectedTime)} on ${formatDisplayDate(selectedDate)}`);
    }
    
    setIsCheckingAvailability(false);
  };

  const formatDisplayDate = (date: Date) => {
    if (!date || isNaN(date.getTime())) {
      return 'Select date';
    }
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);
      
      if (compareDate.getTime() === today.getTime()) {
        return 'Today';
      } else if (compareDate.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
      } else {
        return date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Select date';
    }
  };

  const formatDisplayTime = (time: Date) => {
    if (!time || isNaN(time.getTime())) {
      return 'Select time';
    }
    
    try {
      return time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Select time';
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    console.log('Date picker event:', event.type, 'selectedDate:', selectedDate);
    
    // On Android, always close the picker
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    // Handle dismissal on Android
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      const newDate = new Date(selectedDate);
      newDate.setHours(0, 0, 0, 0);
      setSelectedDate(newDate);
      setValidationError(null);
      
      // Close picker on iOS after selection
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    console.log('Time picker event:', event.type, 'selectedTime:', selectedTime);
    
    // On Android, always close the picker
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    // Handle dismissal on Android
    if (event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    
    if (selectedTime && !isNaN(selectedTime.getTime())) {
      setSelectedTime(selectedTime);
      setValidationError(null);
      
      // Close picker on iOS after selection
      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
      }
    }
  };

  const showDatePickerModal = () => {
    console.log('Date picker pressed - Platform:', Platform.OS);
    console.log('Current showDatePicker state:', showDatePicker);
    setShowTimePicker(false); // Close time picker if open
    setShowDatePicker(true);
  };

  const showTimePickerModal = () => {
    console.log('Time picker pressed - Platform:', Platform.OS);
    console.log('Current showTimePicker state:', showTimePicker);
    setShowDatePicker(false); // Close date picker if open
    setShowTimePicker(true);
  };

  const handleWebDateChange = (dateString: string) => {
    if (dateString) {
      const newDate = new Date(dateString + 'T00:00:00');
      if (!isNaN(newDate.getTime())) {
        setSelectedDate(newDate);
        setValidationError(null);
      }
    }
  };

  const handleWebTimeChange = (timeString: string) => {
    if (timeString) {
      const [hours, minutes] = timeString.split(':');
      const newTime = new Date();
      newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      if (!isNaN(newTime.getTime())) {
        setSelectedTime(newTime);
        setValidationError(null);
      }
    }
  };

  const handleSendInvitationTo = () => {
    if (validateDateTime()) {
      const invitationData = {
        placeName,
        placeAddress,
        placeId,
        date: selectedDate.toISOString(),
        time: selectedTime.toISOString(),
        fromInvitation: 'true'
      };
      
      const params = new URLSearchParams(invitationData).toString();
      router.push(`/(tabs)/messages?${params}`);
    } else {
      Alert.alert(
        'Invalid Time Selection',
        validationError || 'Please select a time when the restaurant is open.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Invitation</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileImageContainer}>
              <User size={32} color={Colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <TouchableOpacity onPress={() => router.push('/user-profile?userId=1')}>
                <Text style={styles.profileName}>You</Text>
              </TouchableOpacity>
              <Text style={styles.profileSubtext}>Sending invitation</Text>
            </View>
          </View>
        </View>

        {/* Restaurant Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant</Text>
          <View style={styles.restaurantCard}>
            <Text style={styles.restaurantName}>{placeName}</Text>
            <Text style={styles.restaurantAddress}>{placeAddress}</Text>
            <View style={styles.dateTimeInfo}>
              <View style={styles.dateTimeItem}>
                <Calendar size={16} color={Colors.primary} />
                <Text style={styles.dateTimeText}>{formatDisplayDate(selectedDate)}</Text>
              </View>
              <View style={styles.dateTimeItem}>
                <Clock size={16} color={Colors.primary} />
                <Text style={styles.dateTimeText}>{formatDisplayTime(selectedTime)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Edit Date */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Date</Text>
            <TouchableOpacity 
              onPress={checkAvailability}
              style={[styles.validateButton, isCheckingAvailability && styles.validateButtonDisabled]}
              disabled={isCheckingAvailability}
            >
              <Text style={styles.validateButtonText}>
                {isCheckingAvailability ? 'Checking...' : 'Check Availability'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            onPress={() => {
              console.log('Date TouchableOpacity pressed! Platform:', Platform.OS);
              if (Platform.OS === 'web') {
                const input = document.createElement('input');
                input.type = 'date';
                const today = new Date();
                const dateValue = selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.toISOString().split('T')[0] : today.toISOString().split('T')[0];
                input.value = dateValue;
                input.min = today.toISOString().split('T')[0];
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  handleWebDateChange(target.value);
                };
                input.click();
              } else {
                showDatePickerModal();
              }
            }}
            style={[styles.dateDisplay, showDatePicker && Platform.OS === 'ios' && styles.activeInput]}
            activeOpacity={0.7}
            testID="date-picker-button"
            accessible={true}
            accessibilityLabel="Select date"
            accessibilityRole="button"
          >
            <Calendar size={20} color={Colors.primary} />
            <Text style={styles.dateDisplayText}>{formatDisplayDate(selectedDate)}</Text>
          </TouchableOpacity>
          {showDatePicker && Platform.OS !== 'web' && (
            <DateTimePicker
              testID="dateTimePicker"
              value={selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
              maximumDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 year from now
              style={Platform.OS === 'ios' ? styles.iosDatePicker : undefined}
            />
          )}
        </View>

        {/* Edit Time */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Time</Text>
          <TouchableOpacity 
            onPress={() => {
              console.log('Time TouchableOpacity pressed! Platform:', Platform.OS);
              if (Platform.OS === 'web') {
                const input = document.createElement('input');
                input.type = 'time';
                const timeValue = selectedTime && !isNaN(selectedTime.getTime()) ? selectedTime.toTimeString().slice(0, 5) : '19:00';
                input.value = timeValue;
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  handleWebTimeChange(target.value);
                };
                input.click();
              } else {
                showTimePickerModal();
              }
            }}
            style={[styles.timeDisplay, showTimePicker && Platform.OS === 'ios' && styles.activeInput]}
            activeOpacity={0.7}
            testID="time-picker-button"
            accessible={true}
            accessibilityLabel="Select time"
            accessibilityRole="button"
          >
            <Clock size={20} color={Colors.primary} />
            <Text style={styles.timeDisplayText}>{formatDisplayTime(selectedTime)}</Text>
          </TouchableOpacity>
          {showTimePicker && Platform.OS !== 'web' && (
            <DateTimePicker
              testID="timeTimePicker"
              value={selectedTime && !isNaN(selectedTime.getTime()) ? selectedTime : new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
              is24Hour={true}
              style={Platform.OS === 'ios' ? styles.iosDatePicker : undefined}
            />
          )}
        </View>

        {/* Validation Messages */}
        {validationError && (
          <View style={styles.errorContainer}>
            <AlertCircle size={16} color={Colors.error} />
            <Text style={styles.errorText}>{validationError}</Text>
          </View>
        )}
        
        {availabilityMessage && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{availabilityMessage}</Text>
          </View>
        )}


      </ScrollView>

      {/* Send Invitation To Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSendInvitationTo}
          style={[styles.sendButton, validationError && styles.sendButtonDisabled]}
        >
          <Send size={20} color={Colors.background} />
          <Text style={styles.sendButtonText}>Send invitation to</Text>
        </TouchableOpacity>
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  restaurantCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  dateTimeInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 48,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 1,
  },
  dateDisplayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 48,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 1,
  },
  timeDisplayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  activeInput: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  iosDatePicker: {
    marginTop: 10,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginVertical: 10,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    flex: 1,
  },

  validateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  validateButtonText: {
    fontSize: 14,
    color: Colors.background,
    fontWeight: '500',
  },
  validateButtonDisabled: {
    opacity: 0.6,
  },
  successContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  successText: {
    fontSize: 14,
    color: '#15803D',
    fontWeight: '500',
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 2,
  },
  profileSubtext: {
    fontSize: 14,
    color: Colors.textLight,
  },
});