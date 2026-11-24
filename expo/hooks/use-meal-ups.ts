import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BACKEND_URL } from '@/constants/backend';
import type { MealUp } from '@/types/user';

/**
 * Meal ups live on the backend (Cloudflare Worker + Durable Object SQLite),
 * so every device sees the same list — same pattern as use-groups.
 *
 * The wire format differs from the client `MealUp` interface:
 *   - date arrives as an ISO string → converted to Date
 *   - prices arrive as malePrice / femalePrice → ticketPrice
 *   - time arrives as timeLabel → time
 *   - venue carries lat/lng (geocoded at creation) for "near me" filtering
 */

type SerializedMealUp = {
  id: string;
  organizerId: string;
  organizerName: string;
  title: string;
  description: string;
  date: string;
  timeLabel: string;
  venue: {
    name: string;
    address?: string;
    country?: string;
    cuisine?: string;
    lat?: number;
    lng?: number;
  };
  maxAttendees: number;
  currentAttendees: string[];
  malePrice?: number;
  femalePrice?: number;
  imageUrl?: string;
  group?: { id: string; name: string; isPaid?: boolean; memberDiscount?: string };
  createdAt: string;
};

function deserializeMealUp(raw: SerializedMealUp): MealUp {
  const male = typeof raw.malePrice === 'number' ? raw.malePrice : null;
  const female = typeof raw.femalePrice === 'number' ? raw.femalePrice : null;
  const ticketPrice = male ?? female ?? 0;
  const imageUrl = raw.imageUrl ?? '';
  return {
    id: raw.id,
    organizerId: raw.organizerId,
    organizerName: raw.organizerName,
    title: raw.title,
    description: raw.description,
    date: new Date(raw.date),
    time: raw.timeLabel,
    venue: {
      name: raw.venue.name,
      address: raw.venue.address ?? '',
      country: raw.venue.country,
      cuisine: raw.venue.cuisine ?? '',
      lat: raw.venue.lat,
      lng: raw.venue.lng,
    },
    maxAttendees: raw.maxAttendees,
    currentAttendees: raw.currentAttendees ?? [],
    ticketPrice,
    imageUrl,
    images: imageUrl ? [imageUrl] : [],
    group: raw.group,
    priceDetails: {
      includesFood: true,
      paymentType: 'individual_pays',
    },
  };
}

async function fetchMealUps(): Promise<MealUp[]> {
  const res = await fetch(`${BACKEND_URL}/meal-ups`);
  if (!res.ok) throw new Error(`Failed to load meal ups (${res.status})`);
  const data = (await res.json()) as { mealUps: SerializedMealUp[] };
  return data.mealUps.map(deserializeMealUp);
}

async function fetchMealUp(mealUpId: string): Promise<MealUp> {
  const res = await fetch(`${BACKEND_URL}/meal-ups/${encodeURIComponent(mealUpId)}`);
  if (res.status === 404) throw new Error('MEAL_UP_NOT_FOUND');
  if (!res.ok) throw new Error(`Failed to load meal up (${res.status})`);
  const data = (await res.json()) as { mealUp: SerializedMealUp };
  return deserializeMealUp(data.mealUp);
}

export interface CreateMealUpInput {
  organizer: { id: string; name: string };
  title: string;
  description?: string;
  /** Epoch ms — parsed manually on the client (Hermes date parsing is unreliable). */
  date: number;
  timeLabel?: string;
  venue: {
    name: string;
    address?: string;
    country?: string;
    cuisine?: string;
    lat?: number;
    lng?: number;
  };
  maxAttendees?: number;
  malePrice?: number;
  femalePrice?: number;
  imageUrl?: string;
  group?: { id: string; name: string; isPaid?: boolean; memberDiscount?: string };
}

async function createMealUp(input: CreateMealUpInput): Promise<MealUp> {
  const res = await fetch(`${BACKEND_URL}/meal-ups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `Failed to create meal up (${res.status})`);
  }
  const data = (await res.json()) as { mealUp: SerializedMealUp };
  return deserializeMealUp(data.mealUp);
}

export async function joinMealUpOnBackend(mealUpId: string, userId: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/meal-ups/${encodeURIComponent(mealUpId)}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `Failed to join meal up (${res.status})`);
  }
}

export function useMealUps() {
  return useQuery({
    queryKey: ['meal-ups'],
    queryFn: fetchMealUps,
  });
}

export function useMealUp(mealUpId: string) {
  return useQuery({
    queryKey: ['meal-up', mealUpId],
    queryFn: () => fetchMealUp(mealUpId),
    retry: false,
  });
}

export function useCreateMealUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMealUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-ups'] });
    },
  });
}

export function useJoinMealUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mealUpId, userId }: { mealUpId: string; userId: string }) =>
      joinMealUpOnBackend(mealUpId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meal-ups'] });
      queryClient.invalidateQueries({ queryKey: ['meal-up', variables.mealUpId] });
    },
  });
}
