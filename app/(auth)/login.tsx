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
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

function friendlyLoginError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === 'INVALID_CREDENTIALS') return 'Incorrect email or password. Please try again.';
    if (err.message.includes('cancelled') || err.message.includes('cancel')) return 'Google sign-in was cancelled.';
    if (err.message) return err.message;
  }
  return 'Login failed. Please try again.';
}

export default function LoginScreen() {
  const router = useRouter();
  const { login, googleLogin } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const scrollToBottom = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      setServerError(friendlyLoginError(err));
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onGoogleLogin = async () => {
    setServerError(null);
    setIsGoogleLoading(true);
    try {
      await googleLogin();
      router.replace('/(tabs)');
    } catch (err: unknown) {
      setServerError(friendlyLoginError(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#6366F1' }}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />

      {/* Fixed indigo header */}
      <View style={{ overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.07)', top: -70, right: -50 }} />
        <View style={{ position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.05)', top: 20, left: -30 }} />
        <View style={{ position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)', bottom: 10, right: 80 }} />

        <SafeAreaView edges={['top']}>
          <View style={{ alignItems: 'center', paddingVertical: 26, paddingHorizontal: 24 }}>
            <View style={{
              width: 74, height: 74, borderRadius: 22,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
              alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              <Ionicons name="school" size={36} color="#fff" />
            </View>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>
              MiniLMS
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 3 }}>
              Your learning companion
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
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 48,
            minHeight: SCREEN_H * 0.68,
          }}>

            <Text style={{ fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 4, letterSpacing: -0.5 }}>
              Welcome back
            </Text>
            <Text style={{ color: '#64748B', fontSize: 15, marginBottom: 24, lineHeight: 22 }}>
              Sign in to continue your learning
            </Text>

            {/* Server error */}
            {serverError ? (
              <View style={{
                backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
                borderRadius: 14, padding: 14, marginBottom: 20,
                flexDirection: 'row', alignItems: 'flex-start',
              }}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginTop: 1 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: '#DC2626', fontSize: 13, lineHeight: 19 }}>
                    {serverError}
                  </Text>
                  {serverError.includes('Incorrect') && (
                    <Pressable onPress={() => router.push('/(auth)/register')} hitSlop={8}>
                      <Text style={{ color: '#6366F1', fontSize: 13, fontWeight: '700', marginTop: 4 }}>
                        Don't have an account? Sign up →
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ) : null}

            {/* ── Google Sign-In Button ── */}
            <Pressable
              onPress={onGoogleLogin}
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
                    Continue with Google
                  </Text>
                </View>
              )}
            </Pressable>

            {/* ── OR divider ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
              <Text style={{ color: '#94A3B8', fontSize: 12, marginHorizontal: 12, fontWeight: '500' }}>
                OR
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            </View>

            {/* ── Email field ── */}
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
                />
              )}
            />

            {/* ── Password field ── */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry
                  icon="lock-closed-outline"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.password?.message}
                  onFocus={scrollToBottom}
                />
              )}
            />

            <Pressable
              onPress={() => router.push('/(auth)/forgot-password')}
              style={{ alignSelf: 'flex-end', marginTop: -4, marginBottom: 24 }}
              hitSlop={8}
            >
              <Text style={{ color: '#6366F1', fontSize: 13, fontWeight: '600' }}>
                Forgot password?
              </Text>
            </Pressable>

            {/* ── Sign In Button ── */}
            <View style={{
              backgroundColor: '#6366F1',
              borderRadius: 14,
              overflow: 'hidden',
              elevation: 6,
              shadowColor: '#6366F1',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              opacity: isSubmitting ? 0.72 : 1,
            }}>
              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting || isGoogleLoading}
                android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                style={{ paddingVertical: 17, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>
                  {isSubmitting ? 'Signing in…' : 'Sign In'}
                </Text>
              </Pressable>
            </View>

            {/* ── Sign up link ── */}
            <View style={{
              marginTop: 24,
              paddingTop: 20,
              borderTopWidth: 1,
              borderTopColor: '#F1F5F9',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#64748B', fontSize: 14 }}>Don't have an account? </Text>
              <Pressable onPress={() => router.push('/(auth)/register')} hitSlop={8}>
                <Text style={{ color: '#6366F1', fontWeight: '700', fontSize: 14 }}>
                  Sign up
                </Text>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
