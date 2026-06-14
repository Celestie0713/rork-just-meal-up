import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Share, Platform, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Clock, MapPin, Users, DollarSign, Share2, ChevronRight, ChevronLeft, UsersRound, MessageSquareShare, Copy } from 'lucide-react-native';
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

  const copyToClipboardWeb = (text: string): boolean => {
    // Try modern async Clipboard API first
    if (typeof navigator?.clipboard?.writeText === 'function') {
      try {
        // Must be sync-like — schedule the async write but don't await here
        // because the user gesture may expire. Instead use the legacy fallback.
      } catch { /* fall through */ }
    }

    // Legacy fallback using execCommand — works in all browsers, even non-HTTPS
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    let success = false;
    try {
      success = document.execCommand('copy');
    } catch { /* ignore */ }

    document.body.removeChild(textarea);
    return success;
  };

  const shareMessage = `${mealUp.title} at ${mealUp.venue.name} — ${formatFullDate(mealUp.date)} at ${mealUp.time}. Only ${mealUp.ticketPrice}!`;

  const handleCopyLink = () => {
    setShowShareOptions(false);
    if (Platform.OS === 'web') {
      const copied = copyToClipboardWeb(shareMessage);
      if (copied) {
        Alert.alert('Copied!', 'Meal details copied to clipboard.');
      } else {
        Alert.alert('Could not copy', 'Please try again.');
      }
    } else {
      Share.share({ message: shareMessage });
    }
  };

  const handleShareFacebook = async () => {
    setShowShareOptions(false);
    if (Platform.OS === 'web') {
      // Facebook doesn't support pre-filling post text via URL (unlike X).
      // Copy to clipboard so user can Ctrl+V / Cmd+V into the share dialog.
      const copied = copyToClipboardWeb(shareMessage);
      // Open Facebook's share dialog — user pastes and clicks Post
      window.open('https://www.facebook.com/sharer/sharer.php', '_blank');
      if (copied) {
        Alert.alert('Text copied!', 'Paste (Ctrl+V) into the Facebook post and share.');
      }
    } else {
      await Share.share({ message: shareMessage });
    }
  };

  const handleShareInstagram = async () => {
    setShowShareOptions(false);
    if (Platform.OS === 'web') {
      const copied = copyToClipboardWeb(shareMessage);
      window.open('https://www.instagram.com/', '_blank');
      if (copied) {
        Alert.alert('Text copied!', 'Paste (Ctrl+V) into Instagram and share.');
      }
    } else {
      await Share.share({ message: shareMessage });
    }
  };

  const handleShareX = async () => {
    setShowShareOptions(false);
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      try {
        await Linking.openURL(url);
      } catch {
        await Share.share({ message: shareMessage });
      }
    }
  };

  const handleShareThreads = async () => {
    setShowShareOptions(false);
    const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(shareMessage)}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      try {
        await Linking.openURL(url);
      } catch {
        await Share.share({ message: shareMessage });
      }
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

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleCopyLink}
                testID={`share-copy-${mealUp.id}`}
              >
                <View style={[styles.socialIcon, { backgroundColor: '#444' }]}>
                  <Copy size={20} color="#FFF" />
                </View>
                <Text style={styles.socialLabel}>Copy link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleShareFacebook}
                testID={`share-fb-${mealUp.id}`}
              >
                <View style={[styles.socialIcon, { backgroundColor: '#1877F2' }]}>
                  <Text style={styles.socialIconText}>f</Text>
                </View>
                <Text style={styles.socialLabel}>Facebook</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleShareInstagram}
                testID={`share-ig-${mealUp.id}`}
              >
                <View style={[styles.socialIcon, styles.instagramIcon]}>
                  <Text style={styles.socialIconText}>📷</Text>
                </View>
                <Text style={styles.socialLabel}>Instagram</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleShareX}
                testID={`share-x-${mealUp.id}`}
              >
                <View style={[styles.socialIcon, { backgroundColor: '#FFF' }]}>
                  <Text style={[styles.socialIconText, { color: '#000' }]}>𝕏</Text>
                </View>
                <Text style={styles.socialLabel}>X</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleShareThreads}
                testID={`share-threads-${mealUp.id}`}
              >
                <View style={[styles.socialIcon, { backgroundColor: '#FFF' }]}>
                  <Text style={[styles.socialIconText, { color: '#000' }]}>@</Text>
                </View>
                <Text style={styles.socialLabel}>Threads</Text>
              </TouchableOpacity>
            </View>

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

  shareOptionTextContainer: {
    flex: 1,
  },
  shareOptionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.background,
  },

  shareOptionButtonSubtext: {
    fontSize: 12,
    color: Colors.background,
    opacity: 0.85,
    marginTop: 2,
  },

  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  socialButton: {
    alignItems: 'center',
    gap: 6,
    minWidth: 60,
  },
  socialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instagramIcon: {
    backgroundColor: '#E4405F',
  },
  socialIconText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700' as const,
  },
  socialLabel: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
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
