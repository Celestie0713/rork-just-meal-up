import { useState, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { mockInvitations } from '@/mocks/invitations';
import type { MealInvitation } from '@/types/user';

export const [InvitationsProvider, useInvitations] = createContextHook(() => {
  const [invitations, setInvitations] = useState<MealInvitation[]>(mockInvitations);
  const [pendingTipInvitationId, setPendingTipInvitationId] = useState<string | null>(null);

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

  const setPendingTip = useCallback((invitationId: string | null) => {
    console.log('[useInvitations] Setting pending tip for invitation:', invitationId);
    setPendingTipInvitationId(invitationId);
  }, []);

  const completeTip = useCallback((invitationId: string, tipAmount: number) => {
    console.log('[useInvitations] Completing tip for invitation:', invitationId, 'Amount:', tipAmount);
    updateInvitation(invitationId, { tipAmount });
    setPendingTipInvitationId(null);
  }, [updateInvitation]);

  return {
    invitations,
    addInvitation,
    updateInvitation,
    removeInvitation,
    getInvitation,
    pendingTipInvitationId,
    setPendingTip,
    completeTip,
  };
});
