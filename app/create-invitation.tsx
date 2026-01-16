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
    if (date && date.getTime() !== selectedDate.getTime()) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (time && time.getTime() !== selectedTime.getTime()) {
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

  const renderDatePicker = () => {
    if (Platform.OS === 'android') {
      return showDatePicker ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      ) : null;
    }

    return (
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={[styles.modalButton, styles.modalButtonPrimary]}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="inline"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          </View>
        </View>
      </Modal>
    );
  };

  const renderTimePicker = () => {
    if (Platform.OS === 'android') {
      return showTimePicker ? (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
          is24Hour={false}
        />
      ) : null;
    }

    return (
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={() => setShowTimePicker(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.modalButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={[styles.modalButton, styles.modalButtonPrimary]}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="inline"
              onChange={handleTimeChange}
            />
          </View>
        </View>
      </Modal>
    );
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
            style={styles.pickerButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.pickerButtonLeft}>
              <View style={styles.iconContainer}>
                <Calendar size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.pickerLabel}>Date</Text>
                <Text style={styles.pickerValue}>{formatDate(selectedDate)}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.pickerButton}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.pickerButtonLeft}>
              <View style={styles.iconContainer}>
                <Clock size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.pickerLabel}>Time</Text>
                <Text style={styles.pickerValue}>{formatTime(selectedTime)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Invitation Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Restaurant:</Text>
              <Text style={styles.summaryValue}>{placeName}</Text>
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

      {renderDatePicker()}
      {renderTimePicker()}
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
  pickerButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 2,
  },
  pickerValue: {
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
    alignItems: 'center',
    marginBottom: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000000',
  },
  modalButton: {
    fontSize: 16,
    color: '#666666',
  },
  modalButtonPrimary: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },

});
