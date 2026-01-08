import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { MapPin, Users, DollarSign, Heart, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/colors';
import { mockGroups } from '@/mocks/groups';
import { mockMealUps } from '@/mocks/meal-ups';
import { MealUpCard } from '@/components/MealUpCard';
import type { MealUp } from '@/types/user';

export default function GroupDetailsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [isMember, setIsMember] = useState(false);

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
    if (group.isPaid) {
      Alert.alert(
        'Join Group',
        `This is a paid group. Monthly fee: $${group.monthlyFee}. Would you like to join?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Join Now', 
            onPress: () => {
              setIsMember(true);
              Alert.alert('Success', 'Welcome to the group!');
            }
          }
        ]
      );
    } else {
      setIsMember(true);
      Alert.alert('Success', 'Welcome to the group!');
    }
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
    router.push(`/meal-up-details?mealUpId=${mealUp.id}`);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
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
            style={[styles.joinButton, isMember && styles.leaveButton]}
            onPress={isMember ? handleLeaveGroup : handleJoinGroup}
          >
            <Text style={styles.joinButtonText}>
              {isMember ? 'Leave Group' : 'Join Group'}
            </Text>
          </TouchableOpacity>
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
        
        {group.posts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Member Posts</Text>
            {group.posts.map(post => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Image source={{ uri: post.userImage }} style={styles.postUserImage} />
                  <View style={styles.postUserInfo}>
                    <Text style={styles.postUserName}>{post.userName}</Text>
                    <Text style={styles.postTime}>{formatTimeAgo(post.timestamp)}</Text>
                  </View>
                </View>
                
                <Text style={styles.postContent}>{post.content}</Text>
                
                {post.imageUrl && (
                  <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
                )}
                
                <View style={styles.postFooter}>
                  <TouchableOpacity style={styles.likeButton}>
                    <Heart size={18} color="#FF1493" />
                    <Text style={styles.likeCount}>{post.likes}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {group.posts.length === 0 && upcomingMealUpsData.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No posts or upcoming events yet. Be the first to start the conversation!
            </Text>
          </View>
        )}
      </ScrollView>
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
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postUserInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    color: Colors.textLight,
  },
  postContent: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
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
});
