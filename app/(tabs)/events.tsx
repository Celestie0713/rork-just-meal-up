import React, { useState } from 'react';
import { Text, StyleSheet, FlatList, SafeAreaView, View, TextInput, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Filter, Plus, Users } from 'lucide-react-native';
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
  const { user } = useAuth();

  const handleMealUpPress = (mealUp: MealUp) => {
    console.log('Opening meal up:', mealUp.title);
    router.push(`/meal-up-details?mealUpId=${mealUp.id}`);
  };

  const handleCreateMealUp = () => {
    console.log('=== CREATE MEAL UP BUTTON CLICKED ===');
    console.log('User:', user);
    console.log('Is paid member:', isPaidMember);
    
    if (isPaidMember) {
      console.log('Navigating to create-meal-up screen...');
      try {
        router.push('/create-meal-up');
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

  const filteredMealUps = displayedMealUps.filter(mealUp => 
    mealUp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mealUp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mealUp.venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mealUp.venue.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mealUp.venue.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMealUp = ({ item }: { item: MealUp }) => (
    <MealUpCard mealUp={item} onPress={() => handleMealUpPress(item)} />
  );

  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity style={styles.groupCard}>
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
          <TouchableOpacity style={styles.filterButton}>
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
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Upcoming Meal up</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {activeTab === 'upcoming' ? (
        <FlatList
          data={filteredMealUps}
          renderItem={renderMealUp}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
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
});