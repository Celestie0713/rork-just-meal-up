import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BACKEND_URL } from '@/constants/backend';
import type { Group } from '@/mocks/groups';

/**
 * Groups live on the backend (Cloudflare Worker + Durable Object SQLite),
 * so every device sees the same list.
 *
 * The wire format matches the `Group` interface in mocks/groups.ts, except
 * post timestamps arrive as ISO strings and are converted to Date here.
 */

async function fetchGroups(): Promise<Group[]> {
  const res = await fetch(`${BACKEND_URL}/groups`);
  if (!res.ok) throw new Error(`Failed to load groups (${res.status})`);
  const data = (await res.json()) as { groups: SerializedGroup[] };
  return data.groups.map(deserializeGroup);
}

async function fetchGroup(groupId: string): Promise<Group> {
  const res = await fetch(`${BACKEND_URL}/groups/${encodeURIComponent(groupId)}`);
  if (res.status === 404) throw new Error('GROUP_NOT_FOUND');
  if (!res.ok) throw new Error(`Failed to load group (${res.status})`);
  const data = (await res.json()) as { group: SerializedGroup };
  return deserializeGroup(data.group);
}

/** The API's JSON shape: timestamps are ISO strings, not Dates. */
type SerializedGroup = Omit<Group, 'posts'> & {
  posts: (Omit<Group['posts'][number], 'timestamp'> & { timestamp: string })[];
};

function deserializeGroup(group: SerializedGroup): Group {
  return {
    ...group,
    posts: (group.posts ?? []).map(post => ({
      ...post,
      timestamp: new Date(post.timestamp),
    })),
  };
}

export interface CreateGroupInput {
  name: string;
  description: string;
  location: string;
  imageUrl?: string;
  isPaid: boolean;
  monthlyFee?: number;
  memberDiscount?: string;
  user: { id: string; name: string; avatar?: string };
}

async function createGroup(input: CreateGroupInput): Promise<Group> {
  const res = await fetch(`${BACKEND_URL}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `Failed to create group (${res.status})`);
  }
  const data = (await res.json()) as { group: SerializedGroup };
  return deserializeGroup(data.group);
}

export async function joinGroupOnBackend(groupId: string, userId: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/groups/${encodeURIComponent(groupId)}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error(`Failed to join group (${res.status})`);
}

export async function leaveGroupOnBackend(groupId: string, userId: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/groups/${encodeURIComponent(groupId)}/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error(`Failed to leave group (${res.status})`);
}

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: () => fetchGroup(groupId),
    retry: false,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useGroupMembership() {
  const queryClient = useQueryClient();

  const join = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      joinGroupOnBackend(groupId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', variables.groupId] });
    },
  });

  const leave = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      leaveGroupOnBackend(groupId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', variables.groupId] });
    },
  });

  return { join, leave };
}
