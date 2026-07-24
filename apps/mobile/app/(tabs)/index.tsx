import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePortfolio, usePortfolioStats, useStrategies } from '@/hooks/useApi';
import { wsService } from '@/services/websocket.service';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';

export default function HomeScreen() {
  const router = useRouter();

  const { data: portfolio, isLoading, refetch } = usePortfolio();
  const { data: stats } = usePortfolioStats();
  const { data: strategies } = useStrategies();

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    await refetch();
    setIsManualRefreshing(false);
  };

  const formatUsd = (val?: number) => {
    if (val === undefined || val === null) return '$0.00';
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalValue = Number(portfolio?.totalValueUsd ?? portfolio?.totalBalanceUsd ?? 0);
  const todayPnl = Number(portfolio?.todayPnlUsd ?? 0);
  const todayPnlPercent = Number(portfolio?.todayPnlPercent ?? 0);
  const totalPnl = Number(portfolio?.totalPnlUsd ?? 0);
  const totalPnlPercent = Number(portfolio?.totalPnlPercent ?? 0);
  const availableBalance = Number(portfolio?.cashBalanceUsd ?? portfolio?.availableBalanceUsd ?? totalValue);
  const copyProfit = Number(portfolio?.copyProfitUsd ?? portfolio?.copyTradingProfitUsd ?? 0);

  const myPositions = React.useMemo(() => portfolio?.myPositions ?? [], [portfolio?.myPositions]);
  const copyPositions = React.useMemo(() => portfolio?.copyPositions ?? [], [portfolio?.copyPositions]);

  if (isLoading && !portfolio) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00F0FF" />
        <Text style={styles.loadingText}>Loading Portfolio...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.headerSubtitle}>MY PORTFOLIO</Text>
          <Text style={styles.headerTitle}>Overview</Text>
        </View>

        <TouchableOpacity
          style={styles.activityButton}
          onPress={() => router.push('/activity')}
        >
          <Ionicons name="notifications" size={18} color="#00F0FF" />
          <Text style={styles.activityButtonText}>Activity</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isManualRefreshing} onRefresh={handleManualRefresh} tintColor="#00F0FF" />
        }
      >
        {/* Total Portfolio Value Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TOTAL PORTFOLIO VALUE</Text>
          <AnimatedNumber value={totalValue} style={styles.totalValueText} />

          <View style={styles.pnlRow}>
            <View style={styles.pnlCol}>
              <Text style={styles.pnlLabel}>Today's PnL</Text>
              <Text style={[styles.pnlValue, { color: todayPnl >= 0 ? '#10B981' : '#EF4444' }]}>
                {todayPnl >= 0 ? '+' : ''}{formatUsd(todayPnl)} ({todayPnlPercent}%)
              </Text>
            </View>

            <View style={styles.pnlCol}>
              <Text style={styles.pnlLabel}>Total PnL</Text>
              <Text style={[styles.pnlValue, { color: totalPnl >= 0 ? '#10B981' : '#EF4444' }]}>
                {totalPnl >= 0 ? '+' : ''}{formatUsd(totalPnl)} ({totalPnlPercent}%)
              </Text>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Available Balance</Text>
              <AnimatedNumber value={availableBalance} style={styles.gridVal} />
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Copy Trading Profit</Text>
              <Text style={[styles.gridVal, { color: '#00F0FF' }]}>{formatUsd(copyProfit)}</Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Open Positions</Text>
              <Text style={styles.gridVal}>{myPositions.length + copyPositions.length}</Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Active Strategies</Text>
              <Text style={styles.gridVal}>{strategies?.length ?? 0}</Text>
            </View>
          </View>
        </View>

        {/* SECTION A: MY POSITIONS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>A. My Positions ({myPositions.length})</Text>
        </View>

        {myPositions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="pie-chart-outline" size={32} color="#404055" />
            <Text style={styles.emptyCardTitle}>No Personal Positions</Text>
            <Text style={styles.emptyCardSub}>Positions from your Privy wallet balances will appear here.</Text>
          </View>
        ) : (
          myPositions.map((pos: any) => (
            <View key={pos.id} style={styles.positionCard}>
              <View style={styles.posHeader}>
                <View style={styles.posTitleGroup}>
                  <Text style={styles.posSymbol}>{pos.tokenSymbol}</Text>
                  <View style={styles.chainBadge}>
                    <Text style={styles.chainBadgeText}>{pos.chainId === 'SOLANA_MAINNET' ? 'SOL' : 'EVM'}</Text>
                  </View>
                </View>

                <Text style={styles.posValue}>{formatUsd(pos.currentValueUsd)}</Text>
              </View>

              <View style={styles.posMetaRow}>
                <Text style={styles.posMetaText}>Qty: {pos.quantity}</Text>
                <Text style={styles.posMetaText}>Cost: {formatUsd(pos.costBasisUsd)}</Text>
                <Text style={[styles.posMetaText, { color: pos.pnlUsd >= 0 ? '#10B981' : '#EF4444', fontWeight: 'bold' }]}>
                  {pos.pnlUsd >= 0 ? '+' : ''}{formatUsd(pos.pnlUsd)} ({pos.roiPercent}%)
                </Text>
              </View>
            </View>
          ))
        )}

        {/* SECTION B: COPY POSITIONS */}
        <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>B. Copy Positions ({copyPositions.length})</Text>
        </View>

        {copyPositions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={32} color="#404055" />
            <Text style={styles.emptyCardTitle}>No Active Copy Positions</Text>
            <Text style={styles.emptyCardSub}>Discover top traders and activate copy strategies to auto-execute trades.</Text>
            <TouchableOpacity style={styles.discoverBtn} onPress={() => router.push('/(tabs)/traders')}>
              <Text style={styles.discoverBtnText}>Explore Traders</Text>
            </TouchableOpacity>
          </View>
        ) : (
          copyPositions.map((pos: any) => (
            <View key={pos.id} style={styles.copyCard}>
              <View style={styles.copyHeader}>
                <View style={styles.traderInfo}>
                  <Ionicons name="person-circle" size={24} color="#00F0FF" />
                  <View>
                    <Text style={styles.traderName}>{pos.traderName}</Text>
                    <Text style={styles.walletUsedText}>Wallet: {pos.walletName}</Text>
                  </View>
                </View>

                <View style={styles.copyPnlBox}>
                  <Text style={[styles.copyPnlVal, { color: pos.pnlUsd >= 0 ? '#10B981' : '#EF4444' }]}>
                    {pos.pnlUsd >= 0 ? '+' : ''}{formatUsd(pos.pnlUsd)}
                  </Text>
                  <Text style={[styles.copyRoiVal, { color: pos.pnlUsd >= 0 ? '#10B981' : '#EF4444' }]}>
                    +{pos.roiPercent}%
                  </Text>
                </View>
              </View>

              <View style={styles.copyDetailsGrid}>
                <View style={styles.copyDetailCol}>
                  <Text style={styles.copyLabel}>Token</Text>
                  <Text style={styles.copyVal}>{pos.tokenSymbol}</Text>
                </View>
                <View style={styles.copyDetailCol}>
                  <Text style={styles.copyLabel}>Entry</Text>
                  <Text style={styles.copyVal}>${pos.entryPriceUsd}</Text>
                </View>
                <View style={styles.copyDetailCol}>
                  <Text style={styles.copyLabel}>Current</Text>
                  <Text style={styles.copyVal}>${pos.currentPriceUsd}</Text>
                </View>
                <View style={styles.copyDetailCol}>
                  <Text style={styles.copyLabel}>Market Cap</Text>
                  <Text style={styles.copyVal}>${(pos.currentMarketCapUsd / 1000000).toFixed(0)}M</Text>
                </View>
                <View style={styles.copyDetailCol}>
                  <Text style={styles.copyLabel}>Duration</Text>
                  <Text style={styles.copyVal}>{pos.holdingDuration}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerSubtitle: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00F0FF15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00F0FF40',
    gap: 6,
  },
  activityButtonText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 90,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#12121A',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222232',
  },
  summaryLabel: {
    color: '#808095',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  totalValueText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  pnlRow: {
    flexDirection: 'row',
    gap: 20,
    marginVertical: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A26',
  },
  pnlCol: {
    flex: 1,
  },
  pnlLabel: {
    color: '#808095',
    fontSize: 11,
  },
  pnlValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  gridItem: {
    width: '50%',
  },
  gridLabel: {
    color: '#808095',
    fontSize: 11,
  },
  gridVal: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  positionCard: {
    width: '100%',
    backgroundColor: '#12121A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#222232',
  },
  posHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  posTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  posSymbol: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chainBadge: {
    backgroundColor: '#00F0FF20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chainBadgeText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  posValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  posMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  posMetaText: {
    color: '#808095',
    fontSize: 12,
  },
  copyCard: {
    width: '100%',
    backgroundColor: '#12121A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222232',
  },
  copyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A26',
  },
  traderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  traderName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  walletUsedText: {
    color: '#808095',
    fontSize: 11,
  },
  copyPnlBox: {
    alignItems: 'flex-end',
  },
  copyPnlVal: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  copyRoiVal: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  copyDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  copyDetailCol: {
    alignItems: 'center',
  },
  copyLabel: {
    color: '#808095',
    fontSize: 10,
    marginBottom: 2,
  },
  copyVal: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyCard: {
    width: '100%',
    backgroundColor: '#12121A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222232',
    marginBottom: 12,
  },
  emptyCardTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 8,
  },
  emptyCardSub: {
    color: '#808095',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  discoverBtn: {
    backgroundColor: '#00F0FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  discoverBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
