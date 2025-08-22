import React, { useState } from 'react';
import { Text, StyleSheet, FlatList, SafeAreaView, View, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Filter } from 'lucide-react-native';
import { router } from 'expo-router';
import { MealUpCard } from '@/components/MealUpCard';
import { Colors, Gradients } from '@/constants/colors';
import { mockMealUps } from '@/mocks/meal-ups';
import type { MealUp } from '@/types/user';

export default function EventsScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleMealUpPress = (mealUp: MealUp) => {
    console.log('Opening meal up:', mealUp.title);
    router.push(`/meal-up-details?mealUpId=${mealUp.id}`);
  };

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
        <Text style={styles.title}>Meal Ups</Text>
        <Text style={styles.subtitle}>Join group dining experiences</Text>
        
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
    alignItems: 'center',
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
  listContent: {
    paddingBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
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