import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Linking,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  UserPlus, 
  DollarSign,
  Navigation,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { GooglePlacesService } from '@/services/google-places';
import { PhotoGallery } from '@/components/PhotoGallery';
import type { PlaceDetails } from '@/types/place';

export default function PlaceDetailsScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllHours, setShowAllHours] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const loadPlaceDetails = useCallback(async () => {
    if (!placeId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const details = await GooglePlacesService.getPlaceDetails(placeId);
      if (details) {
        setPlace(details);
      } else {
        setError('Failed to load place details');
      }
    } catch (error) {
      console.error('Error loading place details:', error);
      setError('Failed to load place details');
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    if (placeId) {
      loadPlaceDetails();
    }
  }, [placeId, loadPlaceDetails]);

  const handleCall = () => {
    if (place?.formatted_phone_number) {
      Linking.openURL(`tel:${place.formatted_phone_number}`);
    }
  };

  const handleInvite = () => {
    router.push({
      pathname: '/create-invitation',
      params: {
        placeName: place?.name || '',
        placeAddress: place?.formatted_address || '',
        placeId: place?.place_id || placeId || ''
      }
    });
  };

  const handleDirections = () => {
    if (place?.geometry?.location) {
      const { lat, lng } = place.geometry.location;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(url);
    }
  };

  const handleWriteReview = () => {
    // TODO: Implement write review functionality
    console.log('Write review for:', place?.name);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading place details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !place) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Place not found'}</Text>
          <TouchableOpacity onPress={loadPlaceDetails} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasPhotos = place.photos && place.photos.length > 0;

  const priceRange = GooglePlacesService.getPriceRangeText(place.priceLevel);
  const cuisine = GooglePlacesService.getCuisineFromTypes(place.types);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {hasPhotos && (
          <View style={styles.imageContainer}>
            <PhotoGallery photos={place.photos!} maxPhotos={10} />
            <View style={styles.imageOverlay}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.name}>{place.name}</Text>
            {place.rating && (
              <View style={styles.rating}>
                <Star size={16} color={Colors.primary} fill={Colors.primary} />
                <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.location}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.address}>{place.formatted_address}</Text>
          </View>

          <View style={styles.details}>
            <Text style={styles.cuisine}>{cuisine}</Text>
            {place.priceLevel && (
              <>
                <Text style={styles.separator}>•</Text>
                <View style={styles.price}>
                  <DollarSign size={16} color={Colors.textLight} />
                  <Text style={styles.priceText}>{priceRange}</Text>
                </View>
              </>
            )}
            {place.opening_hours && (
              <>
                <Text style={styles.separator}>•</Text>
                <View style={styles.hours}>
                  <Clock size={16} color={place.opening_hours.open_now ? Colors.success : Colors.error} />
                  <Text style={[styles.hoursText, { 
                    color: place.opening_hours.open_now ? Colors.success : Colors.error 
                  }]}>
                    {place.opening_hours.open_now ? 'Open Now' : 'Closed'}
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={handleDirections} style={styles.actionButton}>
              <Navigation size={20} color={Colors.primary} />
              <Text style={styles.actionText}>Directions</Text>
            </TouchableOpacity>
            
            {place.formatted_phone_number && (
              <TouchableOpacity onPress={handleCall} style={styles.actionButton}>
                <Phone size={20} color={Colors.primary} />
                <Text style={styles.actionText}>Call</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={handleInvite} style={styles.actionButton}>
              <UserPlus size={20} color={Colors.primary} />
              <Text style={styles.actionText}>Invite</Text>
            </TouchableOpacity>
          </View>

          {place.opening_hours?.weekday_text && (
            <View style={styles.hoursSection}>
              <TouchableOpacity 
                style={styles.sectionHeader}
                onPress={() => setShowAllHours(!showAllHours)}
              >
                <Text style={styles.sectionTitle}>Opening Hours</Text>
                {showAllHours ? (
                  <ChevronUp size={20} color={Colors.text} />
                ) : (
                  <ChevronDown size={20} color={Colors.text} />
                )}
              </TouchableOpacity>
              
              <View style={styles.hoursContainer}>
                <View style={styles.currentStatus}>
                  <Clock size={20} color={place.opening_hours.open_now ? Colors.success : Colors.error} />
                  <Text style={[styles.statusText, { 
                    color: place.opening_hours.open_now ? Colors.success : Colors.error 
                  }]}>
                    {place.opening_hours.open_now ? 'Open Now' : 'Closed Now'}
                  </Text>
                </View>
                
                {(() => {
                  const today = new Date().getDay();
                  const todayIndex = today === 0 ? 6 : today - 1; // Convert JS Date getDay() to Google's format
                  const todayText = place.opening_hours.weekday_text[todayIndex];
                  
                  return (
                    <View style={styles.todayRow}>
                      <Text style={styles.todayText}>
                        Today: {todayText.split(': ')[1] || todayText}
                      </Text>
                    </View>
                  );
                })()}
                
                {showAllHours && (
                  <View style={styles.allHoursContainer}>
                    <Text style={styles.allHoursTitle}>All Hours:</Text>
                    {place.opening_hours.weekday_text.map((hours, index) => {
                      const today = new Date().getDay();
                      const todayIndex = today === 0 ? 6 : today - 1;
                      const isToday = index === todayIndex;
                      
                      return (
                        <View key={index} style={[styles.dayRow, isToday && styles.todayHighlight]}>
                          <Text style={[styles.dayText, isToday && styles.todayDayText]}>
                            {hours}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          )}

          {place.reviews && place.reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <View style={styles.reviewsHeader}>
                <TouchableOpacity 
                  style={styles.sectionHeader}
                  onPress={() => setShowAllReviews(!showAllReviews)}
                >
                  <Text style={styles.sectionTitle}>Reviews</Text>
                  {showAllReviews ? (
                    <ChevronUp size={20} color={Colors.text} />
                  ) : (
                    <ChevronDown size={20} color={Colors.text} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleWriteReview} style={styles.addReviewButton}>
                  <Plus size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              
              {showAllReviews && (
                <View>
                  {place.reviews.slice(0, 5).map((review, index) => (
                    <View key={index} style={styles.review}>
                      <View style={styles.reviewHeader}>
                        <Text style={styles.reviewAuthor}>{review.author_name}</Text>
                        <View style={styles.reviewRating}>
                          <Star size={12} color={Colors.primary} fill={Colors.primary} />
                          <Text style={styles.reviewRatingText}>{review.rating}</Text>
                        </View>
                      </View>
                      <Text style={styles.reviewText} numberOfLines={showAllReviews ? undefined : 3}>{review.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 300,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    alignSelf: 'flex-start',
  },
  content: {
    padding: 20,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  address: {
    fontSize: 16,
    color: Colors.textLight,
    marginLeft: 8,
    flex: 1,
    lineHeight: 22,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  cuisine: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  separator: {
    fontSize: 16,
    color: Colors.textLight,
    marginHorizontal: 12,
  },
  price: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    color: Colors.textLight,
    marginLeft: 4,
  },
  hours: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  hoursSection: {
    marginBottom: 32,
  },
  hoursContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  currentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#FFFFFF',
  },
  dayRow: {
    paddingVertical: 8,
    borderRadius: 6,
  },
  todayRow: {
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 4,
  },
  dayText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  todayText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    lineHeight: 22,
  },
  reviewsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  review: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    fontSize: 12,
    color: Colors.primary,
    marginLeft: 4,
  },
  reviewText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addReviewButton: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    color: Colors.background,
    fontWeight: '600',
  },
  allHoursContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  allHoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  todayHighlight: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  todayDayText: {
    fontWeight: '600',
    color: Colors.primary,
  },
});