import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { GooglePlacesService } from '@/services/google-places';

interface PhotoGalleryProps {
  photos: { photo_reference: string; height: number; width: number; }[];
  maxPhotos?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export function PhotoGallery({ photos, maxPhotos = 10 }: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const scrollViewRef = React.useRef<ScrollView>(null);
  
  const displayPhotos = photos.slice(0, maxPhotos);
  
  const scrollToIndex = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: index * (screenWidth - 32), animated: true });
      setCurrentIndex(index);
    }
  };
  
  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (screenWidth - 32));
    setCurrentIndex(index);
  };
  
  if (!displayPhotos.length) return null;
  
  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {displayPhotos.map((photo, index) => {
          const photoUrl = GooglePlacesService.getPhotoUrl(photo.photo_reference, 800);
          return (
            <Image
              key={index}
              source={{ uri: photoUrl }}
              style={styles.photo}
              resizeMode="cover"
            />
          );
        })}
      </ScrollView>
      
      {displayPhotos.length > 1 && (
        <>
          <View style={styles.indicators}>
            {displayPhotos.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.indicator,
                  index === currentIndex && styles.activeIndicator
                ]}
                onPress={() => scrollToIndex(index)}
              />
            ))}
          </View>
          
          {currentIndex > 0 && (
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={() => scrollToIndex(currentIndex - 1)}
            >
              <ChevronLeft size={28} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          
          {currentIndex < displayPhotos.length - 1 && (
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={() => scrollToIndex(currentIndex + 1)}
            >
              <ChevronRight size={28} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </>
      )}
      
      {displayPhotos.length > 1 && (
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {displayPhotos.length}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 16,
  },
  scrollView: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: screenWidth - 32,
    height: 250,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -24 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 24,
    padding: 12,
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
  prevButton: {
    left: 12,
  },
  nextButton: {
    right: 12,
  },
  counter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});