import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Text, StyleSheet, FlatList, SafeAreaView, View, TextInput, TouchableOpacity, ScrollView, Dimensions, Image, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Search, Filter, Heart, X, MapPin, ChevronDown, Star, Clock, Phone, Globe, Navigation, Users, UtensilsCrossed } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { UserCard } from '@/components/UserCard';
import { NotificationPopup } from '@/components/NotificationPopup';
import { mockUsers } from '@/mocks/users';
import { useNotifications } from '@/hooks/use-notifications';
import { useChat } from '@/hooks/use-chat';
import { usePlacesSearch } from '@/hooks/use-places-search';

import { Colors } from '@/constants/colors';
import type { User } from '@/types/user';
import type { PlaceResult } from '@/hooks/use-places-search';

const COUNTRIES = [
    { name: 'Afghanistan', code: 'AF' }, { name: 'Albania', code: 'AL' }, { name: 'Algeria', code: 'DZ' },
    { name: 'Andorra', code: 'AD' }, { name: 'Angola', code: 'AO' }, { name: 'Argentina', code: 'AR' },
    { name: 'Armenia', code: 'AM' }, { name: 'Australia', code: 'AU' }, { name: 'Austria', code: 'AT' },
    { name: 'Azerbaijan', code: 'AZ' }, { name: 'Bahrain', code: 'BH' }, { name: 'Bangladesh', code: 'BD' },
    { name: 'Belarus', code: 'BY' }, { name: 'Belgium', code: 'BE' }, { name: 'Bolivia', code: 'BO' },
    { name: 'Bosnia and Herzegovina', code: 'BA' }, { name: 'Brazil', code: 'BR' }, { name: 'Bulgaria', code: 'BG' },
    { name: 'Cambodia', code: 'KH' }, { name: 'Canada', code: 'CA' }, { name: 'Chile', code: 'CL' },
    { name: 'China', code: 'CN' }, { name: 'Colombia', code: 'CO' }, { name: 'Costa Rica', code: 'CR' },
    { name: 'Croatia', code: 'HR' }, { name: 'Cuba', code: 'CU' }, { name: 'Cyprus', code: 'CY' },
    { name: 'Czech Republic', code: 'CZ' }, { name: 'Denmark', code: 'DK' }, { name: 'Dominican Republic', code: 'DO' },
    { name: 'Ecuador', code: 'EC' }, { name: 'Egypt', code: 'EG' }, { name: 'Estonia', code: 'EE' },
    { name: 'Ethiopia', code: 'ET' }, { name: 'Finland', code: 'FI' }, { name: 'France', code: 'FR' },
    { name: 'Georgia', code: 'GE' }, { name: 'Germany', code: 'DE' }, { name: 'Ghana', code: 'GH' },
    { name: 'Greece', code: 'GR' }, { name: 'Guatemala', code: 'GT' }, { name: 'Hong Kong', code: 'HK' },
    { name: 'Hungary', code: 'HU' }, { name: 'Iceland', code: 'IS' }, { name: 'India', code: 'IN' },
    { name: 'Indonesia', code: 'ID' }, { name: 'Iran', code: 'IR' }, { name: 'Iraq', code: 'IQ' },
    { name: 'Ireland', code: 'IE' }, { name: 'Israel', code: 'IL' }, { name: 'Italy', code: 'IT' },
    { name: 'Jamaica', code: 'JM' }, { name: 'Japan', code: 'JP' }, { name: 'Jordan', code: 'JO' },
    { name: 'Kazakhstan', code: 'KZ' }, { name: 'Kenya', code: 'KE' }, { name: 'Kuwait', code: 'KW' },
    { name: 'Latvia', code: 'LV' }, { name: 'Lebanon', code: 'LB' }, { name: 'Lithuania', code: 'LT' },
    { name: 'Luxembourg', code: 'LU' }, { name: 'Malaysia', code: 'MY' }, { name: 'Maldives', code: 'MV' },
    { name: 'Malta', code: 'MT' }, { name: 'Mexico', code: 'MX' }, { name: 'Moldova', code: 'MD' },
    { name: 'Monaco', code: 'MC' }, { name: 'Mongolia', code: 'MN' }, { name: 'Morocco', code: 'MA' },
    { name: 'Nepal', code: 'NP' }, { name: 'Netherlands', code: 'NL' }, { name: 'New Zealand', code: 'NZ' },
    { name: 'Nigeria', code: 'NG' }, { name: 'North Korea', code: 'KP' }, { name: 'Norway', code: 'NO' },
    { name: 'Oman', code: 'OM' }, { name: 'Pakistan', code: 'PK' }, { name: 'Panama', code: 'PA' },
    { name: 'Paraguay', code: 'PY' }, { name: 'Peru', code: 'PE' }, { name: 'Philippines', code: 'PH' },
    { name: 'Poland', code: 'PL' }, { name: 'Portugal', code: 'PT' }, { name: 'Qatar', code: 'QA' },
    { name: 'Romania', code: 'RO' }, { name: 'Russia', code: 'RU' }, { name: 'Saudi Arabia', code: 'SA' },
    { name: 'Serbia', code: 'RS' }, { name: 'Singapore', code: 'SG' }, { name: 'Slovakia', code: 'SK' },
    { name: 'Slovenia', code: 'SI' }, { name: 'South Africa', code: 'ZA' }, { name: 'South Korea', code: 'KR' },
    { name: 'Spain', code: 'ES' }, { name: 'Sri Lanka', code: 'LK' }, { name: 'Sweden', code: 'SE' },
    { name: 'Switzerland', code: 'CH' }, { name: 'Taiwan', code: 'TW' }, { name: 'Thailand', code: 'TH' },
    { name: 'Tunisia', code: 'TN' }, { name: 'Turkey', code: 'TR' }, { name: 'Uganda', code: 'UG' },
    { name: 'Ukraine', code: 'UA' }, { name: 'United Arab Emirates', code: 'AE' }, { name: 'United Kingdom', code: 'GB' },
    { name: 'United States', code: 'US' }, { name: 'Uruguay', code: 'UY' }, { name: 'Uzbekistan', code: 'UZ' },
    { name: 'Venezuela', code: 'VE' }, { name: 'Vietnam', code: 'VN' }, { name: 'Zimbabwe', code: 'ZW' },
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.38;

const PLACE_PHOTOS = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
];

function getRatingStars(rating: number): string {
  if (rating >= 4.7) return '★★★★★';
  if (rating >= 4.3) return '★★★★☆';
  if (rating >= 3.7) return '★★★☆☆';
  if (rating >= 2.7) return '★★☆☆☆';
  return '★☆☆☆☆';
}

function getPriceString(level: number): string {
  return '$'.repeat(Math.min(level, 4)) || '?';
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<'user' | 'places'>('user');

  useEffect(() => {
    if (params.tab === 'places') setActiveTab('places');
  }, [params.tab]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const [filters, setFilters] = useState({
    country: '' as string,
    sex: [] as string[],
    languages: [] as string[],
    intention: [] as string[],
    minAge: '',
    maxAge: '',
    distance: '',
  });
  const { getUnreadCount } = useNotifications();
  useChat();

  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [showPlaceDetail, setShowPlaceDetail] = useState(false);
  const mapRef = useRef<MapView>(null);

  const {
    data: placesData,
    isLoading: placesLoading,
    isError: placesError,
    search: searchPlaces,
  } = usePlacesSearch();

  const mapRegion = useMemo(() => {
    const places = placesData?.results ?? [];
    if (places.length === 0) {
      return { latitude: 21.0278, longitude: 105.8342, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    }
    if (places.length === 1) {
      const p = places[0].place;
      return { latitude: p.latitude, longitude: p.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    }
    const lats = places.map((p) => p.place.latitude);
    const lngs = places.map((p) => p.place.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const pad = 0.02;
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat + pad * 2, 0.01),
      longitudeDelta: Math.max(maxLng - minLng + pad * 2, 0.01),
    };
  }, [placesData]);

  const handlePlaceSearch = useCallback(() => {
    if (placeSearchQuery.trim().length > 0) {
      searchPlaces(placeSearchQuery.trim());
    }
  }, [placeSearchQuery, searchPlaces]);

  const handlePlaceSelect = useCallback((place: PlaceResult) => {
    setSelectedPlace(place);
    setShowPlaceDetail(true);
  }, []);

  const handleInviteToEat = useCallback((place: PlaceResult) => {
    setShowPlaceDetail(false);
    router.push({
      pathname: '/create-invitation' as any,
      params: {
        restaurantName: place.place.name,
        restaurantAddress: place.place.address,
        restaurantCity: place.place.city,
        restaurantCountry: place.place.country,
      },
    });
  }, []);

  const handleUserPress = (user: User) => {
    router.push({ pathname: '/user-profile' as any, params: { userId: user.id } });
  };


  const unreadCount = getUnreadCount();

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = !filters.country || (user.country !== undefined && user.country.toLowerCase() === filters.country.toLowerCase());
    const matchesSex = filters.sex.length === 0 || (user.sex !== undefined && filters.sex.includes(user.sex));
    const matchesIntention = filters.intention.length === 0 || (user.intention !== undefined && filters.intention.includes(user.intention));
    const matchesLanguages = filters.languages.length === 0 || filters.languages.some(lang => user.languages?.includes(lang));
    const minAge = filters.minAge ? parseInt(filters.minAge) : null;
    const maxAge = filters.maxAge ? parseInt(filters.maxAge) : null;
    const matchesAge = (!minAge || user.age >= minAge) && (!maxAge || user.age <= maxAge);
    return matchesSearch && matchesCountry && matchesSex && matchesIntention && matchesLanguages && matchesAge;
  });

  const renderUser = useCallback(({ item }: { item: User }) => {
    return <UserCard user={item} onPress={() => handleUserPress(item)} isGridView={true} />;
  }, []);


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Just Meal Up</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Heart size={24} color="#FF6B35" fill={unreadCount > 0 ? "#FF6B35" : "none"} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#000000" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#666666"
            />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
            <Filter size={20} color="#000000" />
          </TouchableOpacity>
        </View>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, styles.tabLeft, activeTab === 'user' && styles.activeTab]}
            onPress={() => setActiveTab('user')}
          >
            <Text style={[styles.tabText, activeTab === 'user' && styles.activeTabText]}>User</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, styles.tabRight, activeTab === 'places' && styles.activeTab]}
            onPress={() => setActiveTab('places')}
          >
            <Text style={[styles.tabText, activeTab === 'places' && styles.activeTabText]}>Places</Text>
          </TouchableOpacity>
        </View>
      </View>
      {activeTab === 'user' && (
        <FlatList
          key="users-list"
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
        />
      )}
      {activeTab === 'places' && (
        <View style={styles.placesContainer}>
          <View style={styles.placesSearchRow}>
            <View style={styles.placesSearchInputWrap}>
              <Search size={18} color="#999999" />
              <TextInput
                style={styles.placesSearchInput}
                placeholder="Search restaurants, cuisines..."
                placeholderTextColor="#666666"
                value={placeSearchQuery}
                onChangeText={setPlaceSearchQuery}
                onSubmitEditing={handlePlaceSearch}
                returnKeyType="search"
              />
              {placeSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setPlaceSearchQuery(''); }}>
                  <X size={16} color="#999999" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.placesSearchButton} onPress={handlePlaceSearch}>
              <Text style={styles.placesSearchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          {!placesData && !placesLoading && (
            <View style={styles.placesEmptyState}>
              <UtensilsCrossed size={48} color={Colors.textLight} />
              <Text style={styles.placesEmptyText}>Discover Places</Text>
              <Text style={styles.placesEmptySubtext}>Search for restaurants, cafes, and eateries to find your next meal</Text>
            </View>
          )}

          {placesLoading && (
            <View style={styles.placesLoadingState}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.placesLoadingText}>Finding the best spots...</Text>
            </View>
          )}

          {placesError && (
            <View style={styles.placesEmptyState}>
              <X size={48} color={Colors.error} />
              <Text style={styles.placesEmptyText}>Something went wrong</Text>
              <Text style={styles.placesEmptySubtext}>Try searching again</Text>
            </View>
          )}

          {placesData && placesData.results.length > 0 && (
            <>
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  region={mapRegion}
                  showsUserLocation={false}
                  showsMyLocationButton={false}
                >
                  {placesData.results.map((item, idx) => (
                    <Marker
                      key={item.place.id}
                      coordinate={{ latitude: item.place.latitude, longitude: item.place.longitude }}
                      title={item.place.name}
                      description={`${item.place.city}, ${item.place.country}`}
                      onPress={() => handlePlaceSelect(item)}
                    >
                      <View style={styles.customMarker}>
                        <View style={styles.markerPulse} />
                        <View style={[styles.markerDot, idx === 0 && styles.markerDotFirst]}>
                          <Text style={styles.markerEmoji}>{item.place.cuisineEmoji || '🍽️'}</Text>
                        </View>
                      </View>
                    </Marker>
                  ))}
                </MapView>
                <View style={styles.mapGradient} pointerEvents="none">
                  <View style={styles.mapGradientTop} />
                </View>
              </View>

              <Text style={styles.resultsCount}>
                {placesData.totalResults} places found
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.placesCardList}
                contentContainerStyle={styles.placesCardListContent}
              >
                {placesData.results.map((item, idx) => (
                  <TouchableOpacity
                    key={item.place.id}
                    style={styles.placeCard}
                    onPress={() => handlePlaceSelect(item)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.placeCardImageWrap}>
                      <Image
                        source={{ uri: PLACE_PHOTOS[idx % PLACE_PHOTOS.length] }}
                        style={styles.placeCardImage}
                      />
                      <View style={styles.placeCardOverlay} />
                      <View style={styles.placeCardBadge}>
                        <Text style={styles.placeCardBadgeText}>{item.place.cuisineEmoji || '🍽️'}</Text>
                      </View>
                      {item.place.priceLevel > 0 && (
                        <View style={styles.placeCardPrice}>
                          <Text style={styles.placeCardPriceText}>{getPriceString(item.place.priceLevel)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.placeCardInfo}>
                      <Text style={styles.placeCardName} numberOfLines={1}>{item.place.name}</Text>
                      <View style={styles.placeCardMeta}>
                        <MapPin size={12} color={Colors.textLight} />
                        <Text style={styles.placeCardLocation} numberOfLines={1}>{item.place.city}, {item.place.country}</Text>
                      </View>
                      <View style={styles.placeCardRating}>
                        <Text style={styles.placeCardStars}>{getRatingStars(item.place.rating)}</Text>
                        {item.place.rating > 0 && (
                          <Text style={styles.placeCardRatingNum}>{item.place.rating.toFixed(1)}</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.inviteButton}
                        onPress={() => handleInviteToEat(item)}
                        activeOpacity={0.8}
                      >
                        <Users size={14} color="#FFFFFF" />
                        <Text style={styles.inviteButtonText}>Invite to Eat</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      )}

      {showPlaceDetail && selectedPlace && (
        <View style={styles.detailOverlay}>
          <TouchableOpacity
            style={styles.detailBackdrop}
            activeOpacity={1}
            onPress={() => setShowPlaceDetail(false)}
          />
          <View style={styles.detailSheet}>
            <View style={styles.detailHandle} />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={styles.detailImageWrap}>
                <Image
                  source={{ uri: PLACE_PHOTOS[0] }}
                  style={styles.detailImage}
                />
                <View style={styles.detailImageOverlay} />
                <TouchableOpacity
                  style={styles.detailClose}
                  onPress={() => setShowPlaceDetail(false)}
                >
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.detailImageContent}>
                  <Text style={styles.detailName}>{selectedPlace.place.name}</Text>
                  <View style={styles.detailRatingInline}>
                    <Text style={styles.detailStars}>{getRatingStars(selectedPlace.place.rating)}</Text>
                    {selectedPlace.place.rating > 0 && (
                      <Text style={styles.detailRatingNum}>{selectedPlace.place.rating.toFixed(1)}</Text>
                    )}
                    {selectedPlace.place.priceLevel > 0 && (
                      <Text style={styles.detailPrice}>{getPriceString(selectedPlace.place.priceLevel)}</Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.detailBody}>
                <Text style={styles.detailDescription}>{selectedPlace.description}</Text>

                <View style={styles.detailInfoGrid}>
                  <View style={styles.detailInfoItem}>
                    <MapPin size={16} color={Colors.primary} />
                    <View style={styles.detailInfoTextWrap}>
                      <Text style={styles.detailInfoLabel}>Location</Text>
                      <Text style={styles.detailInfoValue}>{selectedPlace.place.address}</Text>
                      <Text style={styles.detailInfoSub}>{selectedPlace.place.city}, {selectedPlace.place.country}</Text>
                    </View>
                  </View>

                  {selectedPlace.place.phoneNumber && (
                    <View style={styles.detailInfoItem}>
                      <Phone size={16} color={Colors.primary} />
                      <View style={styles.detailInfoTextWrap}>
                        <Text style={styles.detailInfoLabel}>Phone</Text>
                        <Text style={styles.detailInfoValue}>{selectedPlace.place.phoneNumber}</Text>
                      </View>
                    </View>
                  )}

                  {selectedPlace.place.openingHours && selectedPlace.place.openingHours.length > 0 && (
                    <View style={styles.detailInfoItem}>
                      <Clock size={16} color={Colors.primary} />
                      <View style={styles.detailInfoTextWrap}>
                        <Text style={styles.detailInfoLabel}>Hours</Text>
                        {selectedPlace.place.openingHours.map((h: string, i: number) => (
                          <Text key={i} style={styles.detailInfoValue}>{h}</Text>
                        ))}
                      </View>
                    </View>
                  )}

                  {selectedPlace.place.website && (
                    <View style={styles.detailInfoItem}>
                      <Globe size={16} color={Colors.primary} />
                      <View style={styles.detailInfoTextWrap}>
                        <Text style={styles.detailInfoLabel}>Website</Text>
                        <Text style={styles.detailInfoValue}>{selectedPlace.place.website}</Text>
                      </View>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.detailInviteButton}
                  onPress={() => handleInviteToEat(selectedPlace)}
                  activeOpacity={0.85}
                >
                  <Users size={20} color="#FFFFFF" />
                  <Text style={styles.detailInviteText}>Invite Someone to Eat Here</Text>
                </TouchableOpacity>

                {selectedPlace.place.googleMapsUrl && (
                  <TouchableOpacity
                    style={styles.detailDirectionsButton}
                    onPress={() => {
                      router.push(selectedPlace.place.googleMapsUrl as any);
                    }}
                    activeOpacity={0.85}
                  >
                    <Navigation size={16} color={Colors.primary} />
                    <Text style={styles.detailDirectionsText}>Get Directions</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {showFilterModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.closeButton}>
                <X size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Country</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowCountryPicker(!showCountryPicker)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropdownButtonText, !filters.country && styles.dropdownPlaceholder]}>
                    {filters.country ? COUNTRIES.find(c => c.code === filters.country)?.name : 'All Countries'}
                  </Text>
                  <ChevronDown size={18} color="#FF6B35" />
                </TouchableOpacity>
              </View>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Distance</Text>
                <TextInput style={styles.distanceInput} placeholder="Distance in miles" value={filters.distance} onChangeText={(text) => setFilters({...filters, distance: text})} keyboardType="numeric" placeholderTextColor="#999999" />
              </View>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Age Range</Text>
                <View style={styles.ageInputs}>
                  <View style={styles.ageInput}>
                    <Text style={styles.ageInputLabel}>Min</Text>
                    <TextInput style={styles.ageInputField} placeholder="18" value={filters.minAge} onChangeText={(text) => setFilters({...filters, minAge: text})} keyboardType="numeric" placeholderTextColor="#999999" />
                  </View>
                  <Text style={styles.ageRangeSeparator}>-</Text>
                  <View style={styles.ageInput}>
                    <Text style={styles.ageInputLabel}>Max</Text>
                    <TextInput style={styles.ageInputField} placeholder="99" value={filters.maxAge} onChangeText={(text) => setFilters({...filters, maxAge: text})} keyboardType="numeric" placeholderTextColor="#999999" />
                  </View>
                </View>
              </View>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Sex</Text>
                <View style={styles.checkboxGroup}>
                  {['Male', 'Female', 'Other'].map((sex) => (
                    <TouchableOpacity key={sex} style={styles.checkbox} onPress={() => {
                      const newSex = filters.sex.includes(sex) ? filters.sex.filter(s => s !== sex) : [...filters.sex, sex];
                      setFilters({...filters, sex: newSex});
                    }}>
                      <View style={[styles.checkboxBox, filters.sex.includes(sex) && styles.checkboxBoxActive]}>
                        {filters.sex.includes(sex) && <View style={styles.checkboxCheck} />}
                      </View>
                      <Text style={styles.checkboxLabel}>{sex}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Language</Text>
                <View style={styles.checkboxGroup}>
                  {['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean'].map((lang) => (
                    <TouchableOpacity key={lang} style={styles.checkbox} onPress={() => {
                      const newLang = filters.languages.includes(lang) ? filters.languages.filter(l => l !== lang) : [...filters.languages, lang];
                      setFilters({...filters, languages: newLang});
                    }}>
                      <View style={[styles.checkboxBox, filters.languages.includes(lang) && styles.checkboxBoxActive]}>
                        {filters.languages.includes(lang) && <View style={styles.checkboxCheck} />}
                      </View>
                      <Text style={styles.checkboxLabel}>{lang}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Intention</Text>
                <View style={styles.checkboxGroup}>
                  {(['make_new_friends', 'relationship', 'casual', 'marriage', 'open_marriage', 'figuring_it_out'] as const).map((intention) => {
                    const labels: Record<string, string> = { make_new_friends: 'Make New Friends', relationship: 'Relationship', casual: 'Casual', marriage: 'Marriage', open_marriage: 'Open Marriage', figuring_it_out: 'Figuring It Out' };
                    return (
                      <TouchableOpacity key={intention} style={styles.checkbox} onPress={() => {
                        const newIntention = filters.intention.includes(intention) ? filters.intention.filter(i => i !== intention) : [...filters.intention, intention];
                        setFilters({...filters, intention: newIntention});
                      }}>
                        <View style={[styles.checkboxBox, filters.intention.includes(intention) && styles.checkboxBoxActive]}>
                          {filters.intention.includes(intention) && <View style={styles.checkboxCheck} />}
                        </View>
                        <Text style={styles.checkboxLabel}>{labels[intention]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
            {showCountryPicker && (
              <View style={styles.countryPickerOverlay}>
                <View style={styles.countryPickerHeader}>
                  <Text style={styles.countryPickerTitle}>Select Country</Text>
                  <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                    <X size={22} color="#000" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.countryScrollList} showsVerticalScrollIndicator={false}>
                  {COUNTRIES.map((c) => (
                    <TouchableOpacity
                      key={c.code}
                      style={[styles.countryOption, filters.country === c.code && styles.countryOptionActive]}
                      onPress={() => { setFilters({...filters, country: c.code}); setShowCountryPicker(false); }}
                    >
                      <Text style={[styles.countryOptionText, filters.country === c.code && styles.countryOptionTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearButton} onPress={() => setFilters({ country: '', sex: [], languages: [], intention: [], minAge: '', maxAge: '', distance: '' })}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilterModal(false)}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 16, backgroundColor: '#FFF8E7' },
  titleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#000000' },
  notificationButton: { padding: 8, borderRadius: 20, backgroundColor: '#FFF8E7', borderWidth: 1, borderColor: '#888888', position: 'relative' },
  notificationBadge: { position: 'absolute', bottom: -2, left: -2, backgroundColor: '#FF4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF8E7' },
  notificationBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginRight: 8, borderWidth: 1, borderColor: '#888888' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#000000' },
  filterButton: { backgroundColor: '#FFF8E7', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#888888' },
  listContent: { paddingBottom: 20, paddingHorizontal: 4 },
  row: { justifyContent: 'space-between', paddingHorizontal: 4 },
  tabContainer: { flexDirection: 'row', borderWidth: 1, borderColor: '#888888', borderRadius: 12, overflow: 'hidden' },
  tab: { flex: 1, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  tabLeft: { borderRightWidth: 0.5, borderRightColor: '#888888' },
  tabRight: { borderLeftWidth: 0.5, borderLeftColor: '#888888' },
  activeTab: { backgroundColor: '#000000' },
  tabText: { fontSize: 15, fontWeight: '700', color: '#000000' },
  activeTabText: { color: '#FFFFFF' },

  placesContainer: { flex: 1, backgroundColor: Colors.background },
  placesSearchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.surface, gap: 8 },
  placesSearchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#262626', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border },
  placesSearchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#FFFFFF' },
  placesSearchButton: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  placesSearchButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  placesEmptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 48, paddingBottom: 60 },
  placesEmptyText: { fontSize: 18, fontWeight: '600', color: Colors.text, marginTop: 16 },
  placesEmptySubtext: { fontSize: 14, color: Colors.textLight, marginTop: 8, textAlign: 'center', lineHeight: 20 },

  placesLoadingState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingBottom: 60 },
  placesLoadingText: { fontSize: 15, color: Colors.textLight, marginTop: 8 },

  mapContainer: { height: MAP_HEIGHT, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  mapGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 60, pointerEvents: 'none' as const },
  mapGradientTop: { flex: 1, backgroundColor: 'transparent' },
  customMarker: { alignItems: 'center', justifyContent: 'center' },
  markerPulse: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 107, 53, 0.2)', top: -4, left: -4 },
  markerDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  markerDotFirst: { backgroundColor: '#FF4444', width: 36, height: 36, borderRadius: 18 },
  markerEmoji: { fontSize: 14 },

  resultsCount: { fontSize: 13, fontWeight: '600', color: Colors.textLight, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },

  placesCardList: { maxHeight: 202, flexGrow: 0 },
  placesCardListContent: { paddingHorizontal: 16, gap: 12, paddingBottom: 12 },

  placeCard: { width: 200, backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  placeCardImageWrap: { height: 110, position: 'relative' },
  placeCardImage: { width: '100%', height: '100%' },
  placeCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  placeCardBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  placeCardBadgeText: { fontSize: 14 },
  placeCardPrice: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  placeCardPriceText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  placeCardInfo: { padding: 10, gap: 4 },
  placeCardName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  placeCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  placeCardLocation: { fontSize: 11, color: Colors.textLight, flex: 1 },
  placeCardRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  placeCardStars: { fontSize: 10, color: Colors.premium, letterSpacing: 1 },
  placeCardRatingNum: { fontSize: 11, fontWeight: '600', color: Colors.textLight },
  inviteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginTop: 6, gap: 6 },
  inviteButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  detailOverlay: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, zIndex: 300 },
  detailBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  detailSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  detailHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  detailImageWrap: { height: 200, position: 'relative' },
  detailImage: { width: '100%', height: '100%' },
  detailImageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  detailClose: { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  detailImageContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  detailName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  detailRatingInline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailStars: { fontSize: 14, color: Colors.premium, letterSpacing: 2 },
  detailRatingNum: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  detailPrice: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  detailBody: { padding: 20, gap: 20 },
  detailDescription: { fontSize: 15, color: Colors.textLight, lineHeight: 22 },
  detailInfoGrid: { gap: 16 },
  detailInfoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detailInfoTextWrap: { flex: 1, gap: 2 },
  detailInfoLabel: { fontSize: 11, fontWeight: '600', color: Colors.textLight, textTransform: 'uppercase' as const, letterSpacing: 1 },
  detailInfoValue: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  detailInfoSub: { fontSize: 12, color: Colors.textLight },
  detailInviteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, gap: 10 },
  detailInviteText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  detailDirectionsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  detailDirectionsText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  modalOverlay: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end', zIndex: 100 },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  modalTitle: { fontSize: 24, fontWeight: '700', color: '#000000' },
  closeButton: { padding: 4 },
  modalBody: { paddingHorizontal: 20, paddingVertical: 20 },
  filterSection: { marginBottom: 28 },
  filterLabel: { fontSize: 18, fontWeight: '600', color: '#000000', marginBottom: 12 },
  ageInputs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ageInput: { flex: 1 },
  ageInputLabel: { fontSize: 14, color: '#666666', marginBottom: 8 },
  ageInputField: { borderWidth: 1, borderColor: '#888888', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, color: '#000000' },
  ageRangeSeparator: { fontSize: 20, fontWeight: '600', color: '#000000', marginHorizontal: 16, marginTop: 20 },
  distanceInput: { borderWidth: 1, borderColor: '#888888', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, color: '#000000' },
  dropdownButton: { borderWidth: 1, borderColor: '#888888', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF' },
  dropdownButtonText: { fontSize: 16, color: '#000000', fontWeight: '500' },
  dropdownPlaceholder: { color: '#999999' },
  checkboxGroup: { gap: 12 },
  checkbox: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  checkboxBox: { width: 24, height: 24, borderWidth: 2, borderColor: '#888888', borderRadius: 6, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxBoxActive: { backgroundColor: '#000000', borderColor: '#000000' },
  checkboxCheck: { width: 12, height: 12, backgroundColor: '#FFFFFF', borderRadius: 2 },
  checkboxLabel: { fontSize: 16, color: '#000000' },
  modalFooter: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  clearButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center' },
  clearButtonText: { fontSize: 16, fontWeight: '600', color: '#000000' },
  applyButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#000000', alignItems: 'center' },
  applyButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  countryPickerOverlay: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', zIndex: 200, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  countryPickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  countryPickerTitle: { fontSize: 20, fontWeight: '700', color: '#000000' },
  countryScrollList: { flex: 1, paddingHorizontal: 12 },
  countryOption: { paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, marginVertical: 2 },
  countryOptionActive: { backgroundColor: '#000000' },
  countryOptionText: { fontSize: 16, color: '#000000' },
  countryOptionTextActive: { color: '#FFFFFF' },

});
