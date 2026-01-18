import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { MapPin, Heart, Navigation } from 'lucide-react-native';
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

  const handleNavigate = () => {
    const searchQuery = encodeURIComponent(`${place.name} ${place.location.address}`);

    if (Platform.OS === 'web') {
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
      window.open(googleMapsUrl, '_blank');
      return;
    }

    Alert.alert(
      'Navigate to ' + place.name,
      'Choose your navigation app',
      [
        {
          text: 'Google Maps',
          onPress: () => {
            const url = Platform.select({
              ios: `comgooglemaps://?q=${searchQuery}`,
              android: `geo:0,0?q=${searchQuery}`,
            });
            const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
            
            Linking.canOpenURL(url!).then((supported) => {
              if (supported) {
                Linking.openURL(url!);
              } else {
                Linking.openURL(fallbackUrl);
              }
            });
          },
        },
        {
          text: 'Waze',
          onPress: () => {
            const url = `https://waze.com/ul?q=${searchQuery}&navigate=yes`;
            Linking.openURL(url);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
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

        <TouchableOpacity style={styles.addressContainer} onPress={handleNavigate} activeOpacity={0.7}>
          <MapPin size={16} color="#FF6B35" />
          <Text style={styles.address} numberOfLines={2}>{place.location.address}</Text>
          <Navigation size={16} color="#FF6B35" />
        </TouchableOpacity>

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
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE0CC',
    gap: 8,
  },
  address: {
    flex: 1,
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
    lineHeight: 18,
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
