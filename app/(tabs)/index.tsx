import React, { useState, useCallback } from 'react';
import { Text, StyleSheet, FlatList, SafeAreaView, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Search, Filter, Heart, Plus, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import { UserCard } from '@/components/UserCard';
import { PlaceCard } from '@/components/PlaceCard';
import { SuccessPopup } from '@/components/SuccessPopup';
import { NotificationPopup } from '@/components/NotificationPopup';
import { mockUsers } from '@/mocks/users';
import { useNotifications } from '@/hooks/use-notifications';
import { useChat } from '@/hooks/use-chat';
import { usePlaces } from '@/hooks/use-places';
import { Colors } from '@/constants/colors';

import type { User } from '@/types/user';

export default function SearchScreen() {
  const [activeTab, setActiveTab] = useState<'user' | 'places'>('user');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const { getUnreadCount } = useNotifications();
  const { matchedProfiles } = useChat();
  const { 
    places, 
    mode, 
    setMode, 
    selectedInviteeId, 
    setSelectedInviteeId, 
    togglePlaceAdded,
    isLoadingLocation 
  } = usePlaces();

  const handleUserPress = (user: User) => {
    router.push({
      pathname: '/user-profile',
      params: { userId: user.id }
    });
  };

  const handleNotificationPress = () => {
    setShowNotificationPopup(true);
  };

  const unreadCount = getUnreadCount();

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPlaces = places.filter(pd =>
    pd.place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pd.place.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUser = useCallback(({ item }: { item: User }) => {
    console.log('Rendering user card for:', item.name, 'ID:', item.id);
    console.log('Current matchedProfiles in search:', matchedProfiles);
    return (
      <UserCard user={item} onPress={() => handleUserPress(item)} isGridView={true} />
    );
  }, [matchedProfiles]);

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
        
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'user' && styles.tabActive]}
            onPress={() => setActiveTab('user')}
          >
            <Text style={[styles.tabText, activeTab === 'user' && styles.tabTextActive]}>User</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'places' && styles.tabActive]}
            onPress={() => setActiveTab('places')}
          >
            <Text style={[styles.tabText, activeTab === 'places' && styles.tabTextActive]}>Places</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#000000" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#666666"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#000000" />
          </TouchableOpacity>
        </View>
        
      </View>
      
      {activeTab === 'user' ? (
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
        <View style={styles.placesWrapper}>
          <View style={styles.placesHeader}>
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'nearby' && styles.modeButtonActive]}
                onPress={() => setMode('nearby')}
                activeOpacity={0.7}
              >
                <MapPin size={16} color={mode === 'nearby' ? '#FFFFFF' : '#666666'} />
                <Text style={[styles.modeButtonText, mode === 'nearby' && styles.modeButtonTextActive]}>
                  Nearby
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'between-us' && styles.modeButtonActive]}
                onPress={() => setMode('between-us')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeButtonText, mode === 'between-us' && styles.modeButtonTextActive]}>
                  Between-Us
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.addPlaceButton}
              onPress={() => router.push('/add-place')}
              activeOpacity={0.7}
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {mode === 'between-us' && (
            <View style={styles.inviteeSelector}>
              <Text style={styles.inviteeSelectorLabel}>Select someone to meet:</Text>
              <FlatList
                horizontal
                data={mockUsers.slice(0, 5)}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.inviteeChip,
                      selectedInviteeId === item.id && styles.inviteeChipSelected,
                    ]}
                    onPress={() => setSelectedInviteeId(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.inviteeChipText,
                        selectedInviteeId === item.id && styles.inviteeChipTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.inviteeList}
              />
            </View>
          )}

          {isLoadingLocation ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF1493" />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : mode === 'between-us' && !selectedInviteeId ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Select someone above to find places between you</Text>
            </View>
          ) : (
            <FlatList
              key="places-list"
              data={filteredPlaces}
              renderItem={({ item }) => (
                <PlaceCard
                  placeDistance={item}
                  onPress={() => {}}
                  onAddPress={() => togglePlaceAdded(item.place.id, 'current-user')}
                  isAdded={item.place.addedBy.includes('current-user')}
                  mode={mode}
                />
              )}
              keyExtractor={(item) => item.place.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.placesListContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No places found in this area</Text>
                </View>
              }
            />
          )}
        </View>
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
    bottom: -2,
    left: -2,
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
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 8,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#888888',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FF8C00',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888888',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  placesWrapper: {
    flex: 1,
  },
  placesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 4,
    gap: 4,
    flex: 1,
    marginRight: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: '#000000',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  addPlaceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF1493',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteeSelector: {
    backgroundColor: '#FFF8E7',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  inviteeSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  inviteeList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  inviteeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  inviteeChipSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  inviteeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  inviteeChipTextSelected: {
    color: '#FFFFFF',
  },
  placesListContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888888',
    fontWeight: '500',
    textAlign: 'center',
  },
});