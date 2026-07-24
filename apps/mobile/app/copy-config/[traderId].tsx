import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTraderDetail, useWallets, useSaveCopyStrategy } from '@/hooks/useApi';
import { CopyStepWizard } from '@/components/copy/CopyStepWizard';

export default function CopyConfigScreen() {
  const { traderId } = useLocalSearchParams<{ traderId: string }>();
  const router = useRouter();

  const { data: trader, isLoading: traderLoading } = useTraderDetail(traderId as string);
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const saveStrategyMutation = useSaveCopyStrategy();

  if (traderLoading || walletsLoading || !trader) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00F0FF" />
        <Text style={styles.loadingText}>Loading Copy Configuration...</Text>
      </View>
    );
  }

  const handleSave = async (config: any) => {
    await saveStrategyMutation.mutateAsync(config);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: `Copy ${trader.displayName}`,
          headerStyle: { backgroundColor: '#0A0A10' },
          headerTintColor: '#FFF',
        }}
      />

      <CopyStepWizard
        trader={trader}
        wallets={wallets ?? []}
        onSaveStrategy={handleSave}
        onCancel={() => router.back()}
      />
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
});
