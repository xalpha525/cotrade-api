import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { SectionHeader, RowGroup } from '@/components/ui/Card';

interface RowProps {
  label: string;
  value?: string;
  chevron?: boolean;
  onPress?: () => void;
  isToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  destructive?: boolean;
  accent?: boolean;
  icon?: string;
}

const Row: React.FC<RowProps> = ({
  label, value, chevron, onPress, isToggle, toggleValue, onToggle, destructive, accent, icon,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={isToggle || !onPress}
    activeOpacity={0.6}
    style={styles.row}
  >
    {icon && <Text style={styles.rowIcon}>{icon}</Text>}
    <Text style={[
      styles.rowLabel,
      destructive && { color: Colors.bearish },
      accent && { color: Colors.accent },
    ]}>
      {label}
    </Text>
    {isToggle ? (
      <Switch
        value={toggleValue}
        onValueChange={onToggle}
        trackColor={{ false: Colors.surfaceHigh, true: Colors.accent }}
        thumbColor={Colors.textPrimary}
      />
    ) : value ? (
      <Text style={styles.rowValue}>{value}</Text>
    ) : chevron !== false ? (
      <Text style={styles.chevron}>›</Text>
    ) : null}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [tradeAlerts, setTradeAlerts] = useState(true);
  const [biometric, setBiometric] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.bg}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
          </View>

          {/* Profile */}
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0)?.toUpperCase() ?? 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileEmail}>{user?.email ?? 'Demo User'}</Text>
              <Text style={styles.profileRole}>{user?.role ?? 'USER'}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>

          {/* Account */}
          <View style={styles.section}>
            <SectionHeader title="ACCOUNT" />
            <RowGroup>
              <Row icon="◈" label="Profile" chevron onPress={() => {}} />
              <Row icon="⊕" label="Subscription" value="Free" onPress={() => {}} />
              <Row icon="◉" label="Security" chevron onPress={() => {}} />
            </RowGroup>
          </View>

          {/* Trading */}
          <View style={styles.section}>
            <SectionHeader title="TRADING" />
            <RowGroup>
              <Row icon="⟳" label="Max Slippage" value="0.5%" onPress={() => {}} />
              <Row icon="◎" label="Max Allocation" value="$500" onPress={() => {}} />
              <Row icon="⬡" label="Auto-Copy Trades" isToggle toggleValue={tradeAlerts} onToggle={setTradeAlerts} />
            </RowGroup>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <SectionHeader title="NOTIFICATIONS" />
            <RowGroup>
              <Row label="Push Notifications" isToggle toggleValue={pushEnabled} onToggle={setPushEnabled} />
              <Row label="Trade Alerts" isToggle toggleValue={tradeAlerts} onToggle={setTradeAlerts} />
            </RowGroup>
          </View>

          {/* Security */}
          <View style={styles.section}>
            <SectionHeader title="SECURITY" />
            <RowGroup>
              <Row label="Biometric Auth" isToggle toggleValue={biometric} onToggle={setBiometric} />
              <Row label="2FA Authentication" chevron onPress={() => {}} />
            </RowGroup>
          </View>

          {/* App */}
          <View style={styles.section}>
            <SectionHeader title="APP" />
            <RowGroup>
              <Row label="Theme" value="Dark" onPress={() => {}} />
              <Row label="Trade History" chevron onPress={() => router.push('/(tabs)/trades' as any)} />
              <Row label="App Version" value="1.0.0" chevron={false} />
            </RowGroup>
          </View>

          {/* Support */}
          <View style={styles.section}>
            <SectionHeader title="SUPPORT" />
            <RowGroup>
              <Row label="Documentation" chevron onPress={() => {}} />
              <Row label="Terms of Service" chevron onPress={() => {}} />
              <Row label="Privacy Policy" chevron onPress={() => {}} />
            </RowGroup>
          </View>

          {/* Sign Out */}
          <View style={styles.section}>
            <RowGroup>
              <Row label="Sign Out" destructive onPress={handleLogout} chevron={false} />
            </RowGroup>
          </View>

          <Text style={styles.footer}>CopyTrading · v1.0.0</Text>

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
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, marginBottom: Spacing.xl },
  title: { fontSize: Typography.xxl, fontWeight: Typography.heavy, color: Colors.textPrimary, letterSpacing: Typography.tight },

  profileRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl, gap: Spacing.md,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.separator,
    marginBottom: Spacing.xxl,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textSecondary },
  profileInfo: { flex: 1 },
  profileEmail: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  profileRole: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: Typography.wide },

  section: { marginBottom: Spacing.xxl },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 14, gap: Spacing.sm,
  },
  rowIcon: { fontSize: 16, color: Colors.textMuted, width: 22 },
  rowLabel: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.regular },
  rowValue: { fontSize: Typography.sm, color: Colors.textMuted },
  chevron: { fontSize: 20, color: Colors.textDisabled },
  footer: {
    textAlign: 'center', fontSize: Typography.xs, color: Colors.textDisabled,
    paddingVertical: Spacing.xl,
  },
});
