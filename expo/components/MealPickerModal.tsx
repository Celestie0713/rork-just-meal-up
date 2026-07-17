import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  Pressable,
  Platform,
} from 'react-native';
import { X, Sparkles, Shuffle, Plus, Send, Trash2, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type PickerPlace = {
  id: string;
  name: string;
  emoji: string;
  city: string;
};

type Phase = 'select' | 'shuffling' | 'result';

interface CardAnim {
  x: Animated.Value;
  y: Animated.Value;
  rot: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  flip: Animated.Value;
}

interface MealPickerModalProps {
  visible: boolean;
  places: PickerPlace[];
  onClose: () => void;
  onAddPlace: () => void;
  onRemovePlace: (id: string) => void;
  onPick: (place: PickerPlace) => void;
  onInviteePick: (places: PickerPlace[]) => void;
}

const CARD_W = 96;
const CARD_H = 128;
const SHUFFLE_AREA_HEIGHT = 360;
const MIN_TO_SHUFFLE = 2;

export function MealPickerModal({
  visible,
  places,
  onClose,
  onAddPlace,
  onRemovePlace,
  onPick,
  onInviteePick,
}: MealPickerModalProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [shuffleCards, setShuffleCards] = useState<PickerPlace[]>([]);
  const [winnerIndex, setWinnerIndex] = useState<number>(0);
  const [winner, setWinner] = useState<PickerPlace | null>(null);

  const cardAnimsRef = useRef<CardAnim[]>([]);

  const reset = useCallback(() => {
    setPhase('select');
    setShuffleCards([]);
    setWinner(null);
    setWinnerIndex(0);
    cardAnimsRef.current = [];
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleAddPlace = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAddPlace();
  }, [onAddPlace]);

  const handleRemovePlace = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemovePlace(id);
  }, [onRemovePlace]);

  const startShuffle = useCallback(() => {
    if (places.length < MIN_TO_SHUFFLE) return;

    const cards = [...places];
    const pickIdx = Math.floor(Math.random() * cards.length);

    cardAnimsRef.current = cards.map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rot: new Animated.Value(0),
      scale: new Animated.Value(0.7),
      opacity: new Animated.Value(0),
      flip: new Animated.Value(0),
    }));

    setShuffleCards(cards);
    setWinnerIndex(pickIdx);
    setWinner(null);
    setPhase('shuffling');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setTimeout(() => runShuffleAnimation(pickIdx, cards), 180);
  }, [places]);

  const runShuffleAnimation = (pickIdx: number, cards: PickerPlace[]) => {
    const anims = cardAnimsRef.current;
    if (anims.length === 0) return;

    const fadeIn = Animated.parallel(
      anims.map((a) =>
        Animated.parallel([
          Animated.timing(a.opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.spring(a.scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        ])
      )
    );

    const fanOut = Animated.parallel(
      anims.map((a, i) => {
        const offset = (i - (anims.length - 1) / 2) * 60;
        return Animated.parallel([
          Animated.timing(a.x, { toValue: offset, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(a.rot, { toValue: (i - (anims.length - 1) / 2) * 4, duration: 320, useNativeDriver: true }),
        ]);
      })
    );

    const rounds: Animated.CompositeAnimation[] = [];
    const roundCount = 5;
    for (let r = 0; r < roundCount; r++) {
      const roundAnims = anims.map((a) => {
        const randX = (Math.random() - 0.5) * 240;
        const randY = (Math.random() - 0.5) * 70;
        const randRot = (Math.random() - 0.5) * 35;
        return Animated.parallel([
          Animated.timing(a.x, { toValue: randX, duration: 200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(a.y, { toValue: randY, duration: 200, useNativeDriver: true }),
          Animated.timing(a.rot, { toValue: randRot, duration: 200, useNativeDriver: true }),
        ]);
      });
      rounds.push(
        Animated.parallel([
          ...roundAnims,
          Animated.delay(0).start(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }) as unknown as Animated.CompositeAnimation,
        ])
      );
    }

    const collapse = Animated.parallel(
      anims.map((a) =>
        Animated.parallel([
          Animated.timing(a.x, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
          Animated.timing(a.y, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(a.rot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      )
    );

    const losersFade = Animated.parallel(
      anims.map((a, i) =>
        i === pickIdx
          ? Animated.parallel([
              Animated.timing(a.y, { toValue: -30, duration: 450, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
              Animated.spring(a.scale, { toValue: 1.35, friction: 5, tension: 80, useNativeDriver: true }),
            ])
          : Animated.parallel([
              Animated.timing(a.opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
              Animated.timing(a.scale, { toValue: 0.4, duration: 350, useNativeDriver: true }),
            ])
      )
    );

    const winnerFlip = Animated.timing(anims[pickIdx].flip, {
      toValue: 180,
      duration: 600,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });

    Animated.sequence([
      fadeIn,
      fanOut,
      ...rounds,
      collapse,
      Animated.parallel([losersFade, winnerFlip]),
    ]).start(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setWinner(cards[pickIdx]);
      setTimeout(() => setPhase('result'), 250);
    });
  };

  const handleSearch = useCallback(() => {
    if (winner) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPick(winner);
      reset();
    }
  }, [winner, onPick, reset]);

  const handleInviteePick = useCallback(() => {
    if (places.length < MIN_TO_SHUFFLE) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onInviteePick(places);
    reset();
  }, [places, onInviteePick, reset]);

  const centerX = SCREEN_WIDTH / 2 - CARD_W / 2;
  const centerY = SHUFFLE_AREA_HEIGHT / 2 - CARD_H / 2;
  const canShuffle = places.length >= MIN_TO_SHUFFLE;

  if (!visible) return null;

  const SQUARE_SIZE = (SCREEN_WIDTH - 40 - 30) / 3;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={handleClose} />

      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {phase === 'select' && 'Meal Picker'}
            {phase === 'shuffling' && 'Shuffling...'}
            {phase === 'result' && 'Your pick!'}
          </Text>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <X size={22} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        {phase === 'select' && (
          <>
            <Text style={styles.subtitle}>
              Can't decide where to eat? Add a few places and let fate choose one for you. 🎴
            </Text>
            <ScrollView style={styles.placesScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.placesGrid}>
              {places.map((place) => (
                <View key={place.id} style={[styles.placeSquare, { width: SQUARE_SIZE, height: SQUARE_SIZE }]}>
                  <TouchableOpacity
                    style={styles.placeRemoveBtn}
                    onPress={() => handleRemovePlace(place.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={13} color="#FF6B35" />
                  </TouchableOpacity>
                  <Text style={styles.placeEmoji}>{place.emoji}</Text>
                  <Text style={styles.placeName} numberOfLines={2}>{place.name}</Text>
                  <Text style={styles.placeCity} numberOfLines={1}>{place.city}</Text>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.addSquare, { width: SQUARE_SIZE, height: SQUARE_SIZE }]}
                onPress={handleAddPlace}
                activeOpacity={0.7}
              >
                <View style={styles.addCircle}>
                  <Plus size={26} color={Colors.primary} strokeWidth={2.5} />
                </View>
                <Text style={styles.addLabel}>Add a place</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.footer}>
              <Text style={styles.countText}>
                {places.length === 0
                  ? 'Tap the box above to add places'
                  : places.length < MIN_TO_SHUFFLE
                    ? `Add ${MIN_TO_SHUFFLE - places.length} more to shuffle`
                    : `${places.length} places — ready to shuffle!`}
              </Text>

              <TouchableOpacity
                style={[styles.primaryButton, !canShuffle && styles.primaryButtonDisabled]}
                onPress={startShuffle}
                disabled={!canShuffle}
                activeOpacity={0.8}
              >
                <Shuffle size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>I'll shuffle & pick</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, !canShuffle && styles.secondaryButtonDisabled]}
                onPress={handleInviteePick}
                disabled={!canShuffle}
                activeOpacity={0.8}
              >
                <Send size={17} color={canShuffle ? Colors.primary : '#666666'} />
                <Text style={[styles.secondaryButtonText, !canShuffle && styles.secondaryButtonTextDisabled]}>
                  Invitee will shuffle & pick
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {phase === 'shuffling' && (
          <View style={styles.shuffleStage}>
            <Text style={styles.shuffleHint}>The cards are deciding your fate...</Text>
            <View style={styles.shuffleArea}>
              {shuffleCards.map((card, i) => {
                const anims = cardAnimsRef.current[i];
                if (!anims) return null;
                const frontFlip = anims.flip.interpolate({
                  inputRange: [0, 180],
                  outputRange: ['0deg', '180deg'],
                });
                const backFlip = anims.flip.interpolate({
                  inputRange: [0, 180],
                  outputRange: ['180deg', '360deg'],
                });
                return (
                  <Animated.View
                    key={`${card.id}-${i}`}
                    style={[
                      styles.cardSlot,
                      {
                        left: centerX,
                        top: centerY,
                        opacity: anims.opacity,
                        transform: [
                          { translateX: anims.x },
                          { translateY: anims.y },
                          { rotate: anims.rot.interpolate({ inputRange: [-50, 50], outputRange: ['-50deg', '50deg'] }) },
                          { scale: anims.scale },
                        ],
                      },
                    ]}
                  >
                    <Animated.View
                      style={[styles.cardFace, styles.cardBack, { transform: [{ rotateY: backFlip }], backfaceVisibility: 'hidden' }]}
                    >
                      <Sparkles size={22} color={Colors.primary} />
                      <Text style={styles.cardBackLabel}>JMU</Text>
                      <View style={styles.cardBackDiamond} />
                    </Animated.View>
                    <Animated.View
                      style={[styles.cardFace, styles.cardFront, { transform: [{ rotateY: frontFlip }], backfaceVisibility: 'hidden' }]}
                    >
                      <Text style={styles.cardFrontEmoji}>{card.emoji}</Text>
                      <Text style={styles.cardFrontName} numberOfLines={2}>{card.name}</Text>
                    </Animated.View>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        )}

        {phase === 'result' && winner && (
          <View style={styles.resultStage}>
            <View style={styles.resultGlow} />
            <View style={styles.resultCard}>
              <Sparkles size={26} color={Colors.primary} style={styles.resultSparkle} />
              <Text style={styles.resultEmoji}>{winner.emoji}</Text>
              <Text style={styles.resultName}>{winner.name}</Text>
              <Text style={styles.resultCity}>{winner.city}</Text>
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>Fate has chosen</Text>
              </View>
            </View>

            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.8}>
                <Calendar size={18} color="#FFFFFF" />
                <Text style={styles.searchButtonText}>Set date & time</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 400,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 28,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  placesScroll: {
    paddingHorizontal: 12,
    paddingTop: 8,
    maxHeight: 340,
  },
  placesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 16,
  },
  placeSquare: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
  },
  placeRemoveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2A1A12',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  placeEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  placeName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 13,
    marginBottom: 2,
  },
  placeCity: {
    fontSize: 9,
    color: Colors.textLight,
    textAlign: 'center',
  },
  addSquare: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  addCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A1A12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  addLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  countText: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    gap: 10,
    marginBottom: 10,
  },
  primaryButtonDisabled: {
    backgroundColor: '#3A3A3A',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 15,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  secondaryButtonDisabled: {
    borderColor: '#444444',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  secondaryButtonTextDisabled: {
    color: '#666666',
  },

  shuffleStage: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  shuffleHint: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 16,
  },
  shuffleArea: {
    width: SCREEN_WIDTH,
    height: SHUFFLE_AREA_HEIGHT,
    position: 'relative',
  },
  cardSlot: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
  },
  cardFace: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  cardBackLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 2,
    marginTop: 6,
  },
  cardBackDiamond: {
    width: 10,
    height: 10,
    backgroundColor: Colors.primary,
    transform: [{ rotate: '45deg' }],
    marginTop: 8,
    opacity: 0.6,
  },
  cardFront: {
    backgroundColor: Colors.secondary,
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingHorizontal: 6,
  },
  cardFrontEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  cardFrontName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 13,
  },

  resultStage: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 12,
  },
  resultGlow: {
    position: 'absolute',
    top: 40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.primary,
    opacity: 0.12,
  },
  resultCard: {
    width: 200,
    height: 280,
    backgroundColor: Colors.secondary,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  resultSparkle: {
    marginBottom: 14,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  resultName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 4,
  },
  resultCity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 16,
  },
  resultBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultActions: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 12,
    width: '100%',
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    gap: 8,
  },
  searchButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
