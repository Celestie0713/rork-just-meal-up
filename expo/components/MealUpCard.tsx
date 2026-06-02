import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Share, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Clock, MapPin, Users, DollarSign, Share2, ChevronRight, ChevronLeft, UsersRound, MessageSquareShare, Globe } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Gradients } from '@/constants/colors';
import type { MealUp } from '@/types/user';

interface MealUpCardProps {
  mealUp: MealUp;
  onPress: () => void;
}

export function MealUpCard({ mealUp, onPress }: MealUpCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [showShareOptions, setShowShareOptions] = useState<boolean>(false);
  const images = mealUp.images || [mealUp.imageUrl];
  const maxImages = Math.min(images.length, 10);
  const displayImages = images.slice(0, maxImages);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const spotsLeft = mealUp.maxAttendees - mealUp.currentAttendees.length;

  const handleSharePress = (event: any) => {
    event.stopPropagation();
    setShowShareOptions(true);
  };

  const handleShareViaChat = () => {
    setShowShareOptions(false);
    router.push({
      pathname: '/messages' as any,
      params: {
        fromMealUpShare: 'true',
        mealUpId: mealUp.id,
        mealUpTitle: mealUp.title,
        mealUpVenue: mealUp.venue.name,
        mealUpDate: mealUp.date.toISOString(),
        mealUpTime: mealUp.time,
        mealUpPrice: mealUp.ticketPrice,
        mealUpImage: mealUp.imageUrl
      }
    });
  };

  const handleShareSocial = async () => {
    const message = `${mealUp.title} at ${mealUp.venue.name} — ${formatFullDate(mealUp.date)} at ${mealUp.time}. Only ${mealUp.ticketPrice}!`;

    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(message);
        setShowShareOptions(false);
        Alert.alert('Copied!', 'Meal details copied to clipboard — paste anywhere to share.');
      } catch {
        setShowShareOptions(false);
        Alert.alert('Could not copy', 'Please try again or share manually.');
      }
      return;
    }

    try {
      await Share.share({ title: mealUp.title, message });
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('Share failed:', error);
      }
    } finally {
      setShowShareOptions(false);
    }
  };

  const handlePrevImage = (event: any) => {
    event.stopPropagation();
    setCurrentImageIndex(prev => prev > 0 ? prev - 1 : displayImages.length - 1);
  };

  const handleNextImage = (event: any) => {
    event.stopPropagation();
    setCurrentImageIndex(prev => prev < displayImages.length - 1 ? prev + 1 : 0);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} testID={`meal-up-${mealUp.id}`}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: displayImages[currentImageIndex] }} style={styles.image} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        />
        <View style={styles.topActions}>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleSharePress}
            testID={`share-${mealUp.id}`}
          >
            <Share2 size={20} color={Colors.background} />
          </TouchableOpacity>
          <View style={styles.priceTag}>
            <DollarSign size={14} color={Colors.background} />
            <Text style={styles.priceText}>{mealUp.ticketPrice}</Text>
          </View>
        </View>
        {displayImages.length > 1 && (
          <>
            <TouchableOpacity 
              style={styles.leftArrow}
              onPress={handlePrevImage}
              testID={`prev-image-${mealUp.id}`}
            >
              <ChevronLeft size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.rightArrow}
              onPress={handleNextImage}
              testID={`next-image-${mealUp.id}`}
            >
              <ChevronRight size={24} color="#333" />
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
        {!!mealUp.group && (
          <View style={styles.groupBadge}>
            <UsersRound size={13} color={Colors.primary} />
            <Text style={styles.groupName}>{mealUp.group.name}</Text>
          </View>
        )}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Calendar size={16} color={Colors.primary} />
            <Text style={styles.detailText}>{formatDate(mealUp.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={16} color={Colors.primary} />
            <Text style={styles.detailText}>{mealUp.time}</Text>
          </View>
        </View>
        <View style={styles.venueContainer}>
          <MapPin size={16} color={Colors.textLight} />
          <View style={styles.venueInfo}>
            <Text style={styles.venueName}>{mealUp.venue.name}</Text>
            <Text style={styles.venueAddress}>{mealUp.venue.address}</Text>
          </View>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {mealUp.description}
        </Text>
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.attendeesInfo}
            onPress={() => router.push(`/meal-up-attendees?mealUpId=${mealUp.id}` as any)}
            testID={`attendees-${mealUp.id}`}
          >
            <Users size={16} color={Colors.primary} />
            <Text style={[styles.attendeesText, { color: Colors.primary }]}>
              {mealUp.currentAttendees.length}/{mealUp.maxAttendees} going
            </Text>
          </TouchableOpacity>
          <View style={styles.rightSection}>
            <LinearGradient
              colors={spotsLeft > 0 ? Gradients.primary : ['#ccc', '#999']}
              style={[styles.joinButton, spotsLeft === 0 && styles.disabledButton]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.joinButtonText}>
                {spotsLeft > 0 ? 'Join Meal' : 'Full'}
              </Text>
            </LinearGradient>
            <View style={styles.arrowContainer}>
              <ChevronRight size={24} color={Colors.primary} />
            </View>
          </View>
        </View>
      </View>

      <Modal
        visible={showShareOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareOptions(false)}
      >
        <TouchableOpacity
          style={styles.shareOverlay}
          activeOpacity={1}
          onPress={() => setShowShareOptions(false)}
        >
          <View style={styles.shareSheet}>
            <Text style={styles.shareTitle}>Share Meal Up</Text>
            <Text style={styles.shareSubtitle}>How do you want to share?</Text>

            <TouchableOpacity
              style={styles.shareOptionButton}
              onPress={handleShareViaChat}
              testID={`share-chat-${mealUp.id}`}
            >
              <MessageSquareShare size={22} color={Colors.background} />
              <View style={styles.shareOptionTextContainer}>
                <Text style={styles.shareOptionButtonText}>Share via Chat</Text>
                <Text style={styles.shareOptionButtonSubtext}>Send to a friend in the app</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shareOptionButton, styles.shareSocialButton]}
              onPress={handleShareSocial}
              testID={`share-social-${mealUp.id}`}
            >
              <Globe size={22} color={Colors.primary} />
              <View style={styles.shareOptionTextContainer}>
                <Text style={[styles.shareOptionButtonText, styles.shareSocialText]}>Share on Social Media</Text>
                <Text style={[styles.shareOptionButtonSubtext, styles.shareSocialSubtext]}>Post to Instagram, Twitter, WhatsApp & more</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareCancel}
              onPress={() => setShowShareOptions(false)}
            >
              <Text style={styles.shareCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  topActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareButton: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  priceTag: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 2,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 6,
    fontWeight: '500',
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  venueInfo: {
    marginLeft: 6,
    flex: 1,
  },
  venueName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  venueAddress: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  arrowContainer: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leftArrow: {
    position: 'absolute',
    left: 12,
    top: '50%',
    marginTop: -20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
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
    right: 12,
    top: '50%',
    marginTop: -20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
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
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeIndicator: {
    backgroundColor: 'white',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  groupText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500' as const,
    flex: 1,
  },
  groupFromText: {
    color: Colors.textLight,
    fontWeight: '400' as const,
  },
  groupName: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  attendeesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  attendeesText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  joinButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  shareOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  shareSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  shareTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  shareSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 6,
  },
  shareOptionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  shareSocialButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  shareOptionTextContainer: {
    flex: 1,
  },
  shareOptionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.background,
  },
  shareSocialText: {
    color: Colors.primary,
  },
  shareOptionButtonSubtext: {
    fontSize: 12,
    color: Colors.background,
    opacity: 0.85,
    marginTop: 2,
  },
  shareSocialSubtext: {
    color: Colors.textLight,
    opacity: 1,
  },
  shareCancel: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  shareCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight,
  },
});
