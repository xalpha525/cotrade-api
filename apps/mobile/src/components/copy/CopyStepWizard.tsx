import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface CopyStepWizardProps {
  trader: any;
  wallets: any[];
  onSaveStrategy: (config: any) => Promise<void>;
  onCancel: () => void;
}

export const CopyStepWizard: React.FC<CopyStepWizardProps> = ({
  trader,
  wallets,
  onSaveStrategy,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Step 1: Wallet
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id ?? '');

  // Step 2: Position Sizing
  const [sizingMode, setSizingMode] = useState<'FIXED_DOLLAR' | 'PERCENTAGE' | 'MULTIPLIER'>('FIXED_DOLLAR');
  const [fixedAmountUsd, setFixedAmountUsd] = useState<string>('250');
  const [percentageAllocation, setPercentageAllocation] = useState<string>('10');
  const [multiplier, setMultiplier] = useState<string>('1.0');
  const [maxBuyUsd, setMaxBuyUsd] = useState<string>('500');
  const [minBuyUsd, setMinBuyUsd] = useState<string>('20');
  const [maxPositionSizeUsd, setMaxPositionSizeUsd] = useState<string>('1000');
  const [maxDailySpendUsd, setMaxDailySpendUsd] = useState<string>('2500');
  const [maxOpenPositions, setMaxOpenPositions] = useState<string>('5');
  const [maxExposureUsd, setMaxExposureUsd] = useState<string>('5000');

  // Step 3: Buy Rules
  const [copyAllBuys, setCopyAllBuys] = useState<boolean>(true);
  const [onlyVerifiedTokens, setOnlyVerifiedTokens] = useState<boolean>(false);
  const [minLiquidityUsd, setMinLiquidityUsd] = useState<string>('50000');
  const [maxMarketCapUsd, setMaxMarketCapUsd] = useState<string>('50000000');
  const [minHolders, setMinHolders] = useState<string>('100');
  const [maxSlippageBps, setMaxSlippageBps] = useState<string>('100');
  const [maxBuyTaxPercent, setMaxBuyTaxPercent] = useState<string>('5');
  const [maxSellTaxPercent, setMaxSellTaxPercent] = useState<string>('5');

  // Step 4: Sell Rules
  const [sellExecutionMode, setSellExecutionMode] = useState<'MIRROR_TRADER' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'HOLD_FOREVER'>('MIRROR_TRADER');
  const [takeProfitPercentage, setTakeProfitPercentage] = useState<string>('100');
  const [stopLossPercentage, setStopLossPercentage] = useState<string>('20');
  const [trailingStopPercent, setTrailingStopPercent] = useState<string>('10');
  const [mirrorPartialSells, setMirrorPartialSells] = useState<boolean>(true);

  // Step 5: Risk Management
  const [dailyLossLimitUsd, setDailyLossLimitUsd] = useState<string>('300');
  const [pauseAfterLosses, setPauseAfterLosses] = useState<string>('3');
  const [maxDrawdownPercent, setMaxDrawdownPercent] = useState<string>('25');
  const [emergencyStop, setEmergencyStop] = useState<boolean>(false);

  const handleNext = () => {
    if (currentStep === 1 && !selectedWalletId) {
      Alert.alert('Select Wallet', 'Please select a Privy destination wallet for this strategy.');
      return;
    }
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirmAndActivate = async () => {
    setIsSubmitting(true);
    try {
      const config = {
        traderId: trader.id,
        destinationWalletId: selectedWalletId,
        sizingMode,
        fixedAmountUsd: parseFloat(fixedAmountUsd) || 250,
        percentageAllocation: parseFloat(percentageAllocation) || 10,
        multiplier: parseFloat(multiplier) || 1.0,
        maxBuyUsd: parseFloat(maxBuyUsd) || 500,
        minBuyUsd: parseFloat(minBuyUsd) || 20,
        maxPositionSizeUsd: parseFloat(maxPositionSizeUsd) || 1000,
        maxDailySpendUsd: parseFloat(maxDailySpendUsd) || 2500,
        maxOpenPositions: parseInt(maxOpenPositions) || 5,
        maxExposureUsd: parseFloat(maxExposureUsd) || 5000,
        copyAllBuys,
        onlyVerifiedTokens,
        minLiquidityUsd: parseFloat(minLiquidityUsd) || 50000,
        maxMarketCapUsd: parseFloat(maxMarketCapUsd) || 50000000,
        minHolders: parseInt(minHolders) || 100,
        maxSlippageBps: parseInt(maxSlippageBps) || 100,
        maxBuyTaxPercent: parseFloat(maxBuyTaxPercent) || 5,
        maxSellTaxPercent: parseFloat(maxSellTaxPercent) || 5,
        sellExecutionMode,
        takeProfitPercentage: parseFloat(takeProfitPercentage) || 100,
        stopLossPercentage: parseFloat(stopLossPercentage) || 20,
        trailingStopPercent: parseFloat(trailingStopPercent) || 10,
        mirrorPartialSells,
        dailyLossLimitUsd: parseFloat(dailyLossLimitUsd) || 300,
        pauseAfterLosses: parseInt(pauseAfterLosses) || 3,
        maxDrawdownPercent: parseFloat(maxDrawdownPercent) || 25,
        emergencyStop,
      };

      await onSaveStrategy(config);
    } catch (err: any) {
      Alert.alert('Strategy Error', err.message ?? 'Failed to activate strategy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Wizard Progress Bar */}
      <View style={styles.stepHeader}>
        <View style={styles.stepIndicatorRow}>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <View
              key={s}
              style={[
                styles.stepDot,
                currentStep >= s && styles.stepDotActive,
                currentStep === s && styles.stepDotCurrent,
              ]}
            >
              <Text style={[styles.stepDotText, currentStep >= s && styles.stepDotTextActive]}>{s}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.stepTitle}>
          {currentStep === 1 && 'Step 1: Select Destination Privy Wallet'}
          {currentStep === 2 && 'Step 2: Position Sizing & Limits'}
          {currentStep === 3 && 'Step 3: Buy Filtering Rules'}
          {currentStep === 4 && 'Step 4: Take Profit & Stop Loss Rules'}
          {currentStep === 5 && 'Step 5: Risk Management & Controls'}
          {currentStep === 6 && 'Step 6: Confirm & Activate Strategy'}
        </Text>
      </View>

      <ScrollView style={styles.bodyScroll} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* STEP 1: DESTINATION WALLET */}
        {currentStep === 1 && (
          <View style={styles.stepSection}>
            <Text style={styles.sectionDesc}>Select which Privy embedded wallet will execute copy trades for {trader.displayName}:</Text>
            {wallets.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={[styles.walletItem, selectedWalletId === w.id && styles.walletItemActive]}
                onPress={() => setSelectedWalletId(w.id)}
              >
                <View style={styles.walletItemHeader}>
                  <Text style={styles.walletItemName}>{w.name || (w.chainId === 'SOLANA_MAINNET' ? 'Solana Privy Wallet' : 'EVM Privy Wallet')}</Text>
                  <Text style={styles.walletItemChain}>{w.chainId === 'SOLANA_MAINNET' ? 'SOL' : 'EVM'}</Text>
                </View>
                <Text style={styles.walletItemAddr}>{w.address}</Text>
                <View style={styles.walletItemFooter}>
                  <Text style={styles.walletItemBal}>Balance: ${(w.balanceUsd ?? 0).toFixed(2)}</Text>

                  {selectedWalletId === w.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#00F0FF" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* STEP 2: POSITION SIZING */}
        {currentStep === 2 && (
          <View style={styles.stepSection}>
            <Text style={styles.fieldLabel}>Sizing Mode</Text>
            <View style={styles.modeRow}>
              {(['FIXED_DOLLAR', 'PERCENTAGE', 'MULTIPLIER'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeBtn, sizingMode === m && styles.modeBtnActive]}
                  onPress={() => setSizingMode(m)}
                >
                  <Text style={[styles.modeText, sizingMode === m && styles.modeTextActive]}>{m.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {sizingMode === 'FIXED_DOLLAR' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fixed Trade Amount ($)</Text>
                <TextInput style={styles.textInput} value={fixedAmountUsd} onChangeText={setFixedAmountUsd} keyboardType="numeric" />
              </View>
            )}

            {sizingMode === 'PERCENTAGE' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Percentage of Trader Trade (%)</Text>
                <TextInput style={styles.textInput} value={percentageAllocation} onChangeText={setPercentageAllocation} keyboardType="numeric" />
              </View>
            )}

            {sizingMode === 'MULTIPLIER' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Multiplier Ratio (x)</Text>
                <TextInput style={styles.textInput} value={multiplier} onChangeText={setMultiplier} keyboardType="numeric" />
              </View>
            )}

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Max Buy ($)</Text>
                <TextInput style={styles.textInput} value={maxBuyUsd} onChangeText={setMaxBuyUsd} keyboardType="numeric" />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Min Buy ($)</Text>
                <TextInput style={styles.textInput} value={minBuyUsd} onChangeText={setMinBuyUsd} keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Max Position Size ($)</Text>
                <TextInput style={styles.textInput} value={maxPositionSizeUsd} onChangeText={setMaxPositionSizeUsd} keyboardType="numeric" />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Max Daily Spend ($)</Text>
                <TextInput style={styles.textInput} value={maxDailySpendUsd} onChangeText={setMaxDailySpendUsd} keyboardType="numeric" />
              </View>
            </View>
          </View>
        )}

        {/* STEP 3: BUY RULES */}
        {currentStep === 3 && (
          <View style={styles.stepSection}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Copy All Buys Automatically</Text>
              <Switch value={copyAllBuys} onValueChange={setCopyAllBuys} trackColor={{ true: '#00F0FF' }} />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Only Verified Tokens</Text>
              <Switch value={onlyVerifiedTokens} onValueChange={setOnlyVerifiedTokens} trackColor={{ true: '#00F0FF' }} />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Min Liquidity ($)</Text>
                <TextInput style={styles.textInput} value={minLiquidityUsd} onChangeText={setMinLiquidityUsd} keyboardType="numeric" />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Max Market Cap ($)</Text>
                <TextInput style={styles.textInput} value={maxMarketCapUsd} onChangeText={setMaxMarketCapUsd} keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Max Slippage (bps)</Text>
                <TextInput style={styles.textInput} value={maxSlippageBps} onChangeText={setMaxSlippageBps} keyboardType="numeric" />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Min Token Holders</Text>
                <TextInput style={styles.textInput} value={minHolders} onChangeText={setMinHolders} keyboardType="numeric" />
              </View>
            </View>
          </View>
        )}

        {/* STEP 4: SELL RULES */}
        {currentStep === 4 && (
          <View style={styles.stepSection}>
            <Text style={styles.fieldLabel}>Sell Execution Mode</Text>
            <View style={styles.modeRow}>
              {(['MIRROR_TRADER', 'TAKE_PROFIT', 'STOP_LOSS', 'HOLD_FOREVER'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeBtn, sellExecutionMode === m && styles.modeBtnActive]}
                  onPress={() => setSellExecutionMode(m)}
                >
                  <Text style={[styles.modeText, sellExecutionMode === m && styles.modeTextActive]}>{m.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Take Profit Target (%)</Text>
                <TextInput style={styles.textInput} value={takeProfitPercentage} onChangeText={setTakeProfitPercentage} keyboardType="numeric" />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Stop Loss Trigger (%)</Text>
                <TextInput style={styles.textInput} value={stopLossPercentage} onChangeText={setStopLossPercentage} keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Mirror Trader Partial Sells</Text>
              <Switch value={mirrorPartialSells} onValueChange={setMirrorPartialSells} trackColor={{ true: '#00F0FF' }} />
            </View>
          </View>
        )}

        {/* STEP 5: RISK MANAGEMENT */}
        {currentStep === 5 && (
          <View style={styles.stepSection}>
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Daily Loss Limit ($)</Text>
                <TextInput style={styles.textInput} value={dailyLossLimitUsd} onChangeText={setDailyLossLimitUsd} keyboardType="numeric" />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Pause After Losses</Text>
                <TextInput style={styles.textInput} value={pauseAfterLosses} onChangeText={setPauseAfterLosses} keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Max Allowable Drawdown (%)</Text>
              <TextInput style={styles.textInput} value={maxDrawdownPercent} onChangeText={setMaxDrawdownPercent} keyboardType="numeric" />
            </View>

            <View style={[styles.switchRow, { marginTop: 12 }]}>
              <Text style={[styles.switchLabel, { color: '#EF4444' }]}>Emergency Stop Circuit Breaker</Text>
              <Switch value={emergencyStop} onValueChange={setEmergencyStop} trackColor={{ true: '#EF4444' }} />
            </View>
          </View>
        )}

        {/* STEP 6: CONFIRMATION & ACTIVATION */}
        {currentStep === 6 && (
          <View style={styles.stepSection}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryHeader}>Strategy Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Target Trader:</Text>
                <Text style={styles.summaryValue}>{trader.displayName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Destination Wallet:</Text>
                <Text style={styles.summaryValue}>{selectedWalletId.slice(0, 8)}...</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sizing Mode:</Text>
                <Text style={styles.summaryValue}>{sizingMode} (${fixedAmountUsd})</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Max Daily Spend:</Text>
                <Text style={styles.summaryValue}>${maxDailySpendUsd}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Take Profit / Stop Loss:</Text>
                <Text style={styles.summaryValue}>+{takeProfitPercentage}% / -{stopLossPercentage}%</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Daily Loss Limit:</Text>
                <Text style={styles.summaryValue}>${dailyLossLimitUsd}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer Navigation Buttons */}
      <View style={styles.footerRow}>
        {currentStep > 1 ? (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.backBtn} onPress={onCancel}>
            <Text style={styles.backText}>Cancel</Text>
          </TouchableOpacity>
        )}

        {currentStep < 6 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextText}>Next Step</Text>
            <Ionicons name="arrow-forward" size={16} color="#000" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.activateBtn} onPress={handleConfirmAndActivate} disabled={isSubmitting}>
            <Ionicons name="flash" size={16} color="#000" style={{ marginRight: 4 }} />
            <Text style={styles.activateText}>{isSubmitting ? 'Activating...' : 'Activate Strategy'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A10',
    padding: 16,
  },
  stepHeader: {
    marginBottom: 16,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E1E2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#00F0FF30',
  },
  stepDotCurrent: {
    backgroundColor: '#00F0FF',
  },
  stepDotText: {
    color: '#606075',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepDotTextActive: {
    color: '#00F0FF',
  },
  stepTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bodyScroll: {
    flex: 1,
  },
  stepSection: {
    gap: 12,
  },
  sectionDesc: {
    color: '#808095',
    fontSize: 13,
    marginBottom: 8,
  },
  walletItem: {
    backgroundColor: '#12121A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222232',
    marginBottom: 8,
  },
  walletItemActive: {
    borderColor: '#00F0FF',
    backgroundColor: '#00F0FF10',
  },
  walletItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  walletItemName: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  walletItemChain: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  walletItemAddr: {
    color: '#808095',
    fontSize: 11,
    fontFamily: 'Courier',
    marginBottom: 8,
  },
  walletItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletItemBal: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fieldLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeBtn: {
    flex: 1,
    backgroundColor: '#12121A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222232',
  },
  modeBtnActive: {
    borderColor: '#00F0FF',
    backgroundColor: '#00F0FF20',
  },
  modeText: {
    color: '#808095',
    fontSize: 11,
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#00F0FF',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    color: '#808095',
    fontSize: 11,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#12121A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A3C',
    color: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#12121A',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222232',
    marginBottom: 8,
  },
  switchLabel: {
    color: '#FFF',
    fontSize: 13,
  },
  summaryCard: {
    backgroundColor: '#12121A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#00F0FF40',
    gap: 10,
  },
  summaryHeader: {
    color: '#00F0FF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: '#808095',
    fontSize: 13,
  },
  summaryValue: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1A1A26',
  },
  backBtn: {
    flex: 1,
    backgroundColor: '#1E1E2E',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  backText: {
    color: '#FFF',
    fontWeight: '600',
  },
  nextBtn: {
    flex: 2,
    backgroundColor: '#00F0FF',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  nextText: {
    color: '#000',
    fontWeight: 'bold',
  },
  activateBtn: {
    flex: 2,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activateText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
