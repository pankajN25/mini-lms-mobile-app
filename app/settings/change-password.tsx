import { useRef, useState } from 'react';
import {
  Alert,
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
import { Input } from '@/components/ui/Input';

const schema = z
  .object({
    current: z.string().min(1, 'Current password is required'),
    password: z.string().min(8, 'At least 8 characters required'),
    confirm: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type FormData = z.infer<typeof schema>;

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

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const watchedPw = watch('password') ?? '';
  const strength = getStrength(watchedPw);

  const onSubmit = async (_data: FormData) => {
    setSubmitting(true);
    try {
      await new Promise<void>((r) => setTimeout(r, 1500));
      Alert.alert(
        '✅ Password Changed',
        'Your password has been updated successfully.',
        [{ text: 'Done', onPress: () => router.back() }],
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

      {/* ── Header ── */}
      <View style={{ backgroundColor: '#7C3AED', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)', top: -50, right: -40 }} />
        <View style={{ position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)', top: 20, left: -25 }} />
        <SafeAreaView edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 }}>
            <Pressable onPress={() => router.back()} hitSlop={12}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 }}>Change Password</Text>
              <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 }}>Keep your account secure</Text>
            </View>
            <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Security tip */}
          <View style={{ backgroundColor: '#F5F3FF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#DDD6FE', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="shield" size={16} color="#fff" />
              </View>
              <Text style={{ flex: 1, fontSize: 12, color: '#6D28D9', lineHeight: 19 }}>
                Use a unique password you don't use on other sites. A strong password has 10+ characters with uppercase, numbers, and symbols.
              </Text>
            </View>
          </View>

          {/* Current password */}
          <Controller
            control={control}
            name="current"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Current password"
                placeholder="Enter your current password"
                secureTextEntry
                icon="lock-closed-outline"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.current?.message}
              />
            )}
          />

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4, marginBottom: 16 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', marginHorizontal: 12 }}>NEW PASSWORD</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
          </View>

          {/* New password */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="New password"
                placeholder="At least 8 characters"
                secureTextEntry
                icon="lock-open-outline"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.password?.message}
                onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150)}
              />
            )}
          />

          {/* Strength bar */}
          {watchedPw.length > 0 && (
            <View style={{ marginTop: -8, marginBottom: 18 }}>
              <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < strength.level ? strength.color : '#E2E8F0', marginRight: i < 3 ? 4 : 0 }} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: strength.color, marginRight: 6 }} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: strength.color }}>{strength.label}</Text>
              </View>
            </View>
          )}

          {/* Confirm */}
          <Controller
            control={control}
            name="confirm"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Confirm new password"
                placeholder="Re-enter your new password"
                secureTextEntry
                icon="shield-checkmark-outline"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.confirm?.message}
                onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150)}
              />
            )}
          />

          {/* Tips */}
          <View style={{ backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 28 }}>
            {[
              { tip: 'At least 8 characters', met: watchedPw.length >= 8 },
              { tip: 'Contains a number', met: /\d/.test(watchedPw) },
              { tip: 'Contains a special character', met: /[^A-Za-z0-9]/.test(watchedPw) },
              { tip: 'Mix of upper & lowercase', met: /[A-Z]/.test(watchedPw) && /[a-z]/.test(watchedPw) },
            ].map(({ tip, met }) => (
              <View key={tip} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: met ? '#DCFCE7' : '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <Ionicons name={met ? 'checkmark' : 'remove'} size={11} color={met ? '#16A34A' : '#94A3B8'} />
                </View>
                <Text style={{ fontSize: 12, color: met ? '#15803D' : '#94A3B8', fontWeight: met ? '700' : '500' }}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Submit */}
          <View style={{ borderRadius: 16, overflow: 'hidden', elevation: 6, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, opacity: submitting ? 0.72 : 1 }}>
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={submitting}
              android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
              style={{ backgroundColor: '#7C3AED', paddingVertical: 17, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
                {submitting ? 'Updating password…' : 'Update Password'}
              </Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
