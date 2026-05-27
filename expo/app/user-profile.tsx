import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { safeGoBack } from '@/utils/navigation';
import { ArrowLeft, MapPin, Camera, Users, Utensils, Plus, Mic, Heart, Star, ExternalLink, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { mockUsers } from '@/mocks/users';

import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';
import { useFavorites } from '@/hooks/use-favorites';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'food' | 'pictures' | 'mealups';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('food');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const { user: currentUser } = useAuth();
  useChat();
  const { favoritePlaces } = useFavorites();
  
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  
  const user = mockUsers.find(u => u.id === userId);
  

  

  
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
          <TouchableOpacity onPress={() => safeGoBack()} style={styles.backButton}>
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

  const handleViewOnGoogleMaps = async () => {
    if (!selectedPlace) return;
    const url = selectedPlace.googleMapsUrl ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.name + ' ' + (selectedPlace.city || '') + ' ' + (selectedPlace.country || ''))}`;
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.POPOVER,
      });
    } catch (error) {
      console.error('Failed to open Google Maps:', error);
    }
  };

  const renderFoodTab = () => {
    const isOwnProfile = currentUser?.id === userId;
    const places = isOwnProfile ? favoritePlaces : [];
    
    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabDescription}>
          These make me say YES to a date 🍕
        </Text>
        <View style={styles.foodGrid}>
          {places.length > 0 ? (
            places.map((place) => (
              <TouchableOpacity
                key={place.place_id}
                style={styles.foodGridItem}
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedPlace(place);
                  setShowPlaceModal(true);
                }}
              >
                <View style={styles.favPlaceCard}>
                  <Text style={styles.foodLabel} numberOfLines={3}>{place.name}</Text>
                  {place.rating != null && place.rating > 0 && (
                    <View style={styles.favPlaceRating}>
                      <Star size={10} color="#FFB800" fill="#FFB800" />
                      <Text style={styles.favPlaceRatingText}>{place.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : isOwnProfile ? null : (
            <View style={styles.foodGridItem}>
              <View style={styles.favPlaceCard}>
                <Text style={[styles.foodLabel, { color: Colors.textLight }]}>No favorites shared yet</Text>
              </View>
            </View>
          )}
          {isOwnProfile && (
            <TouchableOpacity 
              style={styles.addPlaceButton}
              testID="add-favorite-place-button"
              onPress={() => router.push({ pathname: '/(tabs)', params: { tab: 'places' } } as any)}
            >
              <View style={styles.addPlaceIconContainer}>
                <Plus size={24} color={Colors.primary} />
              </View>
              <Text style={styles.addPlaceText}>Add Places</Text>
            </TouchableOpacity>
          )}
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

  const renderPlaceDetailModal = () => (
    <Modal visible={showPlaceModal} transparent animationType="fade">
      <TouchableOpacity
        style={styles.placeModalOverlay}
        activeOpacity={1}
        onPress={() => setShowPlaceModal(false)}
      >
        <TouchableOpacity activeOpacity={1} style={styles.placeModalCard}>
          <View style={styles.placeModalHandle} />
          <Text style={styles.placeModalName}>{selectedPlace?.name}</Text>
          <View style={styles.placeModalMetaRow}>
            {selectedPlace?.rating != null && selectedPlace.rating > 0 && (
              <View style={styles.placeModalRatingBadge}>
                <Star size={14} color="#FFB800" fill="#FFB800" />
                <Text style={styles.placeModalRatingText}>{selectedPlace.rating.toFixed(1)}</Text>
              </View>
            )}
            {selectedPlace?.price_level != null && selectedPlace.price_level > 0 && (
              <View style={styles.placeModalPriceBadge}>
                <Text style={styles.placeModalPriceText}>{'
        <View style={styles.header}>
          <View style={styles.normalHeader}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.normalHeader}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          {selectedPlace?.formatted_address && (
            <Text style={styles.placeModalAddress}>{selectedPlace.formatted_address}</Text>
          )}
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            activeOpacity={0.8}
            onPress={() => {
              if (!selectedPlace) return;
              const url = selectedPlace.googleMapsUrl
                ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.name)}${selectedPlace.place_id ? `&query_place_id=${selectedPlace.place_id}` : ''}`;
              Linking.openURL(url).catch(() => {});
            }}
          >
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            activeOpacity={0.7}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.normalHeader}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.normalHeader}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.normalHeader}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.normalHeader}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          {selectedPlace?.formatted_address && (
            <Text style={styles.placeModalAddress}>{selectedPlace.formatted_address}</Text>
          )}
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            activeOpacity={0.8}
            onPress={() => {
              if (!selectedPlace) return;
              const url = selectedPlace.googleMapsUrl
                ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.name)}${selectedPlace.place_id ? `&query_place_id=${selectedPlace.place_id}` : ''}`;
              Linking.openURL(url).catch(() => {});
            }}
          >
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            activeOpacity={0.7}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.normalHeader}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.normalHeader}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          {selectedPlace?.formatted_address && (
            <Text style={styles.placeModalAddress}>{selectedPlace.formatted_address}</Text>
          )}
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.85}
          >
            <ExternalLink size={18} color="#FFFFFF" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
            activeOpacity={0.7}
          >
            <X size={18} color={Colors.textLight} />
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.normalHeader}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.normalHeader}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          {selectedPlace?.formatted_address && (
            <Text style={styles.placeModalAddress}>{selectedPlace.formatted_address}</Text>
          )}
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            activeOpacity={0.8}
            onPress={() => {
              if (!selectedPlace) return;
              const url = selectedPlace.googleMapsUrl
                ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.name)}${selectedPlace.place_id ? `&query_place_id=${selectedPlace.place_id}` : ''}`;
              Linking.openURL(url).catch(() => {});
            }}
          >
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            activeOpacity={0.7}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.normalHeader}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.normalHeader}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.normalHeader}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.normalHeader}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          {selectedPlace?.formatted_address && (
            <Text style={styles.placeModalAddress}>{selectedPlace.formatted_address}</Text>
          )}
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            activeOpacity={0.8}
            onPress={() => {
              if (!selectedPlace) return;
              const url = selectedPlace.googleMapsUrl
                ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.name)}${selectedPlace.place_id ? `&query_place_id=${selectedPlace.place_id}` : ''}`;
              Linking.openURL(url).catch(() => {});
            }}
          >
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            activeOpacity={0.7}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.normalHeader}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.normalHeader}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeModalCloseButton}
            onPress={() => setShowPlaceModal(false)}
          >
            <Text style={styles.placeModalCloseText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
              onPress={() => safeGoBack()}
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

          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {currentUser?.id !== userId && (
            <View style={styles.voiceNoteSection}>
              <TouchableOpacity 
                style={styles.voiceNoteButton}
                onPress={() => router.push(`/chat?userId=${userId}` as any)}
                testID="show-voice-recorder"
              >
                <Mic size={20} color={Colors.primary} />
                <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <Text style={styles.preferenceLabel}>Intention</Text>
              <Text style={styles.preferenceValue}>
                {user.intention ? ({
                  make_new_friends: 'Make new friends',
                  relationship: 'Relationship',
                  casual: 'Casual',
                  marriage: 'Marriage',
                  open_marriage: 'Open Marriage',
                  figuring_it_out: 'Figuring it out',
                } as const)[user.intention] : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
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
    justifyContent: 'flex-start',
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: '3.5%',
    marginBottom: 8,
  },
  foodGridItemLast: {
    marginRight: 0,
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
    height: '100%',
    borderRadius: 8,
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
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginRight: '3.5%',
    marginBottom: 8,
  },
  addPlaceButtonLast: {
    marginRight: 0,
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
  placeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addPlaceButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  voiceNoteSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voiceNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  voiceRecorderContainer: {
    alignSelf: 'center',
  },

});