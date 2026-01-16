import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Calendar, Clock, Send, MapPin } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateInvitationScreen() {
  const { placeName, placeAddress, placeId } = useLocalSearchParams<{
    placeName: string;
    placeAddress: string;
    placeId: string;
  }>();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    const time = new Date();
    time.setHours(19, 0, 0, 0);
    return time;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const formatDate = (date: Date) => {
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
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (time) {
      setSelectedTime(time);
    }
  };

  const handleSendInvitation = () => {
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
  };

  const renderDateTimePicker = () => {
    if (Platform.OS === 'android') {
      return (
        <>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="default"
              onChange={handleTimeChange}
              is24Hour={false}
            />
          )}
        </>
      );
    }

    if (showDatePicker) {
      return (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.iosModalOverlay}>
            <TouchableOpacity 
              style={styles.iosModalBackdrop}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            />
            <View style={styles.iosModalContainer}>
              <View style={styles.iosModalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.iosModalCancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.iosModalTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.iosModalDoneButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.iosPickerWrapper}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  textColor="#000000"
                  style={styles.iosPicker}
                />
              </View>
            </View>
          </View>
        </Modal>
      );
    }

    if (showTimePicker) {
      return (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.iosModalOverlay}>
            <TouchableOpacity 
              style={styles.iosModalBackdrop}
              activeOpacity={1}
              onPress={() => setShowTimePicker(false)}
            />
            <View style={styles.iosModalContainer}>
              <View style={styles.iosModalHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.iosModalCancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.iosModalTitle}>Select Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.iosModalDoneButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.iosPickerWrapper}>
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  textColor="#000000"
                  style={styles.iosPicker}
                />
              </View>
            </View>
          </View>
        </Modal>
      );
    }

    return null;
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant</Text>
          <View style={styles.restaurantCard}>
            <Text style={styles.restaurantName}>{placeName || 'Restaurant Name'}</Text>
            <View style={styles.addressRow}>
              <MapPin size={14} color={Colors.textLight} />
              <Text style={styles.restaurantAddress} numberOfLines={2}>
                {placeAddress || 'Restaurant Address'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => {
              console.log('Date button pressed');
              setShowDatePicker(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.dateTimeButtonContent}>
              <View style={styles.iconWrapper}>
                <Calendar size={20} color={Colors.primary} />
              </View>
              <View style={styles.dateTimeTextContainer}>
                <Text style={styles.dateTimeLabel}>Date</Text>
                <Text style={styles.dateTimeValue}>{formatDate(selectedDate)}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => {
              console.log('Time button pressed');
              setShowTimePicker(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.dateTimeButtonContent}>
              <View style={styles.iconWrapper}>
                <Clock size={20} color={Colors.primary} />
              </View>
              <View style={styles.dateTimeTextContainer}>
                <Text style={styles.dateTimeLabel}>Time</Text>
                <Text style={styles.dateTimeValue}>{formatTime(selectedTime)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Invitation Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Restaurant:</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>{placeName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>{formatTime(selectedTime)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSendInvitation}
          style={styles.sendButton}
          activeOpacity={0.8}
        >
          <Send size={20} color="#FFFFFF" />
          <Text style={styles.sendButtonText}>Send Invitation To</Text>
        </TouchableOpacity>
      </View>

      {renderDateTimePicker()}
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
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  restaurantCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  restaurantAddress: {
    fontSize: 14,
    color: Colors.textLight,
    flex: 1,
    lineHeight: 20,
  },
  dateTimeButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateTimeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimeTextContainer: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 2,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 165, 0, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.2)',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    gap: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  iosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  iosModalBackdrop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iosModalContainer: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  iosModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  iosModalTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#000000',
  },
  iosModalCancelButton: {
    fontSize: 17,
    color: '#007AFF',
  },
  iosModalDoneButton: {
    fontSize: 17,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  iosPickerWrapper: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
  },
  iosPicker: {
    width: '100%',
    height: 200,
  },
});
