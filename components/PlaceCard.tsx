import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { MapPin, Star, Clock, DollarSign, ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { GooglePlacesService } from '@/services/google-places';
import type { Place } from '@/types/place';

const { width: screenWidth } = Dimensions.get('window');

interface PlaceCardProps {
  place: Place;
  onPress: (place: Place) => void;
  onAddToFavorites?: (place: Place) => void;
}

export function PlaceCard({ place, onPress, onAddToFavorites }: PlaceCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const photos = place.photos || [];
  const maxPhotos = Math.min(photos.length, 5);
  const displayPhotos = photos.slice(0, maxPhotos);
  
  const priceRange = GooglePlacesService.getPriceRangeText(place.priceLevel);
  const cuisine = GooglePlacesService.getCuisineFromTypes(place.types);
  
  const scrollToPhoto = (index: number) => {
    if (scrollViewRef.current) {
      const cardWidth = screenWidth - 32; // Account for margins
      scrollViewRef.current.scrollTo({ x: index * cardWidth, animated: true });
      setCurrentPhotoIndex(index);
    }
  };
  
  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const cardWidth = screenWidth - 32;
    const index = Math.round(contentOffset / cardWidth);
    setCurrentPhotoIndex(index);
  };

  const handleAddToFavorites = (event: any) => {
    console.log('=== PLACECARD: ADD BUTTON PRESSED ===');
    console.log('PlaceCard: Place name:', place.name);
    console.log('PlaceCard: Place ID:', place.place_id);
    console.log('PlaceCard: Event:', event.nativeEvent);
    
    event.stopPropagation();
    event.preventDefault();
    
    console.log('PlaceCard: About to call onAddToFavorites...');
    console.log('PlaceCard: onAddToFavorites exists?', !!onAddToFavorites);
    
    if (onAddToFavorites) {
      console.log('PlaceCard: Calling onAddToFavorites now...');
      onAddToFavorites(place);
      console.log('PlaceCard: onAddToFavorites called successfully');
    } else {
      console.log('PlaceCard: ERROR - onAddToFavorites is not defined!');
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress(place)}
      testID={`place-card-${place.place_id}`}
    >
      {displayPhotos.length > 0 && (
        <View style={styles.imageContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            style={styles.imageScrollView}
          >
            {displayPhotos.map((photo, index) => {
              const photoUrl = GooglePlacesService.getPhotoUrl(photo.photo_reference, 400);
              return (
                <Image
                  key={index}
                  source={{ uri: photoUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
              );
            })}
          </ScrollView>
          
          {displayPhotos.length > 1 && (
            <>
              <View style={styles.photoIndicators}>
                {displayPhotos.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.photoIndicator,
                      index === currentPhotoIndex && styles.activePhotoIndicator
                    ]}
                  />
                ))}
              </View>
              
              <TouchableOpacity
                style={[
                  styles.photoNavButton, 
                  styles.prevPhotoButton,
                  currentPhotoIndex === 0 && styles.disabledNavButton
                ]}
                onPress={() => scrollToPhoto(currentPhotoIndex - 1)}
                disabled={currentPhotoIndex === 0}
              >
                <ChevronLeft 
                  size={24} 
                  color={currentPhotoIndex === 0 ? "rgba(255, 255, 255, 0.3)" : "#FFFFFF"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.photoNavButton, 
                  styles.nextPhotoButton,
                  currentPhotoIndex === displayPhotos.length - 1 && styles.disabledNavButton
                ]}
                onPress={() => scrollToPhoto(currentPhotoIndex + 1)}
                disabled={currentPhotoIndex === displayPhotos.length - 1}
              >
                <ChevronRight 
                  size={24} 
                  color={currentPhotoIndex === displayPhotos.length - 1 ? "rgba(255, 255, 255, 0.3)" : "#FFFFFF"} 
                />
              </TouchableOpacity>
            </>
          )}
          
          {onAddToFavorites && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddToFavorites}
              testID={`add-favorite-${place.place_id}`}
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
          {place.rating && (
            <View style={styles.rating}>
              <Star size={14} color={Colors.primary} fill={Colors.primary} />
              <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.location}>
          <MapPin size={14} color={Colors.textLight} />
          <Text style={styles.address} numberOfLines={1}>
            {place.vicinity || place.address}
          </Text>
        </View>
        
        <View style={styles.details}>
          <Text style={styles.cuisine}>{cuisine}</Text>
          {place.priceLevel && (
            <>
              <Text style={styles.separator}>•</Text>
              <View style={styles.price}>
                <DollarSign size={14} color={Colors.textLight} />
                <Text style={styles.priceText}>{priceRange}</Text>
              </View>
            </>
          )}
          {place.opening_hours && (
            <>
              <Text style={styles.separator}>•</Text>
              <View style={styles.hours}>
                <Clock size={14} color={place.opening_hours.open_now ? Colors.success : Colors.error} />
                <Text style={[styles.hoursText, { 
                  color: place.opening_hours.open_now ? Colors.success : Colors.error 
                }]}>
                  {place.opening_hours.open_now ? 'Open' : 'Closed'}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    height: screenWidth - 32,
    width: screenWidth - 32,
  },
  imageScrollView: {
    height: screenWidth - 32,
  },
  image: {
    width: screenWidth - 32,
    height: screenWidth - 32,
  },
  photoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
  },
  photoIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 2,
  },
  activePhotoIndicator: {
    backgroundColor: '#FFFFFF',
    width: 16,
  },
  photoNavButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 10,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledNavButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  prevPhotoButton: {
    left: 12,
  },
  nextPhotoButton: {
    right: 12,
  },
  addButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 8,
    zIndex: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    padding: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
    flex: 1,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  cuisine: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  separator: {
    fontSize: 14,
    color: Colors.textLight,
    marginHorizontal: 8,
  },
  price: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 2,
  },
  hours: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 2,
  },
});