import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wine, Coffee, HelpCircle, ChefHat, Cake, Utensils } from 'lucide-react-native';


const colors = {
  primary: '#FF6B35',
  text: '#2C2C2C',
  textLight: '#666666',
  background: '#FFFFFF',
  surface: '#F8F8F8',
  success: '#4CAF50',
  warning: '#FFA726',
  premium: '#FFD700',
} as const;

type MealMenuChoice = 'second-course' | 'appetizer' | 'deciding' | null;
type RelationshipChoice = 'exclusive' | 'friends' | 'undecided' | null;

export default function PostMealScreen() {
  const [mealChoice, setMealChoice] = useState<MealMenuChoice>(null);
  const [relationshipChoice, setRelationshipChoice] = useState<RelationshipChoice>(null);
  const [showRelationshipMenu, setShowRelationshipMenu] = useState(false);

  const handleMealChoice = (choice: MealMenuChoice) => {
    setMealChoice(choice);
  };

  const handleRelationshipChoice = (choice: RelationshipChoice) => {
    setRelationshipChoice(choice);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Post Meal Menu</Text>
          <Text style={styles.subtitle}>How was your meal experience?</Text>
        </View>

        {!showRelationshipMenu ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meal Menu (10 hours after date)</Text>
            <Text style={styles.sectionSubtitle}>Choose your next course with Sarah</Text>
            
            <TouchableOpacity 
              style={[styles.choiceCard, mealChoice === 'second-course' && styles.selectedCard]}
              onPress={() => handleMealChoice('second-course')}
            >
              <Wine size={24} color={colors.primary} />
              <View style={styles.choiceContent}>
                <Text style={styles.choiceTitle}>🥂 Second Course</Text>
                <Text style={styles.choiceDescription}>Yes to second date</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.choiceCard, mealChoice === 'appetizer' && styles.selectedCard]}
              onPress={() => handleMealChoice('appetizer')}
            >
              <Coffee size={24} color={colors.warning} />
              <View style={styles.choiceContent}>
                <Text style={styles.choiceTitle}>🍋 Just Appetizer</Text>
                <Text style={styles.choiceDescription}>Stay friends</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.choiceCard, mealChoice === 'deciding' && styles.selectedCard]}
              onPress={() => handleMealChoice('deciding')}
            >
              <HelpCircle size={24} color={colors.textLight} />
              <View style={styles.choiceContent}>
                <Text style={styles.choiceTitle}>🍷 Still Deciding</Text>
                <Text style={styles.choiceDescription}>Not sure yet</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.relationshipButton}
              onPress={() => setShowRelationshipMenu(true)}
            >
              <Text style={styles.relationshipButtonText}>Open Relationship Menu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Relationship Menu</Text>
            <Text style={styles.sectionSubtitle}>Define your relationship with Sarah</Text>
            
            <TouchableOpacity 
              style={[styles.choiceCard, relationshipChoice === 'exclusive' && styles.selectedCard]}
              onPress={() => handleRelationshipChoice('exclusive')}
            >
              <ChefHat size={24} color={colors.primary} />
              <View style={styles.choiceContent}>
                <Text style={styles.choiceTitle}>🥂 Chef&apos;s Special</Text>
                <Text style={styles.choiceDescription}>Let&apos;s Date Exclusively</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.choiceCard, relationshipChoice === 'friends' && styles.selectedCard]}
              onPress={() => handleRelationshipChoice('friends')}
            >
              <Cake size={24} color={colors.warning} />
              <View style={styles.choiceContent}>
                <Text style={styles.choiceTitle}>🍰 Side Dish</Text>
                <Text style={styles.choiceDescription}>Stay Friends</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.choiceCard, relationshipChoice === 'undecided' && styles.selectedCard]}
              onPress={() => handleRelationshipChoice('undecided')}
            >
              <Utensils size={24} color={colors.textLight} />
              <View style={styles.choiceContent}>
                <Text style={styles.choiceTitle}>🥄 Undecided Palate</Text>
                <Text style={styles.choiceDescription}>I Actually Don&apos;t Know</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowRelationshipMenu(false)}
            >
              <Text style={styles.backButtonText}>Back to Meal Menu</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>• Choices are revealed only when both users make their selection</Text>
          <Text style={styles.infoText}>• You can have up to 4 dates before the Relationship Menu</Text>
          <Text style={styles.infoText}>• Premium members can see the other person&apos;s choice first</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  choiceContent: {
    marginLeft: 12,
    flex: 1,
  },
  choiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  choiceDescription: {
    fontSize: 14,
    color: colors.textLight,
  },
  relationshipButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  relationshipButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
});