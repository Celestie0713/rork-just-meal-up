import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, TextInput, Alert, Modal, FlatList } from 'react-native';
import { Star, Settings, MapPin, Plus, X, Pencil, Check, Camera, Users, Utensils, Mic, ExternalLink, Heart, LogOut } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/types/user';
import { useChat } from '@/hooks/use-chat';
import { mockUsers } from '@/mocks/users';
import { useFavorites } from '@/hooks/use-favorites';
import { mockMealUps } from '@/mocks/meal-ups';
import { ChevronRight } from 'lucide-react-native';


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

const INTENTION_OPTIONS = [
  { value: 'make_new_friends' as const, label: 'Make new friends' },
  { value: 'relationship' as const, label: 'Relationship' },
  { value: 'casual' as const, label: 'Casual' },
  { value: 'marriage' as const, label: 'Marriage' },
  { value: 'open_marriage' as const, label: 'Open Marriage' },
  { value: 'figuring_it_out' as const, label: 'Figuring it out' },
];

const INTENTION_LABEL_MAP: Record<string, string> = {
  make_new_friends: 'Make new friends',
  relationship: 'Relationship',
  casual: 'Casual',
  marriage: 'Marriage',
  open_marriage: 'Open Marriage',
  figuring_it_out: 'Figuring it out',
};

type TabType = 'food' | 'pictures' | 'mealups';

export default function ProfileScreen() {
  const { user, updateUser, signOut } = useAuth();
  const { getExclusiveMatchPartner, removeMatchedProfile, hasActiveExclusiveMatch } = useChat();
  const { favoritePlaces, removeFromFavorites } = useFavorites();

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);

  useEffect(() => {
    if (user) {
      setEditedUser(user);
    }
  }, [user]);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [showPersonalLanguageModal, setShowPersonalLanguageModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRemoveLoveModal, setShowRemoveLoveModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('food');

  const [editedBio, setEditedBio] = useState(user?.bio || '');
  const [selectedPlace, setSelectedPlace] = useState<{
    place_id: string;
    name: string;
    formatted_address?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    googleMapsUrl?: string;
    rating?: number;
    price_level?: number;
    geometry?: { location: { lat: number; lng: number } };
  } | null>(null);
  const [showPlaceModal, setShowPlaceModal] = useState(false);


  const exclusivePartner = getExclusiveMatchPartner();
  const partnerUser = exclusivePartner ? mockUsers.find(u => u.id === exclusivePartner.userId) : null;
  const isExclusive = hasActiveExclusiveMatch();

  const handleRemoveLoveIcon = () => {
    if (!exclusivePartner) return;
    setShowRemoveLoveModal(true);
  };

  const confirmRemoveLoveIcon = () => {
    if (!exclusivePartner) return;
    console.log('[Profile] Removing exclusive match with:', exclusivePartner.userId);
    removeMatchedProfile(exclusivePartner.userId);
    setShowRemoveLoveModal(false);
  };

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

  const setIntention = (intention: User['intention']) => {
    if (!editedUser) return;
    
    setEditedUser({
      ...editedUser,
      intention
    });
    setShowIntentionModal(false);
  };

  const setPersonalLanguage = (language: string) => {
    if (!editedUser) return;
    
    setEditedUser({
      ...editedUser,
      ethnicity: language
    });
    setShowPersonalLanguageModal(false);
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
    const now = Date.now();
    const userMealUps = mockMealUps
      .filter(m => user && m.currentAttendees.includes(user.id) && new Date(m.date).getTime() >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabDescription}>
          Your meal up events
        </Text>
        <View style={styles.mealUpsContainer}>
          {userMealUps.length === 0 ? (
            <Text style={styles.emptyFoodHint}>No upcoming meal ups</Text>
          ) : (
            userMealUps.map((mealUp) => {
              const formattedDate = new Date(mealUp.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              return (
                <TouchableOpacity
                  key={mealUp.id}
                  style={styles.mealUpItem}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/meal-up-details?mealUpId=${mealUp.id}` as any)}
                >
                  <View style={styles.mealUpInfo}>
                    <Text style={styles.mealUpTitle}>{mealUp.title}</Text>
                    <Text style={styles.mealUpDate}>{formattedDate}</Text>
                    <Text style={styles.mealUpVenue}>{mealUp.venue.name}</Text>
                  </View>
                  <View style={styles.mealUpDetailsButton}>
                    <Text style={styles.mealUpDetailsButtonText}>Details</Text>
                    <ChevronRight size={14} color={Colors.background} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
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

  const renderIntentionModal = () => (
    <Modal visible={showIntentionModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Intention</Text>
            <TouchableOpacity onPress={() => setShowIntentionModal(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>What are you looking for? (optional)</Text>
          <FlatList
            data={INTENTION_OPTIONS}
            keyExtractor={(item) => `intention-${item.value}`}
            renderItem={({ item }) => {
              const isSelected = (isEditing ? editedUser?.intention : user?.intention) === item.value;
              return (
                <TouchableOpacity
                  style={[styles.optionItem, isSelected && styles.selectedOption]}
                  onPress={() => setIntention(item.value)}
                >
                  <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                    {item.label}
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



  const handleSignOut = () => {
    setShowSettingsModal(false);
    setShowSignOutModal(true);
  };

  const confirmSignOut = async () => {
    await signOut();
    setShowSignOutModal(false);
    router.replace('/signup');
  };

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
            <TouchableOpacity style={[styles.settingsItem, { marginTop: 8 }]} onPress={handleSignOut} activeOpacity={0.7}>
              <LogOut size={20} color="#FF4444" />
              <Text style={[styles.settingsItemText, { color: '#FF4444' }]}>Sign Out</Text>
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
              <View style={{ flex: 1 }} />
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => setShowSettingsModal(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Settings size={26} color={Colors.text} strokeWidth={2.5} />
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
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          {isExclusive && partnerUser && (
            <View style={styles.loveIconRow}>
              <TouchableOpacity
                style={styles.loveIconButton}
                onPress={() => router.push(`/user-profile?userId=${partnerUser.id}` as any)}
                activeOpacity={0.7}
              >
                <Heart size={18} color="#FF3B6F" fill="#FF3B6F" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeLoveButton}
                onPress={handleRemoveLoveIcon}
                activeOpacity={0.7}
              >
                <X size={14} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {!isEditing && (
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Pencil size={20} color={Colors.primary} />
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
                {isEditing && <Pencil size={16} color={Colors.primary} />}
              </View>
              <Text style={styles.preferenceValue}>
                {(isEditing ? editedUser?.ethnicity : user.ethnicity) || 'Not specified'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.halfPreferenceItem}
              onPress={() => isEditing && setShowIntentionModal(true)}
              disabled={!isEditing}
            >
              <View style={styles.preferenceHeader}>
                <Text style={styles.preferenceLabel}>Intention</Text>
                {isEditing && <Pencil size={16} color={Colors.primary} />}
              </View>
              <Text style={styles.preferenceValue}>
                {(() => {
                  const intentionValue = isEditing ? editedUser?.intention : user?.intention;
                  return intentionValue ? INTENTION_LABEL_MAP[intentionValue] : 'Not specified';
                })()}
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
      {renderIntentionModal()}
      {renderPersonalLanguageModal()}
      {renderSettingsModal()}
      <Modal visible={showSignOutModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.signOutModalOverlay}
          activeOpacity={1}
          onPress={() => setShowSignOutModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.signOutModalCard}>
            <View style={styles.signOutModalIconWrap}>
              <LogOut size={28} color={Colors.primary} />
            </View>
            <Text style={styles.signOutModalTitle}>Sign Out</Text>
            <Text style={styles.signOutModalMessage}>
              Are you sure you want to sign out? You will need to sign up again to use the app.
            </Text>
            <View style={styles.signOutModalActions}>
              <TouchableOpacity
                style={styles.signOutModalCancelBtn}
                onPress={() => setShowSignOutModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.signOutModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.signOutModalConfirmBtn}
                onPress={confirmSignOut}
                activeOpacity={0.7}
              >
                <LogOut size={16} color="#FFFFFF" />
                <Text style={styles.signOutModalConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Modal visible={showRemoveLoveModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.removeLoveModalOverlay}
          activeOpacity={1}
          onPress={() => setShowRemoveLoveModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.removeLoveModalCard}>
            <View style={styles.removeLoveModalIconWrap}>
              <Heart size={28} color="#FF3B6F" fill="#FF3B6F" />
            </View>
            <Text style={styles.removeLoveModalTitle}>Remove Love Icon</Text>
            <Text style={styles.removeLoveModalMessage}>
              Removing the love icon means your current exclusive date will be gone forever and your other dates will resume.
            </Text>
            <View style={styles.removeLoveModalActions}>
              <TouchableOpacity
                style={styles.removeLoveModalCancelBtn}
                onPress={() => setShowRemoveLoveModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.removeLoveModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeLoveModalRemoveBtn}
                onPress={confirmRemoveLoveIcon}
                activeOpacity={0.7}
              >
                <Text style={styles.removeLoveModalRemoveText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
  mealUpDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    gap: 2,
  },
  mealUpDetailsButtonText: {
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
  loveIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  loveIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 111, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  loveIconText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FF3B6F',
  },
  removeLoveButton: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 6,
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
  removeLoveModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  removeLoveModalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 320,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
  },
  removeLoveModalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,59,111,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  removeLoveModalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  removeLoveModalMessage: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 24,
  },
  removeLoveModalActions: {
    flexDirection: 'row' as const,
    gap: 12,
    width: '100%',
  },
  removeLoveModalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  removeLoveModalCancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  removeLoveModalRemoveBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#FF3B6F',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  removeLoveModalRemoveText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  signOutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  signOutModalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 320,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
  },
  signOutModalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  signOutModalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  signOutModalMessage: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 24,
  },
  signOutModalActions: {
    flexDirection: 'row' as const,
    gap: 12,
    width: '100%',
  },
  signOutModalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  signOutModalCancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  signOutModalConfirmBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
  },
  signOutModalConfirmText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
