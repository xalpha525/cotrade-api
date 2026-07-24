import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { EmptyState } from '@/components/ui/LoadingSpinner';
import { useNotifications } from '@/hooks/useApi';

const demoNotifications = [
  { id: 'n1', type: 'trade', title: 'Trade Executed', body: 'Copied BUY SOL/USDC · +$312.40 (+4.2%)', time: '2m ago', unread: true },
  { id: 'n2', type: 'alert', title: 'Trader Alert', body: '@sol_sniper opened a large position in JUP', time: '18m ago', unread: true },
  { id: 'n3', type: 'trade', title: 'Trade Closed', body: 'Closed SELL ETH/USDC · −$84.10 (−1.1%)', time: '1h ago', unread: false },
  { id: 'n4', type: 'system', title: 'Wallet Connected', body: 'EVM Vault (0x4A2...c81b) successfully linked', time: '3h ago', unread: false },
  { id: 'n5', type: 'trade', title: 'Trade Executed', body: 'Copied BUY JUP/USDC · +$201.80 (+7.6%)', time: '5h ago', unread: false },
];

const typeIcon = (type: string) => {
  if (type === 'trade') return '⟳';
  if (type === 'alert') return '◈';
  if (type === 'system') return '◎';
  return '○';
};

const typeColor = (type: string) => {
  if (type === 'trade') return Colors.bullish;
  if (type === 'alert') return Colors.warning;
  return Colors.info;
};

export default function NotificationsScreen() {
  const { data: notifications, isLoading, refetch } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [notifs, setNotifs] = useState(demoNotifications);

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };
  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));

  const list = Array.isArray(notifications) && notifications.length > 0
    ? (notifications as typeof demoNotifications)
    : notifs;

  const unreadCount = list.filter((n) => n.unread).length;

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
            <View>
              <Text style={styles.title}>Notifications</Text>
              {unreadCount > 0 && (
                <Text style={styles.unreadCount}>{unreadCount} unread</Text>
              )}
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllRead}>
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>

          {list.length === 0 ? (
            <EmptyState title="No notifications" subtitle="You're all caught up" icon="◎" />
          ) : (
            <View style={styles.listWrap}>
              {list.map((notif, i) => (
                <View key={notif.id ?? i}>
                  {i > 0 && <View style={styles.separator} />}
                  <TouchableOpacity style={styles.notifRow} activeOpacity={0.6}>
                    {/* Unread dot */}
                    <View style={styles.dotCol}>
                      {notif.unread && <View style={styles.unreadDot} />}
                    </View>
                    {/* Icon */}
                    <View style={[styles.iconWrap, { backgroundColor: `${typeColor(notif.type)}14` }]}>
                      <Text style={[styles.notifIcon, { color: typeColor(notif.type) }]}>
                        {typeIcon(notif.type)}
                      </Text>
                    </View>
                    {/* Content */}
                    <View style={styles.notifContent}>
                      <View style={styles.notifTitleRow}>
                        <Text style={[styles.notifTitle, notif.unread && styles.notifTitleUnread]}>
                          {notif.title}
                        </Text>
                        <Text style={styles.notifTime}>{notif.time}</Text>
                      </View>
                      <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
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
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, marginBottom: Spacing.xl,
  },
  title: { fontSize: Typography.xxl, fontWeight: Typography.heavy, color: Colors.textPrimary, letterSpacing: Typography.tight },
  unreadCount: { fontSize: Typography.sm, color: Colors.accent, marginTop: 2 },
  markAllText: { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 8 },
  listWrap: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.separator },
  separator: { height: 1, backgroundColor: Colors.separator, marginLeft: Spacing.lg + 8 + 36 + Spacing.md },
  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg, paddingVertical: 14, gap: Spacing.md,
  },
  dotCol: { width: 8, paddingTop: 18, alignItems: 'center' },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  notifIcon: { fontSize: 16 },
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 },
  notifTitle: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textSecondary, flex: 1 },
  notifTitleUnread: { color: Colors.textPrimary, fontWeight: Typography.semibold },
  notifTime: { fontSize: Typography.micro, color: Colors.textDisabled, marginLeft: Spacing.sm },
  notifBody: { fontSize: Typography.xs, color: Colors.textMuted, lineHeight: 18 },
});
