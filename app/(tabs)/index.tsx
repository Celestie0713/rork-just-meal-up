import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Text, StyleSheet, FlatList, SafeAreaView, View, TextInput, TouchableOpacity, Modal, ScrollView, Image, Linking, Animated, Keyboard } from 'react-native';
import { Search, Filter, Heart, X, MapPin, Star, Phone, Globe, Gift, Sparkles, Send } from 'lucide-react-native';
import { router } from 'expo-router';
import { UserCard } from '@/components/UserCard';

import { SuccessPopup } from '@/components/SuccessPopup';
import { NotificationPopup } from '@/components/NotificationPopup';
import { mockUsers } from '@/mocks/users';
import { useNotifications } from '@/hooks/use-notifications';
import { useChat } from '@/hooks/use-chat';
import { trpc } from '@/lib/trpc';

import { Colors } from '@/constants/colors';

import type { User } from '@/types/user';

export default function SearchScreen() {
  const [activeTab, setActiveTab] = useState<'user' | 'places'>('user');
  const [searchQuery, setSearchQuery] = useState('');
  const [placesInputValue, setPlacesInputValue] = useState('');
  const [placesSearchQuery, setPlacesSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  const [filters, setFilters] = useState({
    sex: [] as string[],
    incomeLevel: '' as string,
    languages: [] as string[],
    minAge: '',
    maxAge: '',
    distance: '',
  });
  const { getUnreadCount } = useNotifications();
  const { matchedProfiles } = useChat();

  const placesQuery = trpc.places.search.useQuery(
    { query: placesSearchQuery, limit: 8 },
    { enabled: placesSearchQuery.length > 0, retry: 1, staleTime: 1000 * 60 * 5 }
  );

  useEffect(() => {
    if (placesQuery.isLoading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [placesQuery.isLoading, pulseAnim]);

  const handlePlacesSearch = useCallback(() => {
    const trimmed = placesInputValue.trim();
    if (trimmed.length > 0) {
      setPlacesSearchQuery(trimmed);
      setHasSearched(true);
      Keyboard.dismiss();
    }
  }, [placesInputValue]);

  const handleUserPress = (user: User) => {
    router.push({
      pathname: '/user-profile' as any,
      params: { userId: user.id }
    });
  };

  const handleNotificationPress = () => {
    setShowNotificationPopup(true);
  };

  const unreadCount = getUnreadCount();

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSex = filters.sex.length === 0 || (user.sex !== undefined && filters.sex.includes(user.sex));
    
    const matchesIncome = !filters.incomeLevel || (user.income !== undefined && (() => {
      if (filters.incomeLevel === '≤$50k') return user.income <= 50000;
      if (filters.incomeLevel === '≥$50k') return user.income >= 50000 && user.income < 100000;
      if (filters.incomeLevel === '≥$100k') return user.income >= 100000;
      return false;
    })());
    
    const matchesLanguages = filters.languages.length === 0 || 
      filters.languages.some(lang => user.languages?.includes(lang));
    
    const minAge = filters.minAge ? parseInt(filters.minAge) : null;
    const maxAge = filters.maxAge ? parseInt(filters.maxAge) : null;
    const matchesAge = (!minAge || user.age >= minAge) && (!maxAge || user.age <= maxAge);
    
    return matchesSearch && matchesSex && matchesIncome && matchesLanguages && matchesAge;
  });



  const renderUser = useCallback(({ item }: { item: User }) => {
    console.log('Rendering user card for:', item.name, 'ID:', item.id);
    console.log('Current matchedProfiles in search:', matchedProfiles);
    return (
      <UserCard user={item} onPress={() => handleUserPress(item)} isGridView={true} />
    );
  }, [matchedProfiles]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Just Meal Up</Text>
          <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
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
          <View style={styles.placesSearchContainer}>
            <View style={styles.placesSearchInputContainer}>
              <Sparkles size={20} color="#FF6B35" />
              <TextInput
                style={styles.placesSearchInput}
                placeholder='Try "romantic dinner in Paris" or "cozy cafe"'
                value={placesInputValue}
                onChangeText={setPlacesInputValue}
                placeholderTextColor="#999999"
                onSubmitEditing={handlePlacesSearch}
                returnKeyType="search"
              />
              <TouchableOpacity
                onPress={handlePlacesSearch}
                style={styles.searchSendButton}
                disabled={placesInputValue.trim().length === 0}
              >
                <Send size={18} color={placesInputValue.trim().length > 0 ? '#FF6B35' : '#CCCCCC'} />
              </TouchableOpacity>
            </View>
          </View>

          {placesQuery.isLoading && (
            <View style={styles.loadingContainer}>
              <Animated.View style={[styles.loadingIconWrap, { opacity: pulseAnim }]}>
                <Sparkles size={40} color="#FF6B35" />
              </Animated.View>
              <Text style={styles.loadingTitle}>AI is finding the best spots...</Text>
              <Text style={styles.loadingSubtext}>Curating personalized recommendations</Text>
            </View>
          )}

          {placesQuery.isError && (
            <View style={styles.placesEmptyState}>
              <Text style={styles.placesEmptyText}>Something went wrong</Text>
              <Text style={styles.placesEmptySubtext}>Please try searching again</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => placesQuery.refetch()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!placesQuery.isLoading && !placesQuery.isError && !hasSearched && (
            <View style={styles.placesEmptyState}>
              <View style={styles.emptyIconWrap}>
                <Sparkles size={48} color="#FF6B35" />
              </View>
              <Text style={styles.placesEmptyText}>AI-Powered Place Search</Text>
              <Text style={styles.placesEmptySubtext}>Describe your ideal dining experience and our AI will find the perfect spots for you</Text>
              <View style={styles.suggestionChips}>
                {['Romantic dinner in NYC', 'Cozy ramen spot in Tokyo', 'Rooftop bar in London'].map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    style={styles.suggestionChip}
                    onPress={() => {
                      setPlacesInputValue(suggestion);
                      setPlacesSearchQuery(suggestion);
                      setHasSearched(true);
                    }}
                  >
                    <Text style={styles.suggestionChipText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {!placesQuery.isLoading && !placesQuery.isError && hasSearched && placesQuery.data && placesQuery.data.results.length === 0 && (
            <View style={styles.placesEmptyState}>
              <Text style={styles.placesEmptyText}>No places found</Text>
              <Text style={styles.placesEmptySubtext}>Try describing a different type of place</Text>
            </View>
          )}

          {!placesQuery.isLoading && !placesQuery.isError && placesQuery.data && placesQuery.data.results.length > 0 && (
            <ScrollView style={styles.placesResults} showsVerticalScrollIndicator={false}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  {placesQuery.data.totalResults} {placesQuery.data.totalResults === 1 ? 'place' : 'places'} found
                </Text>
                <View style={styles.aiBadge}>
                  <Sparkles size={12} color="#FF6B35" />
                  <Text style={styles.aiBadgeText}>AI Picks</Text>
                </View>
              </View>

              {placesQuery.data.results.map((result: any, index: number) => (
                <TouchableOpacity
                  key={`${result.place.id}-${index}`}
                  style={styles.placeCard}
                  onPress={() => setSelectedPlace(result)}
                  activeOpacity={0.8}
                >
                  <View style={styles.placeImageContainer}>
                    {result.place.photoUrls && result.place.photoUrls.length > 0 ? (
                      <Image
                        source={{ uri: result.place.photoUrls[0] }}
                        style={styles.placeImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.placePlaceholderImage}>
                        <MapPin size={32} color="#CCCCCC" />
                      </View>
                    )}
                    <View style={styles.placeMatchBadge}>
                      <Sparkles size={10} color="#FFFFFF" />
                      <Text style={styles.placeMatchText}>{result.matchScore}%</Text>
                    </View>
                  </View>

                  <View style={styles.placeContent}>
                    <Text style={styles.placeName}>{result.place.name}</Text>
                    
                    <View style={styles.placeRatingRow}>
                      {result.place.rating != null && result.place.rating > 0 && (
                        <View style={styles.placeRating}>
                          <Star size={14} color="#FFB800" fill="#FFB800" />
                          <Text style={styles.placeRatingText}>{result.place.rating.toFixed(1)}</Text>
                        </View>
                      )}
                      {result.place.priceLevel != null && result.place.priceLevel > 0 && (
                        <Text style={styles.placePriceLevel}>
                          {'$'.repeat(result.place.priceLevel)}
                        </Text>
                      )}
                    </View>

                    <View style={styles.placeLocationRow}>
                      <MapPin size={14} color="#666666" />
                      <Text style={styles.placeAddress} numberOfLines={1}>
                        {result.place.address}
                      </Text>
                    </View>

                    <Text style={styles.placeDescription} numberOfLines={3}>{result.description}</Text>

                    <TouchableOpacity style={styles.inviteButton}>
                      <Gift size={18} color="#FFFFFF" />
                      <Text style={styles.inviteButtonText}>Send Invitation</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </View>
      )}
      
      <SuccessPopup
        visible={showSuccessPopup}
        message="Poof! Added successfully👌🤘"
        onHide={() => setShowSuccessPopup(false)}
      />
      
      <NotificationPopup
        visible={showNotificationPopup}
        onClose={() => setShowNotificationPopup(false)}
      />

      <Modal
        visible={selectedPlace !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedPlace(null)}
      >
        <View style={styles.placeDetailOverlay}>
          <View style={styles.placeDetailContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedPlace && (
                <>
                  <TouchableOpacity
                    style={styles.closeDetailButton}
                    onPress={() => setSelectedPlace(null)}
                  >
                    <X size={24} color="#000000" />
                  </TouchableOpacity>

                  {selectedPlace.place.photoUrls && selectedPlace.place.photoUrls.length > 0 ? (
                    <Image
                      source={{ uri: selectedPlace.place.photoUrls[0] }}
                      style={styles.placeDetailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeDetailPlaceholderImage}>
                      <MapPin size={48} color="#CCCCCC" />
                    </View>
                  )}

                  <View style={styles.placeDetailBody}>
                    <Text style={styles.placeDetailName}>{selectedPlace.place.name}</Text>

                    <View style={styles.placeDetailRatingRow}>
                      {selectedPlace.place.rating != null && selectedPlace.place.rating > 0 && (
                        <View style={styles.placeDetailRating}>
                          <Star size={16} color="#FFB800" fill="#FFB800" />
                          <Text style={styles.placeDetailRatingText}>{selectedPlace.place.rating.toFixed(1)}</Text>
                        </View>
                      )}
                      {selectedPlace.place.priceLevel != null && selectedPlace.place.priceLevel > 0 && (
                        <Text style={styles.placeDetailPriceLevel}>
                          {'$'.repeat(selectedPlace.place.priceLevel)}
                        </Text>
                      )}
                      <View style={styles.placeDetailMatchBadge}>
                        <Text style={styles.placeDetailMatchText}>{selectedPlace.matchScore}% Match</Text>
                      </View>
                    </View>

                    <View style={styles.placeDetailRow}>
                      <MapPin size={18} color="#666666" />
                      <Text style={styles.placeDetailAddress}>{selectedPlace.place.address}</Text>
                    </View>

                    {selectedPlace.place.phoneNumber && (
                      <TouchableOpacity
                        style={styles.placeDetailRow}
                        onPress={() => Linking.openURL(`tel:${selectedPlace.place.phoneNumber}`)}
                      >
                        <Phone size={18} color="#666666" />
                        <Text style={styles.placeDetailContact}>{selectedPlace.place.phoneNumber}</Text>
                      </TouchableOpacity>
                    )}

                    {selectedPlace.place.website && (
                      <TouchableOpacity
                        style={styles.placeDetailRow}
                        onPress={() => Linking.openURL(selectedPlace.place.website)}
                      >
                        <Globe size={18} color="#666666" />
                        <Text style={styles.placeDetailContact}>{selectedPlace.place.website}</Text>
                      </TouchableOpacity>
                    )}

                    {selectedPlace.place.openingHours && selectedPlace.place.openingHours.length > 0 && (
                      <View style={styles.placeDetailSection}>
                        <Text style={styles.placeDetailSectionTitle}>Opening Hours</Text>
                        {selectedPlace.place.openingHours.map((hours: string, idx: number) => (
                          <Text key={idx} style={styles.placeDetailHours}>{hours}</Text>
                        ))}
                      </View>
                    )}

                    <View style={styles.placeDetailSection}>
                      <Text style={styles.placeDetailSectionTitle}>About</Text>
                      <Text style={styles.placeDetailDescription}>{selectedPlace.description}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.placeDetailMapButton}
                      onPress={() => {
                        const url = `https://www.google.com/maps/search/?api=1&query=${selectedPlace.place.latitude},${selectedPlace.place.longitude}`;
                        void Linking.openURL(url);
                      }}
                    >
                      <MapPin size={20} color="#FFFFFF" />
                      <Text style={styles.placeDetailMapButtonText}>Open in Maps</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.placeDetailInviteButton}>
                      <Gift size={20} color="#FFFFFF" />
                      <Text style={styles.placeDetailInviteButtonText}>Send Invitation with Gift</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
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
                <Text style={styles.filterLabel}>Age Range</Text>
                <View style={styles.ageInputs}>
                  <View style={styles.ageInput}>
                    <Text style={styles.ageInputLabel}>Min</Text>
                    <TextInput
                      style={styles.ageInputField}
                      placeholder="18"
                      value={filters.minAge}
                      onChangeText={(text) => setFilters({...filters, minAge: text})}
                      keyboardType="numeric"
                      placeholderTextColor="#999999"
                    />
                  </View>
                  <Text style={styles.ageRangeSeparator}>-</Text>
                  <View style={styles.ageInput}>
                    <Text style={styles.ageInputLabel}>Max</Text>
                    <TextInput
                      style={styles.ageInputField}
                      placeholder="99"
                      value={filters.maxAge}
                      onChangeText={(text) => setFilters({...filters, maxAge: text})}
                      keyboardType="numeric"
                      placeholderTextColor="#999999"
                    />
                  </View>
                </View>
              </View>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Distance</Text>
                <TextInput
                  style={styles.distanceInput}
                  placeholder="Distance in miles"
                  value={filters.distance}
                  onChangeText={(text) => setFilters({...filters, distance: text})}
                  keyboardType="numeric"
                  placeholderTextColor="#999999"
                />
              </View>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Sex</Text>
                <View style={styles.checkboxGroup}>
                  {['Male', 'Female', 'Other'].map((sex) => (
                    <TouchableOpacity
                      key={sex}
                      style={styles.checkbox}
                      onPress={() => {
                        const newSex = filters.sex.includes(sex)
                          ? filters.sex.filter(s => s !== sex)
                          : [...filters.sex, sex];
                        setFilters({...filters, sex: newSex});
                      }}
                    >
                      <View style={[styles.checkboxBox, filters.sex.includes(sex) && styles.checkboxBoxActive]}>
                        {filters.sex.includes(sex) && <View style={styles.checkboxCheck} />}
                      </View>
                      <Text style={styles.checkboxLabel}>{sex}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Income Level</Text>
                <View style={styles.checkboxGroup}>
                  {['≤$50k', '≥$50k', '≥$100k'].map((income) => (
                    <TouchableOpacity
                      key={income}
                      style={styles.checkbox}
                      onPress={() => {
                        const newIncome = filters.incomeLevel === income ? '' : income;
                        setFilters({...filters, incomeLevel: newIncome});
                      }}
                    >
                      <View style={[styles.checkboxBox, filters.incomeLevel === income && styles.checkboxBoxActive]}>
                        {filters.incomeLevel === income && <View style={styles.checkboxCheck} />}
                      </View>
                      <Text style={styles.checkboxLabel}>{income}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Languages</Text>
                <View style={styles.checkboxGroup}>
                  {['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean'].map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={styles.checkbox}
                      onPress={() => {
                        const newLang = filters.languages.includes(lang)
                          ? filters.languages.filter(l => l !== lang)
                          : [...filters.languages, lang];
                        setFilters({...filters, languages: newLang});
                      }}
                    >
                      <View style={[styles.checkboxBox, filters.languages.includes(lang) && styles.checkboxBoxActive]}>
                        {filters.languages.includes(lang) && <View style={styles.checkboxCheck} />}
                      </View>
                      <Text style={styles.checkboxLabel}>{lang}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setFilters({
                  sex: [],
                  incomeLevel: '',
                  languages: [],
                  minAge: '',
                  maxAge: '',
                  distance: '',
                })}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 16,
    backgroundColor: '#FFF8E7',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
  },
  notificationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: '#888888',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF8E7',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#888888',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000000',
  },
  filterButton: {
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#888888',
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 4,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#888888',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLeft: {
    borderRightWidth: 0.5,
    borderRightColor: '#888888',
  },
  tabRight: {
    borderLeftWidth: 0.5,
    borderLeftColor: '#888888',
  },
  activeTab: {
    backgroundColor: '#000000',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  placesContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  placesSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF8E7',
  },
  placesSearchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#888888',
  },
  placesSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  placesEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  placesEmptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
  },
  placesEmptySubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  placesResults: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000000',
  },
  aiBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FF6B35',
  },
  searchSendButton: {
    padding: 4,
  },
  loadingIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF0E6',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 4,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#888888',
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0E6',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  suggestionChips: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  suggestionChip: {
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD5B8',
  },
  suggestionChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#FF6B35',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  placeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  placeImageContainer: {
    position: 'relative' as const,
    width: '100%',
    height: 200,
  },
  placeImage: {
    width: '100%',
    height: '100%',
  },
  placePlaceholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeMatchBadge: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  placeMatchText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  placeContent: {
    padding: 16,
  },
  placeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  placeRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  placeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  placePriceLevel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  placeLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  placeAddress: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  placeDescription: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 12,
  },
  giftSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  giftEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  giftContent: {
    flex: 1,
  },
  giftName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  giftDescription: {
    fontSize: 12,
    color: '#666666',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  placeDetailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  placeDetailContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  closeDetailButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  placeDetailImage: {
    width: '100%',
    height: 300,
  },
  placeDetailPlaceholderImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeDetailBody: {
    padding: 20,
  },
  placeDetailName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  placeDetailRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  placeDetailRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeDetailRatingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  placeDetailPriceLevel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  placeDetailMatchBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  placeDetailMatchText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  placeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  placeDetailAddress: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  placeDetailContact: {
    fontSize: 14,
    color: '#0066CC',
    flex: 1,
  },
  placeDetailSection: {
    marginTop: 20,
  },
  placeDetailSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  placeDetailHours: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  placeDetailDescription: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  placeDetailGift: {
    marginTop: 20,
  },
  giftDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  giftDetailEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  giftDetailContent: {
    flex: 1,
  },
  giftDetailName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  giftDetailDescription: {
    fontSize: 14,
    color: '#666666',
  },
  placeDetailMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
  },
  placeDetailMapButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  placeDetailInviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
  },
  placeDetailInviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  filterSection: {
    marginBottom: 28,
  },
  filterLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  ageInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ageInput: {
    flex: 1,
  },
  ageInputLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  ageInputField: {
    borderWidth: 1,
    borderColor: '#888888',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
  },
  ageRangeSeparator: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginHorizontal: 16,
    marginTop: 20,
  },
  distanceInput: {
    borderWidth: 1,
    borderColor: '#888888',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
  },
  checkboxGroup: {
    gap: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#888888',
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  checkboxCheck: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#000000',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
