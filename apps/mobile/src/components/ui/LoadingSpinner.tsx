import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = Colors.accent,
}) => (
  <View style={styles.container}>
    <ActivityIndicator size={size} color={color} />
  </View>
);

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle, icon }) => (
  <View style={styles.emptyContainer}>
    {icon && <Text style={styles.emptyIcon}>{icon}</Text>}
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
