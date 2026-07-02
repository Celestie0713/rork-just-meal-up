import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { X, DollarSign, Users, TrendingUp, Crown, UserCheck } from 'lucide-react-native';
import { useAuth } from '@/hooks/use-auth';
import { mockGroups } from '@/mocks/groups';
import { mockMealUps } from '@/mocks/meal-ups';
import { Colors } from '@/constants/colors';
import type { Group } from '@/mocks/groups';
import type { MealUp } from '@/types/user';

const PLATFORM_RATE = 0.15;
const HOST_SELF_RUN_RATE = 0.85;
const HOST_COHOST_SHARE = 0.25;
const COHOST_RATE = 0.60;

interface EventDetail {
  mealUp: MealUp;
  totalRevenue: number;
  platformCut: number;
  hostCut: number;
  cohostCut: number;
  isSelfRun: boolean;
}

interface MyGroupBalance {
  group: Group;
  monthlySubsIncome: number;
  hostEventIncome: number;
  cohostShareIncome: number;
  events: EventDetail[];
}

interface MemberGroupBalance {
  group: Group;
  cohostIncome: number;
  events: EventDetail[];
}

interface BalanceModalProps {
  onClose: () => void;
}

type Tab = 'my-group' | 'member-in';

export function BalanceModal({ onClose }: BalanceModalProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const [activeTab, setActiveTab] = useState<Tab>('my-group');

  const { myGroups, memberGroups, totalEarnings } = useMemo(() => {
    if (!userId) {
      return {
        myGroups: [] as MyGroupBalance[],
        memberGroups: [] as MemberGroupBalance[],
        totalEarnings: 0,
      };
    }

    const hostedGroups = mockGroups.filter((g) => g.hostedBy.userId === userId);
    const hostedGroupIds = new Set(hostedGroups.map((g) => g.id));

    const joinedGroupIds = (user?.joinedGroupIds ?? []).filter(
      (gid) => !hostedGroupIds.has(gid),
    );
    const joinedGroups = mockGroups.filter((g) => joinedGroupIds.includes(g.id));

    function computeMyGroupBalance(group: Group): MyGroupBalance {
      const groupMealUps = mockMealUps.filter((m) => m.group?.id === group.id);

      const monthlySubsIncome =
        group.isPaid && group.monthlyFee ? group.memberCount * group.monthlyFee : 0;

      const events: EventDetail[] = groupMealUps.map((mealUp) => {
        const attendeeCount = mealUp.currentAttendees.length;
        const totalRevenue = mealUp.ticketPrice * Math.max(attendeeCount, 1);
        const isSelfRun = mealUp.organizerId === userId;

        if (isSelfRun) {
          const platformCut = round(totalRevenue * PLATFORM_RATE);
          const hostCut = round(totalRevenue * HOST_SELF_RUN_RATE);
          return { mealUp, totalRevenue, platformCut, hostCut, cohostCut: 0, isSelfRun };
        } else {
          const platformCut = round(totalRevenue * PLATFORM_RATE);
          const hostCut = round(totalRevenue * HOST_COHOST_SHARE);
          const cohostCut = round(totalRevenue * COHOST_RATE);
          return { mealUp, totalRevenue, platformCut, hostCut, cohostCut, isSelfRun };
        }
      });

      const hostEventIncome = round(
        events.filter((e) => e.isSelfRun).reduce((sum, e) => sum + e.hostCut, 0),
      );
      const cohostShareIncome = round(
        events.filter((e) => !e.isSelfRun).reduce((sum, e) => sum + e.hostCut, 0),
      );

      return { group, monthlySubsIncome, hostEventIncome, cohostShareIncome, events };
    }

    function computeMemberGroupBalance(group: Group): MemberGroupBalance {
      const groupMealUps = mockMealUps.filter(
        (m) => m.group?.id === group.id && m.organizerId === userId,
      );

      const events: EventDetail[] = groupMealUps.map((mealUp) => {
        const attendeeCount = mealUp.currentAttendees.length;
        const totalRevenue = mealUp.ticketPrice * Math.max(attendeeCount, 1);
        const platformCut = round(totalRevenue * PLATFORM_RATE);
        const hostCut = round(totalRevenue * HOST_COHOST_SHARE);
        const cohostCut = round(totalRevenue * COHOST_RATE);
        return { mealUp, totalRevenue, platformCut, hostCut, cohostCut, isSelfRun: false };
      });

      const cohostIncome = round(
        events.reduce((sum, e) => sum + e.cohostCut, 0),
      );

      return { group, cohostIncome, events };
    }

    const myGroups = hostedGroups.map(computeMyGroupBalance);
    const memberGroups = joinedGroups.map(computeMemberGroupBalance);

    const totalEarnings = round(
      myGroups.reduce(
        (sum, g) => sum + g.monthlySubsIncome + g.hostEventIncome + g.cohostShareIncome,
        0,
      ) + memberGroups.reduce((sum, g) => sum + g.cohostIncome, 0),
    );

    return { myGroups, memberGroups, totalEarnings };
  }, [userId, user?.joinedGroupIds]);

  const activeCount = activeTab === 'my-group' ? myGroups.length : memberGroups.length;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <DollarSign size={20} color={Colors.primary} />
            <Text style={styles.title}>Balance</Text>
          </View>
          <View style={styles.headerRight}>
            {totalEarnings > 0 && (
              <View style={styles.headerTotalBadge}>
                <Text style={styles.headerTotalLabel}>Total</Text>
                <Text style={styles.headerTotalAmount}>${totalEarnings.toFixed(2)}</Text>
              </View>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <X size={22} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Revenue Split Table */}
        <View style={styles.splitTable}>
          <Text style={styles.splitTableTitle}>Revenue Split</Text>

          {/* Table Header */}
          <View style={styles.splitTableHeader}>
            <Text style={[styles.splitHeaderCell, styles.splitFirstCell]}>Scenario</Text>
            <Text style={styles.splitHeaderCell}>Platform</Text>
            <Text style={styles.splitHeaderCell}>Host</Text>
            <Text style={styles.splitHeaderCell}>Cohost</Text>
          </View>

          {/* Row 1: Event hosted by group creator */}
          <View style={styles.splitRow}>
            <Text style={[styles.splitCell, styles.splitFirstCell, styles.splitLabelCell]}>
              Event by host (group founder)
            </Text>
            <Text style={styles.splitCell}>{Math.round(PLATFORM_RATE * 100)}%</Text>
            <Text style={styles.splitCell}>{Math.round(HOST_SELF_RUN_RATE * 100)}%</Text>
            <Text style={[styles.splitCell, styles.splitInactiveCell]}>—</Text>
          </View>

          {/* Row 2: Event hosted by member (cohost) */}
          <View style={styles.splitRow}>
            <Text style={[styles.splitCell, styles.splitFirstCell, styles.splitLabelCell]}>
              Event by cohost (group member)
            </Text>
            <Text style={styles.splitCell}>{Math.round(PLATFORM_RATE * 100)}%</Text>
            <Text style={styles.splitCell}>{Math.round(HOST_COHOST_SHARE * 100)}%</Text>
            <Text style={styles.splitCell}>{Math.round(COHOST_RATE * 100)}%</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my-group' && styles.tabActive]}
            onPress={() => setActiveTab('my-group')}
            activeOpacity={0.7}
          >
            <Crown
              size={16}
              color={activeTab === 'my-group' ? Colors.primary : '#999999'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'my-group' && styles.tabTextActive,
              ]}
            >
              My Group
            </Text>
            {myGroups.length > 0 && (
              <View style={[styles.tabBadge, activeTab === 'my-group' && styles.tabBadgeActive]}>
                <Text style={styles.tabBadgeText}>{myGroups.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'member-in' && styles.tabActive]}
            onPress={() => setActiveTab('member-in')}
            activeOpacity={0.7}
          >
            <UserCheck
              size={16}
              color={activeTab === 'member-in' ? Colors.primary : '#999999'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'member-in' && styles.tabTextActive,
              ]}
            >
              Member in
            </Text>
            {memberGroups.length > 0 && (
              <View style={[styles.tabBadge, activeTab === 'member-in' && styles.tabBadgeActive]}>
                <Text style={styles.tabBadgeText}>{memberGroups.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bodyContent}
        >
          {activeTab === 'my-group' ? (
            <>
              {myGroups.length === 0 ? (
                <View style={styles.empty}>
                  <Crown size={44} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>No groups yet</Text>
                  <Text style={styles.emptyText}>
                    Create a group to start earning from{'\n'}monthly subscriptions and events.
                  </Text>
                </View>
              ) : (
                myGroups.map((gb) => (
                  <View key={gb.group.id} style={styles.groupCard}>
                    {/* Group Header */}
                    <View style={styles.groupHeader}>
                      <View style={styles.groupHeaderLeft}>
                        <Text style={styles.groupName}>{gb.group.name}</Text>
                        <View style={styles.groupMetaRow}>
                          <Users size={13} color="#888888" />
                          <Text style={styles.groupMetaText}>
                            {gb.group.memberCount} members
                          </Text>
                        </View>
                      </View>
                      {gb.group.isPaid && gb.group.monthlyFee ? (
                        <View style={styles.priceBadge}>
                          <Text style={styles.priceBadgeText}>
                            ${gb.group.monthlyFee}/mo
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.freeBadge}>
                          <Text style={styles.freeBadgeText}>Free</Text>
                        </View>
                      )}
                    </View>

                    {/* Income Summary */}
                    <View style={styles.incomeSummary}>
                      <Text style={styles.incomeSectionLabel}>Income breakdown</Text>

                      {gb.group.isPaid && gb.group.monthlyFee ? (
                        <View style={styles.incomeRow}>
                          <View style={styles.incomeRowLeft}>
                            <View style={[styles.incomeDot, { backgroundColor: '#8B5CF6' }]} />
                            <Text style={styles.incomeLabel}>Monthly subs</Text>
                          </View>
                          <Text style={styles.incomeValue}>
                            ${gb.monthlySubsIncome.toFixed(2)}
                          </Text>
                        </View>
                      ) : null}

                      <View style={styles.incomeRow}>
                        <View style={styles.incomeRowLeft}>
                          <View style={[styles.incomeDot, { backgroundColor: '#3B82F6' }]} />
                          <Text style={styles.incomeLabel}>
                            Event ({Math.round(HOST_SELF_RUN_RATE * 100)}%)
                          </Text>
                        </View>
                        <Text style={styles.incomeValue}>
                          ${gb.hostEventIncome.toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.incomeRow}>
                        <View style={styles.incomeRowLeft}>
                          <View style={[styles.incomeDot, { backgroundColor: '#F59E0B' }]} />
                          <Text style={styles.incomeLabel}>
                            Cohost share ({Math.round(HOST_COHOST_SHARE * 100)}%)
                          </Text>
                        </View>
                        <Text style={styles.incomeValue}>
                          ${gb.cohostShareIncome.toFixed(2)}
                        </Text>
                      </View>

                      {(gb.monthlySubsIncome + gb.hostEventIncome + gb.cohostShareIncome) > 0 && (
                        <>
                          <View style={styles.incomeDivider} />
                          <View style={styles.incomeRow}>
                            <Text style={styles.incomeTotalLabel}>Group total</Text>
                            <Text style={styles.incomeTotalValue}>
                              $
                              {(
                                gb.monthlySubsIncome +
                                gb.hostEventIncome +
                                gb.cohostShareIncome
                              ).toFixed(2)}
                            </Text>
                          </View>
                        </>
                      )}

                      {gb.monthlySubsIncome + gb.hostEventIncome + gb.cohostShareIncome === 0 && (
                        <Text style={styles.noIncomeNote}>No income yet from this group</Text>
                      )}
                    </View>

                    {/* Event Details */}
                    {gb.events.length > 0 && (
                      <View style={styles.eventSection}>
                        {gb.events.map((ev) => (
                          <View key={ev.mealUp.id} style={styles.eventRow}>
                            <View style={styles.eventLeft}>
                              <Text style={styles.eventName}>{ev.mealUp.title}</Text>
                              <Text style={styles.eventMeta}>
                                {ev.mealUp.currentAttendees.length} attendees · $
                                {ev.mealUp.ticketPrice}/ticket
                              </Text>
                              {ev.isSelfRun ? (
                                <View style={styles.selfRunBadge}>
                                  <Text style={styles.selfRunBadgeText}>Your event</Text>
                                </View>
                              ) : (
                                <View style={styles.cohostEventBadge}>
                                  <Text style={styles.cohostEventBadgeText}>
                                    By {ev.mealUp.organizerName}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.eventRight}>
                              <Text style={styles.eventTotal}>
                                ${ev.totalRevenue.toFixed(2)}
                              </Text>
                              <Text style={styles.eventSplit}>
                                You: ${ev.hostCut.toFixed(2)}
                              </Text>
                              <Text style={styles.eventSplitMinor}>
                                Platform: ${ev.platformCut.toFixed(2)}
                              </Text>
                              {!ev.isSelfRun && (
                                <Text style={styles.eventSplitMinor}>
                                  Cohost: ${ev.cohostCut.toFixed(2)}
                                </Text>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))
              )}
            </>
          ) : (
            <>
              {memberGroups.length === 0 ? (
                <View style={styles.empty}>
                  <UserCheck size={44} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>No member groups</Text>
                  <Text style={styles.emptyText}>
                    Join a group and create events as a{'\n'}cohost to start earning {Math.round(COHOST_RATE * 100)}% of ticket revenue.
                  </Text>
                </View>
              ) : (
                memberGroups.map((gb) => (
                  <View key={gb.group.id} style={styles.groupCard}>
                    {/* Group Header */}
                    <View style={styles.groupHeader}>
                      <View style={styles.groupHeaderLeft}>
                        <Text style={styles.groupName}>{gb.group.name}</Text>
                        <View style={styles.groupMetaRow}>
                          <Users size={13} color="#888888" />
                          <Text style={styles.groupMetaText}>
                            {gb.group.memberCount} members
                          </Text>
                        </View>
                        <Text style={styles.hostedBy}>
                          Hosted by {gb.group.hostedBy.name}
                        </Text>
                      </View>
                    </View>

                    {/* Cohost Income */}
                    <View style={styles.incomeSummary}>
                      <Text style={styles.incomeSectionLabel}>
                        Cohost income ({Math.round(COHOST_RATE * 100)}%)
                      </Text>
                      <View style={styles.incomeRow}>
                        <View style={styles.incomeRowLeft}>
                          <View style={[styles.incomeDot, { backgroundColor: '#22C55E' }]} />
                          <Text style={styles.incomeLabel}>Your cut</Text>
                        </View>
                        <Text style={[styles.incomeValue, { color: '#22C55E' }]}>
                          ${gb.cohostIncome.toFixed(2)}
                        </Text>
                      </View>
                      {gb.cohostIncome === 0 && (
                        <Text style={styles.noIncomeNote}>
                          No cohosted events yet. Create a Meal Up under this group!
                        </Text>
                      )}
                    </View>

                    {/* Cohosted Event Details */}
                    {gb.events.length > 0 && (
                      <View style={styles.eventSection}>
                        <Text style={styles.eventSectionTitle}>Events you cohosted</Text>
                        {gb.events.map((ev) => (
                          <View key={ev.mealUp.id} style={styles.eventRow}>
                            <View style={styles.eventLeft}>
                              <Text style={styles.eventName}>{ev.mealUp.title}</Text>
                              <Text style={styles.eventMeta}>
                                {ev.mealUp.currentAttendees.length} attendees · $
                                {ev.mealUp.ticketPrice}/ticket
                              </Text>
                            </View>
                            <View style={styles.eventRight}>
                              <Text style={styles.eventTotal}>
                                ${ev.totalRevenue.toFixed(2)}
                              </Text>
                              <Text style={[styles.eventSplit, { color: '#22C55E' }]}>
                                You: ${ev.cohostCut.toFixed(2)}
                              </Text>
                              <Text style={styles.eventSplitMinor}>
                                Host: ${ev.hostCut.toFixed(2)} · Plat: $
                                {ev.platformCut.toFixed(2)}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))
              )}
            </>
          )}

          {/* Bottom padding */}
          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerNote}>
            Platform fee (15%) applies to all ticket sales. Payouts weekly.
          </Text>
        </View>
      </View>
    </View>
  );
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 300,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
  },
  headerTotalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#000000',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  headerTotalLabel: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '600',
  },
  headerTotalAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#22C55E',
  },
  closeBtn: {
    padding: 4,
  },
  splitTable: {
    backgroundColor: '#F8F8F8',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  splitTableTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  splitTableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 6,
  },
  splitHeaderCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: '#AAAAAA',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  splitRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
  },
  splitFirstCell: {
    flex: 1.3,
    textAlign: 'left',
  },
  splitCell: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
  },
  splitLabelCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555555',
  },
  splitInactiveCell: {
    color: '#CCCCCC',
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#F3F3F3',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
  },
  tabTextActive: {
    color: '#000000',
  },
  tabBadge: {
    backgroundColor: '#E5E5E5',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeActive: {
    backgroundColor: '#000000',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999999',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#999999',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },
  groupCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  groupHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  groupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupMetaText: {
    fontSize: 13,
    color: '#888888',
  },
  hostedBy: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 4,
  },
  priceBadge: {
    backgroundColor: '#000000',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  priceBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  freeBadge: {
    backgroundColor: '#E8E8E8',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  freeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
  },
  incomeSummary: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  incomeSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  incomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  incomeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  incomeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  incomeLabel: {
    fontSize: 13,
    color: '#555555',
    fontWeight: '500',
  },
  incomeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  incomeDivider: {
    height: 1,
    backgroundColor: '#DDDDDD',
    marginVertical: 8,
  },
  incomeTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  incomeTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  noIncomeNote: {
    fontSize: 12,
    color: '#BBBBBB',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  eventSection: {
    marginTop: 4,
  },
  eventSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  eventLeft: {
    flex: 1,
    marginRight: 12,
  },
  eventName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  eventMeta: {
    fontSize: 11,
    color: '#888888',
    marginBottom: 4,
  },
  selfRunBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  selfRunBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
  },
  cohostEventBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  cohostEventBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
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
    color: '#666666',
    textAlign: 'right',
    lineHeight: 16,
    fontWeight: '600',
  },
  eventSplitMinor: {
    fontSize: 10,
    color: '#AAAAAA',
    textAlign: 'right',
    lineHeight: 15,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
  },
  footerNote: {
    fontSize: 10,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 15,
  },
});
