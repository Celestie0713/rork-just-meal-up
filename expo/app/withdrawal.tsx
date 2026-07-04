import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Wallet,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';

type WithdrawalStatus = 'completed' | 'pending' | 'failed';

interface WithdrawalRecord {
  id: string;
  amount: number;
  method: string;
  date: string;
  status: WithdrawalStatus;
  reference: string;
}

const MOCK_WITHDRAWALS: WithdrawalRecord[] = [
  {
    id: 'w1',
    amount: 240.0,
    method: 'Bank transfer ••4821',
    date: 'Jun 28, 2026',
    status: 'completed',
    reference: 'WD-2026-0628-A1',
  },
  {
    id: 'w2',
    amount: 175.5,
    method: 'PayPal · j.lee@mail.com',
    date: 'Jun 14, 2026',
    status: 'completed',
    reference: 'WD-2026-0614-B3',
  },
  {
    id: 'w3',
    amount: 320.0,
    method: 'Bank transfer ••4821',
    date: 'May 30, 2026',
    status: 'completed',
    reference: 'WD-2026-0530-A2',
  },
  {
    id: 'w4',
    amount: 88.25,
    method: 'PayPal · j.lee@mail.com',
    date: 'May 16, 2026',
    status: 'pending',
    reference: 'WD-2026-0516-C7',
  },
  {
    id: 'w5',
    amount: 60.0,
    method: 'Bank transfer ••4821',
    date: 'May 02, 2026',
    status: 'failed',
    reference: 'WD-2026-0502-A0',
  },
];

const PAYOUT_METHODS = [
  { id: 'bank', label: 'Bank transfer ••4821', subtitle: 'Chase Bank · Checking' },
  { id: 'paypal', label: 'PayPal · j.lee@mail.com', subtitle: 'Instant transfer' },
  { id: 'venmo', label: 'Venmo · @jordanlee', subtitle: '1–3 business days' },
];

const STATUS_CONFIG: Record<
  WithdrawalStatus,
  { label: string; color: string; Icon: typeof CheckCircle2 }
> = {
  completed: { label: 'Completed', color: '#22C55E', Icon: CheckCircle2 },
  pending: { label: 'Pending', color: '#F59E0B', Icon: Clock },
  failed: { label: 'Failed', color: '#EF4444', Icon: XCircle },
};

export default function WithdrawalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ total: string }>();
  const availableBalance = parseFloat((params.total as string) ?? '0');

  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('bank');
  const [withdrawals] = useState<WithdrawalRecord[]>(MOCK_WITHDRAWALS);

  const totalWithdrawn = withdrawals
    .filter((w) => w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

  const pendingTotal = withdrawals
    .filter((w) => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);

  function handleWithdrawAll() {
    setAmount(availableBalance.toFixed(2));
  }

  function handleRequestWithdraw() {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      Alert.alert('Invalid amount', 'Enter an amount greater than $0.');
      return;
    }
    if (value > availableBalance) {
      Alert.alert('Insufficient balance', 'You cannot withdraw more than your available balance.');
      return;
    }
    Alert.alert(
      'Withdrawal requested',
      `A $${value.toFixed(2)} payout to ${
        PAYOUT_METHODS.find((m) => m.id === selectedMethod)?.label
      } has been queued. Funds typically arrive in 1–3 business days.`,
      [{ text: 'OK', onPress: () => setAmount('') }],
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
          hitSlop={12}
        >
          <ArrowLeft size={22} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdrawal</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Available Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceCardTop}>
            <View style={styles.balanceIconWrap}>
              <Wallet size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.balanceLabel}>Available balance</Text>
              <Text style={styles.balanceAmount}>
                ${availableBalance.toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <TrendingUp size={13} color="#A7F3D0" />
              <Text style={styles.balanceStatLabel}>Withdrawn</Text>
              <Text style={styles.balanceStatValue}>${totalWithdrawn.toFixed(2)}</Text>
            </View>
            <View style={styles.balanceStatDivider} />
            <View style={styles.balanceStat}>
              <Clock size={13} color="#FDE68A" />
              <Text style={styles.balanceStatLabel}>Pending</Text>
              <Text style={styles.balanceStatValue}>${pendingTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* New Withdrawal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request a payout</Text>

          <Text style={styles.inputLabel}>Amount</Text>
          <View style={styles.amountInputWrap}>
            <Text style={styles.amountCurrency}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#C7C7CC"
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.withdrawAllBtn}
              onPress={handleWithdrawAll}
              activeOpacity={0.7}
            >
              <Text style={styles.withdrawAllBtnText}>Max</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.amountHint}>
            Up to ${availableBalance.toFixed(2)} available
          </Text>

          <Text style={[styles.inputLabel, { marginTop: 18 }]}>Payout method</Text>
          <View style={styles.methodList}>
            {PAYOUT_METHODS.map((m) => {
              const active = selectedMethod === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.methodRow, active && styles.methodRowActive]}
                  onPress={() => setSelectedMethod(m.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.methodLeft}>
                    <Banknote
                      size={18}
                      color={active ? Colors.primary : '#888888'}
                    />
                    <View>
                      <Text
                        style={[
                          styles.methodLabel,
                          active && styles.methodLabelActive,
                        ]}
                      >
                        {m.label}
                      </Text>
                      <Text style={styles.methodSubtitle}>{m.subtitle}</Text>
                    </View>
                  </View>
                  <View
                    style={[styles.radio, active && styles.radioActive]}
                  >
                    {active && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.addMethodRow}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Add payout method', 'Not available in this demo.')}
            >
              <Plus size={18} color={Colors.primary} />
              <Text style={styles.addMethodText}>Add new payout method</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.withdrawBtn,
              availableBalance <= 0 && styles.withdrawBtnDisabled,
            ]}
            onPress={handleRequestWithdraw}
            disabled={availableBalance <= 0}
            activeOpacity={0.8}
          >
            <Text style={styles.withdrawBtnText}>
              {availableBalance > 0 ? 'Request withdrawal' : 'Nothing to withdraw'}
            </Text>
            <ChevronRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Withdrawal History */}
        <View style={styles.section}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Withdrawal history</Text>
            <Text style={styles.historyCount}>{withdrawals.length} payouts</Text>
          </View>

          {withdrawals.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Banknote size={36} color="#D1D5DB" />
              <Text style={styles.emptyHistoryText}>No withdrawals yet</Text>
            </View>
          ) : (
            withdrawals.map((w) => {
              const cfg = STATUS_CONFIG[w.status];
              const Icon = cfg.Icon;
              return (
                <View key={w.id} style={styles.historyRow}>
                  <View style={styles.historyLeft}>
                    <View
                      style={[
                        styles.historyIconWrap,
                        { backgroundColor: `${cfg.color}1A` },
                      ]}
                    >
                      <Icon size={16} color={cfg.color} />
                    </View>
                    <View>
                      <Text style={styles.historyAmount}>
                        ${w.amount.toFixed(2)}
                      </Text>
                      <Text style={styles.historyMethod}>{w.method}</Text>
                      <Text style={styles.historyDate}>
                        {w.date} · {w.reference}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${cfg.color}1A` },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 22,
  },
  balanceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  balanceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34,197,94,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  balanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  balanceStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  balanceStatLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  balanceStatValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 'auto',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FAFAFA',
  },
  amountCurrency: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    padding: 0,
  },
  withdrawAllBtn: {
    backgroundColor: `${Colors.primary}1A`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  withdrawAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  amountHint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
  },
  methodList: {
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  methodRowActive: {
    backgroundColor: `${Colors.primary}0D`,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  methodLabelActive: {
    color: Colors.primary,
  },
  methodSubtitle: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  addMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    marginTop: 18,
  },
  withdrawBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  withdrawBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  historyCount: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '600',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#999999',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  historyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  historyMethod: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  historyDate: {
    fontSize: 11,
    color: '#999999',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
