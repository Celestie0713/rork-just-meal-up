import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Modal, Animated, Dimensions, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { MapPin, Users, DollarSign, Heart, Calendar, Crown, Plus, X, Shield, Star, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/colors';
import { mockGroups } from '@/mocks/groups';
import { mockMealUps } from '@/mocks/meal-ups';
import { MealUpCard } from '@/components/MealUpCard';
import type { MealUp } from '@/types/user';

export default function GroupDetailsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [isMember, setIsMember] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const successScaleAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  const openJoinModal = () => {
    setShowJoinModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    modalScaleAnim.setValue(0.7);
    modalOpacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeJoinModal = () => {
    Animated.parallel([
      Animated.timing(modalScaleAnim, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setShowJoinModal(false));
  };

  const confirmJoin = () => {
    closeJoinModal();
    setTimeout(() => {
      setIsMember(true);
      setShowSuccessModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      successScaleAnim.setValue(0);
      checkAnim.setValue(0);
      Animated.sequence([
        Animated.spring(successScaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(checkAnim, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(successScaleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => setShowSuccessModal(false));
      }, 2000);
    }, 300);
  };

  const group = mockGroups.find(g => g.id === groupId);

  if (!group) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Group Not Found' }} />
        <Text style={styles.errorText}>Group not found</Text>
      </View>
    );
  }

  const upcomingMealUpsData = mockMealUps.filter(mealUp => 
    group.upcomingMealUps.includes(mealUp.id)
  );

  const handleJoinGroup = () => {
    openJoinModal();
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: () => {
            setIsMember(false);
            Alert.alert('Left Group', 'You have left the group.');
          }
        }
      ]
    );
  };

  const handleMealUpPress = (mealUp: MealUp) => {
    router.push(`/meal-up-details?mealUpId=${mealUp.id}` as any);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: group.name,
          headerTitleStyle: { fontSize: 16 }
        }} 
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: group.imageUrl }} style={styles.headerImage} />
        <LinearGradient
          colors={Gradients.secondary}
          style={styles.headerGradient}
        >
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupDescription}>{group.description}</Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                {group.isPaid ? (
                  <DollarSign size={18} color={Colors.primary} />
                ) : (
                  <Heart size={18} color={Colors.primary} />
                )}
              </View>
              <Text style={styles.infoLabel}>
                {group.isPaid ? `$${group.monthlyFee}/month` : 'Free'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Users size={18} color={Colors.primary} />
              </View>
              <Text style={styles.infoLabel}>{group.memberCount} members</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <MapPin size={18} color={Colors.primary} />
              </View>
              <Text style={styles.infoLabel}>{group.location}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.hostRow}
            onPress={() => router.push(`/user-profile?userId=${group.hostedBy.userId}` as any)}
            activeOpacity={0.7}
          >
            <Image source={{ uri: group.hostedBy.avatar }} style={styles.hostAvatar} />
            <View style={styles.hostInfo}>
              <Text style={styles.hostLabel}>Hosted by</Text>
              <Text style={styles.hostName}>{group.hostedBy.name}</Text>
            </View>
            <Crown size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.joinButton, isMember && styles.leaveButton]}
            onPress={isMember ? handleLeaveGroup : handleJoinGroup}
          >
            <Text style={styles.joinButtonText}>
              {isMember ? 'Leave Group' : 'Join Group'}
            </Text>
          </TouchableOpacity>
          {isMember && (
            <TouchableOpacity 
              style={styles.createMealUpButton}
              onPress={() => router.push(`/create-meal-up?groupId=${group.id}&groupName=${encodeURIComponent(group.name)}` as any)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.createMealUpButtonText}>Create Meal Up Session</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
        {upcomingMealUpsData.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={Colors.text} />
              <Text style={styles.sectionTitle}>Upcoming Meal-Ups</Text>
            </View>
            {upcomingMealUpsData.map(mealUp => (
              <MealUpCard 
                key={mealUp.id} 
                mealUp={mealUp} 
                onPress={() => handleMealUpPress(mealUp)} 
              />
            ))}
          </View>
        )}
        {upcomingMealUpsData.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No posts or upcoming events yet. Be the first to start the conversation!
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showJoinModal}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeJoinModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeJoinModal}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: modalOpacityAnim,
                transform: [{ scale: modalScaleAnim }],
              },
            ]}
          >
            <Pressable onPress={() => {}}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={closeJoinModal} activeOpacity={0.7}>
                <X size={20} color="#999" />
              </TouchableOpacity>

              <View style={styles.modalGroupImageContainer}>
                <Image source={{ uri: group.imageUrl }} style={styles.modalGroupImage} />
                <View style={styles.modalGroupImageOverlay} />
                <View style={styles.modalBadge}>
                  {group.isPaid ? (
                    <Star size={14} color="#FFF" fill="#FFF" />
                  ) : (
                    <Heart size={14} color="#FFF" fill="#FFF" />
                  )}
                  <Text style={styles.modalBadgeText}>
                    {group.isPaid ? 'Premium' : 'Free'}
                  </Text>
                </View>
              </View>

              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Join {group.name}?</Text>
                
                <View style={styles.modalStatsRow}>
                  <View style={styles.modalStat}>
                    <Users size={16} color={Colors.primary} />
                    <Text style={styles.modalStatText}>{group.memberCount} members</Text>
                  </View>
                  <View style={styles.modalStat}>
                    <MapPin size={16} color={Colors.primary} />
                    <Text style={styles.modalStatText}>{group.location}</Text>
                  </View>
                </View>

                {group.isPaid && (
                  <View style={styles.modalPriceCard}>
                    <View style={styles.modalPriceLeft}>
                      <DollarSign size={20} color={Colors.primary} />
                      <View>
                        <Text style={styles.modalPriceAmount}>${group.monthlyFee}</Text>
                        <Text style={styles.modalPricePeriod}>per month</Text>
                      </View>
                    </View>
                    <View style={styles.modalPriceDivider} />
                  </View>
                )}

                <View style={styles.modalHostRow}>
                  <Image source={{ uri: group.hostedBy.avatar }} style={styles.modalHostAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalHostLabel}>Hosted by</Text>
                    <Text style={styles.modalHostName}>{group.hostedBy.name}</Text>
                  </View>
                  <Shield size={16} color={Colors.success} />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={closeJoinModal} activeOpacity={0.7}>
                    <Text style={styles.modalCancelText}>Not Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalJoinBtn} onPress={confirmJoin} activeOpacity={0.8}>
                    <Text style={styles.modalJoinText}>
                      {group.isPaid ? `Join for ${group.monthlyFee}/mo` : 'Join Group'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <View style={styles.successOverlay}>
          <Animated.View
            style={[
              styles.successContainer,
              { transform: [{ scale: successScaleAnim }] },
            ]}
          >
            <Animated.View style={[styles.successCheckCircle, { transform: [{ scale: checkAnim }] }]}>
              <CheckCircle size={48} color="#FFF" />
            </Animated.View>
            <Text style={styles.successTitle}>Welcome!</Text>
            <Text style={styles.successSubtitle}>You've joined {group.name}</Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerImage: {
    width: '100%',
    height: 250,
  },
  headerGradient: {
    padding: 20,
    marginTop: -40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  groupName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 12,
  },
  groupDescription: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    marginBottom: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  infoIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  hostRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    gap: 12,
  },
  hostAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  hostInfo: {
    flex: 1,
  },
  hostLabel: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500' as const,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000000',
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  leaveButton: {
    backgroundColor: '#666666',
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createMealUpButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#1A8D1A',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  createMealUpButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  section: {
    padding: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },

  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    overflow: 'hidden',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalGroupImageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  modalGroupImage: {
    width: '100%',
    height: '100%',
  },
  modalGroupImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  modalBadge: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFF',
    letterSpacing: 0.3,
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 14,
  },
  modalStatsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  modalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalStatText: {
    fontSize: 13,
    color: '#AAAAAA',
    fontWeight: '500' as const,
  },
  modalPriceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  modalPriceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalPriceAmount: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  modalPricePeriod: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500' as const,
  },
  modalPriceDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#444',
  },
  modalPricePerks: {
    flex: 1,
    gap: 3,
  },
  modalPerkItem: {
    fontSize: 12,
    color: '#CCC',
    fontWeight: '500' as const,
  },
  modalHostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    padding: 12,
    borderRadius: 14,
    marginBottom: 20,
    gap: 10,
  },
  modalHostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  modalHostLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500' as const,
  },
  modalHostName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#AAA',
  },
  modalJoinBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalJoinText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    width: 260,
  },
  successCheckCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#FFF',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    fontWeight: '500' as const,
  },
});
