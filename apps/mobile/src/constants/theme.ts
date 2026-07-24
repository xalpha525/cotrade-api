// Cabal-inspired design system
// Pure black, card-less, terminal aesthetic

export const Colors = {
  // Backgrounds — true black layers
  background: '#000000',
  surface: '#0A0A0A',
  surfaceElevated: '#111111',
  surfaceHigh: '#1A1A1A',
  overlay: 'rgba(255,255,255,0.04)',

  // Primary accent — electric green (Cabal signature)
  accent: '#00FF87',
  accentDim: 'rgba(0,255,135,0.12)',
  accentMuted: 'rgba(0,255,135,0.06)',

  // Trading semantics
  bullish: '#00FF87',
  bearish: '#FF3B5C',
  bullishDim: 'rgba(0,255,135,0.12)',
  bearishDim: 'rgba(255,59,92,0.12)',

  // Text — pure white hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.78)',
  textMuted: 'rgba(255, 255, 255, 0.62)',
  textDisabled: 'rgba(255, 255, 255, 0.40)',

  // Separators — ultra-subtle
  separator: 'rgba(255,255,255,0.07)',
  separatorBright: 'rgba(255,255,255,0.12)',

  // Tab bar
  tabBarBg: 'rgba(16,16,16,0.94)',
  tabActive: '#FFFFFF',
  tabInactive: 'rgba(255,255,255,0.32)',

  // Status
  warning: '#FFB800',
  info: '#4D9EFF',

  // Gradients
  gradientAccent: ['#00FF87', '#00C468'] as const,
  gradientDanger: ['#FF3B5C', '#CC2040'] as const,
  gradientDark: ['#0A0A0A', '#000000'] as const,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 44,
  section: 32,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  pill: 999,
} as const;

export const Typography = {
  // Size scale
  micro: 10,
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 26,
  xxl: 34,
  xxxl: 44,
  display: 58,

  // Weight
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,

  // Tracking
  tight: -0.8,
  normal: 0,
  wide: 0.6,
  ultraWide: 1.2,
} as const;
