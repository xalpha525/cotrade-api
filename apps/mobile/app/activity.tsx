import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '@/hooks/useApi';

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'WALLET_CREATED': return { name: 'wallet', color: '#00F0FF' };
    case 'WALLET_FUNDED': return { name: 'arrow-down-circle', color: '#10B981' };
    case 'STRATEGY_ENABLED': return { name: 'flash', color: '#F59E0B' };
    case 'STRATEGY_DISABLED': return { name: 'pause-circle', color: '#EF4444' };
    case 'COPIED_SUCCESSFULLY': return { name: 'checkmark-circle', color: '#10B981' };
    case 'COPIED_FAILED': return { name: 'close-circle', color: '#EF4444' };
    case 'PROFIT_TAKEN': return { name: 'trending-up', color: '#10B981' };
    case 'STOP_LOSS_TRIGGERED': return { name: 'trending-down', color: '#EF4444' };
    default: return { name: 'notifications', color: '#00F0FF' };
  }
};

const openExplorer = (url?: string) => {
  if (url) {
    Linking.openURL(url).catch(() => {});
  }
};

const ActivityCardItem = memo(({ item }: { item: any }) => {
  const icon = getActivityIcon(item.activityType);
  return (
    <View style={styles.activityCard}>
      <View style={[styles.iconBox, { backgroundColor: `${icon.color}20` }]}>
        <Ionicons name={icon.name as any} size={20} color={icon.color} />
      </View>

      <View style={styles.activityContent}>
        <View style={styles.titleRow}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          <Text style={styles.timeText}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>

        <Text style={styles.activitySummary}>{item.summary}</Text>

        {item.txHash && (
          <TouchableOpacity style={styles.txLink} onPress={() => openExplorer(item.explorerUrl)}>
            <Ionicons name="link-outline" size={12} color="#00F0FF" />
            <Text style={styles.txHashText}>Tx: {item.txHash.slice(0, 8)}...{item.txHash.slice(-6)}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}, (prev, next) => prev.item.id === next.item.id && prev.item.timestamp === next.item.timestamp);

export default function ActivityCenterScreen() {
  const { data: activities, isLoading, refetch } = useNotifications();

  const keyExtractor = useCallback((item: any) => item.id, []);
  const renderItem = useCallback(({ item }: { item: any }) => <ActivityCardItem item={item} />, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Activity Center',
          headerStyle: { backgroundColor: '#0A0A10' },
          headerTintColor: '#FFF',
        }}
      />

      <FlatList
        data={activities}
        keyExtractor={keyExtractor}
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerStyle={{ padding: 16 }}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A10',
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#12121A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#222232',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activityTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timeText: {
    color: '#808095',
    fontSize: 11,
  },
  activitySummary: {
    color: '#A0A0B0',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  txLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  txHashText: {
    color: '#00F0FF',
    fontSize: 11,
    fontFamily: 'Courier',
  },
});
