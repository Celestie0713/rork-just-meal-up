import React, { useState, useCallback } from 'react';
import { Text, StyleSheet, FlatList, SafeAreaView, View, TextInput, TouchableOpacity } from 'react-native';
import { Search, Filter, Heart } from 'lucide-react-native';
import { router } from 'expo-router';
import { UserCard } from '@/components/UserCard';
import { SuccessPopup } from '@/components/SuccessPopup';
import { NotificationPopup } from '@/components/NotificationPopup';
import { mockUsers } from '@/mocks/users';
import { useNotifications } from '@/hooks/use-notifications';
import { useChat } from '@/hooks/use-chat';
import { Colors } from '@/constants/colors';

import type { User } from '@/types/user';

export default function SearchScreen() {
  const [activeTab, setActiveTab] = useState<'user' | 'places'>('user');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const { getUnreadCount } = useNotifications();
  const { matchedProfiles } = useChat();

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
        <View style={styles.placesContainer}>
          <Text style={styles.placesText}>Places coming soon...</Text>
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
    backgroundColor: '#000000',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888888',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  placesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placesText: {
    fontSize: 18,
    color: '#888888',
    fontWeight: '500',
  },
});