export const themeTokens = {
  colors: {
    primary: '#0052FF',
    secondary: '#1652F0',
    background: '#0A0B0D',
    cardBackground: '#141519',
    border: '#2A2D35',
    textPrimary: '#FFFFFF',
    textSecondary: '#8A919E',
    success: '#00C853',
    danger: '#FF3B30',
    warning: '#FF9500'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999
  }
} as const;

export type ThemeTokens = typeof themeTokens;

export interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  isDisabled?: boolean;
  onPress?: () => void;
}

export interface CardProps {
  title?: string;
  children?: unknown;
}
