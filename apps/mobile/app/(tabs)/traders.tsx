import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTraders, useAddTrader } from '@/hooks/useApi';
import { TraderCard } from '@/components/trader/TraderCard';

export default function TradersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'SUGGESTED' | 'TRACKED' | 'RECENT'>('SUGGESTED');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newHandle, setNewHandle] = useState('');

  const { data: traders, isLoading, refetch, isRefetching } = useTraders(searchQuery);
  const addTraderMutation = useAddTrader();

  const handleAddTrader = async () => {
    if (!newAddress) {
      Alert.alert('Address Required', 'Please enter a wallet address.');
      return;
    }

    try {
      await addTraderMutation.mutateAsync({
        address: newAddress,
        handle: newHandle || 'Trader',
        chain: 'SOL',
      });
      setIsAddModalOpen(false);
      setNewAddress('');
      setNewHandle('');
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to add trader');
    }
  };

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    await refetch();
    setIsManualRefreshing(false);
  };

  const filteredTraders = (traders ?? []).filter((t: any) => {
    if (activeCategory === 'TRACKED') return t.followerCount > 0;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Search & Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Discover Traders</Text>
          <TouchableOpacity
            style={styles.addTraderBtn}
            onPress={() => setIsAddModalOpen(!isAddModalOpen)}
          >
            <Ionicons name="add" size={18} color="#00F0FF" />
            <Text style={styles.addTraderBtnText}>Track Address</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#808095" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Wallet, ENS, Name, Nickname..."
            placeholderTextColor="#606075"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#808095" />
            </TouchableOpacity>
          )}
        </View>

        {/* Modal / Inline Add Trader Box */}
        {isAddModalOpen && (
          <View style={styles.addBox}>
            <Text style={styles.addBoxTitle}>Track New Trader Address</Text>
            <TextInput
              style={styles.addInput}
              placeholder="Wallet Address (Solana or EVM)"
              placeholderTextColor="#606075"
              value={newAddress}
              onChangeText={setNewAddress}
            />
            <TextInput
              style={styles.addInput}
              placeholder="Nickname / Display Handle (Optional)"
              placeholderTextColor="#606075"
              value={newHandle}
              onChangeText={setNewHandle}
            />
            <View style={styles.addBoxBtnRow}>
              <TouchableOpacity style={styles.addCancelBtn} onPress={() => setIsAddModalOpen(false)}>
                <Text style={styles.addCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addSubmitBtn} onPress={handleAddTrader}>
                <Text style={styles.addSubmitText}>Track Trader</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Category Pills */}
        <View style={styles.categoryRow}>
          {(['SUGGESTED', 'TRACKED', 'RECENT'] as const).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                {cat === 'SUGGESTED' ? 'Suggested' : cat === 'TRACKED' ? 'Tracked' : 'Recent'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Traders List */}
      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isManualRefreshing} onRefresh={handleManualRefresh} tintColor="#00F0FF" />
        }
      >
        {isLoading && !traders ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#00F0FF" />
            <Text style={styles.loadingText}>Fetching Top Traders...</Text>
          </View>
        ) : filteredTraders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={48} color="#404055" />
            <Text style={styles.emptyTitle}>No traders have been added yet.</Text>
            <Text style={styles.emptySub}>Add the first wallet to start building the community trader database.</Text>
            <TouchableOpacity
              style={styles.addTraderEmptyBtn}
              onPress={() => setIsAddModalOpen(true)}
            >
              <Text style={styles.addTraderEmptyText}>+ Track Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredTraders.map((trader: any) => (
            <TraderCard
              key={trader.id}
              trader={trader}
              onView={() => router.push(`/trader/${trader.id}`)}
              onTrack={() => Alert.alert('Tracked', `You are now tracking ${trader.displayName}`)}
              onCopy={() => router.push(`/copy-config/${trader.id}`)}
            />
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
  topHeader: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  addTraderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00F0FF15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00F0FF40',
    gap: 4,
  },
  addTraderBtnText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12121A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#222232',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
  },
  addBox: {
    width: '100%',
    backgroundColor: '#12121A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00F0FF40',
    gap: 10,
  },
  addBoxTitle: {
    color: '#00F0FF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addInput: {
    backgroundColor: '#1A1A26',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A3C',
    color: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  addBoxBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  addCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addCancelText: {
    color: '#808095',
    fontSize: 12,
  },
  addSubmitBtn: {
    backgroundColor: '#00F0FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addSubmitText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: '#222232',
  },
  categoryPillActive: {
    backgroundColor: '#00F0FF20',
    borderColor: '#00F0FF',
  },
  categoryText: {
    color: '#808095',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#00F0FF',
    fontWeight: 'bold',
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 90,
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
    paddingVertical: 60,
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
  addTraderEmptyBtn: {
    backgroundColor: '#00F0FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addTraderEmptyText: {
    color: '#0A0A10',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
