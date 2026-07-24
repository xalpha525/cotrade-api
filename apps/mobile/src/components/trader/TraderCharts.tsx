import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TraderChartsProps {
  traderId: string;
}

export const TraderCharts: React.FC<TraderChartsProps> = () => {
  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'MONTHLY' | 'WINRATE' | 'ROI' | 'DISTRIBUTION'>('PORTFOLIO');

  return (
    <View style={styles.container}>
      {/* Chart Segment Control Tabs */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'PORTFOLIO' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('PORTFOLIO')}
        >
          <Text style={[styles.segmentText, activeTab === 'PORTFOLIO' && styles.segmentTextActive]}>Curve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'MONTHLY' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('MONTHLY')}
        >
          <Text style={[styles.segmentText, activeTab === 'MONTHLY' && styles.segmentTextActive]}>Monthly</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'WINRATE' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('WINRATE')}
        >
          <Text style={[styles.segmentText, activeTab === 'WINRATE' && styles.segmentTextActive]}>Win Rate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'ROI' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('ROI')}
        >
          <Text style={[styles.segmentText, activeTab === 'ROI' && styles.segmentTextActive]}>ROI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'DISTRIBUTION' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('DISTRIBUTION')}
        >
          <Text style={[styles.segmentText, activeTab === 'DISTRIBUTION' && styles.segmentTextActive]}>MC Dist</Text>
        </TouchableOpacity>
      </View>

      {/* Chart Canvas Card */}
      <View style={styles.chartCard}>
        {activeTab === 'PORTFOLIO' && (
          <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>Portfolio Equity Curve (30D)</Text>
            <View style={styles.svgBarContainer}>
              {[40, 45, 42, 58, 65, 60, 72, 85, 94, 88, 98, 112, 125].map((h, i) => (
                <View key={i} style={styles.barColumn}>
                  <View style={[styles.bar, { height: h, backgroundColor: '#00F0FF' }]} />
                  <Text style={styles.barLabel}>{`D${i + 1}`}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartStatsRow}>
              <Text style={styles.statLabel}>Peak: <Text style={styles.statVal}>$35,000</Text></Text>
              <Text style={styles.statLabel}>Current: <Text style={styles.statVal}>$24,500</Text></Text>
              <Text style={styles.statLabel}>Drawdown: <Text style={[styles.statVal, { color: '#10B981' }]}>-12.5%</Text></Text>
            </View>
          </View>
        )}

        {activeTab === 'MONTHLY' && (
          <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>Monthly PnL Performance ($)</Text>
            <View style={styles.svgBarContainer}>
              {[
                { month: 'Jan', val: '+$4.2k', h: 70, color: '#10B981' },
                { month: 'Feb', val: '+$6.8k', h: 95, color: '#10B981' },
                { month: 'Mar', val: '-$1.2k', h: 30, color: '#EF4444' },
                { month: 'Apr', val: '+$8.5k', h: 110, color: '#10B981' },
                { month: 'May', val: '+$3.4k', h: 60, color: '#10B981' },
                { month: 'Jun', val: '+$9.1k', h: 120, color: '#10B981' },
              ].map((m, i) => (
                <View key={i} style={styles.barColumn}>
                  <Text style={{ fontSize: 9, color: m.color, marginBottom: 4 }}>{m.val}</Text>
                  <View style={[styles.bar, { height: m.h, backgroundColor: m.color }]} />
                  <Text style={styles.barLabel}>{m.month}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'WINRATE' && (
          <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>Trade Outcome Distribution</Text>
            <View style={styles.winRateBox}>
              <View style={styles.pieBar}>
                <View style={{ flex: 76, backgroundColor: '#10B981', height: '100%', borderRadius: 4 }} />
                <View style={{ flex: 24, backgroundColor: '#EF4444', height: '100%', borderRadius: 4, marginLeft: 2 }} />
              </View>
              <View style={styles.winRateLegend}>
                <Text style={{ color: '#10B981', fontWeight: 'bold' }}>32 Winning Trades (76.2%)</Text>
                <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>10 Losing Trades (23.8%)</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'ROI' && (
          <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>Return on Investment (ROI) Multipliers</Text>
            <View style={styles.roiGrid}>
              <View style={styles.roiCard}>
                <Text style={styles.roiTitle}>Average Win</Text>
                <Text style={styles.roiValue}>8.4x</Text>
              </View>
              <View style={styles.roiCard}>
                <Text style={styles.roiTitle}>Best Win</Text>
                <Text style={[styles.roiValue, { color: '#00F0FF' }]}>24.5x</Text>
              </View>
              <View style={styles.roiCard}>
                <Text style={styles.roiTitle}>Average Loss</Text>
                <Text style={[styles.roiValue, { color: '#EF4444' }]}>-18.4%</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'DISTRIBUTION' && (
          <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>Market Cap Entry Distribution</Text>
            <View style={styles.mcList}>
              {[
                { range: '< $1M Micro Caps', pct: '45%', color: '#00F0FF' },
                { range: '$1M - $10M Mid Caps', pct: '35%', color: '#10B981' },
                { range: '$10M - $100M Large', pct: '15%', color: '#F59E0B' },
                { range: '> $100M Bluechips', pct: '5%', color: '#8B5CF6' },
              ].map((item, idx) => (
                <View key={idx} style={styles.mcRow}>
                  <Text style={styles.mcRange}>{item.range}</Text>
                  <View style={styles.mcBarBg}>
                    <View style={{ width: item.pct, height: '100%', backgroundColor: item.color, borderRadius: 3 }} />
                  </View>
                  <Text style={styles.mcPct}>{item.pct}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#12121A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222232',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#00F0FF20',
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  segmentText: {
    color: '#808095',
    fontSize: 11,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#00F0FF',
    fontWeight: 'bold',
  },
  chartCard: {
    backgroundColor: '#12121A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222232',
  },
  chartWrapper: {
    alignItems: 'center',
  },
  chartTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  svgBarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    height: 140,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3C',
    paddingBottom: 8,
  },
  barColumn: {
    alignItems: 'center',
  },
  bar: {
    width: 14,
    borderRadius: 4,
  },
  barLabel: {
    color: '#808095',
    fontSize: 9,
    marginTop: 4,
  },
  chartStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
  },
  statLabel: {
    color: '#808095',
    fontSize: 11,
  },
  statVal: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  winRateBox: {
    width: '100%',
    paddingVertical: 12,
  },
  pieBar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  winRateLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  roiGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  roiCard: {
    flex: 1,
    backgroundColor: '#1A1A26',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  roiTitle: {
    color: '#808095',
    fontSize: 11,
    marginBottom: 4,
  },
  roiValue: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mcList: {
    width: '100%',
    gap: 12,
  },
  mcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mcRange: {
    color: '#FFF',
    fontSize: 11,
    width: 120,
  },
  mcBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: '#1A1A26',
    borderRadius: 5,
    overflow: 'hidden',
  },
  mcPct: {
    color: '#808095',
    fontSize: 11,
    width: 35,
    textAlign: 'right',
  },
});
