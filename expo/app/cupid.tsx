import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Heart, ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import { useUserLocation } from '@/hooks/use-user-location';

const MAX_DISTANCE_MI = 1000;

/** Labels for the cupid "Interested in" choice. */
const INTERESTED_LABELS: Record<string, string> = { F: 'Female', M: 'Male' };

/**
 * Cupid page — the user's match preferences (who they're interested in,
 * age range, distance). Shown right after sign-up before the profile page,
 * and reachable again from the profile page to make changes.
 */
export default function CupidScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string }>();
  const { user, updateUser } = useAuth();
  const { requestLocation } = useUserLocation();

  // Edit mode = the user already completed cupid once and came back from
  // their profile. Onboarding mode = first-time, must complete to continue.
  const isEditMode = params.edit === 'true' || !!user?.hasCompletedCupid;

  const [interestedIn, setInterestedIn] = useState<'F' | 'M' | undefined>(user?.interestedIn);
  const [ageMin, setAgeMin] = useState(String(user?.preferences?.ageRange?.[0] ?? 21));
  const [ageMax, setAgeMax] = useState(String(user?.preferences?.ageRange?.[1] ?? 45));
  const [maxDistance, setMaxDistance] = useState<number>(user?.preferences?.maxDistance ?? 25);

  // Distance slider (0–1000 mi): custom PanResponder bar so it behaves
  // identically on native and web (the community slider has no solid web
  // support). trackWidthRef mirrors the measured bar width for the drag math.
  const trackWidthRef = useRef(0);
  const updateDistanceFromTouch = useCallback((locationX: number) => {
    const width = trackWidthRef.current;
    if (!width) return;
    const ratio = Math.min(1, Math.max(0, locationX / width));
    const next = Math.round(ratio * MAX_DISTANCE_MI);
    setMaxDistance((prev) => {
      if (prev !== next) {
        Haptics.selectionAsync().catch(() => {});
      }
      return next;
    });
  }, []);
  const updateDistanceRef = useRef(updateDistanceFromTouch);
  updateDistanceRef.current = updateDistanceFromTouch;
  const distancePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => updateDistanceRef.current(e.nativeEvent.locationX),
      onPanResponderMove: (e) => updateDistanceRef.current(e.nativeEvent.locationX),
    })
  ).current;

  const parseAge = (t: string): number | null => {
    const digits = t.replace(/\D/g, '').slice(0, 3);
    if (!digits) return null;
    return Math.min(parseInt(digits, 10), 100);
  };

  const minAge = parseAge(ageMin);
  const maxAge = parseAge(ageMax);
  const agesValid =
    minAge != null && maxAge != null && minAge >= 18 && maxAge >= minAge && minAge <= 100;
  const canContinue = !!interestedIn && agesValid;

  const handleContinue = async () => {
    if (!canContinue || !interestedIn) return;
    const currentPrefs = user?.preferences;
    // Capture real GPS coordinates (prompts for permission on native) so the
    // max-distance preference can filter the people list. Fails silently if
    // the user denies — distance filtering just stays off until next save.
    const coords = await requestLocation();
    await updateUser({
      ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
      interestedIn,
      hasCompletedCupid: true,
      preferences: {
        ...(currentPrefs ?? {
          cuisinePreferences: [],
        }),
        ageRange: [minAge as number, maxAge as number],
        maxDistance,
      },
    });
    if (isEditMode) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  const handleBack = () => {
    if (isEditMode) {
      router.back();
    }
    // Onboarding mode has no back — cupid must be completed first.
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            {isEditMode ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <ArrowLeft size={24} color={Colors.text} />
              </TouchableOpacity>
            ) : null}
            <View style={styles.headerIconWrap}>
              <Heart size={26} color={Colors.primary} fill={Colors.primary} />
            </View>
            <Text style={styles.title}>
              {isEditMode ? 'Cupid preferences' : 'Where’s the spark?'}
            </Text>
            <Text style={styles.subtitle}>
              {isEditMode
                ? 'Update who Cupid should aim at.'
                : 'Tell Cupid who to aim the arrow at. You can change this anytime.'}
            </Text>
          </View>

          {/* Interested in */}
          <Text style={styles.fieldLabel}>Interested in</Text>
          <View style={styles.genderRow}>
            {(['F', 'M'] as const).map((option) => {
              const selected = interestedIn === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.genderCard, selected && styles.genderCardSelected]}
                  onPress={() => setInterestedIn(option)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.genderLetter, selected && styles.genderLetterSelected]}>
                    {option}
                  </Text>
                  <Text style={[styles.genderSub, selected && styles.genderSubSelected]}>
                    {INTERESTED_LABELS[option]}
                  </Text>
                  {selected && (
                    <View style={styles.genderCheck}>
                      <Check size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Age range */}
          <Text style={styles.fieldLabel}>Age</Text>
          <View style={styles.ageRow}>
            <View style={styles.ageField}>
              <Text style={styles.ageFieldHint}>From</Text>
              <TextInput
                style={styles.ageInput}
                value={ageMin}
                onChangeText={(t) => setAgeMin(t.replace(/\D/g, '').slice(0, 3))}
                placeholder="21"
                placeholderTextColor="#666666"
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            <Text style={styles.ageDash}>—</Text>
            <View style={styles.ageField}>
              <Text style={styles.ageFieldHint}>To</Text>
              <TextInput
                style={styles.ageInput}
                value={ageMax}
                onChangeText={(t) => setAgeMax(t.replace(/\D/g, '').slice(0, 3))}
                placeholder="45"
                placeholderTextColor="#666666"
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
          </View>
          {ageMin.length > 0 && ageMax.length > 0 && !agesValid && (
            <Text style={styles.fieldError}>
              Enter a valid age range (18–100, “To” at least “From”).
            </Text>
          )}

          {/* Distance */}
          <View style={styles.distanceHeaderRow}>
            <Text style={styles.fieldLabel}>Distance</Text>
            <Text style={styles.distanceValue}>{maxDistance} mi</Text>
          </View>
          <View
            style={styles.sliderTrack}
            onLayout={(e) => {
              trackWidthRef.current = e.nativeEvent.layout.width;
            }}
            {...distancePanResponder.panHandlers}
          >
            <View style={styles.sliderTrackBase} />
            <View
              style={[
                styles.sliderFill,
                { width: `${(maxDistance / MAX_DISTANCE_MI) * 100}%` },
              ]}
            />
            <View
              style={[
                styles.sliderThumb,
                { left: `${(maxDistance / MAX_DISTANCE_MI) * 100}%` },
              ]}
            />
          </View>
          <View style={styles.sliderBoundsRow}>
            <Text style={styles.sliderBound}>0 mi</Text>
            <Text style={styles.sliderBound}>{MAX_DISTANCE_MI} mi</Text>
          </View>
          <Text style={styles.distanceHint}>How far should Cupid search for your match?</Text>

          {/* Continue */}
          <TouchableOpacity
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              {isEditMode ? 'Save' : 'Continue'}
            </Text>
            {!isEditMode && <ArrowRight size={18} color="#FFFFFF" />}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 28,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: `${Colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  genderCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  genderCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}14`,
  },
  genderLetter: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.textLight,
  },
  genderLetterSelected: {
    color: Colors.primary,
  },
  genderSub: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
    marginTop: 2,
  },
  genderSubSelected: {
    color: Colors.text,
  },
  genderCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  ageField: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ageFieldHint: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 2,
  },
  ageInput: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    padding: 0,
  },
  ageDash: {
    color: Colors.textLight,
    fontSize: 18,
  },
  fieldError: {
    fontSize: 12,
    color: '#FF4444',
    marginBottom: 8,
  },
  distanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 14,
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  sliderTrack: {
    height: 36,
    justifyContent: 'center',
    marginBottom: 2,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  sliderTrackBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  sliderThumb: {
    position: 'absolute',
    top: '50%',
    marginLeft: -13,
    marginTop: -13,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderBoundsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderBound: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textLight,
  },
  distanceHint: {
    fontSize: 12,
    color: '#777777',
    marginBottom: 32,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 54,
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
