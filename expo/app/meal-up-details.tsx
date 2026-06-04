import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Share, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { safeGoBack } from '@/utils/navigation';
import { Calendar, Clock, MapPin, Users, DollarSign, Share2, ArrowLeft, Heart, ChevronLeft, ChevronRight, Check, BadgePercent } from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/colors';
import { mockMealUps } from '@/mocks/meal-ups';
import { mockUsers } from '@/mocks/users';


export default function MealUpDetailsScreen() {
  const { mealUpId } = useLocalSearchParams<{ mealUpId: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  
  const mealUp = mockMealUps.find(m => m.id === mealUpId);
  const organizer = mockUsers.find(u => u.id === mealUp?.organizerId);
  
  const isPaidGroup = mealUp?.group?.isPaid && mealUp?.group?.memberDiscount;
  const discountPercent = isPaidGroup ? parseInt((mealUp?.group?.memberDiscount ?? '0').replace('%', '')) / 100 : 0;
  const discountedPrice = isPaidGroup ? Math.round(mealUp!.ticketPrice * (1 - discountPercent)) : 0;
  
  const images = mealUp?.images || [mealUp?.imageUrl].filter(Boolean);
  const maxImages = Math.min(images.length, 10);
  const displayImages = images.slice(0, maxImages);
  
  if (!mealUp) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Meal Up not found</Text>
        <TouchableOpacity onPress={() => safeGoBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  const spotsLeft = mealUp.maxAttendees - mealUp.currentAttendees.length;

  const handleShare = async () => {
    try {
      const shareContent = {
        message: `Check out this amazing meal up: ${mealUp.title} at ${mealUp.venue.name} on ${formatDate(mealUp.date)} at ${mealUp.time}. Only $${mealUp.ticketPrice}!`,
        url: Platform.OS === 'web' ? window.location.href : undefined,
      };
      
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share(shareContent);
        } else {
          await navigator.clipboard.writeText(shareContent.message);
          Alert.alert('Copied!', 'Meal up details copied to clipboard');
        }
      } else {
        await Share.share(shareContent);
      }
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleJoinMeal = () => {
    if (spotsLeft > 0) {
      Alert.alert(
        'Join Meal Up',
        `Would you like to join "${mealUp.title}" for $${mealUp.ticketPrice}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Join', 
            onPress: () => {
              Alert.alert('Success!', 'You have successfully joined this meal up!');
            }
          }
        ]
      );
    }
  };

  const handleViewAttendees = () => {
    router.push(`/meal-up-attendees?mealUpId=${mealUp.id}` as any);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => prev > 0 ? prev - 1 : displayImages.length - 1);
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => prev < displayImages.length - 1 ? prev + 1 : 0);
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false
        }} 
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: displayImages[currentImageIndex] }} style={styles.heroImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          />
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => safeGoBack()}
            testID="back-button"
          >
            <ArrowLeft size={24} color={Colors.background} />
          </TouchableOpacity>
          <View style={styles.topActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => console.log('Add to favorites')}
              testID="favorite-button"
            >
              <Heart size={20} color={Colors.background} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShare}
              testID="share-button"
            >
              <Share2 size={20} color={Colors.background} />
            </TouchableOpacity>
          </View>
          <View style={styles.priceTag}>
            {isPaidGroup ? (
              <View style={styles.discountPriceTag}>
                <View style={styles.originalPriceRow}>
                  <DollarSign size={12} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.originalPriceText}>{mealUp.ticketPrice}</Text>
                </View>
                <View style={styles.discountedPriceRow}>
                  <DollarSign size={16} color={Colors.background} />
                  <Text style={styles.discountedPriceText}>{discountedPrice}</Text>
                </View>
              </View>
            ) : (
              <>
                <DollarSign size={16} color={Colors.background} />
                <Text style={styles.priceText}>{mealUp.ticketPrice}</Text>
              </>
            )}
          </View>
          {displayImages.length > 1 && (
            <>
              <TouchableOpacity 
                style={styles.leftArrow}
                onPress={handlePrevImage}
                testID="prev-image-details"
              >
                <ChevronLeft size={28} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.rightArrow}
                onPress={handleNextImage}
                testID="next-image-details"
              >
                <ChevronRight size={28} color="#333" />
              </TouchableOpacity>
              <View style={styles.imageIndicators}>
                {displayImages.map((_, index) => (
                  <View 
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentImageIndex && styles.activeIndicator
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{mealUp.title}</Text>
          {!!organizer && (
            <TouchableOpacity 
              style={styles.organizerContainer}
              onPress={() => router.push(`/user-profile?userId=${organizer.id}` as any)}
              testID="organizer-profile"
            >
              <Image source={{ uri: organizer.photos[0] }} style={styles.organizerAvatar} />
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerLabel}>Organized by</Text>
                <Text style={[styles.organizerName, styles.clickableOrganizerName]}>{organizer.name}</Text>
              </View>
            </TouchableOpacity>
          )}
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <Calendar size={20} color={Colors.primary} />
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(mealUp.date)}</Text>
            </View>
            <View style={styles.detailCard}>
              <Clock size={20} color={Colors.primary} />
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{mealUp.time}</Text>
            </View>
          </View>
          <View style={styles.venueSection}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Venue</Text>
            </View>
            <View style={styles.venueCard}>
              <Text style={styles.venueName}>{mealUp.venue.name}</Text>
              <Text style={styles.venueAddress}>{mealUp.venue.address}</Text>
              <Text style={styles.venueCuisine}>{mealUp.venue.cuisine} Cuisine</Text>
            </View>
          </View>
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About This Experience</Text>
            <Text style={styles.description}>{mealUp.description}</Text>
          </View>
          <View style={styles.includedSection}>
            <Text style={styles.sectionTitle}>What's included with this price?</Text>
            <View style={styles.includedList}>
              <View style={styles.includedItem}>
                <Check size={16} color={Colors.success} />
                <Text style={styles.includedText}>Full course meal</Text>
              </View>
              <View style={styles.includedItem}>
                <Check size={16} color={Colors.success} />
                <Text style={styles.includedText}>Welcome drink</Text>
              </View>
              <View style={styles.includedItem}>
                <Check size={16} color={Colors.success} />
                <Text style={styles.includedText}>Service charge</Text>
              </View>
              <View style={styles.includedItem}>
                <Check size={16} color={Colors.success} />
                <Text style={styles.includedText}>Shared dining experience</Text>
              </View>
            </View>
          </View>
          {isPaidGroup && (
            <View style={styles.memberBenefitSection}>
              <View style={styles.memberBenefitHeader}>
                <View style={styles.memberBenefitIconContainer}>
                  <BadgePercent size={20} color={Colors.primary} />
                </View>
                <View style={styles.memberBenefitHeaderText}>
                  <Text style={styles.memberBenefitTitle}>Member benefit</Text>
                  <Text style={styles.memberBenefitSubtitle}>
                    As a member of {mealUp.group!.name}, you get exclusive discounts
                  </Text>
                </View>
              </View>
              <View style={styles.memberBenefitCard}>
                <View style={styles.memberBenefitRow}>
                  <Text style={styles.memberBenefitLabel}>Group discount</Text>
                  <View style={styles.memberBenefitBadge}>
                    <Text style={styles.memberBenefitBadgeText}>{mealUp.group!.memberDiscount} off</Text>
                  </View>
                </View>
                <View style={styles.memberBenefitDivider} />
                <View style={styles.memberBenefitRow}>
                  <Text style={styles.memberBenefitLabel}>You pay</Text>
                  <Text style={styles.memberBenefitPrice}>${discountedPrice}</Text>
                </View>
                <View style={styles.memberBenefitDivider} />
                <View style={styles.memberBenefitRow}>
                  <Text style={styles.memberBenefitLabel}>You save</Text>
                  <Text style={styles.memberBenefitSave}>${mealUp.ticketPrice - discountedPrice}</Text>
                </View>
              </View>
            </View>
          )}
          <TouchableOpacity 
            style={styles.attendeesSection}
            onPress={handleViewAttendees}
            testID="view-attendees"
          >
            <View style={styles.sectionHeader}>
              <Users size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Who&apos;s Going</Text>
            </View>
            <View style={styles.attendeesInfo}>
              <Text style={styles.attendeesCount}>
                {mealUp.currentAttendees.length} of {mealUp.maxAttendees} spots filled
              </Text>
              <Text style={styles.spotsLeft}>
                {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Event is full'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>
      <View style={styles.bottomBar}>
        <View style={styles.priceInfo}>
          <Text style={styles.bottomPriceLabel}>Price per person</Text>
          {isPaidGroup ? (
            <View style={styles.bottomDiscountRow}>
              <View>
                <Text style={styles.bottomOriginalPrice}>${mealUp.ticketPrice}</Text>
                <Text style={styles.bottomPriceValue}>${discountedPrice}</Text>
              </View>
              <View style={styles.bottomDiscountBadge}>
                <Text style={styles.bottomDiscountBadgeText}>{mealUp.group!.memberDiscount} off</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.bottomPriceValue}>${mealUp.ticketPrice}</Text>
          )}
        </View>
        <LinearGradient
          colors={spotsLeft > 0 ? Gradients.primary : ['#ccc', '#999']}
          style={[styles.joinButton, spotsLeft === 0 && styles.disabledButton]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity 
            onPress={handleJoinMeal}
            disabled={spotsLeft === 0}
            style={styles.joinButtonInner}
            testID="join-meal-button"
          >
            <Text style={styles.joinButtonText}>
              {spotsLeft > 0 ? 'Join This Meal' : 'Event Full'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topActions: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceTag: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 4,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 16,
    lineHeight: 34,
  },
  organizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  organizerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerLabel: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  organizerName: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  clickableOrganizerName: {
    color: Colors.primary,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  detailCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  venueSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 8,
  },
  venueCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  venueAddress: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
    lineHeight: 20,
  },
  venueCuisine: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  includedSection: {
    marginBottom: 24,
  },
  includedList: {
    marginTop: 12,
    gap: 12,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  includedText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginTop: 8,
  },
  attendeesSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  attendeesInfo: {
    marginTop: 8,
  },
  attendeesCount: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  spotsLeft: {
    fontSize: 14,
    color: Colors.textLight,
  },

  bottomPadding: {
    height: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
  },
  priceInfo: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  bottomPriceValue: {
    fontSize: 20,
    color: Colors.text,
    fontWeight: '700',
    marginTop: 2,
  },
  joinButton: {
    borderRadius: 25,
    minWidth: 140,
  },
  joinButtonInner: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  leftArrow: {
    position: 'absolute',
    left: 20,
    top: '50%',
    marginTop: -24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  rightArrow: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeIndicator: {
    backgroundColor: 'white',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // Discount styles
  discountPriceTag: {
    alignItems: 'flex-end',
  },
  originalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  originalPriceText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  discountedPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  discountedPriceText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '700',
  },
  memberBenefitSection: {
    marginBottom: 24,
  },
  memberBenefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  memberBenefitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberBenefitHeaderText: {
    flex: 1,
  },
  memberBenefitTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  memberBenefitSubtitle: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },
  memberBenefitCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  memberBenefitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  memberBenefitLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  memberBenefitBadge: {
    backgroundColor: `${Colors.primary}15`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  memberBenefitBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  memberBenefitDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  memberBenefitPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  memberBenefitSave: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.success,
  },
  bottomDiscountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bottomOriginalPrice: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  bottomDiscountBadge: {
    backgroundColor: `${Colors.primary}20`,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bottomDiscountBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});