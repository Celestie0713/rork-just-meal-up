import React, { useState } from 'react';
import { Text, StyleSheet, FlatList, SafeAreaView, View, TextInput, TouchableOpacity, Alert, Image, Dimensions, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Filter, Plus, Users, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { MealUpCard } from '@/components/MealUpCard';
import { Colors, Gradients } from '@/constants/colors';
import { mockMealUps } from '@/mocks/meal-ups';
import { mockGroups, type Group } from '@/mocks/groups';
import { useAuth } from '@/hooks/use-auth';
import type { MealUp } from '@/types/user';

export default function EventsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'groups'>('upcoming');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const { user } = useAuth();

  const handleMealUpPress = (mealUp: MealUp) => {
    console.log('Opening meal up:', mealUp.title);
    router.push(`/meal-up-details?mealUpId=${mealUp.id}` as any);
  };

  const handleCreateMealUp = () => {
    console.log('=== CREATE MEAL UP BUTTON CLICKED ===');
    console.log('User:', user);
    console.log('Is paid member:', isPaidMember);
    
    if (isPaidMember) {
      console.log('Navigating to create-meal-up screen...');
      try {
        router.push('/create-meal-up' as any);
        console.log('Navigation successful');
      } catch (error) {
        console.error('Navigation error:', error);
      }
    } else {
      // Show upgrade prompt for non-premium members
      Alert.alert(
        'Upgrade to Premium',
        'Only premium members can organize meal ups. Upgrade now to start creating amazing dining experiences!',
        [
          {
            text: 'Maybe Later',
            style: 'cancel'
          },
          {
            text: 'Upgrade Now',
            onPress: () => {
              console.log('User wants to upgrade');
              // TODO: Navigate to upgrade screen
              Alert.alert('Upgrade', 'Upgrade feature coming soon!');
            }
          }
        ]
      );
    }
  };

  const isPaidMember = user?.membershipTier === 'premium' || user?.membershipTier === 'organizer';

  const now = new Date();

  const upcomingMealUps = mockMealUps.filter(mealUp => mealUp.date >= now);
  const pastMealUps = mockMealUps.filter(mealUp => mealUp.date < now);

  const displayedMealUps = activeTab === 'upcoming' ? upcomingMealUps : pastMealUps;

  const filteredMealUps = displayedMealUps.filter(mealUp => {
    const matchesSearch = mealUp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mealUp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mealUp.venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mealUp.venue.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mealUp.venue.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDistance = !selectedDistance || true;
    const matchesPrice = !priceRange || (mealUp.ticketPrice >= priceRange.min && mealUp.ticketPrice <= priceRange.max);
    
    return matchesSearch && matchesDistance && matchesPrice;
  });

  const renderMealUp = ({ item }: { item: MealUp }) => (
    <MealUpCard mealUp={item} onPress={() => handleMealUpPress(item)} />
  );

  const handleGroupPress = (group: Group) => {
    console.log('Opening group:', group.name);
    router.push(`/group-details?groupId=${group.id}` as any);
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity style={styles.groupCard} onPress={() => handleGroupPress(item)}>
      <Image source={{ uri: item.imageUrl }} style={styles.groupImage} />
      <View style={styles.groupOverlay}>
        <Text style={styles.groupName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.memberCountContainer}>
          <Users size={12} color="#FFFFFF" />
          <Text style={styles.memberCount}>{item.memberCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Gradients.secondary}
        style={styles.header}
      >
        <View style={styles.titleContainer}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Meal Ups</Text>
            <Text style={styles.subtitle}>Join group dining experiences</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleCreateMealUp}>
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#666666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search meal ups..."
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
            style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
            onPress={() => setActiveTab('groups')}
          >
            <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>Groups</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Upcoming Meal Up Near Me</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Meal Ups</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.filterSectionTitle}>Distance Near Me</Text>
              <View style={styles.distanceGrid}>
                {[
                  { label: 'Within 1 mile', value: 1 },
                  { label: 'Within 5 miles', value: 5 },
                  { label: 'Within 10 miles', value: 10 },
                  { label: '25+ miles', value: 25 },
                ].map(distance => (
                  <TouchableOpacity
                    key={distance.value}
                    style={[
                      styles.distanceButton,
                      selectedDistance === distance.value && styles.distanceButtonActive
                    ]}
                    onPress={() => {
                      setSelectedDistance(prev => 
                        prev === distance.value ? null : distance.value
                      );
                    }}
                  >
                    <Text style={[
                      styles.distanceButtonText,
                      selectedDistance === distance.value && styles.distanceButtonTextActive
                    ]}>{distance.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.filterSectionTitle}>Price Range</Text>
              <View style={styles.priceGrid}>
                {[
                  { label: 'Under $50', min: 0, max: 50 },
                  { label: '$50-$75', min: 50, max: 75 },
                  { label: '$75-$100', min: 75, max: 100 },
                  { label: 'Over $100', min: 100, max: 999 },
                ].map(range => (
                  <TouchableOpacity
                    key={range.label}
                    style={[
                      styles.priceButton,
                      priceRange?.min === range.min && priceRange?.max === range.max && styles.priceButtonActive
                    ]}
                    onPress={() => {
                      setPriceRange(prev => 
                        prev?.min === range.min && prev?.max === range.max
                          ? null
                          : { min: range.min, max: range.max }
                      );
                    }}
                  >
                    <Text style={[
                      styles.priceButtonText,
                      priceRange?.min === range.min && priceRange?.max === range.max && styles.priceButtonTextActive
                    ]}>{range.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => {
                  setSelectedDistance(null);
                  setPriceRange(null);
                }}
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
      {activeTab === 'upcoming' ? (
        <FlatList
          key="upcoming-meal-ups"
          data={filteredMealUps}
          renderItem={renderMealUp}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          key="groups-grid"
          data={mockGroups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.groupsContent}
          columnWrapperStyle={styles.groupsRow}
        />
      )}
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
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleSection: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
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
  listContent: {
    paddingBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000000',
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
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
    color: '#FFFFFF',
  },
  groupsContent: {
    padding: 12,
    paddingBottom: 20,
  },
  groupsRow: {
    justifyContent: 'space-between',
  },
  groupCard: {
    width: (Dimensions.get('window').width - 36) / 3,
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  groupImage: {
    width: '100%',
    height: '100%',
  },
  groupOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    justifyContent: 'flex-end',
  },
  groupName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 14,
  },
  memberCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  modalBody: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    marginTop: 8,
  },
  distanceGrid: {
    gap: 8,
    marginBottom: 20,
  },
  distanceButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  distanceButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  distanceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  distanceButtonTextActive: {
    color: '#FFFFFF',
  },
  priceGrid: {
    gap: 8,
    marginBottom: 20,
  },
  priceButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  priceButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  priceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  priceButtonTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
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
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});