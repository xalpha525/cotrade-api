import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';

// Cardless in Cabal style — just a separator-bounded section, no card bg
interface RowGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const RowGroup: React.FC<RowGroupProps> = ({ children, style }) => (
  <View style={[styles.group, style]}>
    {React.Children.map(children, (child, i) => (
      <View key={i}>
        {i > 0 && <View style={styles.separator} />}
        {child}
      </View>
    ))}
  </View>
);

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <Text style={styles.sectionAction} onPress={onAction}>
        {action}
      </Text>
    )}
  </View>
);

interface StatRowProps {
  label: string;
  value: string;
  valueColor?: string;
  sublabel?: string;
}

export const StatRow: React.FC<StatRowProps> = ({ label, value, valueColor, sublabel }) => (
  <View style={styles.statRow}>
    <View>
      <Text style={styles.statLabel}>{label}</Text>
      {sublabel && <Text style={styles.statSublabel}>{sublabel}</Text>}
    </View>
    <Text style={[styles.statValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  group: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.separator,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.separator,
    marginLeft: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: Typography.ultraWide,
  },
  sectionAction: {
    fontSize: Typography.sm,
    color: Colors.accent,
    fontWeight: Typography.medium,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  statLabel: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: Typography.regular,
  },
  statSublabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statValue: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    fontVariant: ['tabular-nums'],
  },
});

// Keep Card export for backwards compat — renders as transparent group
export const Card = RowGroup;
export const StatCard = StatRow;
