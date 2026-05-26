import React, { useState, useEffect } from 'react';
import { safeGoBack } from '@/utils/navigation';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Linking } from 'react-native';
import { ArrowLeft, Calendar, Clock, Send, MapPin, ChevronLeft, ChevronRight, Pencil, Check, ExternalLink } from 'lucide-react-native';
import { TextInput } from 'react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateInvitationScreen() {
  const { placeName, placeAddress, placeCity, placeCountry, placeGoogleMapsUrl, placeLatitude, placeLongitude, placeId } = useLocalSearchParams<{
    placeName: string;
    placeAddress: string;
    placeCity: string;
    placeCountry: string;
    placeGoogleMapsUrl: string;
    placeLatitude: string;
    placeLongitude: string;
    placeId: string;
  }>();

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    const time = new Date();
    time.setDate(time.getDate() + 1);
    time.setHours(19, 0, 0, 0);
    return time;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [tempHour, setTempHour] = useState<number>(19);
  const [tempMinute, setTempMinute] = useState<number>(0);
  const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>('PM');
  const [editableAddress, setEditableAddress] = useState<string>(placeAddress || '');
  const [editableCity, setEditableCity] = useState<string>(placeCity || '');
  const [editableCountry, setEditableCountry] = useState<string>(placeCountry || '');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressResolved, setAddressResolved] = useState(false);

  const resolveEnabled = !!(placeLatitude && placeLongitude);
  const { data: resolvedAddress, isLoading: isResolvingAddress } = trpc.places.resolveAddress.useQuery(
    { latitude: parseFloat(placeLatitude || '0'), longitude: parseFloat(placeLongitude || '0') },
    {
      enabled: resolveEnabled,
      staleTime: Infinity,
      retry: 2,
    }
  );

  useEffect(() => {
    if (resolvedAddress && !addressResolved) {
      const addr = resolvedAddress.address;
      const city = resolvedAddress.city;
      const country = resolvedAddress.country;

      if (addr) setEditableAddress(addr);
      if (city) setEditableCity(city);
      if (country) setEditableCountry(country);
      setAddressResolved(true);
    }
  }, [resolvedAddress, addressResolved]);

  const fallbackMapsUrl = placeGoogleMapsUrl || (placeLatitude && placeLongitude
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((placeName || '') + ' ' + (placeCity || '') + ' ' + (placeCountry || ''))}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((placeName || '') + ' ' + (placeCity || '') + ' ' + (placeCountry || ''))}`);

  const handleOpenMaps = () => {
    if (Platform.OS === 'web') {
      window.open(fallbackMapsUrl, '_blank');
    } else {
      Linking.openURL(fallbackMapsUrl);
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, firstDay };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(calendarMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCalendarMonth(newMonth);
  };

  const handleTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (time) {
      setSelectedTime(time);
    }
  };

  const handleTimePickerOpen = () => {
    const hours = selectedTime.getHours();
    const minutes = selectedTime.getMinutes();
    const hour12 = hours % 12 || 12;
    const period = hours >= 12 ? 'PM' : 'AM';
    
    setTempHour(hour12);
    setTempMinute(minutes);
    setTempPeriod(period);
    setShowTimePicker(true);
  };

  const handleTimeDone = () => {
    const newTime = new Date(selectedTime);
    let hours = tempHour;
    if (tempPeriod === 'PM' && hours !== 12) {
      hours += 12;
    } else if (tempPeriod === 'AM' && hours === 12) {
      hours = 0;
    }
    newTime.setHours(hours, tempMinute, 0, 0);
    setSelectedTime(newTime);
    setShowTimePicker(false);
  };

  const renderCustomTimePicker = () => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    return (
      <View style={styles.customTimePickerContainer}>
        <View style={styles.timePickerRow}>
          <View style={styles.timePickerColumn}>
            <Text style={styles.timePickerColumnLabel}>Hour</Text>
            <ScrollView 
              style={styles.timePickerScroll}
              showsVerticalScrollIndicator={false}
            >
              {hours.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[
                    styles.timePickerItem,
                    tempHour === hour && styles.timePickerItemSelected,
                  ]}
                  onPress={() => setTempHour(hour)}
                >
                  <Text
                    style={[
                      styles.timePickerItemText,
                      tempHour === hour && styles.timePickerItemTextSelected,
                    ]}
                  >
                    {hour}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.timePickerColumn}>
            <Text style={styles.timePickerColumnLabel}>Minute</Text>
            <ScrollView 
              style={styles.timePickerScroll}
              showsVerticalScrollIndicator={false}
            >
              {minutes.map((minute) => (
                <TouchableOpacity
                  key={minute}
                  style={[
                    styles.timePickerItem,
                    tempMinute === minute && styles.timePickerItemSelected,
                  ]}
                  onPress={() => setTempMinute(minute)}
                >
                  <Text
                    style={[
                      styles.timePickerItemText,
                      tempMinute === minute && styles.timePickerItemTextSelected,
                    ]}
                  >
                    {minute.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.timePickerColumn}>
            <Text style={styles.timePickerColumnLabel}>Period</Text>
            <ScrollView 
              style={styles.timePickerScroll}
              showsVerticalScrollIndicator={false}
            >
              {['AM', 'PM'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.timePickerItem,
                    tempPeriod === period && styles.timePickerItemSelected,
                  ]}
                  onPress={() => setTempPeriod(period as 'AM' | 'PM')}
                >
                  <Text
                    style={[
                      styles.timePickerItemText,
                      tempPeriod === period && styles.timePickerItemTextSelected,
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  };

  const handleSendInvitation = () => {
    const invitationData: Record<string, string> = {
      placeName: placeName || '',
      placeAddress: editableAddress,
      placeCity: editableCity,
      placeCountry: editableCountry,
      placeGoogleMapsUrl: fallbackMapsUrl,
      placeId: placeId || '',
      date: selectedDate.toISOString(),
      time: selectedTime.toISOString(),
      fromInvitation: 'true',
    };
    
    const params = new URLSearchParams(invitationData).toString();
    router.push(`/(tabs)/messages?${params}` as any);
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, firstDay } = getDaysInMonth(calendarMonth);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(firstDay.getFullYear(), firstDay.getMonth(), day));
    }

    return (
      <View style={styles.calendar}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.monthButton}>
            <ChevronLeft size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthYearText}>
            {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => changeMonth('next')} style={styles.monthButton}>
            <ChevronRight size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.weekDaysRow}>
          {weekDays.map((day) => (
            <View key={day} style={styles.weekDayCell}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {days.map((date, index) => {
            if (!date) {
              return <View key={`empty-${index}`} style={styles.dayCell} />;
            }

            const isSelected = isSameDay(date, selectedDate);
            const isTodayDate = isToday(date);
            const isPast = isPastDate(date);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  isSelected && styles.selectedDayCell,
                  isTodayDate && !isSelected && styles.todayDayCell,
                ]}
                onPress={() => !isPast && handleDateSelect(date)}
                disabled={isPast}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.selectedDayText,
                    isTodayDate && !isSelected && styles.todayDayText,
                    isPast && styles.pastDayText,
                  ]}
                >
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
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
              <View style={styles.calendarWrapper}>
                {renderCalendar()}
              </View>
            </View>
          </View>
        </Modal>
      );
    }

    if (showTimePicker) {
      if (Platform.OS === 'ios') {
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
      } else {
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
                  <TouchableOpacity onPress={handleTimeDone}>
                    <Text style={styles.iosModalDoneButton}>Done</Text>
                  </TouchableOpacity>
                </View>
                {renderCustomTimePicker()}
              </View>
            </View>
          </Modal>
        );
      }
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={styles.backButton}>
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
              <MapPin size={14} color={Colors.textLight} style={{ marginTop: 3 }} />
              {isEditingAddress ? (
                <View style={{ flex: 1, gap: 8 }}>
                  <TextInput
                    style={styles.addressInput}
                    value={editableAddress}
                    onChangeText={setEditableAddress}
                    multiline
                    autoFocus
                    placeholder="Enter address"
                    placeholderTextColor={Colors.textLight}
                  />
                  <TextInput
                    style={styles.addressInputSmall}
                    value={editableCity}
                    onChangeText={setEditableCity}
                    placeholder="City"
                    placeholderTextColor={Colors.textLight}
                  />
                  <TextInput
                    style={styles.addressInputSmall}
                    value={editableCountry}
                    onChangeText={setEditableCountry}
                    placeholder="Country"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>
              ) : isResolvingAddress ? (
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 }}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.resolvingAddressText}>Getting real address from Google...</Text>
                  </View>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <Text style={styles.restaurantAddress} numberOfLines={2}>
                    {editableAddress || 'Restaurant Address'}
                  </Text>
                  {(editableCity || editableCountry) && (
                    <Text style={styles.restaurantCityCountry}>
                      {[editableCity, editableCountry].filter(Boolean).join(', ')}
                    </Text>
                  )}
                </View>
              )}
              <TouchableOpacity
                style={styles.editAddressButton}
                onPress={() => setIsEditingAddress(!isEditingAddress)}
                activeOpacity={0.7}
              >
                {isEditingAddress ? (
                  <Check size={16} color={Colors.primary} />
                ) : (
                  <Pencil size={14} color={Colors.textLight} />
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.viewOnMapButton}
              onPress={handleOpenMaps}
              activeOpacity={0.7}
            >
              <ExternalLink size={14} color={Colors.primary} />
              <Text style={styles.viewOnMapText}>View on Google Maps</Text>
            </TouchableOpacity>
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
              handleTimePickerOpen();
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
  addressInput: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  addressInputSmall: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  restaurantCityCountry: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    lineHeight: 16,
  },
  resolvingAddressText: {
    fontSize: 13,
    color: Colors.textLight,
    fontStyle: 'italic' as const,
  },
  editAddressButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginLeft: 8,
  },
  viewOnMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 165, 0, 0.08)',
    gap: 6,
  },
  viewOnMapText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
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
    backgroundColor: '#FFFFFF',
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
    color: '#888888',
  },
  iosModalDoneButton: {
    fontSize: 17,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  iosPickerWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 0,
    minHeight: 260,
  },
  iosPicker: {
    width: '100%',
    height: 260,
  },
  calendarWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 400,
  },
  calendar: {
    backgroundColor: '#FFFFFF',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  monthButton: {
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.08)',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000000',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#999999',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 2,
  },
  dayCell: {
    width: '14.285%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  selectedDayCell: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
  },
  todayDayCell: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 24,
  },
  dayText: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '500' as const,
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  todayDayText: {
    color: Colors.primary,
    fontWeight: '700' as const,
  },
  pastDayText: {
    color: '#D0D0D0',
    fontWeight: '400' as const,
  },
  customTimePickerContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 16,
    minHeight: 300,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerColumnLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666666',
    marginBottom: 12,
  },
  timePickerScroll: {
    maxHeight: 200,
  },
  timePickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 4,
  },
  timePickerItemSelected: {
    backgroundColor: Colors.primary,
  },
  timePickerItemText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '500' as const,
  },
  timePickerItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
});
