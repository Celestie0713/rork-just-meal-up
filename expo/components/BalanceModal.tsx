import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { X, DollarSign, Users, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/hooks/use-auth';
import { mockGroups } from '@/mocks/groups';
import { mockMealUps } from '@/mocks/meal-ups';
import { Colors } from '@/constants/colors';
import type { Group } from '@/mocks/groups';
import type { MealUp } from '@/types/user';

const PLATFORM_RATE = 0.15;
const COHOST_RATE = 0.60;
const HOST_RATE = 0.25;

interface GroupBalance {
  group: Group;
  events: EventEarning[];
  totalHostEarnings: number;
  totalCohostEarnings: number;
}

interface EventEarning {
  mealUp: MealUp;
  totalRevenue: number;
  platformCut: number;
  hostCut: number;
  cohostCut: number;
  isUserCohost: boolean;
  isUserHost: boolean;
}

interface BalanceModalProps {
  onClose: () => void;
}

export function BalanceModal({ onClose }: BalanceModalProps) {
  const { user } = useAuth();
  const userId = user?.id;

  const { myGroups, memberGroups, totalEarnings } = useMemo(() => {
    if (!userId) return { myGroups: [] as GroupBalance[], memberGroups: [] as GroupBalance[], totalEarnings: 0 };

    const hostedGroupIds = mockGroups
      .filter(g => g.hostedBy.userId === userId)
      .map(g => g.id);

    const memberGroupIds = (user?.joinedGroupIds ?? []).filter(
      gid => !hostedGroupIds.includes(gid)
    );

    function computeGroupBalance(groupId: string, isHosted: boolean): GroupBalance | null {
      const group = mockGroups.find(g => g.id === groupId);
      if (!group) return null;

      const groupMealUps = mockMealUps.filter(
        m => m.group?.id === groupId
      );

      const events: EventEarning[] = groupMealUps.map(mealUp => {
        const attendeeCount = mealUp.currentAttendees.length;
        const totalRevenue = mealUp.ticketPrice * Math.max(attendeeCount, 1);
        const platformCut = Math.round(totalRevenue * PLATFORM_RATE * 100) / 100;
        const hostCut = Math.round(totalRevenue * HOST_RATE * 100) / 100;
        const cohostCut = Math.round(totalRevenue * COHOST_RATE * 100) / 100;
        const isUserCohost = mealUp.organizerId === userId;
        const isUserHost = group.hostedBy.userId === userId;

        return {
          mealUp,
          totalRevenue,
          platformCut,
          hostCut,
          cohostCut,
          isUserCohost,
          isUserHost,
        };
      });

      // Host earnings: only when user is the host, sum hostCut from all events
      const totalHostEarnings = isHosted
        ? Math.round(events.reduce((sum, e) => sum + e.hostCut, 0) * 100) / 100
        : 0;

      // Cohost earnings: only when user cohosted events in groups they're member of
      const totalCohostEarnings = Math.round(
        events.filter(e => e.isUserCohost).reduce((sum, e) => sum + e.cohostCut, 0) * 100
      ) / 100;

      return { group, events, totalHostEarnings, totalCohostEarnings };
    }

    const myGroups = hostedGroupIds
      .map(gid => computeGroupBalance(gid, true))
      .filter((b): b is GroupBalance => b !== null);

    const memberGroups = memberGroupIds
      .map(gid => computeGroupBalance(gid, false))
      .filter((b): b is GroupBalance => b !== null);

    const totalEarnings = Math.round(
      myGroups.reduce((sum, g) => sum + g.totalHostEarnings + g.totalCohostEarnings, 0) +
      memberGroups.reduce((sum, g) => sum + g.totalCohostEarnings, 0)
    * 100) / 100;

    return { myGroups, memberGroups, totalEarnings };
  }, [userId, user?.joinedGroupIds]);

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <DollarSign size={20} color={Colors.primary} />
            <Text style={styles.title}>Balance</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <X size={22} color="#000000" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bodyContent}
        >
          {/* Revenue Split Legend */}
          <View style={styles.legend}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
                <Text style={styles.legendText}>Cohost 60%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>Host 25%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#9CA3AF' }]} />
                <Text style={styles.legendText}>Platform 15%</Text>
              </View>
            </View>
          </View>

          {/* My Groups Section */}
          <Text style={styles.sectionLabel}>
            <Users size={16} color="#000000" /> My Groups
          </Text>
          <Text style={styles.sectionSubtitle}>
            Groups you created and host — you earn {Math.round(HOST_RATE * 100)}% of every event revenue
          </Text>

          {myGroups.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                You haven't created any groups yet.{'\n'}
                Create a group to start earning!
              </Text>
            </View>
          ) : (
            myGroups.map(gb => (
              <View key={gb.group.id} style={styles.groupCard}>
                <Text style={styles.groupName}>{gb.group.name}</Text>
                <Text style={styles.groupMeta}>
                  {gb.group.memberCount} members · {gb.events.length} events
                </Text>

                {gb.events.map(ev => (
                  <View key={ev.mealUp.id} style={styles.eventRow}>
                    <View style={styles.eventLeft}>
                      <Text style={styles.eventName}>{ev.mealUp.title}</Text>
                      <Text style={styles.eventAttendees}>
                        {ev.mealUp.currentAttendees.length} attendees · ${ev.mealUp.ticketPrice}/ticket
                      </Text>
                      {ev.isUserCohost && (
                        <Text style={styles.cohostBadge}>You cohosted this</Text>
                      )}
                    </View>
                    <View style={styles.eventRight}>
                      <Text style={styles.eventTotal}>${ev.totalRevenue.toFixed(2)}</Text>
                      <Text style={styles.eventSplit}>
                        Host: ${ev.hostCut.toFixed(2)} · Cohost: ${ev.cohostCut.toFixed(2)}
                      </Text>
                      <Text style={styles.eventSplit}>
                        Platform: ${ev.platformCut.toFixed(2)}
                      </Text>
                      {ev.isUserCohost && (
                        <Text style={styles.eventEarnings}>
                          +${ev.cohostCut.toFixed(2)} (cohost)
                        </Text>
                      )}
                      {!ev.isUserCohost && (
                        <Text style={styles.eventEarnings}>
                          +${ev.hostCut.toFixed(2)} (host)
                        </Text>
                      )}
                    </View>
                  </View>
                ))}

                <View style={styles.groupTotal}>
                  <Text style={styles.groupTotalLabel}>Your earnings from this group</Text>
                  <Text style={styles.groupTotalAmount}>
                    ${(gb.totalHostEarnings + gb.totalCohostEarnings).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          )}

          {/* Member Groups Section */}
          <Text style={styles.sectionLabel}>
            <Users size={16} color="#000000" /> Member
          </Text>
          <Text style={styles.sectionSubtitle}>
            Groups you're a member of — cohost events to earn {Math.round(COHOST_RATE * 100)}%
          </Text>

          {memberGroups.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                You're not a member of any groups yet,{'\n'}
                or the groups you're in don't have events.
              </Text>
            </View>
          ) : (
            memberGroups.map(gb => (
              <View key={gb.group.id} style={styles.groupCard}>
                <Text style={styles.groupName}>{gb.group.name}</Text>
                <Text style={styles.groupMeta}>
                  {gb.group.memberCount} members · Hosted by {gb.group.hostedBy.name}
                </Text>

                {gb.events
                  .filter(ev => ev.isUserCohost)
                  .map(ev => (
                    <View key={ev.mealUp.id} style={styles.eventRow}>
                      <View style={styles.eventLeft}>
                        <Text style={styles.eventName}>{ev.mealUp.title}</Text>
                        <Text style={styles.eventAttendees}>
                          {ev.mealUp.currentAttendees.length} attendees · ${ev.mealUp.ticketPrice}/ticket
                        </Text>
                        <Text style={styles.cohostBadge}>You cohosted this</Text>
                      </View>
                      <View style={styles.eventRight}>
                        <Text style={styles.eventTotal}>${ev.totalRevenue.toFixed(2)}</Text>
                        <Text style={styles.eventSplit}>
                          Cohost: ${ev.cohostCut.toFixed(2)} · Host: ${ev.hostCut.toFixed(2)}
                        </Text>
                        <Text style={styles.eventSplit}>
                          Platform: ${ev.platformCut.toFixed(2)}
                        </Text>
                        <Text style={styles.eventEarnings}>
                          +${ev.cohostCut.toFixed(2)} (cohost)
                        </Text>
                      </View>
                    </View>
                  ))}

                {gb.events.filter(ev => ev.isUserCohost).length === 0 && (
                  <View style={styles.empty}>
                    <Text style={styles.emptyText}>
                      No cohosted events yet.{'\n'}
                      Create a Meal Up under this group to earn!
                    </Text>
                  </View>
                )}

                {gb.totalCohostEarnings > 0 && (
                  <View style={styles.groupTotal}>
                    <Text style={styles.groupTotalLabel}>Your cohost earnings</Text>
                    <Text style={styles.groupTotalAmount}>
                      ${gb.totalCohostEarnings.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}

          {/* Total Summary */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <TrendingUp size={18} color="#FFFFFF" />
              <Text style={styles.summaryLabel}>Total Earned</Text>
            </View>
            <Text style={styles.summaryAmount}>${totalEarnings.toFixed(2)}</Text>
          </View>
          <Text style={styles.footerNote}>
            Platform fee ({Math.round(PLATFORM_RATE * 100)}%) is deducted from every transaction.
            Payouts are processed weekly.
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 300,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  legend: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 14,
    lineHeight: 17,
  },
  empty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  groupCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  groupMeta: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 12,
  },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  eventLeft: {
    flex: 1,
    marginRight: 12,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  eventAttendees: {
    fontSize: 12,
    color: '#888888',
  },
  cohostBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22C55E',
    marginTop: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  eventRight: {
    alignItems: 'flex-end',
  },
  eventTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  eventSplit: {
    fontSize: 11,
    color: '#888888',
    textAlign: 'right',
    lineHeight: 16,
  },
  eventEarnings: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22C55E',
    marginTop: 4,
  },
  groupTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
  },
  groupTotalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  groupTotalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#22C55E',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 10,
    backgroundColor: '#000000',
    borderRadius: 14,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#22C55E',
  },
  footerNote: {
    fontSize: 11,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
});
