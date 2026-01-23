import React, { useState, useCallback } from 'react';
import { Text, StyleSheet, FlatList, SafeAreaView, View, TextInput, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Search, Filter, Heart, X } from 'lucide-react-native';
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
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  const [filters, setFilters] = useState({
    ageMin: 18,
    ageMax: 65,
    distance: 50,
    sex: [] as string[],
    incomeLevel: [] as string[],
    languages: [] as string[],
  });
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

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAge = user.age >= filters.ageMin && user.age <= filters.ageMax;
    
    const matchesSex = filters.sex.length === 0 || (user.sex !== undefined && filters.sex.includes(user.sex));
    
    const matchesIncome = filters.incomeLevel.length === 0 || (user.income !== undefined && filters.incomeLevel.some(level => {
      if (level === '≤$50k') return user.income! <= 50000;
      if (level === '≥$50k') return user.income! >= 50000 && user.income! < 100000;
      if (level === '≥$100k') return user.income! >= 100000;
      return false;
    }));
    
    const matchesLanguages = filters.languages.length === 0 || 
      filters.languages.some(lang => user.languages?.includes(lang));
    
    return matchesSearch && matchesAge && matchesSex && matchesIncome && matchesLanguages;
  });



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
            <Heart size={24} color="#FF6B35" fill={unreadCount > 0 ? "#FF6B35" : "none"} />
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
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#666666"
            />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
            <Filter size={20} color="#000000" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, styles.tabLeft, activeTab === 'user' && styles.activeTab]}
            onPress={() => setActiveTab('user')}
          >
            <Text style={[styles.tabText, activeTab === 'user' && styles.activeTabText]}>User</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, styles.tabRight, activeTab === 'places' && styles.activeTab]}
            onPress={() => setActiveTab('places')}
          >
            <Text style={[styles.tabText, activeTab === 'places' && styles.activeTabText]}>Places</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {activeTab === 'user' && (
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
      )}
      
      {activeTab === 'places' && (
        <View style={styles.placesPlaceholder}>
          <Text style={styles.placesPlaceholderText}>Places coming soon</Text>
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
      
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.closeButton}>
                <X size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Age Range</Text>
                <View style={styles.ageInputs}>
                  <View style={styles.ageInput}>
                    <Text style={styles.ageInputLabel}>Min</Text>
                    <TextInput
                      style={styles.ageInputField}
                      value={filters.ageMin.toString()}
                      onChangeText={(text) => setFilters({...filters, ageMin: parseInt(text) || 18})}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <Text style={styles.ageRangeSeparator}>-</Text>
                  <View style={styles.ageInput}>
                    <Text style={styles.ageInputLabel}>Max</Text>
                    <TextInput
                      style={styles.ageInputField}
                      value={filters.ageMax.toString()}
                      onChangeText={(text) => setFilters({...filters, ageMax: parseInt(text) || 65})}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                </View>
              </View>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Distance (km)</Text>
                <TextInput
                  style={styles.distanceInput}
                  value={filters.distance.toString()}
                  onChangeText={(text) => setFilters({...filters, distance: parseInt(text) || 50})}
                  keyboardType="number-pad"
                  placeholder="50"
                />
              </View>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Sex</Text>
                <View style={styles.checkboxGroup}>
                  {['Male', 'Female', 'Other'].map((sex) => (
                    <TouchableOpacity
                      key={sex}
                      style={styles.checkbox}
                      onPress={() => {
                        const newSex = filters.sex.includes(sex)
                          ? filters.sex.filter(s => s !== sex)
                          : [...filters.sex, sex];
                        setFilters({...filters, sex: newSex});
                      }}
                    >
                      <View style={[styles.checkboxBox, filters.sex.includes(sex) && styles.checkboxBoxActive]}>
                        {filters.sex.includes(sex) && <View style={styles.checkboxCheck} />}
                      </View>
                      <Text style={styles.checkboxLabel}>{sex}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Income Level</Text>
                <View style={styles.checkboxGroup}>
                  {['≤$50k', '≥$50k', '≥$100k'].map((income) => (
                    <TouchableOpacity
                      key={income}
                      style={styles.checkbox}
                      onPress={() => {
                        const newIncome = filters.incomeLevel.includes(income)
                          ? filters.incomeLevel.filter(i => i !== income)
                          : [...filters.incomeLevel, income];
                        setFilters({...filters, incomeLevel: newIncome});
                      }}
                    >
                      <View style={[styles.checkboxBox, filters.incomeLevel.includes(income) && styles.checkboxBoxActive]}>
                        {filters.incomeLevel.includes(income) && <View style={styles.checkboxCheck} />}
                      </View>
                      <Text style={styles.checkboxLabel}>{income}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Languages</Text>
                <View style={styles.checkboxGroup}>
                  {['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean'].map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={styles.checkbox}
                      onPress={() => {
                        const newLang = filters.languages.includes(lang)
                          ? filters.languages.filter(l => l !== lang)
                          : [...filters.languages, lang];
                        setFilters({...filters, languages: newLang});
                      }}
                    >
                      <View style={[styles.checkboxBox, filters.languages.includes(lang) && styles.checkboxBoxActive]}>
                        {filters.languages.includes(lang) && <View style={styles.checkboxCheck} />}
                      </View>
                      <Text style={styles.checkboxLabel}>{lang}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setFilters({
                  ageMin: 18,
                  ageMax: 65,
                  distance: 50,
                  sex: [],
                  incomeLevel: [],
                  languages: [],
                })}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingHorizontal: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 8,
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
    paddingHorizontal: 4,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#888888',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLeft: {
    borderRightWidth: 0.5,
    borderRightColor: '#888888',
  },
  tabRight: {
    borderLeftWidth: 0.5,
    borderLeftColor: '#888888',
  },
  activeTab: {
    backgroundColor: '#000000',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  placesPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placesPlaceholderText: {
    fontSize: 16,
    color: '#666666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  filterSection: {
    marginBottom: 28,
  },
  filterLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  ageInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ageInput: {
    flex: 1,
  },
  ageInputLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  ageInputField: {
    borderWidth: 1,
    borderColor: '#888888',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
  },
  ageRangeSeparator: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginHorizontal: 16,
    marginTop: 20,
  },
  distanceInput: {
    borderWidth: 1,
    borderColor: '#888888',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
  },
  checkboxGroup: {
    gap: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#888888',
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  checkboxCheck: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#000000',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});