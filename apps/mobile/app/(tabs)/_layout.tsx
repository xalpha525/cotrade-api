import React from 'react';
import { Tabs, usePathname, useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/theme';

// ─── Tab config (3 Main Tabs) ───────────────────────────────────────────────
const TABS = [
  { name: 'index',   route: '/(tabs)/',        icon: '⌂', label: 'Home'       },
  { name: 'traders', route: '/(tabs)/traders', icon: '⊕', label: 'Traders'    },
  { name: 'wallets', route: '/(tabs)/wallets', icon: '◉', label: 'My Wallets' },
] as const;

// ─── Custom floating tab bar ──────────────────────────────────────────────────
function GlassTabBar() {
  const router  = useRouter();
  const path    = usePathname();
  const insets  = useSafeAreaInsets();

  const isActive = (name: string) => {
    if (name === 'index') return path === '/' || path === '/(tabs)' || path === '/(tabs)/index' || path === '';
    return path.includes(`/${name}`);
  };

  const bottomOffset = insets.bottom > 0 ? insets.bottom + 8 : 20;

  return (
    <View style={[styles.barOuter, { bottom: bottomOffset }]}>
      {/* iOS glass morphism blur backdrop */}
      <BlurView
        intensity={72}
        tint="systemChromeMaterialDark"
        style={StyleSheet.absoluteFill}
      />

      {/* Top specular highlight — iOS glass shine */}
      <View style={styles.topHighlight} />

      {/* Tab buttons */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const active = isActive(tab.name);
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabCell}
              onPress={() => router.push(tab.route as any)}
              activeOpacity={0.7}
            >
              {/* Active background pill */}
              {active && <View style={styles.activePill} />}

              {/* Icon */}
              <Text style={[styles.icon, active && styles.iconActive]}>
                {tab.icon}
              </Text>

              {/* Label */}
              <Text style={[styles.label, active && styles.labelActive]}>
                {tab.label}
              </Text>

              {/* Active dot */}
              {active && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabLayout() {
  return (
    <Tabs
      tabBar={() => <GlassTabBar />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index"         />
      <Tabs.Screen name="traders"       />
      <Tabs.Screen name="wallets"       />
      <Tabs.Screen name="portfolio"     options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="trades"        options={{ href: null }} />
      <Tabs.Screen name="settings"      options={{ href: null }} />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const BAR_HEIGHT = 64;
const BAR_RADIUS = 999;

const styles = StyleSheet.create({
  barOuter: {
    position:       'absolute',
    left:           28,
    right:          28,
    height:         BAR_HEIGHT,
    borderRadius:   BAR_RADIUS,
    overflow:       'hidden',
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 8 },
    shadowOpacity:  0.35,
    shadowRadius:   20,
    elevation:      20,
    borderWidth:    0.5,
    borderColor:    'rgba(255,255,255,0.12)',
  },

  topHighlight: {
    position:        'absolute',
    top:             0,
    left:            24,
    right:           24,
    height:          1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius:    1,
    zIndex:          2,
  },

  tabRow: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-around',
    paddingHorizontal: 12,
  },

  tabCell: {
    flex:            1,
    height:          BAR_HEIGHT,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             2,
  },

  activePill: {
    position:        'absolute',
    width:           76,
    height:          46,
    borderRadius:    23,
    backgroundColor: 'rgba(0,255,135,0.08)',
  },

  icon: {
    fontSize:   18,
    lineHeight: 20,
    color:      'rgba(255,255,255,0.35)',
    textAlign:  'center',
  },
  iconActive: {
    color: Colors.accent,
  },

  label: {
    fontSize:   10,
    fontWeight: '500',
    color:      'rgba(255,255,255,0.35)',
  },
  labelActive: {
    color:      Colors.accent,
    fontWeight: '700',
  },

  activeDot: {
    position:        'absolute',
    bottom:          4,
    width:           4,
    height:          4,
    borderRadius:    2,
    backgroundColor: Colors.accent,
  },
});
