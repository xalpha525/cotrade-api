import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTraderDetail, useTraderTrades, useTraderHoldings, useTraderFollowers } from '@/hooks/useApi';
import { TraderCharts } from '@/components/trader/TraderCharts';

export default function TraderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TRADES' | 'PERFORMANCE' | 'HOLDINGS' | 'FOLLOWERS' | 'CHARTS'>('OVERVIEW');

  const { data: trader, isLoading } = useTraderDetail(id as string);
  const { data: trades } = useTraderTrades(id as string);
  const { data: holdings } = useTraderHoldings(id as string);
  const { data: followers } = useTraderFollowers(id as string);

  if (isLoading || !trader) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00F0FF" />
        <Text style={styles.loadingText}>Loading Trader Details...</Text>
      </View>
    );
  }

  const formatMc = (val?: number) => (val && !isNaN(val) ? `$${(val / 1000000).toFixed(2)}M` : '$0.00M');
  const formatHoldTime = (sec?: number) => {
    if (!sec || isNaN(sec)) return '0h 0m';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: trader.displayName,
          headerStyle: { backgroundColor: '#0A0A10' },
          headerTintColor: '#FFF',
          headerBackTitle: 'Traders',
        }}
      />

      {/* Trader Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.headerTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(trader.displayName || 'T').replace('@', '').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.displayName} numberOfLines={1}>{trader.displayName}</Text>
            <Text style={styles.walletAddr} numberOfLines={1}>{formatAddress(trader.walletAddress)}</Text>
            {!!trader.bio && <Text style={styles.bioText} numberOfLines={2}>{trader.bio}</Text>}
          </View>
        </View>

        <View style={styles.headerStatsGrid}>
          <View style={styles.headerStatBox}>
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{trader.winRate ?? 0}%</Text>
          </View>
          <View style={styles.headerStatBox}>
            <Text style={styles.statLabel}>Avg Win</Text>
            <Text style={[styles.statValue, { color: '#00F0FF' }]}>{trader.averageWinMultiple ?? '0x'}</Text>
          </View>
          <View style={styles.headerStatBox}>
            <Text style={styles.statLabel}>Assets Copied</Text>
            <Text style={styles.statValue}>{formatUsd(trader.assetsUnderCopyUsd)}</Text>
          </View>
          <View style={styles.headerStatBox}>
            <Text style={styles.statLabel}>Followers</Text>
            <Text style={styles.statValue}>{trader.followerCount ?? 0}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.copyBtn}
          onPress={() => router.push(`/copy-config/${trader.id}`)}
        >
          <Ionicons name="flash" size={16} color="#000" style={{ marginRight: 6 }} />
          <Text style={styles.copyBtnText}>Copy This Trader</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontally Scrollable Tabs Row */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRowContainer}>
          {(['OVERVIEW', 'TRADES', 'PERFORMANCE', 'HOLDINGS', 'FOLLOWERS', 'CHARTS'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabItem, activeTab === t && styles.tabItemActive]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'OVERVIEW' && (
          <View style={styles.tabSection}>
            <Text style={styles.sectionHeader}>Overview Metrics</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Trades:</Text>
                <Text style={styles.infoValue}>{trader.totalTrades ?? 0} ({trader.winningTrades ?? 0}W / {trader.losingTrades ?? 0}L)</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Average Entry MC:</Text>
                <Text style={styles.infoValue}>{formatMc(trader.averageEntryMcUsd)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Average Exit MC:</Text>
                <Text style={styles.infoValue}>{formatMc(trader.averageExitMcUsd)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Average Hold Time:</Text>
                <Text style={styles.infoValue}>{formatHoldTime(trader.averageHoldTimeSec)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Max Drawdown:</Text>
                <Text style={[styles.infoValue, { color: '#10B981' }]}>-{trader.maxDrawdownPercent ?? 0}%</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'TRADES' && (
          <View style={styles.tabSection}>
            <Text style={styles.sectionHeader}>Trade Timeline ({trades.length})</Text>
            {trades.map((tr: any) => (
              <View key={tr.id} style={styles.tradeCard}>
                <View style={styles.tradeCardHeader}>
                  <View style={[styles.sideBadge, { backgroundColor: tr.side === 'BUY' ? '#10B98120' : '#EF444420' }]}>
                    <Text style={{ color: tr.side === 'BUY' ? '#10B981' : '#EF4444', fontWeight: 'bold', fontSize: 11 }}>
                      {tr.side}
                    </Text>
                  </View>
                  <Text style={styles.tokenSymbol}>{tr.tokenSymbol}</Text>
                  <Text style={[styles.pnlText, { color: tr.pnlUsd >= 0 ? '#10B981' : '#EF4444' }]}>
                    {tr.pnlUsd >= 0 ? '+' : ''}${tr.pnlUsd.toFixed(2)} ({tr.roiPercent}%)
                  </Text>
                </View>

                <View style={styles.tradeDetailsGrid}>
                  <Text style={styles.tradeDetailLabel}>Entry: ${tr.entryPriceUsd}</Text>
                  <Text style={styles.tradeDetailLabel}>Exit: ${tr.exitPriceUsd}</Text>
                  <Text style={styles.tradeDetailLabel}>Entry MC: ${(tr.entryMarketCapUsd / 1000000).toFixed(1)}M</Text>
                  <Text style={styles.tradeDetailLabel}>Exit MC: ${(tr.exitMarketCapUsd / 1000000).toFixed(1)}M</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'CHARTS' && (
          <TraderCharts traderId={trader.id} />
        )}

        {activeTab === 'HOLDINGS' && (
          <View style={styles.tabSection}>
            <Text style={styles.sectionHeader}>Current Holdings</Text>
            {holdings.map((h: any, idx: number) => (
              <View key={idx} style={styles.holdingRow}>
                <Text style={styles.holdingSymbol}>{h.tokenSymbol}</Text>
                <Text style={styles.holdingAmt}>{h.amount} tokens</Text>
                <Text style={styles.holdingVal}>{formatUsd(h.valueUsd)} ({h.allocationPercent}%)</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'FOLLOWERS' && (
          <View style={styles.tabSection}>
            <Text style={styles.sectionHeader}>Active Followers ({followers.length})</Text>
            {followers.map((f: any) => (
              <View key={f.id} style={styles.followerRow}>
                <Text style={styles.followerEmail}>{f.userEmail}</Text>
                <Text style={styles.followerUsd}>${f.allocatedUsd} Allocated</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A10',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0A10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#808095',
    marginTop: 12,
  },
  profileHeader: {
    backgroundColor: '#12121A',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222232',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00F0FF20',
    borderWidth: 1,
    borderColor: '#00F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#00F0FF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  displayName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  walletAddr: {
    color: '#808095',
    fontSize: 12,
    fontFamily: 'Courier',
    marginTop: 2,
  },
  bioText: {
    color: '#A0A0B0',
    fontSize: 12,
    marginTop: 4,
  },
  headerStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A26',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  headerStatBox: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#808095',
    fontSize: 10,
    marginBottom: 2,
  },
  statValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  copyBtn: {
    backgroundColor: '#00F0FF',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabsWrapper: {
    backgroundColor: '#12121A',
    borderBottomWidth: 1,
    borderBottomColor: '#222232',
  },
  tabsRowContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#00F0FF',
  },
  tabText: {
    color: '#808095',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#00F0FF',
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tabSection: {
    gap: 12,
  },
  sectionHeader: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: '#12121A',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#222232',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    color: '#808095',
    fontSize: 13,
  },
  infoValue: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tradeCard: {
    backgroundColor: '#12121A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222232',
  },
  tradeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sideBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tokenSymbol: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  pnlText: {
    marginLeft: 'auto',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tradeDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tradeDetailLabel: {
    color: '#808095',
    fontSize: 11,
  },
  holdingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#12121A',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222232',
  },
  holdingSymbol: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  holdingAmt: {
    color: '#808095',
    fontSize: 12,
  },
  holdingVal: {
    color: '#00F0FF',
    fontWeight: 'bold',
  },
  followerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#12121A',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222232',
  },
  followerEmail: {
    color: '#FFF',
    fontSize: 13,
  },
  followerUsd: {
    color: '#10B981',
    fontWeight: 'bold',
  },
});
