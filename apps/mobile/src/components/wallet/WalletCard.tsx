import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedNumber } from '../common/AnimatedNumber';

export interface WalletCardProps {
  wallet: {
    id: string;
    name?: string;
    address: string;
    chainId: string;
    balanceUsd?: number;
    nativeBalance?: string;
    portfolioValueUsd?: number;
    openPositionsCount?: number;
    activeStrategiesCount?: number;
    createdAt?: string;
    isPrimary?: boolean;
  };
  onRename: () => void;
  onFund: () => void;
  onWithdraw: () => void;
  onViewExplorer: () => void;
  onConfigureStrategies: () => void;
  onDelete: () => void;
}

const walletCardRenderCounts = new Map<string, number>();

const WalletCardComponent: React.FC<WalletCardProps> = ({
  wallet,
  onRename,
  onFund,
  onWithdraw,
  onViewExplorer,
  onConfigureStrategies,
  onDelete,
}) => {
  const currentRenderCount = (walletCardRenderCounts.get(wallet.id) ?? 0) + 1;
  walletCardRenderCounts.set(wallet.id, currentRenderCount);

  console.log('[DEBUG 3 WalletCard Render]', {
    walletId: wallet.id,
    balanceUsd: wallet.balanceUsd,
    renderCount: currentRenderCount,
  });
  const isSol = wallet.chainId === 'SOLANA_MAINNET';
  const chainBadge = isSol ? 'SOL' : 'EVM';
  const badgeBg = isSol ? '#9945FF22' : '#627EEA22';
  const badgeColor = isSol ? '#14F195' : '#627EEA';

  const copyAddress = () => {
    Clipboard.setString(wallet.address);
    Alert.alert('Address Copied', wallet.address);
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.walletTitleRow}>
          <Text style={styles.walletName}>{wallet.name || (isSol ? 'Solana Privy Wallet' : 'EVM Privy Wallet')}</Text>
          {wallet.isPrimary && (
            <View style={styles.primaryTag}>
              <Text style={styles.primaryText}>Primary</Text>
            </View>
          )}
        </View>

        <View style={[styles.chainTag, { backgroundColor: badgeBg }]}>
          <Text style={[styles.chainText, { color: badgeColor }]}>{chainBadge}</Text>
        </View>
      </View>

      {/* Address & UUID Row */}
      <View style={styles.addressRow}>
        <Text style={styles.addressText}>{formatAddress(wallet.address)}</Text>
        <TouchableOpacity style={styles.copyIconButton} onPress={copyAddress}>
          <Ionicons name="copy-outline" size={14} color="#00F0FF" />
        </TouchableOpacity>
        <Text style={styles.uuidText}>UUID: {wallet.id.slice(0, 8)}</Text>
      </View>

      {/* Balances & Metrics Grid */}
      <View style={styles.metricsBox}>
        <View style={styles.metricColumn}>
          <Text style={styles.metricLabel}>Balance</Text>
          <AnimatedNumber value={wallet.balanceUsd ?? 0} style={styles.metricValue} />
        </View>

        <View style={styles.divider} />

        <View style={styles.metricColumn}>
          <Text style={styles.metricLabel}>Open Positions</Text>
          <Text style={styles.metricValue}>{wallet.openPositionsCount ?? 0}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricColumn}>
          <Text style={styles.metricLabel}>Copy Strategies</Text>
          <Text style={[styles.metricValue, { color: '#00F0FF' }]}>{wallet.activeStrategiesCount ?? 0} Active</Text>
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionBtn} onPress={onFund}>
          <Ionicons name="arrow-down-circle" size={16} color="#10B981" />
          <Text style={styles.actionText}>Fund</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onWithdraw}>
          <Ionicons name="arrow-up-circle" size={16} color="#00F0FF" />
          <Text style={styles.actionText}>Withdraw</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onConfigureStrategies}>
          <Ionicons name="settings" size={16} color="#F59E0B" />
          <Text style={styles.actionText}>Strategies</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onViewExplorer}>
          <Ionicons name="open-outline" size={16} color="#808095" />
          <Text style={styles.actionText}>Explorer</Text>
        </TouchableOpacity>
      </View>

      {/* Secondary Tools Header (Rename / Delete) */}
      <View style={styles.secondaryRow}>
        <TouchableOpacity onPress={onRename} style={styles.toolBtn}>
          <Ionicons name="pencil" size={12} color="#808095" />
          <Text style={styles.toolText}>Rename</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onDelete} style={styles.toolBtn}>
          <Ionicons name="trash-outline" size={12} color="#EF4444" />
          <Text style={[styles.toolText, { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const WalletCard = memo(WalletCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.wallet.id === nextProps.wallet.id &&
    prevProps.wallet.name === nextProps.wallet.name &&
    prevProps.wallet.balanceUsd === nextProps.wallet.balanceUsd &&
    prevProps.wallet.openPositionsCount === nextProps.wallet.openPositionsCount &&
    prevProps.wallet.activeStrategiesCount === nextProps.wallet.activeStrategiesCount &&
    prevProps.wallet.isPrimary === nextProps.wallet.isPrimary
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#12121A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#222232',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  walletTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryTag: {
    backgroundColor: '#00F0FF20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  chainTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chainText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  addressText: {
    color: '#00F0FF',
    fontFamily: 'Courier',
    fontSize: 13,
  },
  copyIconButton: {
    marginLeft: 6,
    padding: 2,
  },
  uuidText: {
    color: '#606075',
    fontSize: 11,
    marginLeft: 'auto',
  },
  metricsBox: {
    flexDirection: 'row',
    backgroundColor: '#1A1A26',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  metricColumn: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: '#2A2A3C',
    height: '100%',
  },
  metricLabel: {
    color: '#808095',
    fontSize: 11,
    marginBottom: 4,
  },
  metricValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1E1E2E',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#2D2D40',
  },
  actionText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1A1A26',
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolText: {
    color: '#808095',
    fontSize: 11,
  },
});
