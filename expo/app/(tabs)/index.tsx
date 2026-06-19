import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Text, StyleSheet, FlatList, SafeAreaView, View, TextInput, TouchableOpacity, ScrollView, Animated, Keyboard, Alert, Platform, ActivityIndicator, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Search, Filter, Heart, X, MapPin, Star, Gift, Sparkles, Send, Utensils, Navigation, ChevronDown, ExternalLink, MapPinned, Loader2 } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { UserCard } from '@/components/UserCard';
import { SuccessPopup } from '@/components/SuccessPopup';
import { NotificationPopup } from '@/components/NotificationPopup';
import { mockUsers } from '@/mocks/users';
import { useNotifications } from '@/hooks/use-notifications';
import { useChat } from '@/hooks/use-chat';
import { usePlacesSearch, type PlaceResult } from '@/hooks/use-places-search';
import { useFavorites } from '@/hooks/use-favorites';
import { Colors } from '@/constants/colors';
import type { User } from '@/types/user';

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

export default function SearchScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<'user' | 'places'>('user');

  useEffect(() => {
    if (params.tab === 'places') setActiveTab('places');
  }, [params.tab]);

  const [searchQuery, setSearchQuery] = useState('');
  const [placesQuery, setPlacesQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const placesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const { matchedProfiles } = useChat();
  const placesSearch = usePlacesSearch();

  const handleUserPress = (user: User) => {
    router.push({ pathname: '/user-profile' as any, params: { userId: user.id } });
  };

  // Debounced places search
  useEffect(() => {
    if (activeTab !== 'places') return;
    if (placesDebounceRef.current) clearTimeout(placesDebounceRef.current);
    if (placesQuery.trim().length === 0) return;
    placesDebounceRef.current = setTimeout(() => {
      placesSearch.search(placesQuery);
    }, 500);
    return () => {
      if (placesDebounceRef.current) clearTimeout(placesDebounceRef.current);
    };
  }, [placesQuery, activeTab]);

  const placeResults = placesSearch.data?.results ?? [];
  const hasSearchedPlaces = placesSearch.data !== null || placesSearch.isLoading || placesSearch.isError;

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

  const openInMaps = useCallback((place: PlaceResult['place']) => {
    if (place.googleMapsUrl) {
      Linking.openURL(place.googleMapsUrl).catch(() => {});
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.city + ' ' + place.country)}`;
      Linking.openURL(url).catch(() => {});
    }
  }, []);

  const renderPlace = useCallback(({ item }: { item: PlaceResult }) => {
    const p = item.place;
    const stars = p.rating > 0 ? '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating)) : '';
    const priceStr = p.priceLevel > 0 ? '$'.repeat(p.priceLevel) : '';
    return (
      <View style={styles.placeCard}>
        <View style={styles.placeCardTop}>
          <View style={styles.placeNameRow}>
            <Text style={styles.placeEmoji}>{p.cuisineEmoji || '🍽️'}</Text>
            <View style={styles.placeNameInfo}>
              <Text style={styles.placeName} numberOfLines={2}>{p.name}</Text>
              <View style={styles.placeMetaRow}>
                {stars ? <Text style={styles.placeStars}>{stars}</Text> : null}
                {priceStr ? <Text style={styles.placePrice}>{priceStr}</Text> : null}
                <View style={styles.matchBadge}>
                  <Text style={styles.matchBadgeText}>{item.matchScore}%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        {item.description ? (
          <Text style={styles.placeDescription} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.placeCardBottom}>
          <View style={styles.placeLocationRow}>
            <MapPinned size={14} color={Colors.primary} />
            <Text style={styles.placeAddress} numberOfLines={1}>
              {p.city}{p.country ? `, ${p.country}` : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.mapsButton} onPress={() => openInMaps(p)} activeOpacity={0.7}>
            <ExternalLink size={14} color={Colors.primary} />
            <Text style={styles.mapsButtonText}>Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [openInMaps]);

  const renderPlaceKey = useCallback((item: PlaceResult) => item.place.id, []);

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
            <View style={styles.placesSearchInputContainer}>
              <Search size={18} color={Colors.textLight} />
              <TextInput
                style={styles.placesSearchInput}
                placeholder="Search restaurants, cafes, bars..."
                placeholderTextColor={Colors.textLight}
                value={placesQuery}
                onChangeText={setPlacesQuery}
                returnKeyType="search"
              />
              {placesQuery.length > 0 && (
                <TouchableOpacity onPress={() => setPlacesQuery('')}>
                  <X size={16} color={Colors.textLight} />
                </TouchableOpacity>
              )}
            </View>
            {placesSearch.needsLocationForQuery(placesQuery) && (
              <TouchableOpacity
                style={styles.enableLocationButton}
                onPress={() => placesSearch.requestLocationPermission()}
                activeOpacity={0.7}
              >
                <Navigation size={14} color={Colors.primary} />
                <Text style={styles.enableLocationText}>Enable Location</Text>
              </TouchableOpacity>
            )}
          </View>

          {placesSearch.isLoading ? (
            <View style={styles.placesCenterState}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.placesLoadingText}>Searching for the best spots...</Text>
            </View>
          ) : placesSearch.isError ? (
            <View style={styles.placesCenterState}>
              <X size={40} color={Colors.error} />
              <Text style={styles.placesErrorText}>Something went wrong</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => placesSearch.refetch()} activeOpacity={0.7}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : hasSearchedPlaces && placeResults.length === 0 ? (
            <View style={styles.placesCenterState}>
              <Search size={40} color={Colors.textLight} />
              <Text style={styles.placesEmptyText}>No places found</Text>
              <Text style={styles.placesEmptySubtext}>Try a different search term</Text>
            </View>
          ) : !hasSearchedPlaces ? (
            <View style={styles.placesCenterState}>
              <Utensils size={48} color={Colors.primary} />
              <Text style={styles.placesPromptTitle}>Discover Places</Text>
              <Text style={styles.placesPromptSubtext}>{`Search for restaurants, cafes, and bars
to find your next meal up spot`}</Text>
            </View>
          ) : (
            <FlatList
              data={placeResults}
              renderItem={renderPlace}
              keyExtractor={renderPlaceKey}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.placesListContent}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          )}
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
  placesEmptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  placesEmptyText: { fontSize: 18, fontWeight: '600', color: Colors.text, marginTop: 16 },
  placesEmptySubtext: { fontSize: 14, color: Colors.textLight, marginTop: 8, textAlign: 'center' },
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
  // Places tab styles
  placesSearchRow: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  placesSearchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  placesSearchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: Colors.text },
  enableLocationButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: Colors.primary },
  enableLocationText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  placesCenterState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 60 },
  placesLoadingText: { fontSize: 16, color: Colors.textLight, marginTop: 16 },
  placesErrorText: { fontSize: 16, fontWeight: '600', color: Colors.error, marginTop: 12 },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.primary },
  retryButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  placesPromptTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: 20 },
  placesPromptSubtext: { fontSize: 15, color: Colors.textLight, marginTop: 10, textAlign: 'center', lineHeight: 22 },
  placesListContent: { paddingHorizontal: 16, paddingBottom: 24 },
  placeCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  placeCardTop: { marginBottom: 10 },
  placeNameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  placeEmoji: { fontSize: 32, lineHeight: 40 },
  placeNameInfo: { flex: 1 },
  placeName: { fontSize: 17, fontWeight: '700', color: Colors.text, lineHeight: 22 },
  placeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  placeStars: { fontSize: 13, color: '#FFD700', letterSpacing: 1 },
  placePrice: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  matchBadge: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  matchBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  placeDescription: { fontSize: 14, color: Colors.textLight, lineHeight: 20, marginBottom: 12 },
  placeCardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  placeLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  placeAddress: { fontSize: 13, color: Colors.textLight, flex: 1 },
  mapsButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,107,53,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  mapsButtonText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
