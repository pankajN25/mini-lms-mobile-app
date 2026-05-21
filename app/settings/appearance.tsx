import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type TextSize = 'small' | 'medium' | 'large';
type Theme = 'light' | 'dark' | 'system';

const TEXT_SIZES: { id: TextSize; label: string; size: number; sub: string }[] = [
  { id: 'small', label: 'Small', size: 12, sub: 'Compact, shows more content' },
  { id: 'medium', label: 'Medium', size: 15, sub: 'Default balanced size' },
  { id: 'large', label: 'Large', size: 18, sub: 'Easier on the eyes' },
];

const THEMES: { id: Theme; icon: string; label: string; sub: string; badge?: string }[] = [
  { id: 'light', icon: 'sunny-outline', label: 'Light', sub: 'Classic bright interface' },
  { id: 'dark', icon: 'moon-outline', label: 'Dark', sub: 'Easy on the eyes at night', badge: 'Soon' },
  { id: 'system', icon: 'phone-portrait-outline', label: 'System', sub: 'Follow device setting', badge: 'Soon' },
];

export default function AppearanceScreen() {
  const router = useRouter();
  const [textSize, setTextSize] = useState<TextSize>('medium');
  const [theme, setTheme] = useState<Theme>('light');

  const handleSave = () => {
    Alert.alert('Saved', 'Appearance settings have been updated.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#EC4899" />

      {/* ── Header ── */}
      <View style={{ backgroundColor: '#EC4899', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)', top: -50, right: -40 }} />
        <View style={{ position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)', top: 20, left: -25 }} />
        <SafeAreaView edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 }}>
            <Pressable onPress={() => router.back()} hitSlop={12}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 }}>Appearance</Text>
              <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 }}>Customise how MiniLMS looks</Text>
            </View>
            <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="color-palette" size={20} color="#fff" />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Text Size */}
        <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 4 }}>
          Text Size
        </Text>
        <View style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 22 }}>
          {TEXT_SIZES.map((item, i) => (
            <View key={item.id} style={{ borderBottomWidth: i < TEXT_SIZES.length - 1 ? 1 : 0, borderBottomColor: '#F1F5F9', overflow: 'hidden' }}>
              <Pressable
                onPress={() => setTextSize(item.id)}
                android_ripple={{ color: 'rgba(236,72,153,0.08)' }}
                style={{ paddingVertical: 15, paddingHorizontal: 16 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Radio dot */}
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    borderWidth: 2, borderColor: textSize === item.id ? '#EC4899' : '#CBD5E1',
                    backgroundColor: textSize === item.id ? '#EC4899' : '#fff',
                    alignItems: 'center', justifyContent: 'center', marginRight: 14,
                  }}>
                    {textSize === item.id && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: item.size, fontWeight: '700', color: '#0F172A' }}>{item.label}</Text>
                    <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{item.sub}</Text>
                  </View>
                  {textSize === item.id && <Ionicons name="checkmark-circle" size={20} color="#EC4899" />}
                </View>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Theme */}
        <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 4 }}>
          Theme
        </Text>
        <View style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 22 }}>
          {THEMES.map((item, i) => (
            <View key={item.id} style={{ borderBottomWidth: i < THEMES.length - 1 ? 1 : 0, borderBottomColor: '#F1F5F9', overflow: 'hidden' }}>
              <Pressable
                onPress={() => {
                  if (item.badge) return;
                  setTheme(item.id);
                }}
                android_ripple={{ color: 'rgba(236,72,153,0.08)' }}
                style={{ paddingVertical: 15, paddingHorizontal: 16, opacity: item.badge ? 0.6 : 1 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF0F9', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <Ionicons name={item.icon as never} size={19} color="#EC4899" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>{item.label}</Text>
                    <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{item.sub}</Text>
                  </View>
                  {item.badge ? (
                    <View style={{ backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '700' }}>{item.badge}</Text>
                    </View>
                  ) : theme === item.id ? (
                    <Ionicons name="checkmark-circle" size={20} color="#EC4899" />
                  ) : null}
                </View>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Preview card */}
        <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 4 }}>
          Preview
        </Text>
        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 18, borderWidth: 1.5, borderColor: '#F9A8D4', marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Ionicons name="book" size={20} color="#6366F1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: TEXT_SIZES.find((s) => s.id === textSize)!.size, fontWeight: '800', color: '#0F172A' }}>
                Course Title
              </Text>
              <Text style={{ fontSize: TEXT_SIZES.find((s) => s.id === textSize)!.size - 2, color: '#64748B', marginTop: 2 }}>
                Instructor Name
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: TEXT_SIZES.find((s) => s.id === textSize)!.size - 1, color: '#475569', lineHeight: 22 }}>
            This is how your text will appear across the app with the selected size.
          </Text>
        </View>

        {/* Save */}
        <View style={{ borderRadius: 16, overflow: 'hidden', elevation: 6, shadowColor: '#EC4899', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12 }}>
          <Pressable
            onPress={handleSave}
            android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
            style={{ backgroundColor: '#EC4899', paddingVertical: 17, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Apply Changes</Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}
