import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface TraderCardProps {
  trader: {
    id: string;
    displayName: string;
    walletAddress: string;
    portfolioValueUsd?: number;
    currentHoldingsCount?: number;
    openPositionsCount?: number;
    totalTrades?: number;
    winningTrades?: number;
    losingTrades?: number;
    winRate?: number;
    averageRoiPercent?: number;
    averageWinMultiple?: string;
    averageEntryMarketCapUsd?: number;
    averageExitMarketCapUsd?: number;
    averageHoldTimeSeconds?: number;
    followerCount?: number;
    assetsUnderCopyUsd?: number;
    riskScore?: number;
    lastActiveAt?: string;
  };
  onView: () => void;
  onTrack: () => void;
  onCopy: () => void;
}

export const TraderCard: React.FC<TraderCardProps> = ({ trader, onView, onTrack, onCopy }) => {
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const formatUsd = (val?: number) => {
    if (val === undefined || val === null || val === 0) return '$0.00';
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatHoldTime = (sec?: number) => {
    if (!sec || sec === 0) return '--';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const getRiskBadgeColor = (score?: number) => {
    const s = score ?? 1;
    if (s <= 3) return '#10B981';
    if (s <= 7) return '#F59E0B';
    return '#EF4444';
  };

  const totalTrades = trader.totalTrades ?? 0;
  const winRate = trader.winRate ?? 0;
  const avgRoi = trader.averageRoiPercent ?? 0;
  const avgWin = trader.averageWinMultiple ?? (totalTrades > 0 ? '1.0x' : '--');
  const entryMc = trader.averageEntryMarketCapUsd ? `$${(trader.averageEntryMarketCapUsd / 1000000).toFixed(1)}M` : '--';

  return (
    <View style={styles.card}>
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.traderIdentity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(trader.displayName || 'T').replace('@', '').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName} numberOfLines={1}>{trader.displayName}</Text>
              <View style={[styles.riskBadge, { backgroundColor: getRiskBadgeColor(trader.riskScore) }]}>
                <Text style={styles.riskText}>Risk {trader.riskScore ?? 1}/10</Text>
              </View>
            </View>
            <Text style={styles.walletAddress}>{formatAddress(trader.walletAddress)}</Text>
          </View>
        </View>

        <View style={styles.portfolioBox}>
          <Text style={styles.portfolioLabel}>Portfolio</Text>
          <Text style={styles.portfolioValue} numberOfLines={1}>{formatUsd(trader.portfolioValueUsd)}</Text>
        </View>
      </View>

      {/* Primary Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Win Rate</Text>
          <Text style={[styles.metricValue, { color: winRate >= 50 ? '#10B981' : totalTrades > 0 ? '#EF4444' : '#808095' }]}>
            {winRate.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Avg ROI</Text>
          <Text style={[styles.metricValue, { color: avgRoi >= 0 ? '#10B981' : '#EF4444' }]}>
            {avgRoi >= 0 ? '+' : ''}{avgRoi.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Avg Win</Text>
          <Text style={[styles.metricValue, { color: '#00F0FF' }]}>
            {avgWin}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Trades</Text>
          <Text style={styles.metricValue}>
            {totalTrades} ({trader.winningTrades ?? 0}W/{trader.losingTrades ?? 0}L)
          </Text>
        </View>
      </View>

      {/* Secondary Details Row */}
      <View style={styles.detailsRow}>
        <Text style={styles.detailText}>Avg Entry MC: {entryMc}</Text>
        <Text style={styles.detailDivider}>•</Text>
        <Text style={styles.detailText}>Avg Hold: {formatHoldTime(trader.averageHoldTimeSeconds)}</Text>
        <Text style={styles.detailDivider}>•</Text>
        <Text style={styles.detailText}>{trader.followerCount ?? 0} Followers</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.viewButton} onPress={onView}>
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.trackButton} onPress={onTrack}>
          <Ionicons name="bookmark-outline" size={14} color="#A0A0B0" style={{ marginRight: 4 }} />
          <Text style={styles.trackButtonText}>Track</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.copyButton} onPress={onCopy}>
          <Ionicons name="flash" size={14} color="#000" style={{ marginRight: 4 }} />
          <Text style={styles.copyButtonText}>Copy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#12121A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222232',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  traderIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#00F0FF22',
    borderWidth: 1,
    borderColor: '#00F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#00F0FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nameContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  displayName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    maxWidth: 130,
  },
  riskBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  walletAddress: {
    color: '#808095',
    fontSize: 11,
    marginTop: 1,
  },
  portfolioBox: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  portfolioLabel: {
    color: '#808095',
    fontSize: 10,
  },
  portfolioValue: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A26',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    color: '#808095',
    fontSize: 10,
    marginBottom: 2,
  },
  metricValue: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  detailText: {
    color: '#808095',
    fontSize: 11,
  },
  detailDivider: {
    color: '#404055',
    marginHorizontal: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#1E1E2E',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333348',
  },
  viewButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  trackButton: {
    flex: 1,
    backgroundColor: '#1E1E2E',
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333348',
  },
  trackButtonText: {
    color: '#A0A0B0',
    fontWeight: '600',
    fontSize: 12,
  },
  copyButton: {
    flex: 1.3,
    backgroundColor: '#00F0FF',
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 12,
  },
});
