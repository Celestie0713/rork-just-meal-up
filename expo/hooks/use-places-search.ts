import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

const nullableString = z.preprocess((v) => (v === null || v === undefined ? '' : String(v)), z.string());
const nullableNumber = z.preprocess((v) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }
  if (typeof v === 'number') return v;
  return 0;
}, z.number());
const nullableStringArray = z.preprocess((v) => {
  if (!Array.isArray(v)) return [];
  return v.map((item) => (item === null || item === undefined ? '' : String(item)));
}, z.array(z.string()));

const PlaceSchema = z.preprocess(
  (v) => {
    if (typeof v !== 'object' || v === null) return {};
    return v;
  },
  z.object({
    name: nullableString,
    address: nullableString,
    city: nullableString,
    country: nullableString,
    latitude: nullableNumber,
    longitude: nullableNumber,
    rating: nullableNumber,
    priceLevel: nullableNumber,
    placeType: z.preprocess((v2) => {
      if (!Array.isArray(v2)) return typeof v2 === 'string' ? [v2] : [];
      return v2.map((item: any) => (item === null || item === undefined ? '' : String(item)));
    }, z.array(z.string())),
    cuisineEmoji: nullableString,
    phoneNumber: z.string().nullable().default(null),
    website: z.string().nullable().default(null),
    googleMapsUrl: z.string().nullable().default(null),
    openingHours: nullableStringArray.nullable().default(null),
    description: nullableString,
    matchScore: nullableNumber,
  }).passthrough()
);

const QueryClassificationSchema = z.preprocess(
  (v) => {
    if (typeof v !== 'object' || v === null) return { queryKind: 'other', officialName: '' };
    return v;
  },
  z.object({
    queryKind: z.preprocess(
      (v) => (typeof v === 'string' ? v : 'other'),
      z.enum(['brand', 'dish', 'other'])
    ),
    officialName: nullableString,
  })
);

const PlacesResponseSchema = z.preprocess(
  (v) => {
    if (typeof v !== 'object' || v === null) return { places: [], countryScope: '' };
    const obj = v as Record<string, unknown>;
    if (!Array.isArray(obj.places)) return { places: [], countryScope: obj.countryScope };
    return { places: obj.places, countryScope: obj.countryScope };
  },
  z.object({
    places: z.array(PlaceSchema),
    countryScope: nullableString,
  })
);

export interface PlaceResult {
  place: {
    id: string;
    name: string;
    address: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    rating: number;
    priceLevel: number;
    placeType: string[];
    cuisineEmoji: string;
    phoneNumber?: string;
    website?: string;
    googleMapsUrl?: string;
    openingHours?: string[];
  };
  description: string;
  matchScore: number;
}

export interface PlacesSearchResult {
  results: PlaceResult[];
  totalResults: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

async function reverseGeocode(latitude: number, longitude: number): Promise<{ city?: string; country?: string }> {
  try {
    if (Platform.OS !== 'web') {
      const Location = await import('expo-location');
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results.length > 0) {
        return {
          city: results[0].city ?? results[0].subregion ?? undefined,
          country: results[0].country ?? undefined,
        };
      }
    }
  } catch (e) {
    console.log('[Places] Reverse geocode failed:', e);
  }
  return {};
}

const BASE_PROMPT = `You are a restaurant and venue discovery assistant. Return restaurants that DIRECTLY match the search query, where the dish or cuisine is the PRIMARY specialty. Prioritize real, well-known places. For broad cuisine searches, include as many quality results as you know — cover famous spots, local favorites, chains, hawker stalls, and hidden gems. Always provide a googleMapsUrl. Sort by matchScore descending.

BRAND RECOGNITION: If the query could be a restaurant BRAND NAME — even if misspelled, missing spaces, or concatenated into one word (e.g. "donomakase" → "Don Omakase", "starbuck" → "Starbucks", "kfcmy" → "KFC Malaysia") — FIRST identify the real brand, THEN return that brand's ACTUAL real outlets/branches that you know of, prioritizing the user's country/region. These brand matches must have matchScore 95-100 and list every distinct branch you are confident exists (different branches in the same or different cities are all valid results). NEVER invent branches that you are not confident exist.`;

function buildSearchPrompt(query: string, locationContext: string, batchHint: string, isSpecific: boolean): string {
  const quantityLine = isSpecific
    ? 'QUANTITY: Return ONLY places that GENUINELY match this exact name. If fewer than 5 real places exist worldwide, return ONLY those — do NOT fabricate similar-sounding places. Quality over quantity.'
    : 'QUANTITY: You MUST return at least 30 diverse, real restaurants per batch — aim for 40 if possible. Cover the full range: legendary destinations, neighborhood joints, hawker stalls, food courts, night markets, chains, and hidden gems. Do NOT return the same place more than once. Every result must be a distinct, real restaurant. More is better — fill the list completely. Return the maximum number of real, distinct places you can.';

  return `${BASE_PROMPT}

A user is searching for: "${query}"${locationContext}

${batchHint}

${quantityLine}

IMPORTANT: ONLY return places people visit to eat or drink — restaurants, cafes, hawker stalls, food courts, street food, bakeries, bars.
NEVER return hotels, hostels, resorts, parks, museums, malls, supermarkets, shops, attractions, or landmarks, even if the name matches the search.

LOCATION RULE: Every result MUST be located in ONE country. Follow the location context above: use the user's country unless the query explicitly names a different city/country. Do NOT mix countries in one response.

First provide:
- countryScope: the ONE country ALL your results are located in (empty string if you could not determine one)

For each place provide:
- name: exact official restaurant name
- address: area/neighborhood/district (e.g. "Imbi", "Bukit Bintang", "Damansara Heights", "Petaling Jaya") — NOT a street address. Use the well-known local area name.
- city, country
- latitude/longitude: approximate OK
- rating: 1-5 (0 if unknown)
- priceLevel: 1-4 budget to fine dining (0 if unknown)
- placeType: array like ["restaurant", "indian", "curry"]
- cuisineEmoji: single emoji
- googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=NAME+CITY+COUNTRY"
- description: 2-3 sentences
- matchScore: 0-100 relevance to query`;
}

function mapPlaces(places: any[], baseIndex: number): PlaceResult[] {
  return places.map((place: any, i: number) => ({
    place: {
      id: `ai-place-${Date.now()}-${baseIndex + i}`,
      name: place.name,
      address: place.address,
      city: place.city,
      country: place.country,
      latitude: place.latitude,
      longitude: place.longitude,
      rating: place.rating,
      priceLevel: place.priceLevel,
      placeType: place.placeType,
      cuisineEmoji: place.cuisineEmoji || '🍽️',
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.city + ' ' + place.country)}`,
    },
    description: place.description,
    matchScore: place.matchScore,
  }));
}

const NOMINATIM_FOOD_CATEGORIES: Record<string, Set<string>> = {
  amenity: new Set(['restaurant', 'fast_food', 'cafe', 'pub', 'bar', 'food_court', 'bistro', 'ice_cream', 'canteen']),
  shop: new Set(['bakery', 'deli', 'coffee', 'tea', 'confectionery']),
};

const NOMINATIM_EMOJI: Record<string, string> = {
  restaurant: '🍽️', fast_food: '🍔', cafe: '☕', pub: '🍺', bar: '🍸',
  food_court: '🍜', bistro: '🥂', bakery: '🥐', deli: '🥓', ice_cream: '🍦',
};

interface NominatimHit {
  osm_id?: number;
  category?: string;
  type?: string;
  name?: string;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
}

/** Real place lookup via OpenStreetMap (Nominatim). Catches actual mapped
 * branches of a brand even when the AI doesn't know it — these are REAL
 * places, so they are merged ahead of AI-generated results. */
async function searchNominatim(query: string, userLocation?: UserLocation | null): Promise<PlaceResult[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=25&addressdetails=1&extratags=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'JustMealUp/1.0 (places search)' },
    });
    if (!res.ok) {
      console.log('[Places Nominatim] HTTP', res.status);
      return [];
    }
    const data = (await res.json()) as NominatimHit[];
    const userCountry = userLocation?.country?.toLowerCase() ?? null;
    const normQuery = normalizeName(query);

    const results: PlaceResult[] = [];
    for (const hit of data) {
      const isFood = NOMINATIM_FOOD_CATEGORIES[hit.category ?? '']?.has(hit.type ?? '');
      if (!isFood || !hit.name || !hit.lat || !hit.lon) continue;
      // Only keep hits whose name actually relates to the search —
      // Nominatim can return unrelated amenities for odd tokens.
      if (!nameMatchesBrand(hit.name, query)) continue;

      const addr = hit.address ?? {};
      const area = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || addr.village || '';
      const city = addr.city || addr.town || addr.village || addr.county || '';
      const country = addr.country || '';
      const name = hit.name;
      const normName = normalizeName(name);

      // Exact name match floats to the top; same-country results next.
      let matchScore = normName.includes(normQuery) || normQuery.includes(normName) ? 92 : 70;
      if (userCountry && country.toLowerCase().includes(userCountry)) matchScore = Math.min(100, matchScore + 6);

      results.push({
        place: {
          id: `osm-place-${hit.osm_id ?? results.length}`,
          name,
          address: area || city,
          city,
          country,
          latitude: parseFloat(hit.lat),
          longitude: parseFloat(hit.lon),
          rating: 0,
          priceLevel: 0,
          placeType: [hit.type ?? 'restaurant'],
          cuisineEmoji: NOMINATIM_EMOJI[hit.type ?? ''] || '🍽️',
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + city + ' ' + country)}`,
        },
        description: area
          ? `${name} in ${area}, ${city}. Real location from OpenStreetMap.`
          : `${name} in ${city}. Real location from OpenStreetMap.`,
        matchScore,
      });
    }

    console.log('[Places Nominatim] Real results:', results.length);
    return results;
  } catch (e) {
    console.log('[Places Nominatim] Failed:', e);
    return [];
  }
}

const STOP_WORDS = new Set([
  'restaurant', 'restoran', 'the', 'a', 'an', 'and', 'of', 'in', 'at', 'on',
  'by', 'cafe', 'bar', 'grill', 'kitchen', 'house', 'place', 'bistro', 'eatery',
  'original', 'classic', 'famous', 'best', 'top', 'new', 'old',
]);

/** Normalize common city abbreviations so 'KL' matches 'Kuala Lumpur' etc. */
const CITY_ALIASES: Record<string, string> = {
  kl: 'kuala lumpur',
  pj: 'petaling jaya',
  jb: 'johor bahru',
  sg: 'singapore',
  hk: 'hong kong',
  nyc: 'new york',
  la: 'los angeles',
  sf: 'san francisco',
  dc: 'washington',
  bkk: 'bangkok',
  klcc: 'kuala lumpur',
  mtl: 'montreal',
  chi: 'chicago',
};

function normalizeCity(city: string): string {
  const trimmed = city.toLowerCase().trim();
  return CITY_ALIASES[trimmed] ?? trimmed;
}

function significantWords(name: string): string[] {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/** True if a and b share at least one significant word (length >= 4 chars). */
function hasAnySignificantWordOverlap(a: string, b: string): boolean {
  const wordsA = significantWords(a);
  const wordsB = significantWords(b);
  if (wordsA.length === 0 || wordsB.length === 0) return false;
  const setB = new Set(wordsB);
  return wordsA.some((w) => w.length >= 4 && setB.has(w));
}

/** Two places are likely the same if 2+ significant words overlap. */
function hasHighWordOverlap(a: string, b: string): boolean {
  const wordsA = significantWords(a);
  const wordsB = significantWords(b);
  if (wordsA.length === 0 || wordsB.length === 0) return false;
  const setB = new Set(wordsB);
  const overlap = wordsA.filter((w) => setB.has(w)).length;
  const minLen = Math.min(wordsA.length, wordsB.length);
  return overlap >= Math.min(2, minLen);
}

/** Classify a search query: a specific brand name (even misspelled or
 * concatenated) vs a dish/cuisine vs anything else. Brand queries get a
 * precision search with hard name-matching instead of the broad cuisine
 * search that produces irrelevant results. */
async function classifyQuery(query: string): Promise<{ isBrand: boolean; officialName: string }> {
  try {
    const res = await generateObject({
      messages: [
        {
          role: "user",
          content: `You classify restaurant/food search queries for a place-search app.

Query: "${query}"

Decide:
- queryKind:
  - "brand": the user is searching for a specific NAMED restaurant / chain / venue (a proper name), even if misspelled, missing spaces, or concatenated into one word (e.g. "donomakase" → Don Omakase, "starbuck" → Starbucks). Franchise chains count. NOT dishes or cuisine styles like "omakase", "sushi", "nasi lemak".
  - "dish": a dish, food type, cuisine, or dining style (e.g. "sushi", "omakase", "ramen", "nasi lemak", "seafood near me").
  - "other": anything else (e.g. "romantic dinner", "best cafes", "breakfast").
- officialName: if brand, the corrected official brand name with proper spacing and spelling (e.g. "Don Omakase"). Empty string for dish/other.`,
        },
      ],
      schema: QueryClassificationSchema,
    });
    const isBrand = res.queryKind === 'brand';
    const officialName = (res.officialName || '').trim();
    console.log('[Places AI Search] Classified:', res.queryKind, 'officialName:', officialName);
    return { isBrand, officialName: officialName || query };
  } catch (e) {
    console.log('[Places AI Search] Classification failed:', e);
    return { isBrand: false, officialName: query };
  }
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

/** True when one normalized name fully contains the other. */
function oneContainsOther(a: string, b: string): boolean {
  const normA = normalizeName(a);
  const normB = normalizeName(b);
  return normA.length > 3 && normB.length > 3 && (normA.includes(normB) || normB.includes(normA));
}

/** Levenshtein edit distance (small strings only). */
function editDistance(a: string, b: string): number {
  if (a.length > 40 || b.length > 40) return Math.abs(a.length - b.length) + 100;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

function editDistanceRatio(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 0;
  return editDistance(a, b) / max;
}

/** True when a place name plausibly matches the brand the user searched for:
 * containment, ALL significant brand tokens present, or a close typo match.
 * Used to hard-filter brand searches so unrelated restaurants can't leak in. */
function nameMatchesBrand(name: string, brand: string): boolean {
  const a = normalizeName(name);
  const b = normalizeName(brand);
  if (a.length < 3 || b.length < 3) return false;
  if (a.includes(b) || b.includes(a)) return true;
  // Every significant brand token must appear in the name (e.g. brand
  // "Don Omakase" matches "Don Omakase Damansara" but NOT "Don the Burger").
  const tokens = brand.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
  if (tokens.length > 0 && tokens.every((t) => a.includes(t))) return true;
  // Typo tolerance: "Donomakase Restorant" vs "Don Omakase"
  return editDistanceRatio(a, b) < 0.4;
}

/** Rough km distance using equirectangular approx. */
function approxDistanceKm(a: PlaceResult, b: PlaceResult): number {
  const latDiff = Math.abs(a.place.latitude - b.place.latitude);
  const lngDiff = Math.abs(a.place.longitude - b.place.longitude);
  const avgLat = (a.place.latitude + b.place.latitude) / 2 * Math.PI / 180;
  const kmPerDeg = 111.32;
  const dx = lngDiff * kmPerDeg * Math.cos(avgLat);
  const dy = latDiff * kmPerDeg;
  return Math.sqrt(dx * dx + dy * dy);
}

function isSameLocation(a: PlaceResult, b: PlaceResult): boolean {
  // Both at (0,0) means the AI didn't provide real coords — skip location check.
  if (a.place.latitude === 0 && a.place.longitude === 0 && b.place.latitude === 0 && b.place.longitude === 0) {
    return false;
  }
  // If either is at (0,0), can't compare distances meaningfully
  if (a.place.latitude === 0 && a.place.longitude === 0) return false;
  if (b.place.latitude === 0 && b.place.longitude === 0) return false;
  return approxDistanceKm(a, b) < 0.8; // ~800m — aggressive to catch AI coordinate variation
}

function isSimilarName(a: PlaceResult, b: PlaceResult, strict = false): boolean {
  // Strict mode: ignore city — used for quoted/specific searches where
  // the same restaurant name in different cities is still a duplicate.
  if (!strict) {
    if (normalizeCity(a.place.city) !== normalizeCity(b.place.city)) return false;
  }
  // 2+ word overlap — strong signal
  if (hasHighWordOverlap(a.place.name, b.place.name)) return true;
  // One name fully contains the other when stripped
  if (oneContainsOther(a.place.name, b.place.name)) return true;
  // 1 significant word (≥4 chars) overlap + close coordinates
  if (hasAnySignificantWordOverlap(a.place.name, b.place.name) && approxDistanceKm(a, b) < 2.0) return true;
  // One name fully contains the other when stripped — but only when the
  // coordinates are close. Identical names far apart in the same city can be
  // REAL different branches of a chain (e.g. Don Omakase across KL), so
  // distance-gate this rule. Entries with unknown coords (0,0) fall back to
  // the old behavior (always dedupe).
  if (oneContainsOther(a.place.name, b.place.name)) {
    if (a.place.latitude === 0 && a.place.longitude === 0) return true;
    if (b.place.latitude === 0 && b.place.longitude === 0) return true;
    return approxDistanceKm(a, b) < 2.0;
  }
  return false;
}

/** Words that carry no relevance signal in a food search query. */
const QUERY_STOP_WORDS = new Set([
  'near', 'me', 'nearby', 'around', 'close', 'my', 'area', 'the', 'a', 'an',
  'for', 'with', 'and', 'or', 'to', 'of', 'in', 'at', 'best', 'good', 'top',
  'recommended', 'places', 'place', 'food', 'eat', 'eating',
]);

/** Lowercase query words that matter for relevance (>=3 chars, no stopwords). */
function queryTokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !QUERY_STOP_WORDS.has(t));
}

/** Like normalizeName but keeps word boundaries. */
function looseText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Substring check with plural/singular tolerance: "curries" ~ "curry". */
function textHasToken(text: string, token: string): boolean {
  if (text.includes(token)) return true;
  if (token.length > 3 && token.endsWith('s') && text.includes(token.slice(0, -1))) return true;
  if (text.includes(token + 's')) return true;
  return false;
}

/** Combined searchable text for a place: name + types + description. */
function placeSearchText(place: PlaceResult): string {
  return looseText(`${place.place.name} ${place.place.placeType.join(' ')} ${place.description ?? ''}`);
}

/** Categories that are clearly NOT somewhere people go to eat or drink. */
const NON_FOOD_TYPES = new Set([
  'hotel', 'hostel', 'motel', 'guesthouse', 'apartment', 'resort', 'lodge',
  'park', 'garden', 'museum', 'gallery', 'attraction', 'monument', 'memorial',
  'landmark', 'viewpoint', 'zoo', 'mall', 'supermarket', 'grocery',
  'convenience', 'departmentstore', 'market', 'store', 'shop',
  'atm', 'bank', 'pharmacy', 'hospital', 'clinic', 'doctor', 'dentist',
  'school', 'university', 'college', 'kindergarten', 'library',
  'gym', 'fitness', 'spa', 'salon', 'hairdresser', 'beauty',
  'airport', 'aerodrome', 'station', 'busstation', 'subway', 'ferryterminal',
  'placeofworship', 'church', 'mosque', 'temple', 'synagogue',
  'cinema', 'theatre', 'theater', 'stadium', 'nightclub', 'casino',
  'parking', 'fuel', 'carwash', 'laundry', 'postoffice', 'police', 'townhall',
  'office', 'residential', 'house', 'building',
]);

/** Words that signal a place serves food or drink. */
const FOOD_SIGNAL_WORDS = [
  'restaurant', 'cafe', 'caf', 'coffee', 'food', 'eat', 'dining', 'kitchen',
  'grill', 'cuisine', 'bakery', 'bistro', 'bar', 'pub', 'diner', 'noodle',
  'ramen', 'sushi', 'sashimi', 'pizza', 'burger', 'chicken', 'curry', 'bbq',
  'steamboat', 'hotpot', 'hawker', 'foodcourt', 'deli', 'steakhouse',
  'seafood', 'dessert', 'tea', 'wine', 'beer', 'cocktail', 'izakaya',
  'yakiniku', 'donburi', 'udon', 'soba', 'dimsum', 'boba', 'juice', 'nasi',
  'mee', 'warung', 'mamak', 'brunch', 'lunch', 'dinner', 'menu', 'dishes', 'drinks',
];

/** True when a place is somewhere people go to eat or drink: its category
 * must not be a non-food type, and its name, types, or description must
 * carry a food/drink signal. Filters out hotels, parks, shops, etc. */
function isFoodPlace(result: PlaceResult): boolean {
  const types = result.place.placeType
    .map((t) => normalizeName(String(t)))
    .filter(Boolean);
  if (types.some((t) => NON_FOOD_TYPES.has(t))) return false;
  const text = normalizeName(
    `${result.place.name} ${types.join(' ')} ${result.description ?? ''}`
  );
  return FOOD_SIGNAL_WORDS.some((w) => text.includes(w));
}

/** Alternate names that all refer to the same country. */
const COUNTRY_ALIASES: string[][] = [
  ['usa', 'unitedstates', 'unitedstatesofamerica', 'america'],
  ['uk', 'unitedkingdom', 'greatbritain', 'britain', 'england'],
  ['uae', 'unitedarabemirates'],
  ['southkorea', 'korea', 'republicofkorea'],
  ['netherlands', 'holland'],
];

function normalizeCountry(c: string): string {
  return c.toLowerCase().replace(/[^a-z]/g, '');
}

/** Loose country-name comparison: equality, containment, or alias groups
 * ("USA" ~ "United States", "UK" ~ "England"). */
function countriesMatch(a: string, b: string): boolean {
  const na = normalizeCountry(a);
  const nb = normalizeCountry(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length > 3 && nb.length > 3 && (na.includes(nb) || nb.includes(na))) return true;
  return COUNTRY_ALIASES.some((group) => group.includes(na) && group.includes(nb));
}

/** True when EVERY meaningful query token appears in the place's name,
 * types, or description — drops results that are unrelated to the search. */
function isRelevantToQuery(place: PlaceResult, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const text = placeSearchText(place);
  return tokens.every((t) => textHasToken(text, t));
}

/** True when at least half the query tokens appear — backfill when the
 * strict filter would leave a dish/other search nearly empty. */
function isPartiallyRelevantToQuery(place: PlaceResult, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const text = placeSearchText(place);
  const matched = tokens.filter((t) => textHasToken(text, t)).length;
  return matched >= Math.max(1, Math.ceil(tokens.length / 2));
}

function deduplicatePlaces(results: PlaceResult[], strict = false): PlaceResult[] {
  const deduped: PlaceResult[] = [];

  for (const r of results) {
    const isDup = deduped.some(
      (existing) =>
        isSameLocation(existing, r) || isSimilarName(existing, r, strict),
    );
    if (isDup) continue;
    deduped.push(r);
  }

  return deduped;
}

async function searchPlacesAI(query: string, limit: number = 12, userLocation?: UserLocation | null): Promise<PlacesSearchResult> {
  const nearMe = isNearMeQuery(query);
  const useNearMe = nearMe && !!userLocation;
  const useCountryBias = !nearMe && !!userLocation?.country;
  console.log("[Places AI Search] Query:", query, "nearMe:", useNearMe, "countryBias:", useCountryBias, userLocation?.country);

  let locationContext = '';
  if (useNearMe && userLocation) {
    locationContext = `\n\nThe user said "near me" and is at lat ${userLocation.latitude}, lon ${userLocation.longitude}${userLocation.city ? `, in ${userLocation.city}` : ''}${userLocation.country ? `, ${userLocation.country}` : ''}. Return restaurants close to these coordinates.`;
  } else if (useCountryBias && userLocation) {
    locationContext = `\n\nUser is in ${userLocation.country}${userLocation.city ? ` (near ${userLocation.city})` : ''}. If the query does NOT mention a different country/city, ONLY return places in ${userLocation.country}. If it explicitly mentions another location, use that instead. Search across the ENTIRE country, not just the user's city.`;
  } else {
    locationContext = '\n\nSearch globally. If the query mentions a location, use it. Otherwise return the most famous/relevant places worldwide.';
  }

  // Quote-based search mode: if the user wraps the query in quotes ("like this"),
  // treat it as a specific restaurant name.
  const isQuoted = /^["\u201c\u201d].*["\u201c\u201d]$/.test(query.trim());
  // Strip quotes before passing to the AI
  const cleanQuery = isQuoted ? query.trim().replace(/^["\u201c\u201d]|["\u201c\u201d]$/g, '') : query;
  console.log("[Places AI Search] isQuoted:", isQuoted, "cleanQuery:", cleanQuery);

  // Detect whether the query is a brand name (e.g. "donomakase" → Don
  // Omakase). Brand queries run a precision branch search + hard name
  // filtering; dish/other queries keep the broad multi-batch search.
  const { isBrand, officialName } = isQuoted
    ? { isBrand: true, officialName: cleanQuery }
    : await classifyQuery(cleanQuery);

  const batches: string[] = isBrand
    ? [
        'BRAND SEARCH: The user is looking for the restaurant brand "' + officialName + '". Return ONLY real branches/outlets of this exact brand that you are confident actually exist — each result must be one distinct branch. Prioritize the user\'s country/region, but include notable branches in other cities too. Do NOT return other restaurants, competitors, or similar-sounding places. Use official branch names (often the brand name plus area/mall). matchScore 95-100 for every result.',
        'BRAND SEARCH (more branches): Return UP TO 15 ADDITIONAL real branches of "' + officialName + '" in other cities, regions, or countries not covered by typical results. ONLY branches you are confident exist. Do NOT return other restaurants or similar names.',
      ]
    : [
        'BATCH 1/5: Focus on the MOST FAMOUS and iconic places for this query — the legendary, award-winning, and widely-renowned establishments worldwide.',
        'BATCH 2/5: Focus on HIDDEN GEMS, local favorites, hawker stalls, food courts, neighborhood spots, and lesser-known but excellent places.',
        'BATCH 3/5: Focus on well-known chain restaurants, popular casual spots, and notable mid-range places not covered in batches 1-2.',
        'BATCH 4/5: Focus on street food, night markets, regional specialties, and authentic local spots across different cities/countries.',
        'BATCH 5/5: Focus on fine dining, Michelin-starred, celebrity chef restaurants, and any remaining notable places worldwide for this query.',
      ];

    const isSpecific = isBrand;
  const [batchResults, realPlaces] = await Promise.all([
    Promise.all(
      batches.map((batchHint, batchIndex) =>
        generateObject({
          messages: [
            {
              role: "user",
              content: buildSearchPrompt(cleanQuery, locationContext, batchHint, isSpecific),
            },
          ],
          schema: PlacesResponseSchema,
        }).catch((err) => {
          console.error(`[Places AI Search] Batch ${batchIndex + 1} failed:`, err);
          return { places: [], countryScope: '' };
        })
      )
    ),
    searchNominatim(officialName, userLocation),
  ]);

  let index = 0;
  const aiResults: PlaceResult[] = [];
  for (const r of batchResults) {
    console.log(`[Places AI Search] Batch returned`, r.places.length, "places");
    aiResults.push(...mapPlaces(r.places, index));
    index += r.places.length;
  }

  // Real OSM places first so they win dedup against AI approximations.
  const allResults: PlaceResult[] = [...realPlaces, ...aiResults];

  const deduped = deduplicatePlaces(allResults);
  // Sort by matchScore descending
  deduped.sort((a, b) => b.matchScore - a.matchScore);
  // Drop anything that isn't somewhere people eat or drink (hotels, parks,
  // shops, landmarks...) before any other filtering.
  const foodOnly = deduped.filter(isFoodPlace);
  // Country scope: trust the AI's declared scope, falling back to the
  // user's detected country. Places outside the scope are dropped unless
  // they don't declare a country at all. If filtering would empty the
  // list, keep the unscoped results (scope was likely wrong).
  const scope =
    batchResults.map((r) => r.countryScope.trim()).find(Boolean) ?? '';
  let scoped = foodOnly;
  if (scope) {
    const inScope = foodOnly.filter(
      (r) => !r.place.country || countriesMatch(r.place.country, scope)
    );
    if (inScope.length >= Math.min(3, foodOnly.length)) {
      scoped = inScope;
    } else {
      console.log('[Places AI Search] Scope filter would empty results, keeping unscoped list. Scope:', scope);
    }
  }
  console.log('[Places AI Search] Country scope:', scope || '(none)', 'in-scope:', scoped.length);
  // Brand searches: HARD name filter — drop anything that doesn't plausibly
  // relate to the brand name, so unrelated restaurants can't leak in.
  // Brand results must also have real coordinates — (0,0) entries are
  // usually hallucinated branches.
  // Dish/other searches: relevance filter — every meaningful query token
  // must appear in the place's name, types, or description.
  const relevanceTokens = isBrand ? [] : queryTokens(cleanQuery);
  const relevant = isBrand
    ? scoped.filter(
        (r) =>
          (nameMatchesBrand(r.place.name, officialName) ||
            nameMatchesBrand(r.place.name, cleanQuery)) &&
          !(r.place.latitude === 0 && r.place.longitude === 0)
      )
    : scoped.filter((r) => isRelevantToQuery(r, relevanceTokens));

  // If the relevance filter was too aggressive for a dish/other search,
  // backfill with results matching at least half the query tokens so the
  // list isn't empty — strict matches stay at the top.
  const pool = !isBrand && relevant.length < 3
    ? [
        ...relevant,
        ...scoped.filter(
          (r) => !relevant.includes(r) && isPartiallyRelevantToQuery(r, relevanceTokens)
        ).slice(0, 8),
      ]
    : relevant;
  const final = pool.slice(0, 25);

  console.log("[Places AI Search] Scope:", scope || "(none)", "food-only:", foodOnly.length, "in-scope:", scoped.length, "after relevance:", relevant.length, "final:", final.length);
  console.log("[Places AI Search] Top results:", final.slice(0, 8).map((f) => f.place.name).join(" | "));

  return {
    results: final,
    totalResults: final.length,
  };
}

async function reverseGeocodeWeb(latitude: number, longitude: number): Promise<{ city?: string; country?: string }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
    );
    if (response.ok) {
      const data = await response.json();
      const address = data?.address;
      if (address) {
        return {
          city: address.city || address.town || address.village || address.suburb || address.state,
          country: address.country,
        };
      }
    }
  } catch (e) {
    console.log('[Places] Web reverse geocode failed:', e);
  }
  return {};
}

function isNearMeQuery(query: string): boolean {
  const q = query.toLowerCase();
  return q.includes('near me') || q.includes('nearby') || q.includes('around me') || q.includes('close to me') || q.includes('my area');
}

export function usePlacesSearch() {
  const [data, setData] = useState<PlacesSearchResult | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationReady, setLocationReady] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  // Auto-detect location lazily only when the Places tab is active.
  // Aggressive permission requests on mount crash the cloud simulator
  // with an opaque {} error because expo-location tries to talk to
  // hardware that doesn't exist.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function getLocation() {
      try {
        console.log('[Places] Starting location detection, platform:', Platform.OS);

        if (Platform.OS === 'web') {
          if ('geolocation' in navigator) {
            console.log('[Places] Requesting web geolocation...');
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                if (cancelled) return;
                console.log('[Places] Web raw coords:', position.coords.latitude, position.coords.longitude);
                const loc: UserLocation = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                };
                const geo = await reverseGeocodeWeb(loc.latitude, loc.longitude);
                loc.city = geo.city;
                loc.country = geo.country;
                if (!cancelled) {
                  setUserLocation(loc);
                  setLocationReady(true);
                  console.log('[Places] Web location detected:', loc);
                }
              },
              (err) => {
                console.log('[Places] Web geolocation error:', err.message, 'code:', err.code);
                if (!cancelled) {
                  setLocationError(err.message);
                  setLocationReady(true);
                }
              },
              { timeout: 15000, enableHighAccuracy: false, maximumAge: 300000 }
            );
          } else {
            console.log('[Places] Web geolocation not available');
            setLocationError('Geolocation not supported');
            setLocationReady(true);
          }
        }
        // On native, skip auto-detection — only resolve via explicit
        // requestLocationPermission() to avoid {} crash in cloud simulators.
      } catch (error) {
        console.log('[Places] Location error:', error);
        if (!cancelled) {
          setLocationError('Failed to get location. Please check your location settings.');
          setLocationReady(true);
        }
      }
    }

    // Only run on web — native auto-detection is disabled to prevent
    // expo-location from crashing the cloud simulator bridge.
    if (Platform.OS === 'web') {
      timer = setTimeout(() => {
        void getLocation();
      }, 500);
    } else {
      // Mark location as "not detected" without attempting native calls.
      setLocationReady(true);
    }

    return () => {
      cancelled = true;
      if (timer !== null) clearTimeout(timer);
    };
  }, []);

  /** Detects the user's location on demand. Returns the location, or null
   * when unavailable/denied. Truthy for boolean-style callers. */
  const requestLocationPermission = useCallback(async (): Promise<UserLocation | null> => {
    try {
      if (Platform.OS === 'web') {
        return new Promise<UserLocation | null>((resolve) => {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const loc: UserLocation = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                };
                const geo = await reverseGeocodeWeb(loc.latitude, loc.longitude);
                loc.city = geo.city;
                loc.country = geo.country;
                setUserLocation(loc);
                setLocationReady(true);
                setLocationError(null);
                setLocationPermissionDenied(false);
                resolve(loc);
              },
              () => resolve(null),
              { timeout: 15000, enableHighAccuracy: false, maximumAge: 300000 }
            );
          } else {
            resolve(null);
          }
        });
      } else {
        const Location = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const loc: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          const geo = await reverseGeocode(loc.latitude, loc.longitude);
          loc.city = geo.city;
          loc.country = geo.country;
          setUserLocation(loc);
          setLocationReady(true);
          setLocationError(null);
          setLocationPermissionDenied(false);
          return loc;
        }
        setLocationPermissionDenied(true);
        return null;
      }
    } catch (error) {
      console.log('[Places] Manual location request error:', error);
      return null;
    }
  }, []);

  const mutation = useMutation({
    mutationFn: (v: { query: string; location: UserLocation | null }) =>
      searchPlacesAI(v.query, 75, v.location),
    onSuccess: (result) => {
      console.log("[Places Search] Success:", result.totalResults, "results");
      setData(result);
    },
    onError: (error) => {
      console.error("[Places Search] Error:", error);
    },
  });

  // Detect the user's location BEFORE searching so results are scoped to
  // where they actually are. On web this reuses the browser geolocation
  // prompt; on native it fires the explicit permission request (safe inside
  // try/catch). If detection fails, search globally like before.
  const search = useCallback(async (query: string) => {
    const q = query.trim();
    if (q.length === 0) return;
    let loc = userLocation;
    if (!loc) {
      console.log('[Places] No location yet — detecting before search');
      loc = await requestLocationPermission();
    }
    mutation.mutate({ query: q, location: loc });
  }, [userLocation, requestLocationPermission, mutation]);

  const clearResults = useCallback(() => {
    setData(null);
  }, []);

  const needsLocationForQuery = useCallback((query: string): boolean => {
    return isNearMeQuery(query) && !userLocation;
  }, [userLocation]);

  return {
    data,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    search,
    locationReady,
    locationDetected: userLocation !== null,
    locationCity: userLocation?.city ?? null,
    locationError,
    locationPermissionDenied,
    needsLocationForQuery,
    requestLocationPermission,
    clearResults,
    refetch: () => {
      if (mutation.variables) {
        mutation.mutate(mutation.variables);
      }
    },
  };
}
