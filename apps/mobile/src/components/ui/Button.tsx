import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type TouchableOpacityProps,
} from 'react-native';
import { Colors, BorderRadius, Typography, Spacing } from '@/constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  style,
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading;
  const sz = sizes[size];

  const containerStyle = [
    styles.base,
    styles[variant],
    sz,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    styles[`${variant}Label` as keyof typeof styles],
    { fontSize: size === 'sm' ? Typography.xs : size === 'lg' ? Typography.md : Typography.sm },
  ];

  return (
    <TouchableOpacity
      {...props}
      disabled={isDisabled}
      style={containerStyle}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.background : Colors.accent}
          size="small"
        />
      ) : (
        <Text style={labelStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const sizes = {
  sm: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.md },
  md: { paddingHorizontal: Spacing.xl, paddingVertical: 14, borderRadius: BorderRadius.lg },
  lg: { paddingHorizontal: Spacing.xxl, paddingVertical: 17, borderRadius: BorderRadius.xl },
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.38 },

  // Variants
  primary: {
    backgroundColor: Colors.accent,
  },
  secondary: {
    backgroundColor: Colors.surfaceHigh,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.bearishDim,
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.25)',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.separatorBright,
  },

  // Labels
  label: {
    fontWeight: Typography.semibold,
    letterSpacing: Typography.tight,
  },
  primaryLabel: { color: Colors.background },
  secondaryLabel: { color: Colors.textPrimary },
  ghostLabel: { color: Colors.textSecondary },
  dangerLabel: { color: Colors.bearish },
  outlineLabel: { color: Colors.textSecondary },
});
