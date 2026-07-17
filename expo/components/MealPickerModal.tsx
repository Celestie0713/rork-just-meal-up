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
import { X, Sparkles, Shuffle, Search, RotateCcw, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CUISINES: { name: string; emoji: string }[] = [
  { name: 'Sushi', emoji: '🍣' },
  { name: 'Pizza', emoji: '🍕' },
  { name: 'Ramen', emoji: '🍜' },
  { name: 'Tacos', emoji: '🌮' },
  { name: 'Burger', emoji: '🍔' },
  { name: 'Pad Thai', emoji: '🍝' },
  { name: 'Pho', emoji: '🍲' },
  { name: 'Korean BBQ', emoji: '🥩' },
  { name: 'Pasta', emoji: '🍝' },
  { name: 'Curry', emoji: '🍛' },
  { name: 'Dumplings', emoji: '🥟' },
  { name: 'Kebab', emoji: '🍢' },
  { name: 'Paella', emoji: '🥘' },
  { name: 'Steak', emoji: '🥩' },
  { name: 'Lobster', emoji: '🦞' },
  { name: 'Biryani', emoji: '🍚' },
  { name: 'Nachos', emoji: '🧀' },
  { name: 'Wings', emoji: '🍗' },
  { name: 'Salad', emoji: '🥗' },
  { name: 'Smoothie Bowl', emoji: '🥣' },
  { name: 'Crepe', emoji: '🥞' },
  { name: 'Gelato', emoji: '🍨' },
  { name: 'Barbecue', emoji: '🔥' },
  { name: 'Sandwich', emoji: '🥪' },
  { name: 'Hot Pot', emoji: '🍲' },
  { name: 'Dim Sum', emoji: '🥟' },
  { name: 'Poke', emoji: '🥗' },
  { name: 'Burrito', emoji: '🌯' },
];

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
  onClose: () => void;
  onPick: (cuisine: string) => void;
}

const CARD_W = 96;
const CARD_H = 128;
const SHUFFLE_AREA_HEIGHT = 360;

export function MealPickerModal({ visible, onClose, onPick }: MealPickerModalProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selected, setSelected] = useState<string[]>([]);
  const [shuffleCards, setShuffleCards] = useState<typeof CUISINES>([]);
  const [winnerIndex, setWinnerIndex] = useState<number>(0);
  const [winner, setWinner] = useState<typeof CUISINES[number] | null>(null);

  const cardAnimsRef = useRef<CardAnim[]>([]);

  const toggleCuisine = useCallback((name: string) => {
    Haptics.selectionAsync();
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  }, []);

  const reset = useCallback(() => {
    setPhase('select');
    setSelected([]);
    setShuffleCards([]);
    setWinner(null);
    setWinnerIndex(0);
    cardAnimsRef.current = [];
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const startShuffle = useCallback(() => {
    if (selected.length < 3) return;

    const cards = CUISINES.filter((c) => selected.includes(c.name));
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
  }, [selected]);

  const runShuffleAnimation = (pickIdx: number, cards: typeof CUISINES) => {
    const anims = cardAnimsRef.current;
    if (anims.length === 0) return;

    // Phase 1: converge to center & fade in
    const fadeIn = Animated.parallel(
      anims.map((a) =>
        Animated.parallel([
          Animated.timing(a.opacity, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.spring(a.scale, {
            toValue: 1,
            friction: 6,
            tension: 60,
            useNativeDriver: true,
          }),
        ])
      )
    );

    // Phase 2: fan out into a row
    const fanOut = Animated.parallel(
      anims.map((a, i) => {
        const offset = (i - (anims.length - 1) / 2) * 60;
        return Animated.parallel([
          Animated.timing(a.x, {
            toValue: offset,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(a.rot, {
            toValue: (i - (anims.length - 1) / 2) * 4,
            duration: 320,
            useNativeDriver: true,
          }),
        ]);
      })
    );

    // Phase 3: shuffle rounds (cards swap random positions)
    const rounds: Animated.CompositeAnimation[] = [];
    const roundCount = 5;
    for (let r = 0; r < roundCount; r++) {
      const roundAnims = anims.map((a, i) => {
        const randX = (Math.random() - 0.5) * 240;
        const randY = (Math.random() - 0.5) * 70;
        const randRot = (Math.random() - 0.5) * 35;
        return Animated.parallel([
          Animated.timing(a.x, {
            toValue: randX,
            duration: 200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(a.y, {
            toValue: randY,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(a.rot, {
            toValue: randRot,
            duration: 200,
            useNativeDriver: true,
          }),
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

    // Phase 4: collapse back to center stack
    const collapse = Animated.parallel(
      anims.map((a) =>
        Animated.parallel([
          Animated.timing(a.x, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(a.y, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(a.rot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      )
    );

    // Phase 5: losers fade out, winner rises & flips
    const losersFade = Animated.parallel(
      anims.map((a, i) =>
        i === pickIdx
          ? Animated.parallel([
              Animated.timing(a.y, {
                toValue: -30,
                duration: 450,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
              }),
              Animated.spring(a.scale, {
                toValue: 1.35,
                friction: 5,
                tension: 80,
                useNativeDriver: true,
              }),
            ])
          : Animated.parallel([
              Animated.timing(a.opacity, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
              }),
              Animated.timing(a.scale, {
                toValue: 0.4,
                duration: 350,
                useNativeDriver: true,
              }),
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

  const shuffleAgain = useCallback(() => {
    startShuffle();
  }, [startShuffle]);

  const handleSearch = useCallback(() => {
    if (winner) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPick(winner.name);
      reset();
    }
  }, [winner, onPick, reset]);

  const centerX = SCREEN_WIDTH / 2 - CARD_W / 2;
  const centerY = SHUFFLE_AREA_HEIGHT / 2 - CARD_H / 2;

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
              Can't decide what to eat? Pick 3 or more options and let fate choose one for you. 🎴
            </Text>
            <ScrollView style={styles.cuisineScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.cuisineGrid}>
              {CUISINES.map((c) => {
                const isSelected = selected.includes(c.name);
                return (
                  <TouchableOpacity
                    key={c.name}
                    style={[styles.cuisineCard, isSelected && styles.cuisineCardActive]}
                    onPress={() => toggleCuisine(c.name)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cuisineEmoji}>{c.emoji}</Text>
                    <Text style={[styles.cuisineName, isSelected && styles.cuisineNameActive]} numberOfLines={1}>
                      {c.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.cuisineCheck}>
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.footer}>
              <Text style={styles.countText}>
                {selected.length < 3
                  ? `Pick ${3 - selected.length} more to shuffle`
                  : `${selected.length} selected — ready to shuffle!`}
              </Text>
              <TouchableOpacity
                style={[styles.shuffleButton, selected.length < 3 && styles.shuffleButtonDisabled]}
                onPress={startShuffle}
                disabled={selected.length < 3}
                activeOpacity={0.8}
              >
                <Shuffle size={18} color="#FFFFFF" />
                <Text style={styles.shuffleButtonText}>Shuffle & Pick</Text>
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
                    key={`${card.name}-${i}`}
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
                    {/* Card back (face down) */}
                    <Animated.View
                      style={[styles.cardFace, styles.cardBack, { transform: [{ rotateY: backFlip }], backfaceVisibility: 'hidden' }]}
                    >
                      <Sparkles size={22} color={Colors.primary} />
                      <Text style={styles.cardBackLabel}>JMU</Text>
                      <View style={styles.cardBackDiamond} />
                    </Animated.View>
                    {/* Card front (cuisine) */}
                    <Animated.View
                      style={[styles.cardFace, styles.cardFront, { transform: [{ rotateY: frontFlip }], backfaceVisibility: 'hidden' }]}
                    >
                      <Text style={styles.cardFrontEmoji}>{card.emoji}</Text>
                      <Text style={styles.cardFrontName} numberOfLines={1}>{card.name}</Text>
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
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>Fate has chosen</Text>
              </View>
            </View>

            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.againButton} onPress={shuffleAgain} activeOpacity={0.7}>
                <RotateCcw size={18} color={Colors.text} />
                <Text style={styles.againButtonText}>Shuffle again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.8}>
                <Search size={18} color="#FFFFFF" />
                <Text style={styles.searchButtonText}>Search restaurants</Text>
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 400,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  cuisineScroll: {
    paddingHorizontal: 12,
    paddingTop: 8,
    maxHeight: 380,
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 16,
  },
  cuisineCard: {
    width: (SCREEN_WIDTH - 24 - 30) / 3,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
  },
  cuisineCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#2A1A12',
  },
  cuisineEmoji: {
    fontSize: 30,
    marginBottom: 6,
  },
  cuisineName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
    textAlign: 'center',
  },
  cuisineNameActive: {
    color: Colors.text,
  },
  cuisineCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
  },
  shuffleButtonDisabled: {
    backgroundColor: '#3A3A3A',
  },
  shuffleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
  },
  cardFrontEmoji: {
    fontSize: 40,
    marginBottom: 6,
  },
  cardFrontName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
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
    height: 260,
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
    fontSize: 72,
    marginBottom: 14,
  },
  resultName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
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
  againButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 15,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  againButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  searchButton: {
    flex: 1.3,
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
