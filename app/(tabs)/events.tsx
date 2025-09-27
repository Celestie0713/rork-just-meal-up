import React, { useState } from 'react';
import { Text, StyleSheet, FlatList, SafeAreaView, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Filter, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { MealUpCard } from '@/components/MealUpCard';
import { Colors, Gradients } from '@/constants/colors';
import { mockMealUps } from '@/mocks/meal-ups';
import { useAuth } from '@/hooks/use-auth';
import type { MealUp } from '@/types/user';

export default function EventsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  const handleMealUpPress = (mealUp: MealUp) => {
    console.log('Opening meal up:', mealUp.title);
    router.push(`/meal-up-details?mealUpId=${mealUp.id}`);
  };

  const handleCreateMealUp = () => {
    if (isPaidMember) {
      console.log('Creating new meal up');
      router.push('/create-meal-up');
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

  const filteredMealUps = mockMealUps.filter(mealUp => 
    mealUp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mealUp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mealUp.venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mealUp.venue.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mealUp.venue.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMealUp = ({ item }: { item: MealUp }) => (
    <MealUpCard mealUp={item} onPress={() => handleMealUpPress(item)} />
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
      </LinearGradient>
      
      <FlatList
        data={filteredMealUps}
        renderItem={renderMealUp}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
});