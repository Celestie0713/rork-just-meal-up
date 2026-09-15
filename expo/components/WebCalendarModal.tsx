import { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface WebCalendarModalProps {
  visible: boolean;
  value: Date;
  minimumDate?: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Dark-themed calendar bottom sheet used on web, where the native
 * DateTimePicker renders nothing. Picking a day reports it back and closes.
 */
export function WebCalendarModal({ visible, value, minimumDate, onChange, onClose }: WebCalendarModalProps) {
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());

  useEffect(() => {
    if (visible) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
    }
  }, [visible, value]);

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const result: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) result.push(null);
    // Noon keeps the date stable across UTC conversions when formatted.
    for (let d = 1; d <= daysInMonth; d++) result.push(new Date(viewYear, viewMonth, d, 12));
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [viewYear, viewMonth]);

  const today = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const isDisabled = (d: Date) =>
    minimumDate != null &&
    d < new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate());

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const handlePick = (day: Date) => {
    if (isDisabled(day)) return;
    onChange(day);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Select Date</Text>
            <View style={{ width: 48 }} />
          </View>

          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.monthNavButton}>
              <ChevronLeft size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{`${MONTHS[viewMonth]} ${viewYear}`}</Text>
            <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.monthNavButton}>
              <ChevronRight size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={styles.weekday}>{day}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, index) => {
              if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
              const disabled = isDisabled(day);
              const selected = sameDay(day, value);
              const isToday = sameDay(day, today);
              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  style={styles.dayCell}
                  disabled={disabled}
                  onPress={() => handlePick(day)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.dayInner,
                      selected && styles.daySelected,
                      !selected && isToday && styles.dayToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        disabled && styles.dayTextDisabled,
                        selected && styles.dayTextSelected,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelButton: {
    fontSize: 16,
    color: Colors.textLight,
    width: 48,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 12,
  },
  monthNavButton: {
    padding: 8,
  },
  monthLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  weekday: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayToday: {
    borderColor: Colors.primary,
  },
  daySelected: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: 15,
    color: Colors.text,
  },
  dayTextDisabled: {
    color: Colors.border,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
