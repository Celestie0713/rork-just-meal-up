import { useState, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { mockInvitations } from '@/mocks/invitations';
import type { MealInvitation } from '@/types/user';

export const [InvitationsProvider, useInvitations] = createContextHook(() => {
  const [invitations, setInvitations] = useState<MealInvitation[]>(mockInvitations);

  const addInvitation = useCallback((invitation: MealInvitation) => {
    console.log('[useInvitations] Adding new invitation:', invitation);
    setInvitations(prev => [...prev, invitation]);
  }, []);

  const updateInvitation = useCallback((id: string, updates: Partial<MealInvitation>) => {
    console.log('[useInvitations] Updating invitation:', id, updates);
    setInvitations(prev =>
      prev.map(inv => (inv.id === id ? { ...inv, ...updates } : inv))
    );
  }, []);

  const removeInvitation = useCallback((id: string) => {
    console.log('[useInvitations] Removing invitation:', id);
    setInvitations(prev => prev.filter(inv => inv.id !== id));
  }, []);

  const getInvitation = useCallback((id: string) => {
    return invitations.find(inv => inv.id === id);
  }, [invitations]);

  return {
    invitations,
    addInvitation,
    updateInvitation,
    removeInvitation,
    getInvitation,
  };
});
