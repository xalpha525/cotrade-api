import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SectionHeader, RowGroup } from '@/components/ui/Card';
import { usePortfolio } from '@/hooks/useApi';

const FILTERS = ['All', '1D', '1W', '1M', 'YTD'];

export default function PortfolioScreen() {
  const { data: portfolio, isLoading, refetch } = usePortfolio();
  const [activeFilter, setActiveFilter] = useState('1W');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  const totalValue = (portfolio as any)?.totalValue ?? 24830.50;
  const pnl = (portfolio as any)?.totalPnl ?? 1842.30;
  const pnlPct = (portfolio as any)?.totalPnlPercentage ?? 8.01;
  const isPos = pnl >= 0;

  const holdings = [
    { symbol: 'SOL', name: 'Solana', amount: 82.4, value: 13248.80, pct: 8.2 },
    { symbol: 'ETH', name: 'Ethereum', amount: 2.14, value: 7240.10, pct: -1.3 },
    { symbol: 'JUP', name: 'Jupiter', amount: 4800, value: 2918.40, pct: 12.1 },
    { symbol: 'BONK', name: 'Bonk', amount: 14200000, value: 1423.20, pct: -4.7 },
  ];

  if (isLoading) return <View style={styles.bg}><LoadingSpinner /></View>;

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
            <Text style={styles.title}>Portfolio</Text>
          </View>

          {/* Hero Value */}
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>NET WORTH</Text>
            <Text style={styles.heroValue}>
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
            <View style={styles.heroMeta}>
              <Text style={[styles.heroPnl, { color: isPos ? Colors.bullish : Colors.bearish }]}>
                {isPos ? '+' : ''}${Math.abs(pnl).toFixed(2)}
              </Text>
              <View style={[styles.heroBadge, { backgroundColor: isPos ? Colors.bullishDim : Colors.bearishDim }]}>
                <Text style={[styles.heroBadgeText, { color: isPos ? Colors.bullish : Colors.bearish }]}>
                  {isPos ? '▲' : '▼'} {Math.abs(pnlPct).toFixed(2)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Chart placeholder — time filter + bar visualization */}
          <View style={styles.chartSection}>
            <View style={styles.miniChart}>
              {[40, 55, 48, 70, 62, 80, 75, 90, 85, 100, 95, 108].map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.bar,
                    { height: h * 0.7, backgroundColor: i === 11 ? Colors.accent : Colors.surfaceHigh },
                  ]}
                />
              ))}
            </View>
            <View style={styles.filterRow}>
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setActiveFilter(f)}
                  style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
                >
                  <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {[
              { label: 'INVESTED', value: '$22,988' },
              { label: 'REALIZED P&L', value: '+$1,842' },
              { label: 'WIN RATE', value: '71%' },
              { label: 'TOTAL TRADES', value: '47' },
            ].map((s) => (
              <View key={s.label} style={styles.gridCell}>
                <Text style={styles.gridLabel}>{s.label}</Text>
                <Text style={styles.gridValue}>{s.value}</Text>
              </View>
            ))}
          </View>

          {/* Holdings */}
          <View style={styles.section}>
            <SectionHeader title="HOLDINGS" />
            <RowGroup>
              {holdings.map((h) => (
                <View key={h.symbol} style={styles.holdingRow}>
                  <View style={styles.holdingIcon}>
                    <Text style={styles.holdingIconText}>{h.symbol.charAt(0)}</Text>
                  </View>
                  <View style={styles.holdingInfo}>
                    <Text style={styles.holdingSymbol}>{h.symbol}</Text>
                    <Text style={styles.holdingName}>{h.name}</Text>
                  </View>
                  <View style={styles.holdingRight}>
                    <Text style={styles.holdingValue}>${h.value.toLocaleString()}</Text>
                    <Text style={[styles.holdingPct, { color: h.pct >= 0 ? Colors.bullish : Colors.bearish }]}>
                      {h.pct >= 0 ? '+' : ''}{h.pct}%
                    </Text>
                  </View>
                </View>
              ))}
            </RowGroup>
          </View>

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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.heavy,
    color: Colors.textPrimary,
    letterSpacing: Typography.tight,
  },
  hero: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl, gap: 6 },
  heroLabel: { fontSize: Typography.xs, color: Colors.textMuted, letterSpacing: Typography.ultraWide, fontWeight: Typography.semibold },
  heroValue: { fontSize: Typography.xxxl, fontWeight: Typography.heavy, color: Colors.textPrimary, letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroPnl: { fontSize: Typography.md, fontWeight: Typography.semibold, fontVariant: ['tabular-nums'] },
  heroBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  heroBadgeText: { fontSize: Typography.xs, fontWeight: Typography.bold, fontVariant: ['tabular-nums'] },

  chartSection: { marginBottom: Spacing.xl },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    paddingHorizontal: Spacing.lg,
    gap: 4,
    marginBottom: Spacing.md,
  },
  bar: { flex: 1, borderRadius: 3, minHeight: 4 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  filterBtnActive: { backgroundColor: Colors.surfaceHigh },
  filterText: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.medium },
  filterTextActive: { color: Colors.textPrimary },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderColor: Colors.separator,
    marginBottom: Spacing.xl,
  },
  gridCell: {
    width: '50%',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.separator,
  },
  gridLabel: { fontSize: Typography.micro, color: Colors.textMuted, letterSpacing: Typography.ultraWide, marginBottom: 6 },
  gridValue: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },

  section: { marginBottom: Spacing.xxl },
  holdingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    gap: Spacing.md,
  },
  holdingIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdingIconText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textSecondary },
  holdingInfo: { flex: 1 },
  holdingSymbol: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  holdingName: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  holdingRight: { alignItems: 'flex-end' },
  holdingValue: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  holdingPct: { fontSize: Typography.xs, marginTop: 2, fontVariant: ['tabular-nums'] },
});
