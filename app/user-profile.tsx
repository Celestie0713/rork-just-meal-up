import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';

import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Heart, Camera, Users, Utensils, Plus } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { mockUsers } from '@/mocks/users';
import { mockPlaces } from '@/mocks/places';
import { GooglePlacesService } from '@/services/google-places';

import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';

import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'food' | 'pictures' | 'mealups';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('food');
  const { user: currentUser } = useAuth();
  const { getMatchType } = useChat();
  
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
    const favoritePlaces = user.favoritePlaces || [];
    const places = favoritePlaces.map(placeId => 
      mockPlaces.find(place => place.place_id === placeId)
    ).filter(Boolean);
    
    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabDescription}>
          These make me say YES to a date 🍕
        </Text>
        <View style={styles.foodGrid}>
          {places.map((place, index) => {
            if (!place) return null;
            const photoUrl = place.photos?.[0] 
              ? GooglePlacesService.getPhotoUrl(place.photos[0].photo_reference)
              : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop';
            
            return (
              <TouchableOpacity 
                key={place.place_id} 
                style={styles.foodGridItem}
                onPress={() => router.push(`/place-details?placeId=${place.place_id}`)}
              >
                <Image 
                  source={{ uri: photoUrl }} 
                  style={styles.placeImage}
                  resizeMode="cover"
                />
                <Text style={styles.foodLabel} numberOfLines={2}>{place.name}</Text>
              </TouchableOpacity>
            );
          })}
          
          <TouchableOpacity 
            style={styles.addPlaceButton}
            onPress={() => router.push('/(tabs)')}
            testID="add-favorite-place-button"
          >
            <View style={styles.addPlaceIconContainer}>
              <Plus size={24} color={Colors.primary} />
            </View>
            <Text style={styles.addPlaceText}>Add Place</Text>
          </TouchableOpacity>
        </View>
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
    const mealUps = [
      { title: 'Italian Night', date: 'Dec 15, 2024', venue: 'The Italian Corner', status: 'Attended' },
      { title: 'Sushi Social', date: 'Dec 20, 2024', venue: 'Sakura Sushi', status: 'Upcoming' },
      { title: 'Brunch Meetup', date: 'Dec 25, 2024', venue: 'Cafe Central', status: 'Upcoming' },
      { title: 'Pizza Party', date: 'Jan 5, 2025', venue: 'Tony\'s Pizza', status: 'Upcoming' },
      { title: 'Thai Food Night', date: 'Jan 10, 2025', venue: 'Bangkok Garden', status: 'Upcoming' },
      { title: 'BBQ Gathering', date: 'Jan 15, 2025', venue: 'Smokey Joe\'s', status: 'Upcoming' },
    ];
    
    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabDescription}>
          {user.name}&apos;s meal up history
        </Text>
        <View style={styles.mealUpsGrid}>
          {mealUps.map((mealUp, index) => (
            <View key={index} style={styles.mealUpGridItem}>
              <View style={styles.mealUpImagePlaceholder}>
                <Users size={24} color={Colors.primary} />
              </View>
              <Text style={styles.mealUpGridTitle}>{mealUp.title}</Text>
              <Text style={styles.mealUpGridDate}>{mealUp.date}</Text>
            </View>
          ))}
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
        
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      

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
    width: '31.5%',
    aspectRatio: 1,
    marginBottom: 8,
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
  scrollViewBottomPadding: {
    height: 40,
  },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  foodGridItem: {
    width: '31.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  foodImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  foodLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  placeImage: {
    width: '100%',
    height: '70%',
    borderRadius: 8,
    marginBottom: 8,
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
  mealUpsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mealUpGridItem: {
    width: '31.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  mealUpImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mealUpGridTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 2,
  },
  mealUpGridDate: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 14,
  },
  addPlaceButton: {
    width: '31.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addPlaceIconContainer: {
    width: '70%',
    height: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addPlaceText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 16,
  },

});