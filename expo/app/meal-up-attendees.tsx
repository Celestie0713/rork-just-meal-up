import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Users } from 'lucide-react-native';
import { UserCard } from '@/components/UserCard';
import { Colors, Gradients } from '@/constants/colors';
import { mockMealUps } from '@/mocks/meal-ups';
import { mockUsers } from '@/mocks/users';
import type { User } from '@/types/user';

export default function MealUpAttendeesScreen() {
  const { mealUpId } = useLocalSearchParams<{ mealUpId: string }>();
  
  const mealUp = mockMealUps.find(m => m.id === mealUpId);
  
  if (!mealUp) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Attendees' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Meal up not found</Text>
        </View>
      </View>
    );
  }
  
  const organizer = mockUsers.find(user => user.id === mealUp.organizerId);
  
  const attendees = mockUsers.filter(user => 
    mealUp.currentAttendees.includes(user.id)
  );
  
  const allParticipants = organizer ? [organizer, ...attendees.filter(a => a.id !== organizer.id)] : attendees;
  
  console.log('MealUp:', mealUp.title);
  console.log('Current attendees IDs:', mealUp.currentAttendees);
  console.log('Found attendees:', attendees.map(a => ({ id: a.id, name: a.name })));
  console.log('All participants:', allParticipants.map(p => ({ id: p.id, name: p.name })));
  
  const handleUserPress = (user: User) => {
    console.log('Opening user profile:', user.name);
    router.push(`/user-profile?userId=${user.id}` as any);
  };


  

  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Your next course: 1 on 1 time🎈',
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
        }} 
      />
      <LinearGradient
        colors={Gradients.secondary}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Users size={24} color="#000000" />
          <Text style={styles.title}>{mealUp.title}</Text>
          <Text style={styles.subtitle}>
            {mealUp.currentAttendees.length} of {mealUp.maxAttendees} spots filled
          </Text>
        </View>
      </LinearGradient>
      <View style={styles.participantsSection}>
        <Text style={styles.sectionTitle}>Participants ({allParticipants.length})</Text>
        <FlatList
          data={allParticipants}
          renderItem={({ item }) => (
            <UserCard 
              user={item} 
              onPress={() => handleUserPress(item)}
              showOrganizerBadge={item.id === mealUp.organizerId}
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.listContent}
        />
      </View>
      {allParticipants.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No participants yet</Text>
          <Text style={styles.emptySubtext}>Be the first to join this meal up!</Text>
        </View>
      )}
    </View>
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
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#000000',
    marginTop: 4,
    fontWeight: '500',
  },
  participantsSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textLight,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textLight,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },

});