import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Crown, Star, Heart, MessageCircle, Camera, Users, Utensils, Settings, Plus } from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/colors';
import { mockUsers } from '@/mocks/users';

import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';

import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'food' | 'pictures' | 'mealups';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('food');
  const { user: currentUser } = useAuth();
  const { matchedProfiles, removeMatchedProfile, getMatchType } = useChat();
  
  const user = mockUsers.find(u => u.id === userId);
  
  // Check if this user has a "fight_for_fries" match with current user
  const hasLoveMatch = userId && getMatchType(userId) === 'fight_for_fries';
  
  const handleNavigateToCurrentUser = () => {
    if (currentUser) {
      // Navigate back to current user's main profile tab instead of user-profile page
      router.push('/(tabs)/profile');
    }
  };
  

  
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getMembershipInfo = () => {
    switch (user.membershipTier) {
      case 'organizer':
        return {
          icon: <Crown size={20} color={Colors.organizer} />,
          title: 'Organizer Member',
          gradient: Gradients.organizer,
        };
      case 'premium':
        return {
          icon: <Star size={20} color={Colors.premium} />,
          title: 'Premium Member',
          gradient: Gradients.premium,
        };
      default:
        return {
          icon: <Heart size={20} color={Colors.textLight} />,
          title: 'Free Member',
          gradient: ['#f0f0f0', '#e0e0e0'] as const,
        };
    }
  };

  const membershipInfo = getMembershipInfo();

  const getMembershipColor = () => {
    switch (user.membershipTier) {
      case 'organizer':
        return Colors.organizer;
      case 'premium':
        return Colors.primary;
      default:
        return Colors.surface;
    }
  };

  const handleStartChat = () => {
    router.push(`/chat?userId=${user.id}`);
  };

  const renderTabBar = () => {
    const tabs = [
      { id: 'food' as TabType, label: 'Food to bribe me with', icon: Utensils },
      { id: 'pictures' as TabType, label: 'Pictures', icon: Camera },
      { id: 'mealups' as TabType, label: 'Meal ups', icon: Users },
    ];

    return (
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, isActive && styles.activeTabItem]}
              onPress={() => setActiveTab(tab.id)}
            >
              <IconComponent size={20} color={isActive ? Colors.primary : Colors.textLight} />
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderFoodTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabDescription}>
          Foods that would make them say yes to a date 🍕
        </Text>
        <View style={styles.foodContainer}>
          {/* Don't show food tags for any user profile - keep it consistent */}
        </View>
        
        <TouchableOpacity 
          style={styles.addPlacesButton}
          onPress={() => router.push({
            pathname: '/(tabs)',
            params: { tab: 'places' }
          })}
        >
          <Plus size={20} color={Colors.primary} />
          <Text style={styles.addPlacesButtonText}>Add favorite places</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPicturesTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabDescription}>
          {user.name}&apos;s photos ({user.photos.length})
        </Text>
        <View style={styles.picturesGrid}>
          {user.photos.map((photo, index) => (
            <View key={index} style={styles.pictureContainer}>
              <Image source={{ uri: photo }} style={styles.pictureImage} />
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMealUpsTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabDescription}>
          {user.name}&apos;s meal up history
        </Text>
        <View style={styles.mealUpsContainer}>
          <View style={styles.mealUpItem}>
            <View style={styles.mealUpInfo}>
              <Text style={styles.mealUpTitle}>Italian Night</Text>
              <Text style={styles.mealUpDate}>Dec 15, 2024</Text>
              <Text style={styles.mealUpVenue}>The Italian Corner</Text>
            </View>
            <View style={styles.mealUpStatus}>
              <Text style={styles.statusText}>Attended</Text>
            </View>
          </View>
          
          <View style={styles.mealUpItem}>
            <View style={styles.mealUpInfo}>
              <Text style={styles.mealUpTitle}>Sushi Social</Text>
              <Text style={styles.mealUpDate}>Dec 20, 2024</Text>
              <Text style={styles.mealUpVenue}>Sakura Sushi</Text>
            </View>
            <View style={styles.mealUpStatus}>
              <Text style={styles.statusTextUpcoming}>Upcoming</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'food':
        return renderFoodTab();
      case 'pictures':
        return renderPicturesTab();
      case 'mealups':
        return renderMealUpsTab();
      default:
        return renderFoodTab();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.normalHeader}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => router.back()}
              testID="back-button"
            >
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image source={{ uri: user.photos[0] }} style={styles.profileImage} />
            {hasLoveMatch && (
              <View style={styles.profileLoveIconsContainer}>
                <TouchableOpacity 
                  style={styles.profileLoveIconWrapper}
                  onPress={handleNavigateToCurrentUser}
                  testID="navigate-to-current-user-button"
                >
                  <View style={styles.profileLoveIconBackground}>
                    <Heart size={16} color="#FF69B4" fill="#FF69B4" />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          
          <View style={styles.membershipBadgeContainer}>
            <View style={[styles.membershipBadge, { backgroundColor: getMembershipColor() }]}>
              <View style={styles.membershipBadgeContent}>
                {membershipInfo.icon}
                <Text style={styles.membershipBadgeText}>{membershipInfo.title}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.personalInfoSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.personalInfoRow}>
            <View style={styles.halfPreferenceItem}>
              <Text style={styles.preferenceLabel}>Language</Text>
              <Text style={styles.preferenceValue}>
                {user.ethnicity || 'Not specified'}
              </Text>
            </View>

            <View style={styles.halfPreferenceItem}>
              <Text style={styles.preferenceLabel}>Income Level</Text>
              <Text style={styles.preferenceValue}>
                {user.preferences.incomeLevel || 'Not specified'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        <View style={styles.preferencesSection}>
          <Text style={styles.sectionTitle}>Dating Preferences</Text>
          
          <View style={styles.personalInfoRow}>
            <View style={styles.halfPreferenceItem}>
              <Text style={styles.preferenceLabel}>Preferred Language</Text>
              <Text style={styles.preferenceValue}>
                {user.preferences.preferredEthnicity?.length 
                  ? user.preferences.preferredEthnicity.join(', ')
                  : 'Not specified'
                }
              </Text>
            </View>

            <View style={styles.halfPreferenceItem}>
              <Text style={styles.preferenceLabel}>Preferred Income Level</Text>
              <Text style={styles.preferenceValue}>
                {user.preferences.preferredIncomeLevel || 'Not specified'}
              </Text>
            </View>
          </View>
        </View>

        {renderTabBar()}
        {renderTabContent()}
      </ScrollView>
      
      <View style={styles.bottomBar}>
        <LinearGradient
          colors={Gradients.primary}
          style={styles.chatButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity 
            onPress={handleStartChat}
            style={styles.chatButtonInner}
            testID="start-chat-button"
          >
            <MessageCircle size={20} color={Colors.background} />
            <Text style={styles.chatButtonText}>Send Voice Note</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  normalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButtonHeader: {
    padding: 8,
  },
  headerSpacer: {
    width: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileLoveIconsContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  profileLoveIconWrapper: {
    // Container for individual love icon
  },
  profileLoveIconBackground: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 8,
    borderWidth: 2,
    borderColor: '#FF69B4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },

  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: Colors.textLight,
    marginLeft: 4,
  },
  membershipBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
    position: 'relative',
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 24,
    alignSelf: 'center',
    minWidth: 200,
    maxWidth: 240,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  membershipBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  membershipBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
    textAlign: 'center',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textTransform: 'capitalize',
  },
  personalInfoSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  bioSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  bio: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
  },
  preferencesSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  personalInfoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfPreferenceItem: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  preferenceValue: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  activeTabItem: {
    backgroundColor: Colors.background,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textLight,
    marginLeft: 4,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: Colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  tabDescription: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  foodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  foodTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  foodText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.background,
  },
  picturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pictureContainer: {
    width: '48%',
    aspectRatio: 0.8,
    marginBottom: 12,
  },
  pictureImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  mealUpsContainer: {
    gap: 12,
  },
  mealUpItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  mealUpInfo: {
    flex: 1,
  },
  mealUpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  mealUpDate: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 2,
  },
  mealUpVenue: {
    fontSize: 14,
    color: Colors.textLight,
  },
  mealUpStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.background,
  },
  statusTextUpcoming: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.background,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
  },
  chatButton: {
    borderRadius: 25,
  },
  chatButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  chatButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.background,
    fontWeight: '600',
  },
  addPlacesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addPlacesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
});