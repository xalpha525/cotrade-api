import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { storage, StorageKeys } from '@/lib/storage';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: '◈',
    title: 'Copy the best\ntraders.',
    body: 'One tap to follow top-performing wallets across Solana and EVM chains.',
  },
  {
    icon: '⬡',
    title: 'Real-time\nexecution.',
    body: 'Trades are copied in milliseconds — never miss an alpha opportunity.',
  },
  {
    icon: '◉',
    title: 'Full portfolio\ncontrol.',
    body: 'Set per-trader limits, slippage, and stop-losses. You stay in control.',
  },
  {
    icon: '⟳',
    title: 'Track every\ntrade.',
    body: 'Detailed P&L history, win rates, and performance analytics built in.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleSkip = () => {
    storage.set(StorageKeys.ONBOARDING_COMPLETED, true);
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    if (page < SLIDES.length - 1) {
      const next = page + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setPage(next);
    } else {
      handleSkip();
    }
  };

  return (
    <View style={styles.bg}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        {/* Skip */}
        <View style={styles.topBar}>
          <View style={styles.wordmark}>
            <Text style={styles.wordmarkText}>CT</Text>
          </View>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Slides */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.slider}
        >
          {SLIDES.map((slide, i) => (
            <View key={i} style={[styles.slide, { width }]}>
              <Text style={styles.slideIcon}>{slide.icon}</Text>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideBody}>{slide.body}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          {/* Dots */}
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === page && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity style={styles.cta} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.ctaText}>
              {page === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.background },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, marginBottom: Spacing.xl,
  },
  wordmark: {
    width: 36, height: 36, borderRadius: 9, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  wordmarkText: { fontSize: Typography.sm, fontWeight: Typography.heavy, color: Colors.background },
  skipText: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: Typography.medium },
  slider: { flex: 1 },
  slide: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: 40,
    gap: Spacing.xl,
  },
  slideIcon: {
    fontSize: 64,
    color: Colors.accent,
    marginBottom: Spacing.xl,
  },
  slideTitle: {
    fontSize: Typography.xxxl,
    fontWeight: Typography.heavy,
    color: Colors.textPrimary,
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  slideBody: {
    fontSize: Typography.md,
    color: Colors.textMuted,
    lineHeight: 26,
    maxWidth: 300,
  },
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.xl,
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.separator },
  dotActive: { width: 20, backgroundColor: Colors.accent },
  cta: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.background,
    letterSpacing: 0.2,
  },
});
