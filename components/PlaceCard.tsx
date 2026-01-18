import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MapPin, Heart } from 'lucide-react-native';
import { PlaceDistance } from '@/types/place';

interface PlaceCardProps {
  placeDistance: PlaceDistance;
  onPress: () => void;
  onAddPress: () => void;
  isAdded: boolean;
  mode: 'nearby' | 'between-us';
}

export function PlaceCard({ placeDistance, onPress, onAddPress, isAdded, mode }: PlaceCardProps) {
  const { place, distanceFromUser, distanceFromInvitee } = placeDistance;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {place.photos && place.photos.length > 0 && (
        <Image source={{ uri: place.photos[0] }} style={styles.image} />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
            <Text style={styles.category}>{place.category}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.addButton, isAdded && styles.addButtonActive]} 
            onPress={onAddPress}
            activeOpacity={0.7}
          >
            <Heart 
              size={20} 
              color={isAdded ? '#FF6B35' : '#888888'} 
              fill={isAdded ? '#FF6B35' : 'none'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.distance}>
          {mode === 'nearby' ? (
            <View style={styles.distanceRow}>
              <MapPin size={16} color="#666666" />
              <Text style={styles.distanceText}>
                {distanceFromUser.toFixed(1)} km away
              </Text>
            </View>
          ) : (
            <View style={styles.betweenUsDistances}>
              <View style={styles.distanceRow}>
                <MapPin size={14} color="#666666" />
                <Text style={styles.distanceTextSmall}>
                  You: {distanceFromUser.toFixed(1)} km
                </Text>
              </View>
              {distanceFromInvitee !== undefined && (
                <View style={styles.distanceRow}>
                  <MapPin size={14} color="#666666" />
                  <Text style={styles.distanceTextSmall}>
                    Them: {distanceFromInvitee.toFixed(1)} km
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {place.notes && (
          <Text style={styles.notes} numberOfLines={2}>{place.notes}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: '#F0F0F0',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    textTransform: 'capitalize',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addButtonActive: {
    backgroundColor: '#FFE4F0',
    borderColor: '#FF6B35',
  },
  distance: {
    marginBottom: 12,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
    fontWeight: '500',
  },
  distanceTextSmall: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 4,
    fontWeight: '500',
  },
  betweenUsDistances: {
    gap: 4,
  },

  notes: {
    fontSize: 13,
    color: '#888888',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
