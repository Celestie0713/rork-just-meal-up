import React, { useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler } from 'react-native';
import { useInvitations } from '@/hooks/use-invitations';
import { TipPopup } from '@/components/TipPopup';
import { mockUsers } from '@/mocks/users';
import { Colors } from '@/constants/colors';

export function TipBlocker() {
  const { pendingTipInvitationId, invitations, completeTip } = useInvitations();
  const currentUserId = '1';
  const currentUser = mockUsers.find(user => user.id === currentUserId);

  const invitation = invitations.find(inv => inv.id === pendingTipInvitationId);
  const hasPendingTip = invitation && 
    invitation.inviterId === currentUserId && 
    invitation.status === 'accepted' && 
    !invitation.tipAmount;

  useEffect(() => {
    if (!hasPendingTip) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('[TipBlocker] Back button blocked - pending tip required');
      return true;
    });

    return () => backHandler.remove();
  }, [hasPendingTip]);

  const handleTipComplete = (tipAmount: number) => {
    if (pendingTipInvitationId) {
      console.log('[TipBlocker] Tip completed:', tipAmount);
      completeTip(pendingTipInvitationId, tipAmount);
    }
  };

  if (!hasPendingTip || !pendingTipInvitationId) {
    return null;
  }

  return (
    <>
      <View style={styles.overlay}>
        <View style={styles.blockerContainer}>
          <Text style={styles.blockerText}>
            💡 Complete your tip to continue using the app
          </Text>
        </View>
      </View>
      <TipPopup
        visible={true}
        onClose={() => {}}
        onSendWithTip={handleTipComplete}
        userLocation={currentUser?.location}
        mandatory={true}
        minimumAmount={5}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  blockerContainer: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginHorizontal: 40,
  },
  blockerText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
});
