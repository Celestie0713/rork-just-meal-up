import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, FlatList, SafeAreaView, View, TextInput, TouchableOpacity, Image, Dimensions, Modal, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Filter, Plus, Users, X, TicketPercent, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { MealUpCard } from '@/components/MealUpCard';
import { Colors, Gradients } from '@/constants/colors';
import { ALL_COUNTRIES } from '@/constants/countries';
import type { Group } from '@/mocks/groups';
import { useGroups } from '@/hooks/use-groups';
import { useMealUps } from '@/hooks/use-meal-ups';
import { useUserLocation, type Coords } from '@/hooks/use-user-location';
import { useAuth } from '@/hooks/use-auth';
import type { MealUp } from '@/types/user';

const DEFAULT_RADIUS_MILES = 25;

/** Great-circle distance in miles (haversine). */
function distanceMiles(a: Coords, b: { lat: number; lng: number }): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.latitude) * Math.PI) / 180;
  const dLng = ((b.lng - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function EventsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'groups'>('upcoming');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const { user, isGroupMember } = useAuth();
  const { data: groups, isLoading: groupsLoading, refetch: refetchGroups, isRefetching: groupsRefetching } = useGroups();
  const { data: backendMealUps, isLoading: mealUpsLoading, refetch: refetchMealUps, isRefetching: mealUpsRefetching } = useMealUps();
  const { coords, requestLocation, isRequesting: isLocating } = useUserLocation();

  // Location fallback: forward-geocode the user's saved location string.
  // Network-based (no permission prompt, no hardware) — safe on native too.
  const [geocodedCoords, setGeocodedCoords] = useState<Coords | null>(null);
  useEffect(() => {
    if (coords || geocodedCoords || !user?.location) return;
    let cancelled = false;
    (async () => {
      try {
        const Location = await import('expo-location');
        const results = await Location.geocodeAsync(user.location!);
        if (!cancelled && results[0]?.latitude != null && results[0]?.longitude != null) {
          setGeocodedCoords({ latitude: results[0].latitude, longitude: results[0].longitude });
        }
      } catch (error) {
        console.log('[Events] Location geocode failed:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coords, geocodedCoords, user?.location]);

  const userCoords = coords ?? geocodedCoords;

  const handleMealUpPress = (mealUp: MealUp) => {
    console.log('Opening meal up:', mealUp.title);
    router.push(`/meal-up-details?mealUpId=${mealUp.id}` as any);
  };

  const handleCreateGroup = () => {
    console.log('=== CREATE GROUP BUTTON CLICKED ===');
    router.push('/create-group' as any);
  };

  const now = new Date();

  const countries = ALL_COUNTRIES as unknown as string[];

  // Meal ups live on the backend (Durable Object SQLite) — same as groups.
  const mealUps: MealUp[] = backendMealUps ?? [];

  const upcomingMealUps = mealUps.filter(mealUp => mealUp.date >= now);

  /** Distance to each meal up when both the user and the venue are geolocated. */
  const distances = new Map<string, number>();
  if (userCoords) {
    for (const mealUp of upcomingMealUps) {
      if (mealUp.venue.lat != null && mealUp.venue.lng != null) {
        distances.set(mealUp.id, distanceMiles(userCoords, { lat: mealUp.venue.lat, lng: mealUp.venue.lng }));
      }
    }
  }

  // Nearest first when we know where the user is, otherwise soonest first.
  const sortedMealUps = [...upcomingMealUps].sort((a, b) => {
    const da = distances.get(a.id);
    const db = distances.get(b.id);
    if (da != null && db != null && da !== db) return da - db;
    if (da != null && db == null) return -1;
    if (db != null && da == null) return 1;
    return a.date.getTime() - b.date.getTime();
  });

  const filteredMealUps = sortedMealUps.filter(mealUp => {
    const matchesSearch = mealUp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mealUp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mealUp.venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mealUp.venue.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mealUp.venue.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Radius from the filter modal; default "near me" is 25 miles. Meal ups
    // without geocoded venues always show (we can't place them on the map).
    const distance = distances.get(mealUp.id);
    const radius = selectedDistance ?? (userCoords ? DEFAULT_RADIUS_MILES : null);
    const matchesDistance = radius == null || distance == null || distance <= radius;
    const matchesPrice = !priceRange || (mealUp.ticketPrice >= priceRange.min && mealUp.ticketPrice <= priceRange.max);
    const matchesCountry = !selectedCountry || (mealUp.venue.country ?? '') === selectedCountry;
    
    return matchesSearch && matchesDistance && matchesPrice && matchesCountry;
  });

  const renderMealUp = ({ item }: { item: MealUp }) => (
    <MealUpCard mealUp={item} onPress={() => handleMealUpPress(item)} />
  );

  const handleGroupPress = (group: Group) => {
    console.log('Opening group:', group.name);
    router.push(`/group-details?groupId=${group.id}` as any);
  };

  const renderGroup = ({ item }: { item: Group }) => {
    const joined = isGroupMember(item.id);
    return (
      <TouchableOpacity style={styles.groupCard} onPress={() => handleGroupPress(item)}>
        <Image source={{ uri: item.imageUrl }} style={styles.groupImage} />
        {joined ? (
          <View style={styles.groupJoinedBadge}>
            <CheckCircle size={10} color="#FFFFFF" />
            <Text style={styles.groupJoinedText}>Joined</Text>
          </View>
        ) : item.isPaid && item.memberDiscount ? (
          <View style={styles.groupDiscountBadge}>
            <TicketPercent size={10} color="#FFFFFF" />
            <Text style={styles.groupDiscountText}>{item.memberDiscount} off</Text>
          </View>
        ) : (
          <View style={styles.freeGroupBadge}>
            <Text style={styles.freeGroupBadgeText}>Free</Text>
          </View>
        )}
        <View style={styles.groupOverlay}>
          <Text style={styles.groupName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.memberCountContainer}>
            <Users size={12} color="#FFFFFF" />
            <Text style={styles.memberCount}>{item.memberCount}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Gradients.secondary}
        style={styles.header}
      >
        <View style={styles.titleContainer}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Meal Ups</Text>
            <Text style={styles.subtitle}>Join group dining experiences</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleCreateGroup}>
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#666666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search meal ups..."
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
            style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
            onPress={() => setActiveTab('groups')}
          >
            <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>Groups</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Upcoming Meal Up Near Me</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Meal Ups</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.filterSectionTitle}>Distance Near Me</Text>
              <View style={styles.distanceGrid}>
                {[
                  { label: 'Within 1 mile', value: 1 },
                  { label: 'Within 5 miles', value: 5 },
                  { label: 'Within 10 miles', value: 10 },
                  { label: '25+ miles', value: 25 },
                ].map(distance => (
                  <TouchableOpacity
                    key={distance.value}
                    style={[
                      styles.distanceButton,
                      selectedDistance === distance.value && styles.distanceButtonActive
                    ]}
                    onPress={() => {
                      setSelectedDistance(prev => 
                        prev === distance.value ? null : distance.value
                      );
                    }}
                  >
                    <Text style={[
                      styles.distanceButtonText,
                      selectedDistance === distance.value && styles.distanceButtonTextActive
                    ]}>{distance.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.filterSectionTitle}>Country</Text>
              <TouchableOpacity
                style={styles.countryDropdown}
                onPress={() => setCountryDropdownOpen(prev => !prev)}
              >
                <Text style={[
                  styles.countryDropdownText,
                  !selectedCountry && styles.countryDropdownPlaceholder
                ]}>
                  {selectedCountry ?? 'All countries'}
                </Text>
                {countryDropdownOpen ? (
                  <ChevronUp size={18} color="#666666" />
                ) : (
                  <ChevronDown size={18} color="#666666" />
                )}
              </TouchableOpacity>
              {countryDropdownOpen && (
                <View style={styles.countryDropdownList}>
                  <ScrollView style={styles.countryDropdownScroll} nestedScrollEnabled>
                    <TouchableOpacity
                      style={[
                        styles.countryDropdownItem,
                        !selectedCountry && styles.countryDropdownItemActive
                      ]}
                      onPress={() => {
                        setSelectedCountry(null);
                        setCountryDropdownOpen(false);
                      }}
                    >
                      <Text style={[
                        styles.countryDropdownItemText,
                        !selectedCountry && styles.countryDropdownItemTextActive
                      ]}>All countries</Text>
                    </TouchableOpacity>
                    {countries.map(country => (
                      <TouchableOpacity
                        key={country}
                        style={[
                          styles.countryDropdownItem,
                          selectedCountry === country && styles.countryDropdownItemActive
                        ]}
                        onPress={() => {
                          setSelectedCountry(country);
                          setCountryDropdownOpen(false);
                        }}
                      >
                        <Text style={[
                          styles.countryDropdownItemText,
                          selectedCountry === country && styles.countryDropdownItemTextActive
                        ]}>{country}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              <Text style={styles.filterSectionTitle}>Price Range</Text>
              <View style={styles.priceGrid}>
                {[
                  { label: 'Under $50', min: 0, max: 50 },
                  { label: '$50-$75', min: 50, max: 75 },
                  { label: '$75-$100', min: 75, max: 100 },
                  { label: 'Over $100', min: 100, max: 999 },
                ].map(range => (
                  <TouchableOpacity
                    key={range.label}
                    style={[
                      styles.priceButton,
                      priceRange?.min === range.min && priceRange?.max === range.max && styles.priceButtonActive
                    ]}
                    onPress={() => {
                      setPriceRange(prev => 
                        prev?.min === range.min && prev?.max === range.max
                          ? null
                          : { min: range.min, max: range.max }
                      );
                    }}
                  >
                    <Text style={[
                      styles.priceButtonText,
                      priceRange?.min === range.min && priceRange?.max === range.max && styles.priceButtonTextActive
                    ]}>{range.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => {
                  setSelectedDistance(null);
                  setPriceRange(null);
                  setSelectedCountry(null);
                }}
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
      {activeTab === 'upcoming' ? (
        mealUpsLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Loading meal ups…</Text>
          </View>
        ) : filteredMealUps.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={40} color={Colors.textLight} />
            <Text style={styles.emptyStateTitle}>No meal ups near you yet</Text>
            <Text style={styles.emptyStateText}>
              {!userCoords
                ? 'Let us find you so we can show meal ups close by — or host one yourself.'
                : 'Host one now by clicking the add button to create a group for your people❤️'}
            </Text>
            {!userCoords && (
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => requestLocation()}
                disabled={isLocating}
              >
                <Text style={styles.locationButtonText}>
                  {isLocating ? 'Finding you…' : 'Use my location'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            key="upcoming-meal-ups"
            data={filteredMealUps}
            renderItem={renderMealUp}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={mealUpsRefetching}
                onRefresh={refetchMealUps}
                tintColor="#FF6B35"
                colors={['#FF6B35']}
              />
            }
          />
        )
      ) : groupsLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Loading groups…</Text>
        </View>
      ) : !groups || groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={40} color={Colors.textLight} />
          <Text style={styles.emptyStateTitle}>No groups yet</Text>
          <Text style={styles.emptyStateText}>
            Tap the + button to start the first group.
          </Text>
        </View>
      ) : (
        <FlatList
          key="groups-grid"
          data={groups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.groupsContent}
          columnWrapperStyle={styles.groupsRow}
          refreshControl={
            <RefreshControl
              refreshing={groupsRefetching}
              onRefresh={refetchGroups}
              tintColor="#FF6B35"
              colors={['#FF6B35']}
            />
          }
        />
      )}
    </SafeAreaView>
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
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleSection: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listContent: {
    paddingBottom: 20,
  },
  locationButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 6,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000000',
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  groupsContent: {
    padding: 12,
    paddingBottom: 20,
  },
  groupsRow: {
    justifyContent: 'space-between',
  },
  groupCard: {
    width: (Dimensions.get('window').width - 36) / 3,
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  groupImage: {
    width: '100%',
    height: '100%',
  },
  groupOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    justifyContent: 'flex-end',
  },
  groupName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 14,
  },
  groupDiscountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  groupDiscountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  groupJoinedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  groupJoinedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  freeGroupBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  freeGroupBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  memberCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  modalBody: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    marginTop: 8,
  },
  distanceGrid: {
    gap: 8,
    marginBottom: 20,
  },
  distanceButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  distanceButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  distanceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  distanceButtonTextActive: {
    color: '#FFFFFF',
  },
  priceGrid: {
    gap: 8,
    marginBottom: 20,
  },
  priceButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  priceButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  priceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  priceButtonTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
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
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  countryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 4,
  },
  countryDropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  countryDropdownPlaceholder: {
    color: '#999999',
  },
  countryDropdownList: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    overflow: 'hidden',
  },
  countryDropdownScroll: {
    maxHeight: 200,
  },
  countryDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  countryDropdownItemActive: {
    backgroundColor: '#FFF0E8',
  },
  countryDropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  countryDropdownItemTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});