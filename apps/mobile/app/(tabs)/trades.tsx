import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import { useTrades } from '@/hooks/useApi';

const FILTERS = ['All', 'BUY', 'SELL', 'Win', 'Loss'];

const demoTrades = [
  { id: 't1', symbol: 'SOL/USDC', side: 'BUY', pnl: 312.4, pnlPct: 4.2, amount: 10, time: '2m ago', trader: '@sol_sniper' },
  { id: 't2', symbol: 'ETH/USDC', side: 'SELL', pnl: -84.1, pnlPct: -1.1, amount: 0.5, time: '18m ago', trader: '@defi_dev' },
  { id: 't3', symbol: 'JUP/USDC', side: 'BUY', pnl: 201.8, pnlPct: 7.6, amount: 4800, time: '1h ago', trader: '@sol_sniper' },
  { id: 't4', symbol: 'BONK/SOL', side: 'SELL', pnl: 44.2, pnlPct: 0.9, amount: 14200000, time: '3h ago', trader: '@degen_alpha' },
  { id: 't5', symbol: 'WIF/USDC', side: 'BUY', pnl: -122.0, pnlPct: -2.8, amount: 200, time: '5h ago', trader: '@meme_lord' },
  { id: 't6', symbol: 'RAY/USDC', side: 'BUY', pnl: 88.6, pnlPct: 3.1, amount: 320, time: '8h ago', trader: '@arb_master' },
];

export default function TradesScreen() {
  const { data: trades, isLoading, refetch } = useTrades();
  const [activeFilter, setActiveFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  const list = Array.isArray(trades) && trades.length > 0
    ? trades as typeof demoTrades
    : demoTrades;

  const filtered = list.filter((t) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'BUY') return t.side === 'BUY';
    if (activeFilter === 'SELL') return t.side === 'SELL';
    if (activeFilter === 'Win') return (t.pnl ?? 0) >= 0;
    if (activeFilter === 'Loss') return (t.pnl ?? 0) < 0;
    return true;
  });

  const wins = list.filter((t) => (t.pnl ?? 0) >= 0).length;
  const totalPnl = list.reduce((sum, t) => sum + (t.pnl ?? 0), 0);

  return (
    <View style={styles.bg}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Trade History</Text>
          </View>

          {/* Summary Row */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>TOTAL P&L</Text>
              <Text style={[styles.summaryValue, { color: totalPnl >= 0 ? Colors.bullish : Colors.bearish }]}>
                {totalPnl >= 0 ? '+' : ''}${Math.abs(totalPnl).toFixed(2)}
              </Text>
            </View>
            <View style={[styles.summaryCell, styles.summaryCellBorder]}>
              <Text style={styles.summaryLabel}>WIN RATE</Text>
              <Text style={styles.summaryValue}>{((wins / list.length) * 100).toFixed(0)}%</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>TRADES</Text>
              <Text style={styles.summaryValue}>{list.length}</Text>
            </View>
          </View>

          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setActiveFilter(f)}
                style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Trade List */}
          {isLoading ? (
            <LoadingSpinner size="small" />
          ) : filtered.length === 0 ? (
            <EmptyState title="No trades" icon="◎" />
          ) : (
            <View style={styles.listWrap}>
              {filtered.map((trade, i) => {
                const pnl = trade.pnl ?? 0;
                const pnlPct = trade.pnlPct ?? 0;
                const isPos = pnl >= 0;
                return (
                  <View key={trade.id ?? i}>
                    {i > 0 && <View style={styles.separator} />}
                    <View style={styles.tradeRow}>
                      <View style={[styles.sidePill, { backgroundColor: trade.side === 'BUY' ? Colors.bullishDim : Colors.bearishDim }]}>
                        <Text style={[styles.sideText, { color: trade.side === 'BUY' ? Colors.bullish : Colors.bearish }]}>
                          {trade.side}
                        </Text>
                      </View>
                      <View style={styles.tradeInfo}>
                        <Text style={styles.symbol}>{trade.symbol}</Text>
                        <Text style={styles.trader}>{trade.trader ?? '—'} · {trade.time}</Text>
                      </View>
                      <View style={styles.pnlWrap}>
                        <Text style={[styles.pnl, { color: isPos ? Colors.bullish : Colors.bearish }]}>
                          {isPos ? '+' : ''}${Math.abs(pnl).toFixed(2)}
                        </Text>
                        <Text style={[styles.pnlPct, { color: isPos ? Colors.bullish : Colors.bearish }]}>
                          {isPos ? '+' : ''}{pnlPct.toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.background },
  safe: { flex: 1 },
  scroll: {},
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, marginBottom: Spacing.xl },
  title: { fontSize: Typography.xxl, fontWeight: Typography.heavy, color: Colors.textPrimary, letterSpacing: Typography.tight },
  summaryRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.separator,
    marginBottom: Spacing.xl,
  },
  summaryCell: { flex: 1, paddingVertical: Spacing.xl, alignItems: 'center' },
  summaryCellBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.separator },
  summaryLabel: { fontSize: Typography.micro, color: Colors.textMuted, letterSpacing: Typography.ultraWide, marginBottom: 4 },
  summaryValue: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  filterRow: { paddingHorizontal: Spacing.lg, gap: Spacing.xs, marginBottom: Spacing.xl },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.pill,
    borderWidth: 1, borderColor: Colors.separator,
  },
  filterChipActive: { backgroundColor: Colors.surfaceHigh, borderColor: Colors.separatorBright },
  filterText: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.medium },
  filterTextActive: { color: Colors.textPrimary },
  listWrap: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.separator },
  separator: { height: 1, backgroundColor: Colors.separator, marginLeft: Spacing.lg + 52 },
  tradeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 13, gap: Spacing.md,
  },
  sidePill: { width: 46, height: 22, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  sideText: { fontSize: Typography.micro, fontWeight: Typography.bold, letterSpacing: 0.4 },
  tradeInfo: { flex: 1 },
  symbol: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  trader: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  pnlWrap: { alignItems: 'flex-end' },
  pnl: { fontSize: Typography.sm, fontWeight: Typography.semibold, fontVariant: ['tabular-nums'] },
  pnlPct: { fontSize: Typography.xs, fontVariant: ['tabular-nums'], marginTop: 2 },
});
