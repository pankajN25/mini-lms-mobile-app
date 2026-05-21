import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';

const { height: SCREEN_H } = Dimensions.get('window');

const schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

function getStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw) || pw.length >= 12) score++;
  return Math.min(score, 3) as 0 | 1 | 2 | 3;
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const strength = getStrength(password);
  const colors: Record<number, string> = { 1: '#EF4444', 2: '#F59E0B', 3: '#10B981' };
  const labels: Record<number, string> = { 1: 'Weak', 2: 'Fair', 3: 'Strong' };
  const color = colors[strength] ?? '#E2E8F0';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: -10, marginBottom: 14 }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            flex: 1, height: 3, borderRadius: 2, marginRight: 4,
            backgroundColor: i <= strength ? color : '#E2E8F0',
          }}
        />
      ))}
      <Text style={{ fontSize: 11, color, fontWeight: '700', minWidth: 40, textAlign: 'right' }}>
        {labels[strength] ?? ''}
      </Text>
    </View>
  );
}

function friendlyRegisterError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === 'EMAIL_TAKEN')    return 'This email is already registered. Sign in instead.';
    if (err.message === 'USERNAME_TAKEN') return 'This username is taken. Try a different one.';
    if (err.message) return err.message;
  }
  return 'Registration failed. Please try again.';
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register, googleLogin } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const scrollToBottom = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);

  const onGoogleRegister = async () => {
    setServerError(null);
    setIsGoogleLoading(true);
    try {
      await googleLogin();
      router.replace('/(tabs)');
    } catch (err: unknown) {
      if (err instanceof Error && (err.message.includes('cancelled') || err.message.includes('cancel'))) return;
      setServerError('Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!agreedToTerms) {
      setTermsError(true);
      scrollRef.current?.scrollToEnd({ animated: true });
      return;
    }
    setTermsError(false);
    setServerError(null);
    setIsSubmitting(true);
    try {
      await register(data.username, data.email, data.password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const msg = friendlyRegisterError(err);
      setServerError(msg);
      // Scroll to top so the user sees the error banner
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#7C3AED' }}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

      {/* Fixed violet header */}
      <View style={{ overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.07)', top: -70, left: -50 }} />
        <View style={{ position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.05)', top: 20, right: -30 }} />
        <View style={{ position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)', bottom: 10, left: 80 }} />

        <SafeAreaView edges={['top']}>
          <View style={{ alignItems: 'center', paddingVertical: 22, paddingHorizontal: 24 }}>
            <View style={{
              width: 68, height: 68, borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
              alignItems: 'center', justifyContent: 'center', marginBottom: 10,
            }}>
              <Ionicons name="rocket" size={32} color="#fff" />
            </View>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 }}>
              MiniLMS
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 2 }}>
              Start your learning journey
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Form card */}
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
            paddingTop: 34,
            paddingBottom: 48,
            minHeight: SCREEN_H * 0.74,
          }}>

            <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 4, letterSpacing: -0.5 }}>
              Create account
            </Text>
            <Text style={{ color: '#64748B', fontSize: 14, marginBottom: 22, lineHeight: 20 }}>
              Join thousands of learners today
            </Text>

            {/* ── Google Sign-Up Button ── */}
            <Pressable
              onPress={onGoogleRegister}
              disabled={isGoogleLoading || isSubmitting}
              android_ripple={{ color: 'rgba(0,0,0,0.05)', borderless: false }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? '#F8F9FF' : '#fff',
                borderWidth: 1,
                borderColor: '#DADCE0',
                borderRadius: 50,
                paddingVertical: 13,
                paddingHorizontal: 24,
                marginBottom: 20,
                elevation: 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 2,
                opacity: isGoogleLoading ? 0.65 : 1,
              })}
            >
              {isGoogleLoading ? (
                <ActivityIndicator size="small" color="#4285F4" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Image
                    source={require('../../assets/goole_icon.png')}
                    style={{ width: 22, height: 22 }}
                    resizeMode="contain"
                  />
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '500',
                    color: '#3C4043',
                    marginLeft: 10,
                    letterSpacing: 0.25,
                  }}>
                    Sign up with Google
                  </Text>
                </View>
              )}
            </Pressable>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
              <Text style={{ color: '#94A3B8', fontSize: 12, marginHorizontal: 12, fontWeight: '500' }}>
                OR
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            </View>

            {/* Server error */}
            {serverError ? (
              <View style={{
                backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
                borderRadius: 14, padding: 14, marginBottom: 18,
                flexDirection: 'row', alignItems: 'flex-start',
              }}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginTop: 1 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: '#DC2626', fontSize: 13, lineHeight: 19 }}>
                    {serverError}
                  </Text>
                  {serverError.includes('already taken') && (
                    <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={8}>
                      <Text style={{ color: '#7C3AED', fontSize: 13, fontWeight: '700', marginTop: 4 }}>
                        Sign in instead →
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ) : null}

            {/* Username */}
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Username"
                  placeholder="e.g. john_doe123"
                  icon="person-outline"
                  autoComplete="username"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.username?.message}
                />
              )}
            />

            {/* Email */}
            <Controller
              control={control}
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
                  error={errors.email?.message}
                  onFocus={scrollToBottom}
                />
              )}
            />

            {/* Password */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value, onBlur } }) => (
                <>
                  <Input
                    label="Password"
                    placeholder="Min. 8 characters"
                    secureTextEntry
                    icon="lock-closed-outline"
                    onChangeText={(v) => { onChange(v); setPasswordValue(v); }}
                    onBlur={onBlur}
                    value={value}
                    error={errors.password?.message}
                    onFocus={scrollToBottom}
                  />
                  <PasswordStrength password={passwordValue} />
                </>
              )}
            />

            {/* ── Terms & Privacy checkbox ── */}
            <View style={{ marginTop: 6, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                {/* Checkbox — standalone Pressable so it doesn't conflict with text links */}
                <Pressable
                  onPress={() => { setAgreedToTerms((v) => !v); setTermsError(false); }}
                  hitSlop={8}
                  style={{ marginTop: 2 }}
                >
                  <View style={{
                    width: 22, height: 22, borderRadius: 7,
                    borderWidth: 2,
                    borderColor: termsError ? '#EF4444' : agreedToTerms ? '#7C3AED' : '#CBD5E1',
                    backgroundColor: agreedToTerms ? '#7C3AED' : '#fff',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {agreedToTerms && <Ionicons name="checkmark" size={13} color="#fff" />}
                  </View>
                </Pressable>

                {/* Agreement text with tappable links */}
                <Text style={{ flex: 1, fontSize: 13, color: '#64748B', lineHeight: 21, marginLeft: 11 }}>
                  I have read and agree to the{' '}
                  <Text
                    style={{ color: '#7C3AED', fontWeight: '700' }}
                    onPress={() => router.push('/(auth)/terms')}
                  >
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text
                    style={{ color: '#7C3AED', fontWeight: '700' }}
                    onPress={() => router.push('/(auth)/terms')}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </View>

              {/* Terms validation error */}
              {termsError && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 33 }}>
                  <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontSize: 12, marginLeft: 5 }}>
                    Please accept the Terms of Service to continue
                  </Text>
                </View>
              )}
            </View>

            {/* ── Create Account Button ── */}
            {/* Outer View owns bg/shadow; Pressable only handles touch + ripple */}
            <View style={{
              backgroundColor: '#7C3AED',
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: 28,
              elevation: 6,
              shadowColor: '#7C3AED',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              opacity: isSubmitting ? 0.72 : 1,
            }}>
              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 }}>
                  {isSubmitting ? 'Creating account…' : 'Create Account'}
                </Text>
              </Pressable>
            </View>

            <View style={{
              marginTop: 8,
              paddingTop: 20,
              borderTopWidth: 1,
              borderTopColor: '#F1F5F9',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#64748B', fontSize: 14 }}>Already have an account? </Text>
              <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={8}>
                <Text style={{ color: '#7C3AED', fontWeight: '700', fontSize: 14 }}>Sign in</Text>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
