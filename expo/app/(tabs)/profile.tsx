import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, TextInput, Alert, Modal, FlatList } from 'react-native';
import { Star, Settings, MapPin, Heart, Plus, X, Edit3, Check, Camera, Users, Utensils, Mic, ExternalLink } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/types/user';
import { useChat } from '@/hooks/use-chat';
import { mockUsers } from '@/mocks/users';
import { useFavorites } from '@/hooks/use-favorites';


import { router } from 'expo-router';

const LANGUAGE_OPTIONS = [
  'English',
  'Cantonese',
  'Mandarin',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Japanese',
  'Korean',
  'Arabic',
  'Russian',
  'Hindi',
  'Vietnamese',
  'Thai',
  'Tagalog',
  'Other',
  'No preference'
];

const INCOME_LEVELS = [
  '≤$50k',
  '$50k - $100k',
  '≥$100k'
];

const PREFERRED_INCOME_LEVELS = [
  '≤$50k',
  '$50k - $100k',
  '≥$100k'
];

type TabType = 'food' | 'pictures' | 'mealups';

export default function ProfileScreen() {
  const { user, updateUser } = useAuth();
  const { matchedProfiles, removeMatchedProfile } = useChat();
  const { favoritePlaces, removeFromFavorites } = useFavorites();

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);

  useEffect(() => {
    if (user) {
      setEditedUser(user);
    }
  }, [user]);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const [showPersonalIncomeModal, setShowPersonalIncomeModal] = useState(false);
  const [showPersonalLanguageModal, setShowPersonalLanguageModal] = useState(false);
  const [showPreferredIncomeModal, setShowPreferredIncomeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('food');

  const [editedBio, setEditedBio] = useState(user?.bio || '');
  const [selectedPlace, setSelectedPlace] = useState<{
    place_id: string;
    name: string;
    formatted_address?: string;
    rating?: number;
    price_level?: number;
    geometry?: { location: { lat: number; lng: number } };
  } | null>(null);
  const [showPlaceModal, setShowPlaceModal] = useState(false);


  console.log('Profile screen render - user:', user);

  if (!user) {
    console.log('User not found, showing loading...');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading user...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    console.log('handleSave called');
    if (editedUser) {
      console.log('Saving user:', editedUser);
      await updateUser(editedUser);
      console.log('User saved successfully');
      setIsEditing(false);
    } else {
      console.log('No editedUser to save');
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setEditedBio(user?.bio || '');
    setIsEditing(false);
  };

  const addPhoto = () => {
    if (!newPhotoUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid photo URL');
      return;
    }
    
    if (editedUser && editedUser.photos.length < 5) {
      const updatedUser = {
        ...editedUser,
        photos: [...editedUser.photos, newPhotoUrl.trim()]
      };
      setEditedUser(updatedUser);
      setNewPhotoUrl('');
    } else {
      Alert.alert('Limit Reached', 'You can only add up to 5 photos');
    }
  };

  const updateBio = () => {
    if (editedUser) {
      const updatedUser = {
        ...editedUser,
        bio: editedBio
      };
      setEditedUser(updatedUser);
    }
  };

  const removePhoto = (index: number) => {
    if (editedUser && editedUser.photos.length > 1) {
      const updatedUser = {
        ...editedUser,
        photos: editedUser.photos.filter((_: string, i: number) => i !== index)
      };
      setEditedUser(updatedUser);
    } else {
      Alert.alert('Error', 'You must have at least one photo');
    }
  };

  const toggleLanguage = (language: string) => {
    if (!editedUser) return;
    
    const currentLanguages = editedUser.preferences.preferredEthnicity || [];
    const updatedLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter((e: string) => e !== language)
      : [...currentLanguages, language];
    
    setEditedUser({
      ...editedUser,
      preferences: {
        ...editedUser.preferences,
        preferredEthnicity: updatedLanguages
      }
    });
  };

  const setPersonalIncomeLevel = (income: string) => {
    if (!editedUser) return;
    
    setEditedUser({
      ...editedUser,
      preferences: {
        ...editedUser.preferences,
        incomeLevel: income
      }
    });
    setShowPersonalIncomeModal(false);
  };

  const setPersonalLanguage = (language: string) => {
    if (!editedUser) return;
    
    setEditedUser({
      ...editedUser,
      ethnicity: language
    });
    setShowPersonalLanguageModal(false);
  };

  const setPreferredIncomeLevel = (income: string) => {
    if (!editedUser) return;
    
    setEditedUser({
      ...editedUser,
      preferences: {
        ...editedUser.preferences,
        preferredIncomeLevel: income
      }
    });
    setShowPreferredIncomeModal(false);
  };

  const handleViewOnGoogleMaps = async () => {
    if (!selectedPlace) return;
    const query = encodeURIComponent(selectedPlace.name);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.POPOVER,
      });
    } catch (error) {
      console.error('Failed to open Google Maps:', error);
    }
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
          These make me say YES to a date 🍕
        </Text>
        <View style={styles.foodGrid}>
          {favoritePlaces.map((place) => (
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
                <View style={styles.favPlaceHeader}>
                  <Text style={styles.favPlaceName} numberOfLines={2}>{place.name}</Text>
                  <TouchableOpacity
                    style={styles.removeFavButton}
                    onPress={() => removeFromFavorites(place.place_id)}
                  >
                    <X size={14} color={Colors.textLight} />
                  </TouchableOpacity>
                </View>
                <View style={styles.favPlaceMeta}>
                  {place.rating != null && place.rating > 0 && (
                    <View style={styles.favPlaceRating}>
                      <Star size={12} color="#FFB800" fill="#FFB800" />
                      <Text style={styles.favPlaceRatingText}>{place.rating.toFixed(1)}</Text>
                    </View>
                  )}
                  {place.price_level != null && place.price_level > 0 && (
                    <Text style={styles.favPlacePriceText}>{'$'.repeat(place.price_level)}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
        </View>
        {favoritePlaces.length === 0 && (
          <Text style={styles.emptyFoodHint}>Search for places and add your favorites here!</Text>
        )}
      </View>
    );
  };

  const renderPicturesTab = () => {
    const photos = isEditing ? editedUser?.photos || [] : user?.photos || [];
    
    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabDescription}>
          Show your best self! ({photos.length}/5)
        </Text>
        <View style={styles.picturesGrid}>
          {photos.map((photo: string, index: number) => (
            <View key={`photo-${index}-${photo.slice(-10)}`} style={styles.pictureContainer}>
              <Image source={{ uri: photo }} style={styles.pictureImage} />
              {isEditing && (
                <TouchableOpacity 
                  style={styles.removePictureButton}
                  onPress={() => removePhoto(index)}
                >
                  <X size={16} color={Colors.background} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {isEditing && photos.length < 5 && (
            <View style={styles.addPictureContainer}>
              <Camera size={24} color={Colors.textLight} />
              <TextInput
                style={styles.pictureInput}
                placeholder="Photo URL"
                placeholderTextColor={Colors.textLight}
                value={newPhotoUrl}
                onChangeText={setNewPhotoUrl}
                multiline
              />
              <TouchableOpacity style={styles.addPictureButton} onPress={addPhoto}>
                <Plus size={16} color={Colors.background} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        {!isEditing && photos.length < 5 && (
          <TouchableOpacity 
            style={styles.addPicturesButton}
            onPress={() => setIsEditing(true)}
          >
            <Plus size={20} color={Colors.primary} />
            <Text style={styles.addPicturesButtonText}>Add Pictures</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderMealUpsTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabDescription}>
          Your upcoming meal up events
        </Text>
        <View style={styles.mealUpsContainer}>
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
          <View style={styles.mealUpItem}>
            <View style={styles.mealUpInfo}>
              <Text style={styles.mealUpTitle}>Brunch & Mimosas</Text>
              <Text style={styles.mealUpDate}>Dec 25, 2024</Text>
              <Text style={styles.mealUpVenue}>The Garden Cafe</Text>
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
                <Text style={styles.placeModalPriceText}>{'$'.repeat(selectedPlace.price_level)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.placeModalGoogleButton}
            onPress={handleViewOnGoogleMaps}
            activeOpacity={0.8}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.placeModalGoogleButtonText}>View on Google Maps</Text>
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

  const renderLanguageModal = () => (
    <Modal visible={showLanguageModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Preferred language</Text>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Select all that apply (optional)</Text>
          <FlatList
            data={LANGUAGE_OPTIONS}
            keyExtractor={(item, index) => `language-option-${index}-${item.replace(/\s+/g, '-')}`}
            renderItem={({ item }) => {
              const isSelected = editedUser?.preferences.preferredEthnicity?.includes(item) || false;
              return (
                <TouchableOpacity
                  style={[styles.optionItem, isSelected && styles.selectedOption]}
                  onPress={() => toggleLanguage(item)}
                >
                  <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                    {item}
                  </Text>
                  {isSelected && <Check size={20} color={Colors.background} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  const renderPersonalIncomeModal = () => (
    <Modal visible={showPersonalIncomeModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Income Level</Text>
            <TouchableOpacity onPress={() => setShowPersonalIncomeModal(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Select your income range (optional)</Text>
          <FlatList
            data={INCOME_LEVELS}
            keyExtractor={(item, index) => `income-level-${index}-${item.replace(/\s+/g, '-')}`}
            renderItem={({ item }) => {
              const isSelected = editedUser?.preferences.incomeLevel === item;
              return (
                <TouchableOpacity
                  style={[styles.optionItem, isSelected && styles.selectedOption]}
                  onPress={() => setPersonalIncomeLevel(item)}
                >
                  <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                    {item}
                  </Text>
                  {isSelected && <Check size={20} color={Colors.background} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  const renderPersonalLanguageModal = () => (
    <Modal visible={showPersonalLanguageModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Language</Text>
            <TouchableOpacity onPress={() => setShowPersonalLanguageModal(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Select your language (optional)</Text>
          <FlatList
            data={LANGUAGE_OPTIONS.filter(option => option !== 'No preference')}
            keyExtractor={(item, index) => `personal-language-${index}-${item.replace(/\s+/g, '-')}`}
            renderItem={({ item }) => {
              const isSelected = editedUser?.ethnicity === item;
              return (
                <TouchableOpacity
                  style={[styles.optionItem, isSelected && styles.selectedOption]}
                  onPress={() => setPersonalLanguage(item)}
                >
                  <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                    {item}
                  </Text>
                  {isSelected && <Check size={20} color={Colors.background} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  const renderPreferredIncomeModal = () => (
    <Modal visible={showPreferredIncomeModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Preferred Income Level</Text>
            <TouchableOpacity onPress={() => setShowPreferredIncomeModal(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Select preferred income range for matches (optional)</Text>
          <FlatList
            data={PREFERRED_INCOME_LEVELS}
            keyExtractor={(item, index) => `preferred-income-level-${index}-${item.replace(/\s+/g, '-')}`}
            renderItem={({ item }) => {
              const isSelected = editedUser?.preferences.preferredIncomeLevel === item;
              return (
                <TouchableOpacity
                  style={[styles.optionItem, isSelected && styles.selectedOption]}
                  onPress={() => setPreferredIncomeLevel(item)}
                >
                  <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                    {item}
                  </Text>
                  {isSelected && <Check size={20} color={Colors.background} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  const renderSettingsModal = () => (
    <Modal visible={showSettingsModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.settingsContent}>
            <TouchableOpacity style={styles.settingsItem}>
              <Settings size={20} color={Colors.textLight} />
              <Text style={styles.settingsItemText}>Account Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {isEditing ? (
            <View style={styles.editingHeader}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.normalHeader}>
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => setShowSettingsModal(true)}
              >
                <Settings size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={styles.profileSection}>
          {isEditing && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          )}
          <View style={styles.profileImageContainer}>
            <Image source={{ uri: user.photos[0] }} style={styles.profileImage} />
            <View style={styles.profileLoveIconsContainer}>
              {Object.values(matchedProfiles)
                .filter(profile => profile.matchType === 'fight_for_fries' && profile.userId !== user.id)
                .slice(0, 1)
                .map((matchedProfile) => {
                  const matchedUser = mockUsers.find(u => u.id === matchedProfile.userId);
                  if (!matchedUser) return null;
                  
                  return (
                    <View key={matchedProfile.userId} style={styles.profileLoveIconWrapper}>
                      <TouchableOpacity 
                        style={styles.profileLoveIconBackground}
                        onPress={() => {
                          router.push(`/user-profile?userId=${matchedProfile.userId}` as any);
                        }}
                      >
                        <Heart size={16} color={Colors.primary} fill={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.removeLoveButton}
                        onPress={() => {
                          removeMatchedProfile(matchedProfile.userId);
                        }}
                        testID="remove-love-button"
                      >
                        <X size={10} color={Colors.primary} strokeWidth={3} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              }
            </View>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {!isEditing && (
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Edit3 size={20} color={Colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
          {!isEditing && (
            <TouchableOpacity 
              style={styles.voiceNoteButtonProfile}
              onPress={() => router.push('/(tabs)/messages' as any)}
            >
              <Mic size={20} color={Colors.primary} />
              <Text style={styles.voiceNoteButtonText}>Voice Note</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.personalInfoSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.personalInfoRow}>
            <TouchableOpacity 
              style={styles.halfPreferenceItem}
              onPress={() => isEditing && setShowPersonalLanguageModal(true)}
              disabled={!isEditing}
            >
              <View style={styles.preferenceHeader}>
                <Text style={styles.preferenceLabel}>Language</Text>
                {isEditing && <Edit3 size={16} color={Colors.primary} />}
              </View>
              <Text style={styles.preferenceValue}>
                {(isEditing ? editedUser?.ethnicity : user.ethnicity) || 'Not specified'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.halfPreferenceItem}
              onPress={() => isEditing && setShowPersonalIncomeModal(true)}
              disabled={!isEditing}
            >
              <View style={styles.preferenceHeader}>
                <Text style={styles.preferenceLabel}>Income Level</Text>
                {isEditing && <Edit3 size={16} color={Colors.primary} />}
              </View>
              <Text style={styles.preferenceValue}>
                {(isEditing ? editedUser?.preferences.incomeLevel : user.preferences.incomeLevel) || 'Not specified'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          {isEditing ? (
            <View style={styles.bioEditContainer}>
              <TextInput
                style={styles.bioInput}
                value={editedBio}
                onChangeText={setEditedBio}
                onBlur={updateBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={3}
              />
            </View>
          ) : (
            <Text style={styles.bio}>{user.bio}</Text>
          )}
        </View>

        {renderTabBar()}
        {renderTabContent()}
        <View style={styles.scrollViewBottomPadding} />
      </ScrollView>
      {renderPlaceDetailModal()}
      {renderLanguageModal()}
      {renderPersonalIncomeModal()}
      {renderPersonalLanguageModal()}
      {renderPreferredIncomeModal()}
      {renderSettingsModal()}
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
  editingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsButton: {
    padding: 8,
  },
  editButton: {
    position: 'absolute',
    top: 80,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
  saveButton: {
    position: 'absolute',
    top: 80,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    zIndex: 10,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.background,
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
  profileLoveIconsContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  profileLoveIconWrapper: {
    position: 'relative',
  },
  profileLoveIconBackground: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
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
  bioSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  voiceNoteButtonProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: 12,
    alignSelf: 'center',
  },
  voiceNoteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  personalInfoSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  bioEditContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  bioInput: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: 'top',
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
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  foodGridItem: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 8,
  },
  favPlaceCard: {
    flex: 1,
    justifyContent: 'space-between',
  },
  favPlaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  favPlaceName: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
    marginRight: 2,
  },
  removeFavButton: {
    padding: 2,
  },
  favPlaceAddress: {
    fontSize: 9,
    color: Colors.textLight,
    marginTop: 3,
  },
  favPlaceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  favPlaceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  favPlaceRatingText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  favPlacePriceText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#4CAF50',
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
  },
  addPlaceIconContainer: {
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
  emptyFoodHint: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  picturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pictureContainer: {
    position: 'relative',
    width: '48%',
    aspectRatio: 0.8,
    marginBottom: 12,
  },
  pictureImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removePictureButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 4,
  },
  addPictureContainer: {
    width: '48%',
    aspectRatio: 0.8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
  },
  pictureInput: {
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    marginVertical: 8,
    minHeight: 40,
  },
  addPictureButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 8,
    marginTop: 8,
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
  statusTextUpcoming: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.background,
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
  preferenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  preferenceValue: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  selectedOption: {
    backgroundColor: Colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
  selectedOptionText: {
    color: Colors.background,
    fontWeight: '600',
  },
  addPicturesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addPicturesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  settingsContent: {
    paddingBottom: 20,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  settingsItemText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text,
  },
  scrollViewBottomPadding: {
    height: 40,
  },
  placeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  placeModalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center' as const,
  },
  placeModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 20,
  },
  placeModalName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  placeModalMetaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 24,
  },
  placeModalRatingBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255,184,0,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  placeModalRatingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFB800',
  },
  placeModalPriceBadge: {
    backgroundColor: 'rgba(76,175,80,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  placeModalPriceText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#4CAF50',
  },
  placeModalGoogleButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    gap: 8,
    marginBottom: 12,
  },
  placeModalGoogleButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  placeModalCloseButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  placeModalCloseText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.textLight,
  },
  removeLoveButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.background,
    borderRadius: 10,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 11,
  },
});
