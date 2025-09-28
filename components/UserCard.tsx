import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Crown, Star, Heart } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { hasMutualLoveMatch } from '@/mocks/post-date-responses';
import { useAuth } from '@/hooks/use-auth';

import type { User } from '@/types/user';

interface UserCardProps {
  user: User;
  onPress: () => void;
  isGridView?: boolean;
  showOrganizerBadge?: boolean;
}

export function UserCard({ user, onPress, isGridView = false, showOrganizerBadge = false }: UserCardProps) {
  const { user: currentUser } = useAuth();
  
  const getMembershipIcon = () => {
    if (user.membershipTier === 'organizer') {
      return <Crown size={16} color={Colors.organizer} />;
    }
    if (user.membershipTier === 'premium') {
      return <Star size={16} color={Colors.premium} />;
    }
    return null;
  };
  
  // Check if this user has a mutual love match with current user
  const hasLoveMatch = currentUser ? hasMutualLoveMatch(currentUser.id, user.id) : false;
  
  // Debug logging
  if (user.id === '5') { // Sofia Kim
    console.log('=== UserCard Debug for Sofia Kim ===');
    console.log('Current user:', currentUser?.id, currentUser?.name);
    console.log('Target user:', user.id, user.name);
    console.log('hasLoveMatch result:', hasLoveMatch);
    console.log('hasMutualLoveMatch(1, 5):', hasMutualLoveMatch('1', '5'));
    console.log('=== End UserCard Debug ===');
  }

  return (
    <TouchableOpacity style={[styles.container, isGridView && styles.gridContainer]} onPress={onPress} testID={`user-card-${user.id}`}>
      <View style={[styles.imageContainer, isGridView && styles.gridImageContainer]}>
        <Image source={{ uri: user.photos[0] }} style={styles.image} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        />
        <View style={styles.onlineIndicator}>
          <View style={[styles.onlineDot, { backgroundColor: user.isOnline ? Colors.success : Colors.textLight }]} />
        </View>
        
        {/* Show love icon for Fight for fries for life match */}
        {hasLoveMatch && (
          <View style={styles.loveIconContainer}>
            <View style={styles.loveIconBackground}>
              <Heart size={isGridView ? 12 : 16} color="#FF69B4" fill="#FF69B4" />
            </View>
          </View>
        )}
      </View>
      
      <View style={[styles.content, isGridView && styles.gridContent]}>
        <View style={styles.header}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, isGridView && styles.gridName]} numberOfLines={1}>
              {user.name}, {user.age}
            </Text>
          </View>
          <View style={styles.badgeContainer}>
            {showOrganizerBadge && (
              <View style={styles.organizerBadge}>
                <Crown size={12} color={Colors.background} />
                <Text style={styles.organizerBadgeText}>Organizer</Text>
              </View>
            )}
            {!isGridView && !showOrganizerBadge && getMembershipIcon()}
          </View>
        </View>
        
        {!isGridView && (
          <View style={styles.locationContainer}>
            <MapPin size={14} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
        )}
        
        {!isGridView && (
          <Text style={styles.bio} numberOfLines={2}>
            {user.bio}
          </Text>
        )}
        
        <View
          style={[styles.actionButton, isGridView && styles.gridActionButton, { backgroundColor: '#f37021' }]}
        >
          <Text style={[styles.actionButtonText, isGridView && styles.gridActionButtonText]}>
            {isGridView ? '💬' : 'Send Voice Note'}
          </Text>
        </View>
      </View>
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
  gridContainer: {
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 6,
    maxWidth: '31%',
  },
  imageContainer: {
    height: 280,
    position: 'relative',
  },
  gridImageContainer: {
    height: 140,
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
    height: 80,
  },
  onlineIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    padding: 16,
  },
  gridContent: {
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  gridName: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 4,
  },
  bio: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  gridActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 15,
    marginTop: 4,
  },
  actionButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  gridActionButtonText: {
    fontSize: 14,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.organizer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  organizerBadgeText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  loveIconContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 10,
  },
  loveIconBackground: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 6,
    borderWidth: 2,
    borderColor: '#FF69B4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});