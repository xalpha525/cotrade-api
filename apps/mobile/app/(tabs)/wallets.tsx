import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWallets, useCreatePrivyWallet, useRenameWallet, useRemoveWallet } from '@/hooks/useApi';
import { WalletCard } from '@/components/wallet/WalletCard';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';

export default function WalletsScreen() {
  const router = useRouter();
  const { data: wallets, isLoading, refetch, isRefetching } = useWallets();

  console.log('[DEBUG 2 WalletsScreen Render]', {
    timestamp: new Date().toISOString(),
    walletCount: wallets?.length ?? 0,
    wallets: wallets?.map((w: any) => ({ id: w.id, balanceUsd: w.balanceUsd })),
  });
  const createWalletMutation = useCreatePrivyWallet();
  const renameWalletMutation = useRenameWallet();
  const removeWalletMutation = useRemoveWallet();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChain, setSelectedChain] = useState<'SOLANA_MAINNET' | 'ROBINHOOD_MAINNET'>('SOLANA_MAINNET');
  const [walletCustomName, setWalletCustomName] = useState('');

  const [renamingWalletId, setRenamingWalletId] = useState<string | null>(null);
  const [newWalletName, setNewWalletName] = useState('');

  const handleCreateWallet = async () => {
    try {
      await createWalletMutation.mutateAsync({
        chainId: selectedChain,
        name: walletCustomName || undefined,
      });
      setIsCreateModalOpen(false);
      setWalletCustomName('');
      Alert.alert(
        'Privy Wallet Created',
        `Successfully generated a new ${selectedChain === 'SOLANA_MAINNET' ? 'Solana' : 'EVM'} embedded wallet!`
      );
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to create wallet');
    }
  };

  const handleRenameWallet = async (walletId: string) => {
    if (!newWalletName) return;
    try {
      await renameWalletMutation.mutateAsync({ walletId, name: newWalletName });
      setRenamingWalletId(null);
      setNewWalletName('');
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to rename wallet');
    }
  };

  const handleDeleteWallet = (walletId: string, walletName: string) => {
    Alert.alert(
      'Archive Wallet',
      `Are you sure you want to archive ${walletName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeWalletMutation.mutateAsync(walletId);
              refetch();
            } catch (err: any) {
              Alert.alert('Error', err.message ?? 'Failed to remove wallet');
            }
          },
        },
      ]
    );
  };

  const sortedWallets = React.useMemo(() => {
    return [...(wallets ?? [])].sort((a: any, b: any) => (b.balanceUsd ?? 0) - (a.balanceUsd ?? 0));
  }, [wallets]);

  const handleOpenExplorer = React.useCallback((chain: string, address: string) => {
    const url =
      chain === 'SOLANA_MAINNET'
        ? `https://solscan.io/account/${address}`
        : `https://etherscan.io/address/${address}`;
    Linking.openURL(url).catch(() => {});
  }, []);

  const totalWalletBalance = React.useMemo(() => {
    return (wallets ?? []).reduce((acc: number, w: any) => acc + (w.balanceUsd ?? 0), 0);
  }, [wallets]);

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    await refetch();
    setIsManualRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>PRIVY WALLET MANAGER</Text>
          <Text style={styles.headerTitle}>My Wallets</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setIsCreateModalOpen(!isCreateModalOpen)}
        >
          <Ionicons name="add-circle" size={18} color="#00F0FF" />
          <Text style={styles.addBtnText}>+ Add Wallet</Text>
        </TouchableOpacity>
      </View>

      {/* Inline Create Wallet Modal */}
      {isCreateModalOpen && (
        <View style={styles.createBox}>
          <Text style={styles.createBoxTitle}>Auto-Create Privy Embedded Wallet</Text>
          <Text style={styles.createBoxSub}>Choose chain and optional name for your new wallet:</Text>

          <View style={styles.chainSelector}>
            <TouchableOpacity
              style={[styles.chainOption, selectedChain === 'SOLANA_MAINNET' && styles.chainOptionActive]}
              onPress={() => setSelectedChain('SOLANA_MAINNET')}
            >
              <Text style={[styles.chainOptionText, selectedChain === 'SOLANA_MAINNET' && styles.chainOptionTextActive]}>Solana (SOL)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chainOption, selectedChain === 'ROBINHOOD_MAINNET' && styles.chainOptionActive]}
              onPress={() => setSelectedChain('ROBINHOOD_MAINNET')}
            >
              <Text style={[styles.chainOptionText, selectedChain === 'ROBINHOOD_MAINNET' && styles.chainOptionTextActive]}>Robinhood / EVM</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.nameInput}
            placeholder="Friendly Wallet Name (e.g. SOL Trading Wallet 1)"
            placeholderTextColor="#606075"
            value={walletCustomName}
            onChangeText={setWalletCustomName}
          />

          <View style={styles.createBtnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsCreateModalOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmCreateBtn}
              onPress={handleCreateWallet}
              disabled={createWalletMutation.isPending}
            >
              <Text style={styles.confirmCreateText}>
                {createWalletMutation.isPending ? 'Generating...' : 'Generate Wallet'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Wallet List */}
      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isManualRefreshing} onRefresh={handleManualRefresh} tintColor="#00F0FF" />
        }
      >
        {/* Total Wallet Balance Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL WALLET BALANCE</Text>
          <AnimatedNumber value={totalWalletBalance} style={styles.totalValue} />
          <Text style={styles.totalCount}>{(wallets ?? []).length} Privy Wallets Active</Text>
        </View>

        {isLoading && !wallets ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#00F0FF" />
            <Text style={styles.loadingText}>Fetching Privy Wallets...</Text>
          </View>
        ) : (wallets ?? []).length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="wallet-outline" size={48} color="#404055" />
            <Text style={styles.emptyTitle}>No Privy Wallets Created</Text>
            <Text style={styles.emptySub}>Tap below to automatically generate your first Privy embedded wallet on Solana or EVM.</Text>
            <TouchableOpacity
              style={styles.autoCreateBtn}
              onPress={() => setIsCreateModalOpen(true)}
            >
              <Text style={styles.autoCreateText}>+ Auto-Create Privy Wallet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sortedWallets.map((w: any) => (
            <React.Fragment key={w.id}>
              {renamingWalletId === w.id ? (
                <View style={styles.renameBox}>
                  <Text style={styles.renameTitle}>Rename Wallet</Text>
                  <TextInput
                    style={styles.nameInput}
                    placeholder="New Wallet Name"
                    placeholderTextColor="#606075"
                    value={newWalletName}
                    onChangeText={setNewWalletName}
                  />
                  <View style={styles.createBtnRow}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setRenamingWalletId(null)}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmCreateBtn} onPress={() => handleRenameWallet(w.id)}>
                      <Text style={styles.confirmCreateText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <WalletCard
                  wallet={w}
                  onRename={() => {
                    setRenamingWalletId(w.id);
                    setNewWalletName(w.name || '');
                  }}
                  onFund={() => Alert.alert('Deposit Address', `Send funds directly to your wallet address:\n\n${w.address}`)}
                  onWithdraw={() => Alert.alert('Withdraw Funds', `Withdrawal module initialized for ${w.address}`)}
                  onViewExplorer={() => handleOpenExplorer(w.chainId, w.address)}
                  onConfigureStrategies={() => router.push('/(tabs)/traders')}
                  onDelete={() => handleDeleteWallet(w.id, w.name || 'Wallet')}
                />
              )}
            </React.Fragment>
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
  header: {
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00F0FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  createBox: {
    width: '100%',
    backgroundColor: '#12121A',
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#00F0FF40',
    gap: 10,
  },
  createBoxTitle: {
    color: '#00F0FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createBoxSub: {
    color: '#808095',
    fontSize: 12,
  },
  chainSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  chainOption: {
    flex: 1,
    backgroundColor: '#1A1A26',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3C',
  },
  chainOptionActive: {
    borderColor: '#00F0FF',
    backgroundColor: '#00F0FF20',
  },
  chainOptionText: {
    color: '#808095',
    fontSize: 12,
    fontWeight: '600',
  },
  chainOptionTextActive: {
    color: '#00F0FF',
    fontWeight: 'bold',
  },
  nameInput: {
    backgroundColor: '#1A1A26',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A3C',
    color: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  createBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelText: {
    color: '#808095',
    fontSize: 13,
  },
  confirmCreateBtn: {
    backgroundColor: '#00F0FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmCreateText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 90,
  },
  totalCard: {
    width: '100%',
    backgroundColor: '#12121A',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222232',
  },
  totalLabel: {
    color: '#808095',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  totalValue: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  totalCount: {
    color: '#808095',
    fontSize: 12,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#808095',
    marginTop: 12,
  },
  emptyBox: {
    width: '100%',
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptySub: {
    color: '#808095',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  autoCreateBtn: {
    backgroundColor: '#00F0FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  autoCreateText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  renameBox: {
    width: '100%',
    backgroundColor: '#12121A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00F0FF',
    gap: 10,
  },
  renameTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
