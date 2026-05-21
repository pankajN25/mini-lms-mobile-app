import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useProgress } from '@/hooks/useProgress';
import { getWeeklyActivity } from '@/store/activity.store';

const LOCAL_AVATAR_KEY = '@mini_lms/local_avatar';

// ─── Initials avatar ─────────────────────────────────────────────────────────

function InitialsAvatar({ name, size }: { name: string; size: number }) {
  const palette = ['#6366F1', '#7C3AED', '#059669', '#0EA5E9', '#D97706'];
  const bg = palette[name.charCodeAt(0) % palette.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: size * 0.33, fontWeight: '800' }}>
        {name.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ value, label, icon, color, bg, onPress }: {
  value: string | number; label: string; icon: string; color: string; bg: string; onPress?: () => void;
}) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: '#fff',
      borderRadius: 18,
      overflow: 'hidden',
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 5,
    }}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: `${bg}88` }}
        style={{ paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center' }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', marginBottom: 9 }}>
          <Ionicons name={icon as never} size={21} color={color} />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 }}>{value}</Text>
        <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 3, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' }}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Weekly activity chart ────────────────────────────────────────────────────

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function WeeklyChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const todayIdx = (new Date().getDay() + 6) % 7; // 0=Mon…6=Sun

  return (
    <View style={{
      marginHorizontal: 16,
      marginTop: 20,
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 18,
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      elevation: 4,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="bar-chart-outline" size={18} color="#6366F1" />
        </View>
        <View style={{ marginLeft: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>Weekly Activity</Text>
          <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 1 }}>Lessons completed this week</Text>
        </View>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#6366F1', marginLeft: 'auto' }}>
          {data.reduce((s, v) => s + v, 0)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 80 }}>
        {data.map((count, i) => {
          const isToday = i === todayIdx;
          const barH = max === 0 ? 4 : Math.max((count / max) * 72, count > 0 ? 8 : 4);
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 80 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: count > 0 ? '#6366F1' : '#CBD5E1', marginBottom: 4 }}>
                {count > 0 ? count : ''}
              </Text>
              <View style={{
                width: 28, height: barH, borderRadius: 6,
                backgroundColor: isToday ? '#6366F1' : count > 0 ? '#C7D2FE' : '#F1F5F9',
              }} />
              <Text style={{ fontSize: 9, color: isToday ? '#6366F1' : '#94A3B8', fontWeight: isToday ? '800' : '600', marginTop: 5 }}>
                {DAY_LABELS[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginLeft: 2 }}>
      <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: '#6366F1', marginRight: 8 }} />
      <Text style={{ fontSize: 12, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {title}
      </Text>
    </View>
  );
}

// ─── Account info row ─────────────────────────────────────────────────────────
// Uses plain View (not Pressable) — no android_ripple conflict

function InfoRow({ icon, label, value, last, badge }: {
  icon: string; label: string; value: string; last?: boolean; badge?: React.ReactNode;
}) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: '#F1F5F9',
    }}>
      {/* Icon box */}
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon as never} size={17} color="#6366F1" />
      </View>
      {/* Text — explicit marginLeft instead of gap */}
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 14, color: '#0F172A', fontWeight: '600' }}>{value}</Text>
      </View>
      {badge ? <View style={{ marginLeft: 8 }}>{badge}</View> : null}
    </View>
  );
}

// ─── Menu row (tappable) ──────────────────────────────────────────────────────
// Key: outer View handles layout; inner Pressable only captures touch.
// This avoids the android_ripple + gap conflict that breaks flexDirection on Android.

function MenuRow({ icon, label, iconBg, iconColor, last, rightText, badge, onPress }: {
  icon: string; label: string; iconBg: string; iconColor: string;
  last?: boolean; rightText?: string; badge?: string; onPress?: () => void;
}) {
  return (
    <View style={{
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: '#F1F5F9',
      backgroundColor: '#fff',
      overflow: 'hidden',
    }}>
      {/* android_ripple cannot have flexDirection:row directly on Pressable — use inner View */}
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
        style={{ paddingVertical: 15, paddingHorizontal: 16 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={icon as never} size={18} color={iconColor} />
          </View>

          <Text style={{ flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '600', marginLeft: 14 }}>
            {label}
          </Text>

          {badge ? (
            <View style={{ backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{badge}</Text>
            </View>
          ) : null}

          {rightText ? (
            <View style={{ backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 }}>
              <Text style={{ fontSize: 12, color: '#3B82F6', fontWeight: '800' }}>{rightText}</Text>
            </View>
          ) : null}

          <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
        </View>
      </Pressable>
    </View>
  );
}

// ─── Version row (not tappable) ───────────────────────────────────────────────

function VersionRow() {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
    }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="phone-portrait-outline" size={18} color="#0EA5E9" />
      </View>
      <Text style={{ flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '600', marginLeft: 14 }}>
        App Version
      </Text>
      <View style={{ backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
        <Text style={{ fontSize: 12, color: '#3B82F6', fontWeight: '800' }}>v1.0.0</Text>
      </View>
    </View>
  );
}

// ─── Learning progress bar ────────────────────────────────────────────────────

function LearningProgress({ enrolled, progress }: { enrolled: number; progress: number }) {
  const barColor = progress >= 80 ? '#10B981' : progress >= 50 ? '#6366F1' : '#F59E0B';
  const msg = progress < 30
    ? 'Just getting started — keep going!'
    : progress < 70
    ? 'Great momentum — keep it up!'
    : "Almost there — you're crushing it!";

  return (
    <View style={{
      marginHorizontal: 16,
      marginTop: 20,
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 18,
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="trending-up" size={18} color="#6366F1" />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>Learning Progress</Text>
            <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 1 }}>
              {enrolled} course{enrolled !== 1 ? 's' : ''} enrolled
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '900', color: barColor }}>{progress}%</Text>
      </View>
      <View style={{ height: 8, backgroundColor: '#F1F5F9', borderRadius: 6, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${Math.max(progress, 2)}%`, borderRadius: 6, backgroundColor: barColor }} />
      </View>
      <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 10 }}>{msg}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { bookmarks } = useBookmarks();
  const { enrolledIds } = useEnrollments();
  const { getTotalPercent } = useProgress();
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    if (user?.id) {
      void AsyncStorage.getItem(`${LOCAL_AVATAR_KEY}_${user.id}`).then((val) => {
        if (val) setLocalAvatar(val);
      });
    }
  }, [user?.id]);

  useEffect(() => {
    void getWeeklyActivity().then(setWeeklyData);
  }, []);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo access to update your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setPicking(true);
    try {
      const uri = result.assets[0].uri;
      await AsyncStorage.setItem(`${LOCAL_AVATAR_KEY}_${user!.id}`, uri);
      setLocalAvatar(uri);
    } finally {
      setPicking(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  if (!user) return null;

  const avatarUri = localAvatar || (user.avatarUrl || null);
  const progress = getTotalPercent(enrolledIds);

  const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 52 }}>

        {/* ── Indigo hero ── */}
        <View style={{ backgroundColor: '#6366F1', paddingBottom: 72, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.07)', top: -80, right: -60 }} />
          <View style={{ position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)', top: 40, left: -40 }} />
          <View style={{ position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)', bottom: 18, right: 100 }} />

          <SafeAreaView edges={['top']}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 }}>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>My Profile</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 13, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
                <Ionicons name="shield-checkmark" size={12} color="#A5F3FC" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'capitalize', marginLeft: 5 }}>
                  {user.role.toLowerCase()}
                </Text>
              </View>
            </View>
          </SafeAreaView>

          {/* Avatar */}
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <Pressable onPress={() => void handlePickImage()} style={{ position: 'relative' }}>
              <View style={{ width: 118, height: 118, borderRadius: 59, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 108, height: 108, borderRadius: 54, borderWidth: 3, borderColor: '#fff', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={{ width: 102, height: 102 }} contentFit="cover" transition={200} />
                  ) : (
                    <InitialsAvatar name={user.username} size={102} />
                  )}
                </View>
              </View>
              <View style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff',
                alignItems: 'center', justifyContent: 'center',
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2, shadowRadius: 4, elevation: 6,
                borderWidth: 2, borderColor: '#EEF2FF',
              }}>
                {picking
                  ? <ActivityIndicator size="small" color="#6366F1" />
                  : <Ionicons name="camera" size={15} color="#6366F1" />
                }
              </View>
            </Pressable>

            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 13, letterSpacing: -0.3 }}>
              {user.username}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 3, fontWeight: '500' }}>
              {user.email}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 11 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="ribbon" size={13} color="#FCD34D" />
                  <Text style={{ color: '#FCD34D', fontSize: 12, fontWeight: '800', marginLeft: 6 }}>Active Learner</Text>
                </View>
              </View>
              <Pressable
                onPress={() => router.push('/settings/edit-profile')}
                hitSlop={8}
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginLeft: 10 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="pencil-outline" size={12} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 5 }}>Edit Profile</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── Stats row ── */}
        <View style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: -36 }}>
          <View style={{ flex: 1, marginRight: 5 }}>
            <StatCard
              value={enrolledIds.length}
              label="Enrolled"
              icon="book"
              color="#6366F1"
              bg="#EEF2FF"
              onPress={() => router.push('/')}
            />
          </View>
          <View style={{ flex: 1, marginHorizontal: 5 }}>
            <StatCard
              value={bookmarks.length}
              label="Saved"
              icon="bookmark"
              color="#7C3AED"
              bg="#F5F3FF"
              onPress={() => router.push('/bookmarks')}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 5 }}>
            <StatCard
              value={`${progress}%`}
              label="Progress"
              icon="trending-up"
              color="#059669"
              bg="#F0FDF4"
            />
          </View>
        </View>

        {/* ── Learning progress ── */}
        <LearningProgress enrolled={enrolledIds.length} progress={progress} />

        {/* ── Weekly activity chart ── */}
        <WeeklyChart data={weeklyData} />

        {/* ── Account ── */}
        <View style={{ marginHorizontal: 16, marginTop: 24 }}>
          <SectionTitle title="Account" />
          <View style={cardStyle}>
            <InfoRow icon="person-outline" label="Username" value={user.username} />
            <InfoRow icon="mail-outline" label="Email Address" value={user.email} />
            <InfoRow
              icon="shield-checkmark-outline"
              label="Role"
              value={user.role.charAt(0) + user.role.slice(1).toLowerCase()}
              last
              badge={
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A', marginRight: 5 }} />
                  <Text style={{ color: '#16A34A', fontSize: 11, fontWeight: '800' }}>Active</Text>
                </View>
              }
            />
          </View>
        </View>

        {/* ── Settings ── */}
        <View style={{ marginHorizontal: 16, marginTop: 22 }}>
          <SectionTitle title="Settings" />
          <View style={cardStyle}>
            <MenuRow icon="notifications-outline" label="Notifications" iconBg="#FFF7ED" iconColor="#F97316" onPress={() => router.push('/notifications')} />
            <MenuRow icon="options-outline" label="Notification Settings" iconBg="#FFF7ED" iconColor="#F97316" onPress={() => router.push('/settings/notifications')} />
            <MenuRow icon="lock-closed-outline" label="Privacy & Security" iconBg="#EEF2FF" iconColor="#6366F1" onPress={() => router.push('/settings/change-password')} />
            <MenuRow icon="color-palette-outline" label="Appearance" iconBg="#FFF0F9" iconColor="#EC4899" onPress={() => router.push('/settings/appearance')} />
            <MenuRow icon="help-circle-outline" label="Help & Support" iconBg="#F0FDF4" iconColor="#16A34A" onPress={() => router.push('/settings/help')} />
            <MenuRow
              icon="gift-outline"
              label="Refer & Earn"
              iconBg="#FEF3C7"
              iconColor="#D97706"
              badge="20% OFF"
              last
              onPress={() => router.push('/settings/refer-earn')}
            />
          </View>
        </View>

        {/* ── About ── */}
        <View style={{ marginHorizontal: 16, marginTop: 22 }}>
          <SectionTitle title="About" />
          <View style={cardStyle}>
            <VersionRow />
            <MenuRow icon="star-outline" label="Rate the App" iconBg="#FFFBEB" iconColor="#F59E0B" onPress={() => {}} />
            <MenuRow icon="document-text-outline" label="Terms of Service" iconBg="#F5F3FF" iconColor="#7C3AED" onPress={() => router.push('/(auth)/terms')} />
            <MenuRow icon="shield-outline" label="Privacy Policy" iconBg="#F0FDF4" iconColor="#059669" last onPress={() => router.push('/(auth)/terms')} />
          </View>
        </View>

        {/* ── Sign Out ── */}
        <View style={{ marginHorizontal: 16, marginTop: 28 }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 18,
            overflow: 'hidden',
            borderWidth: 1.5,
            borderColor: '#FECACA',
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 3,
          }}>
            <Pressable
              onPress={handleLogout}
              android_ripple={{ color: 'rgba(239,68,68,0.12)' }}
              style={{ paddingVertical: 18 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                </View>
                <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '800', marginLeft: 10 }}>Sign Out</Text>
              </View>
            </Pressable>
          </View>

          <Text style={{ textAlign: 'center', color: '#CBD5E1', fontSize: 11, fontWeight: '500', marginTop: 18 }}>
            MiniLMS v1.0.0 · Made with ♥
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}
