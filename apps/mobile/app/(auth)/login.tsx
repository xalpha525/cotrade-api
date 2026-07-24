import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { PrivyService } from '@/services/privy.service';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { authenticateWithBackend } = useAuth();

  useEffect(() => {
    try {
      PrivyService.init();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      console.error('[LOGIN] Privy initialization error:', msg);
    }
  }, []);

  const handleSendOTP = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setErrorMessage(null);
    setLoading(true);

    try {
      await PrivyService.sendEmailOTP(trimmedEmail);
      setStep('OTP');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP';
      setErrorMessage(msg);
      Alert.alert('Authentication Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const trimmedCode = otpCode.trim();
    if (!trimmedCode) return;

    setErrorMessage(null);
    setLoading(true);

    try {
      const authRes = await PrivyService.verifyEmailOTP(email.trim(), trimmedCode);
      await authenticateWithBackend(authRes.privyToken, {
        privyId: authRes.user.id,
        email: authRes.user.email,
        wallets: authRes.user.wallets,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OTP Verification Failed';
      setErrorMessage(msg);
      Alert.alert('Authentication Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.bg}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          {/* ── Logo ── */}
          <View style={styles.logoSection}>
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>CT</Text>
            </View>
            <Text style={styles.appName}>CopyTrading</Text>
            <Text style={styles.tagline}>Trade smarter. Copy the best.</Text>
          </View>

          {/* ── Error Banner ── */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* ── Form ── */}
          {step === 'EMAIL' ? (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Sign in with Email</Text>
              <Text style={styles.formSub}>
                We will send a 6-digit verification code via Privy.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textDisabled}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="send"
                  onSubmitEditing={handleSendOTP}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, (!email.trim() || loading) && styles.btnDisabled]}
                onPress={handleSendOTP}
                disabled={!email.trim() || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.background} size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send Verification Code</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Enter Verification Code</Text>
              <Text style={styles.formSub}>
                Code sent to <Text style={styles.emailHighlight}>{email}</Text>
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>6-DIGIT CODE</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="123456"
                  placeholderTextColor={Colors.textDisabled}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOTP}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, (!otpCode.trim() || loading) && styles.btnDisabled]}
                onPress={handleVerifyOTP}
                disabled={!otpCode.trim() || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.background} size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify & Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => {
                  setStep('EMAIL');
                  setOtpCode('');
                }}
                disabled={loading}
              >
                <Text style={styles.backBtnText}>Change Email</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Footer ── */}
          <Text style={styles.footer}>
            Protected by Privy Authentication. By continuing you agree to our{' '}
            <Text style={styles.footerLink}>Terms</Text> &{' '}
            <Text style={styles.footerLink}>Privacy</Text>
          </Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.background },
  safe: { flex: 1 },
  kav: { flex: 1, justifyContent: 'space-between', padding: Spacing.lg },

  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  logoMarkText: {
    fontSize: Typography.xl,
    fontWeight: Typography.heavy,
    color: Colors.background,
    letterSpacing: -1,
  },
  appName: {
    fontSize: Typography.xxl,
    fontWeight: Typography.heavy,
    color: Colors.textPrimary,
    letterSpacing: Typography.tight,
  },
  tagline: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    letterSpacing: Typography.normal,
  },

  errorBanner: {
    backgroundColor: Colors.bearishDim,
    borderColor: Colors.bearish,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.bearish,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    textAlign: 'center',
  },

  form: { gap: Spacing.md },
  formTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: Typography.tight,
  },
  formSub: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  emailHighlight: {
    color: Colors.accent,
    fontWeight: Typography.semibold,
  },

  inputGroup: { gap: Spacing.xs },
  inputLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    letterSpacing: Typography.ultraWide,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  otpInput: {
    fontSize: Typography.xl,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: Typography.bold,
  },

  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  btnDisabled: { opacity: 0.38 },
  primaryBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.background,
    letterSpacing: 0.2,
  },

  backBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  backBtnText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },

  footer: {
    textAlign: 'center',
    fontSize: Typography.xs,
    color: Colors.textDisabled,
    paddingBottom: Spacing.sm,
  },
  footerLink: { color: Colors.textMuted },
});
