import React, { useState, useEffect, useCallback } from 'react';
import { Text, StyleSheet, FlatList, SafeAreaView, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Search, Filter, RefreshCw, MapPin as MapPinIcon, Heart } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { UserCard } from '@/components/UserCard';
import { PlaceCard } from '@/components/PlaceCard';
import { SuccessPopup } from '@/components/SuccessPopup';
import { NotificationPopup } from '@/components/NotificationPopup';
import { mockUsers } from '@/mocks/users';
import { usePlaces } from '@/hooks/use-places';
import { useAuth } from '@/hooks/use-auth';
import { useFavorites } from '@/hooks/use-favorites';
import { useNotifications } from '@/hooks/use-notifications';
import { useChat } from '@/hooks/use-chat';
import { Colors } from '@/constants/colors';

import type { User } from '@/types/user';
import type { Place } from '@/types/place';

export default function SearchScreen() {
  const { tab } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'places'>(tab === 'places' ? 'places' : 'users');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const { user } = useAuth();
  const { addToFavorites, isPlaceInFavorites } = useFavorites();
  const { getUnreadCount } = useNotifications();
  const { matchedProfiles } = useChat();

  const {
    places,
    loading,
    error,
    locationPermission,
    searchPlacesByText,
    refreshNearbyPlaces,
    requestLocationPermission,
  } = usePlaces();

  useEffect(() => {
    if (tab === 'places') {
      setActiveTab('places');
    }
  }, [tab]);

  const handlePlacesSearch = useCallback(() => {
    if (searchQuery.trim()) {
      searchPlacesByText(searchQuery);
    } else {
      refreshNearbyPlaces();
    }
  }, [searchQuery, searchPlacesByText, refreshNearbyPlaces]);

  useEffect(() => {
    if (activeTab === 'places') {
      handlePlacesSearch();
    }
  }, [searchQuery, activeTab, handlePlacesSearch]);

  const handleUserPress = (user: User) => {
    router.push({
      pathname: '/user-profile',
      params: { userId: user.id }
    });
  };

  const handlePlacePress = (place: Place) => {
    router.push({
      pathname: '/place-details',
      params: { placeId: place.place_id }
    });
  };

  const handleLocationPermission = async () => {
    console.log('Handle location permission clicked');
    await requestLocationPermission();
  };

  const handleAddToFavorites = async (place: Place) => {
    console.log('=== SEARCH SCREEN: ADD TO FAVORITES CLICKED ===');
    console.log('Place name:', place.name);
    console.log('Place ID:', place.place_id);
    console.log('Current user:', user?.name, user?.id);
    console.log('addToFavorites function exists?', !!addToFavorites);
    console.log('isPlaceInFavorites function exists?', !!isPlaceInFavorites);
    
    if (!user) {
      console.log('No user found, showing error alert');
      Alert.alert('Error', 'You must be logged in to add favorites');
      return;
    }
    
    // Check if place is already in favorites
    const alreadyInFavorites = isPlaceInFavorites(place.place_id);
    console.log('Is place already in favorites?', alreadyInFavorites);
    
    if (alreadyInFavorites) {
      Alert.alert('Already Added', `${place.name} is already in your "Food to bribe me with" list!`);
      return;
    }
    
    try {
      console.log('=== DIRECTLY ADDING TO FAVORITES (SKIPPING CONFIRMATION) ===');
      console.log('About to call addToFavorites...');
      
      // Add place to favorites using the favorites hook
      const success = await addToFavorites(place);
      
      console.log('addToFavorites returned:', success);
      
      if (success) {
        console.log('Place added to favorites successfully, showing success popup');
        setShowSuccessPopup(true);
      } else {
        console.log('Failed to add place to favorites, showing error alert');
        Alert.alert('Error', 'Failed to add place to favorites. Please try again.');
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleNotificationPress = () => {
    setShowNotificationPopup(true);
  };

  const unreadCount = getUnreadCount();

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUser = useCallback(({ item }: { item: User }) => {
    console.log('Rendering user card for:', item.name, 'ID:', item.id);
    console.log('Current matchedProfiles in search:', matchedProfiles);
    return (
      <UserCard user={item} onPress={() => handleUserPress(item)} isGridView={true} />
    );
  }, [matchedProfiles]);

  const renderPlace = ({ item }: { item: Place }) => (
    <PlaceCard 
      place={item} 
      onPress={handlePlacePress} 
      onAddToFavorites={handleAddToFavorites}
    />
  );

  const renderPlacesContent = () => {
    if (locationPermission === 'denied' || locationPermission === 'undetermined' || locationPermission === null) {
      return (
        <View style={styles.permissionContainer}>
          <MapPinIcon size={48} color={Colors.textLight} />
          <Text style={styles.permissionTitle}>Location Access Needed</Text>
          <Text style={styles.permissionText}>
            To show nearby restaurants, we need access to your location.
          </Text>
          <TouchableOpacity onPress={handleLocationPermission} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding places...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handlePlacesSearch} style={styles.retryButton}>
            <RefreshCw size={16} color={Colors.primary} />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (places.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No places found for your search' : 'No nearby places found'}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        key="places-list"
        data={places}
        renderItem={renderPlace}
        keyExtractor={(item) => item.place_id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Just Meal Up</Text>
          <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
            <Heart size={24} color="#FF1493" fill={unreadCount > 0 ? "#FF1493" : "none"} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#000000" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users or restaurants..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#666666"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#000000" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'users' && styles.activeTab]}
            onPress={() => setActiveTab('users')}
          >
            <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Users</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'places' && styles.activeTab]}
            onPress={() => setActiveTab('places')}
          >
            <Text style={[styles.tabText, activeTab === 'places' && styles.activeTabText]}>Places</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {activeTab === 'users' ? (
        <FlatList
          key="users-list"
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
        />
      ) : (
        renderPlacesContent()
      )}
      
      <SuccessPopup
        visible={showSuccessPopup}
        message="Poof! Added successfully👌🤘"
        onHide={() => setShowSuccessPopup(false)}
      />
      
      <NotificationPopup
        visible={showNotificationPopup}
        onClose={() => setShowNotificationPopup(false)}
      />
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
    paddingVertical: 24,
    paddingBottom: 16,
    backgroundColor: '#FFF8E7',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
  },
  notificationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: '#888888',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF8E7',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#888888',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000000',
  },
  filterButton: {
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#888888',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#888888',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  activeTabText: {
    color: Colors.background,
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 8,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    color: Colors.background,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
});