import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';

const { height: SCREEN_H } = Dimensions.get('window');

type Step = 'email' | 'otp' | 'newpass' | 'success';

// ── Schemas ───────────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

const passSchema = z
  .object({
    password: z.string().min(8, 'At least 8 characters required'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type EmailForm = z.infer<typeof emailSchema>;
type PassForm = z.infer<typeof passSchema>;

// ── Password strength ─────────────────────────────────────────────────────────

function getStrength(pw: string): { level: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  if (pw.length < 6) return { level: 0, label: '', color: '#EF4444' };
  const hasNum = /\d/.test(pw);
  const hasSpec = /[^A-Za-z0-9]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  if (pw.length >= 10 && hasNum && hasSpec && hasUpper && hasLower)
    return { level: 4, label: 'Strong', color: '#10B981' };
  if (pw.length >= 8 && (hasNum || hasSpec) && (hasUpper || hasLower))
    return { level: 3, label: 'Good', color: '#6366F1' };
  if (pw.length >= 6 && (hasNum || hasSpec || hasUpper))
    return { level: 2, label: 'Fair', color: '#F59E0B' };
  return { level: 1, label: 'Weak', color: '#EF4444' };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function maskEmail(email: string) {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  return `${user.slice(0, 2)}${'*'.repeat(Math.max(2, user.length - 2))}@${domain}`;
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState<Step>('email');
  const [sentEmail, setSentEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const resendTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const passForm = useForm<PassForm>({ resolver: zodResolver(passSchema) });
  const watchedPw = passForm.watch('password') ?? '';
  const strength = getStrength(watchedPw);

  useEffect(
    () => () => { if (resendTimer.current) clearInterval(resendTimer.current); },
    [],
  );

  // ── Back navigation per step ──────────────────────────────────────────────

  const handleBack = () => {
    setError(null);
    if (step === 'email' || step === 'success') router.back();
    else if (step === 'otp') setStep('email');
    else setStep('otp');
  };

  // ── Resend countdown ──────────────────────────────────────────────────────

  const startCountdown = () => {
    setResendIn(60);
    resendTimer.current = setInterval(() => {
      setResendIn((v) => {
        if (v <= 1) { clearInterval(resendTimer.current!); return 0; }
        return v - 1;
      });
    }, 1000);
  };

  // ── Step handlers ─────────────────────────────────────────────────────────

  const handleSendCode = async (data: EmailForm) => {
    setLoading(true);
    setError(null);
    try {
      await delay(1500);
      setSentEmail(data.email);
      setOtp(['', '', '', '', '', '']);
      setStep('otp');
      startCountdown();
    } catch {
      setError('Could not send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter the complete 6-digit code.'); return; }
    setLoading(true);
    setError(null);
    try {
      await delay(1200);
      setStep('newpass');
    } catch {
      setError('Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (_data: PassForm) => {
    setLoading(true);
    setError(null);
    try {
      await delay(1500);
      setStep('success');
    } catch {
      setError('Could not reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input ─────────────────────────────────────────────────────────────

  const handleOtpChange = (text: string, i: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (key: string, i: number) => {
    if (key === 'Backspace' && !otp[i] && i > 0) {
      const next = [...otp];
      next[i - 1] = '';
      setOtp(next);
      otpRefs.current[i - 1]?.focus();
    }
  };

  // ── Header meta per step ──────────────────────────────────────────────────

  const meta: Record<Step, { icon: string; title: string; sub: string }> = {
    email: {
      icon: 'lock-open-outline',
      title: 'Forgot Password?',
      sub: 'Enter your email and we\'ll send you a verification code',
    },
    otp: {
      icon: 'mail-outline',
      title: 'Check Your Email',
      sub: `We sent a 6-digit code to ${maskEmail(sentEmail)}`,
    },
    newpass: {
      icon: 'shield-checkmark-outline',
      title: 'New Password',
      sub: 'Create a strong, unique password for your account',
    },
    success: {
      icon: 'checkmark-circle-outline',
      title: 'All Done!',
      sub: 'Your password has been reset successfully',
    },
  };
  const m = meta[step];

  // ── Progress steps ────────────────────────────────────────────────────────

  const STEPS: Step[] = ['email', 'otp', 'newpass'];
  const stepIdx = STEPS.indexOf(step);

  // ── Shared button style ───────────────────────────────────────────────────

  const btnContainer = (disabled?: boolean) => ({
    backgroundColor: '#6366F1',
    borderRadius: 16,
    overflow: 'hidden' as const,
    elevation: 6,
    shadowColor: '#6366F1' as const,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    opacity: disabled ? 0.65 : 1,
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#6366F1' }}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />

      {/* ── Indigo header ── */}
      <View style={{ overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.07)', top: -70, right: -50 }} />
        <View style={{ position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.05)', top: 20, left: -30 }} />
        <View style={{ position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)', bottom: 10, right: 80 }} />

        <SafeAreaView edges={['top']}>
          {/* Back button row */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <Pressable
              onPress={handleBack}
              hitSlop={12}
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Icon + title */}
          <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 26, paddingHorizontal: 28 }}>
            <View style={{
              width: 76, height: 76, borderRadius: 22,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
              alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}>
              <Ionicons name={m.icon as never} size={36} color="#fff" />
            </View>
            <Text style={{ color: '#fff', fontSize: 23, fontWeight: '900', letterSpacing: -0.5 }}>
              {m.title}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
              {m.sub}
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {/* ── Form card ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 28,
            paddingTop: 30,
            paddingBottom: 52,
            minHeight: SCREEN_H * 0.6,
          }}>

            {/* ── Step progress indicators ── */}
            {step !== 'success' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30 }}>
                {STEPS.map((s, i) => {
                  const done = stepIdx > i;
                  const active = step === s;
                  return (
                    <View key={s} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 34, height: 34, borderRadius: 17,
                        backgroundColor: done ? '#10B981' : active ? '#6366F1' : '#EEF2FF',
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: active ? 0 : 1.5,
                        borderColor: done ? '#10B981' : active ? '#6366F1' : '#C7D2FE',
                      }}>
                        {done
                          ? <Ionicons name="checkmark" size={17} color="#fff" />
                          : <Text style={{ color: active ? '#fff' : '#A5B4FC', fontSize: 13, fontWeight: '800' }}>{i + 1}</Text>
                        }
                      </View>
                      {i < STEPS.length - 1 && (
                        <View style={{ width: 44, height: 2.5, backgroundColor: done ? '#10B981' : '#E2E8F0', marginHorizontal: 5, borderRadius: 2 }} />
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── Error banner ── */}
            {error && (
              <View style={{
                backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
                borderRadius: 14, padding: 14, marginBottom: 22,
                flexDirection: 'row', alignItems: 'flex-start',
              }}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginTop: 1 }} />
                <Text style={{ color: '#DC2626', fontSize: 13, lineHeight: 19, flex: 1, marginLeft: 10 }}>
                  {error}
                </Text>
                <Pressable onPress={() => setError(null)} hitSlop={8} style={{ marginLeft: 8 }}>
                  <Ionicons name="close" size={16} color="#EF4444" />
                </Pressable>
              </View>
            )}

            {/* ════════════════════════════════════════
                STEP 1 — Email entry
            ════════════════════════════════════════ */}
            {step === 'email' && (
              <>
                <Controller
                  control={emailForm.control}
                  name="email"
                  render={({ field: { onChange, value, onBlur } }) => (
                    <Input
                      label="Email address"
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoComplete="email"
                      icon="mail-outline"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      error={emailForm.formState.errors.email?.message}
                    />
                  )}
                />

                {/* Info card */}
                <View style={{
                  backgroundColor: '#EEF2FF', borderRadius: 16, padding: 16,
                  borderWidth: 1, borderColor: '#C7D2FE', marginBottom: 28,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="mail" size={16} color="#fff" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: '#3730A3', fontSize: 13, fontWeight: '800', marginBottom: 4 }}>
                        How it works
                      </Text>
                      <Text style={{ color: '#4338CA', fontSize: 12, lineHeight: 19 }}>
                        We'll email you a 6-digit verification code. Enter the code on the next screen to reset your password.
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={btnContainer(loading)}>
                  <Pressable
                    onPress={emailForm.handleSubmit(handleSendCode)}
                    disabled={loading}
                    android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                    style={{ paddingVertical: 18, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>
                      {loading ? 'Sending code…' : 'Send Reset Code'}
                    </Text>
                  </Pressable>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28 }}>
                  <Text style={{ color: '#64748B', fontSize: 15 }}>Remember your password? </Text>
                  <Pressable onPress={() => router.back()} hitSlop={8}>
                    <Text style={{ color: '#6366F1', fontWeight: '800', fontSize: 15 }}>Sign in</Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* ════════════════════════════════════════
                STEP 2 — OTP verification
            ════════════════════════════════════════ */}
            {step === 'otp' && (
              <>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 20 }}>
                  Enter verification code
                </Text>

                {/* 6-digit OTP boxes */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
                  {otp.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={(r) => { otpRefs.current[i] = r; }}
                      value={digit}
                      onChangeText={(t) => handleOtpChange(t, i)}
                      onKeyPress={({ nativeEvent }) => handleOtpKey(nativeEvent.key, i)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      style={{
                        width: 46, height: 56, borderRadius: 14,
                        borderWidth: 2,
                        borderColor: digit ? '#6366F1' : '#E2E8F0',
                        backgroundColor: digit ? '#EEF2FF' : '#F8FAFC',
                        textAlign: 'center',
                        fontSize: 22, fontWeight: '900', color: '#0F172A',
                        marginHorizontal: 4,
                      }}
                    />
                  ))}
                </View>

                {/* Sent to label */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, marginTop: 8 }}>
                  <Ionicons name="mail-outline" size={13} color="#94A3B8" />
                  <Text style={{ color: '#94A3B8', fontSize: 12, marginLeft: 5 }}>
                    Code sent to {maskEmail(sentEmail)}
                  </Text>
                </View>

                {/* Resend */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: '#F8FAFC', borderRadius: 14, paddingVertical: 12,
                  paddingHorizontal: 16, marginBottom: 28,
                  borderWidth: 1, borderColor: '#E2E8F0',
                }}>
                  <Ionicons
                    name={resendIn > 0 ? 'time-outline' : 'refresh-outline'}
                    size={15}
                    color={resendIn > 0 ? '#94A3B8' : '#6366F1'}
                  />
                  {resendIn > 0 ? (
                    <Text style={{ color: '#94A3B8', fontSize: 13, marginLeft: 7 }}>
                      Resend code in <Text style={{ fontWeight: '800' }}>{resendIn}s</Text>
                    </Text>
                  ) : (
                    <Pressable
                      onPress={() => {
                        setOtp(['', '', '', '', '', '']);
                        setError(null);
                        startCountdown();
                      }}
                      hitSlop={8}
                    >
                      <Text style={{ color: '#6366F1', fontSize: 13, fontWeight: '800', marginLeft: 7 }}>
                        Resend verification code
                      </Text>
                    </Pressable>
                  )}
                </View>

                <View style={btnContainer(loading || otp.join('').length < 6)}>
                  <Pressable
                    onPress={() => void handleVerifyOtp()}
                    disabled={loading || otp.join('').length < 6}
                    android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                    style={{ paddingVertical: 18, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>
                      {loading ? 'Verifying…' : 'Verify Code'}
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => { setStep('email'); setError(null); }}
                  hitSlop={8}
                  style={{ alignItems: 'center', marginTop: 20 }}
                >
                  <Text style={{ color: '#6366F1', fontSize: 13, fontWeight: '700' }}>
                    ← Use a different email
                  </Text>
                </Pressable>
              </>
            )}

            {/* ════════════════════════════════════════
                STEP 3 — New password
            ════════════════════════════════════════ */}
            {step === 'newpass' && (
              <>
                <Controller
                  control={passForm.control}
                  name="password"
                  render={({ field: { onChange, value, onBlur } }) => (
                    <Input
                      label="New password"
                      placeholder="At least 8 characters"
                      secureTextEntry
                      icon="lock-closed-outline"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      error={passForm.formState.errors.password?.message}
                    />
                  )}
                />

                {/* Strength bar */}
                {watchedPw.length > 0 && (
                  <View style={{ marginTop: -6, marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                      {[0, 1, 2, 3].map((i) => (
                        <View
                          key={i}
                          style={{
                            flex: 1, height: 4, borderRadius: 2,
                            backgroundColor: i < strength.level ? strength.color : '#E2E8F0',
                            marginRight: i < 3 ? 4 : 0,
                          }}
                        />
                      ))}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: strength.color, marginRight: 6 }} />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: strength.color }}>
                        {strength.label}
                      </Text>
                    </View>
                  </View>
                )}

                <Controller
                  control={passForm.control}
                  name="confirm"
                  render={({ field: { onChange, value, onBlur } }) => (
                    <Input
                      label="Confirm new password"
                      placeholder="Re-enter your password"
                      secureTextEntry
                      icon="shield-checkmark-outline"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      error={passForm.formState.errors.confirm?.message}
                      onFocus={() =>
                        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150)
                      }
                    />
                  )}
                />

                {/* Password tips */}
                <View style={{
                  backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14,
                  borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24,
                }}>
                  {[
                    { tip: 'At least 8 characters', met: watchedPw.length >= 8 },
                    { tip: 'Contains a number (0–9)', met: /\d/.test(watchedPw) },
                    { tip: 'Contains a special character', met: /[^A-Za-z0-9]/.test(watchedPw) },
                    { tip: 'Mix of upper & lowercase', met: /[A-Z]/.test(watchedPw) && /[a-z]/.test(watchedPw) },
                  ].map(({ tip, met }) => (
                    <View key={tip} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{
                        width: 18, height: 18, borderRadius: 9,
                        backgroundColor: met ? '#DCFCE7' : '#F1F5F9',
                        alignItems: 'center', justifyContent: 'center', marginRight: 10,
                      }}>
                        <Ionicons
                          name={met ? 'checkmark' : 'remove'}
                          size={11}
                          color={met ? '#16A34A' : '#94A3B8'}
                        />
                      </View>
                      <Text style={{ fontSize: 12, color: met ? '#15803D' : '#94A3B8', fontWeight: met ? '700' : '500' }}>
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={btnContainer(loading)}>
                  <Pressable
                    onPress={passForm.handleSubmit(handleResetPassword)}
                    disabled={loading}
                    android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                    style={{ paddingVertical: 18, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>
                      {loading ? 'Resetting password…' : 'Reset Password'}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* ════════════════════════════════════════
                STEP 4 — Success
            ════════════════════════════════════════ */}
            {step === 'success' && (
              <View style={{ alignItems: 'center', paddingTop: 16 }}>
                {/* Big success circle */}
                <View style={{
                  width: 110, height: 110, borderRadius: 55,
                  backgroundColor: '#F0FDF4',
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 10,
                  borderWidth: 3, borderColor: '#BBF7D0',
                  shadowColor: '#10B981',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
                }}>
                  <Ionicons name="checkmark-circle" size={68} color="#10B981" />
                </View>

                {/* Confetti dots decoration */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 22, marginTop: 4 }}>
                  {['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#6366F1'].map((c, i) => (
                    <View
                      key={i}
                      style={{
                        width: i === 2 ? 10 : 7, height: i === 2 ? 10 : 7,
                        borderRadius: 5, backgroundColor: c,
                        marginHorizontal: 4, opacity: 0.6,
                      }}
                    />
                  ))}
                </View>

                <Text style={{ fontSize: 24, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 }}>
                  Password Reset!
                </Text>
                <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 36 }}>
                  Your password has been updated successfully.{'\n'}Sign in with your new password to continue.
                </Text>

                {/* What changed card */}
                <View style={{
                  backgroundColor: '#F0FDF4', borderRadius: 16, padding: 16,
                  borderWidth: 1, borderColor: '#BBF7D0', width: '100%', marginBottom: 28,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
                    <Text style={{ color: '#15803D', fontSize: 13, fontWeight: '800', marginLeft: 8 }}>
                      Account secured
                    </Text>
                  </View>
                  <Text style={{ color: '#166534', fontSize: 12, lineHeight: 18, marginLeft: 24 }}>
                    For your safety, you'll be asked to sign in again with your new password.
                  </Text>
                </View>

                <View style={{ alignSelf: 'stretch', ...btnContainer(false) }}>
                  <Pressable
                    onPress={() => router.replace('/(auth)/login')}
                    android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                    style={{ paddingVertical: 18, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>
                      Sign In Now
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
