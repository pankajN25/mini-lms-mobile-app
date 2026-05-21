import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface ToggleItem {
  id: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
}

const TOGGLES: ToggleItem[] = [
  {
    id: 'course_updates',
    icon: 'book-outline',
    iconBg: '#EEF2FF', iconColor: '#6366F1',
    title: 'Course Updates',
    subtitle: 'New lessons, content changes and instructor announcements',
  },
  {
    id: 'reminders',
    icon: 'alarm-outline',
    iconBg: '#FFF7ED', iconColor: '#F97316',
    title: 'Learning Reminders',
    subtitle: 'Daily nudges to keep your learning streak alive',
  },
  {
    id: 'streak',
    icon: 'flame-outline',
    iconBg: '#FEF2F2', iconColor: '#EF4444',
    title: 'Streak Alerts',
    subtitle: 'Get notified before your daily streak resets',
  },
  {
    id: 'messages',
    icon: 'chatbubble-outline',
    iconBg: '#F0F9FF', iconColor: '#0EA5E9',
    title: 'Messages',
    subtitle: 'Replies to your questions and instructor messages',
  },
  {
    id: 'progress',
    icon: 'trending-up-outline',
    iconBg: '#F0FDF4', iconColor: '#10B981',
    title: 'Weekly Progress Report',
    subtitle: 'A summary of your learning activity every Sunday',
  },
  {
    id: 'promotions',
    icon: 'pricetag-outline',
    iconBg: '#FFFBEB', iconColor: '#F59E0B',
    title: 'Offers & Promotions',
    subtitle: 'Discounts, flash sales and new course launches',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, boolean>>({
    course_updates: true,
    reminders: true,
    streak: true,
    messages: true,
    progress: false,
    promotions: false,
  });

  const toggle = (id: string) =>
    setValues((v) => ({ ...v, [id]: !v[id] }));

  const handleSave = () => {
    Alert.alert('Saved', 'Your notification preferences have been updated.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#F97316" />

      {/* ── Header ── */}
      <View style={{ backgroundColor: '#F97316', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)', top: -50, right: -40 }} />
        <View style={{ position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)', top: 20, left: -25 }} />
        <SafeAreaView edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 }}>
            <Pressable onPress={() => router.back()} hitSlop={12}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 }}>Notifications</Text>
              <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 }}>Choose what you want to hear about</Text>
            </View>
            <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="notifications" size={20} color="#fff" />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Toggle list */}
        <View style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 }}>
          {TOGGLES.map((item, i) => (
            <View key={item.id} style={{ borderBottomWidth: i < TOGGLES.length - 1 ? 1 : 0, borderBottomColor: '#F1F5F9' }}>
              <Pressable
                onPress={() => toggle(item.id)}
                android_ripple={{ color: 'rgba(0,0,0,0.04)' }}
                style={{ paddingVertical: 14, paddingHorizontal: 16 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: item.iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <Ionicons name={item.icon as never} size={19} color={item.iconColor} />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>{item.title}</Text>
                    <Text style={{ fontSize: 12, color: '#94A3B8', lineHeight: 17, marginTop: 2 }}>{item.subtitle}</Text>
                  </View>
                  <Switch
                    value={values[item.id]}
                    onValueChange={() => toggle(item.id)}
                    trackColor={{ false: '#E2E8F0', true: '#F97316' }}
                    thumbColor="#fff"
                  />
                </View>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Info note */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 16, backgroundColor: '#FFF7ED', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FED7AA' }}>
          <Ionicons name="information-circle-outline" size={16} color="#F97316" style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontSize: 12, color: '#C2410C', lineHeight: 18, marginLeft: 10 }}>
            You can also manage notifications in your device Settings → Apps → MiniLMS.
          </Text>
        </View>

        {/* Save button */}
        <View style={{ marginTop: 28, borderRadius: 16, overflow: 'hidden', elevation: 6, shadowColor: '#F97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12 }}>
          <Pressable
            onPress={handleSave}
            android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
            style={{ backgroundColor: '#F97316', paddingVertical: 17, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Save Preferences</Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}
