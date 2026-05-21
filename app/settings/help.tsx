import { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'How do I enroll in a course?',
    a: 'Open any course, scroll to the bottom, and tap "Enroll for Free". You can also preview the first two lessons before enrolling. Enrolled courses appear in your Profile under the Enrolled count.',
  },
  {
    q: 'How is my learning progress tracked?',
    a: 'Progress is tracked by marking lessons complete. In a course, tap any unlocked lesson row to mark it done. Your overall progress percentage updates on the Profile screen automatically.',
  },
  {
    q: 'Why does the video open in YouTube instead of playing here?',
    a: 'YouTube restricts in-app video playback for many videos. MiniLMS opens videos in the YouTube app (or browser) to give you the best, uninterrupted viewing experience.',
  },
  {
    q: 'How do I save a course for later?',
    a: 'Tap the bookmark icon on any course card or on the course detail page. Saved courses appear in the Saved tab at the bottom of the app.',
  },
  {
    q: 'How do I use the AI Course Assistant?',
    a: 'On any course detail page, tap the purple "Ask AI" floating button. You can ask questions about the course, get study tips, or find out if it suits your level. Powered by Google Gemini.',
  },
  {
    q: 'I forgot my password. What should I do?',
    a: 'On the Sign In screen, tap "Forgot password?" and follow the steps. You\'ll enter your email, receive a 6-digit code, and then set a new password.',
  },
  {
    q: 'How do I change my profile photo?',
    a: 'Go to Profile (bottom tab) and tap your avatar photo. You\'ll be prompted to choose an image from your gallery. The photo updates immediately across the app.',
  },
  {
    q: 'Can I use MiniLMS offline?',
    a: 'Course information and metadata are cached automatically after you visit a course, so you can browse them offline. Video content requires an internet connection.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggle = (i: number) => setExpanded((cur) => (cur === i ? null : i));

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#16A34A" />

      {/* ── Header ── */}
      <View style={{ backgroundColor: '#16A34A', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)', top: -50, right: -40 }} />
        <View style={{ position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)', top: 20, left: -25 }} />
        <SafeAreaView edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 }}>
            <Pressable onPress={() => router.back()} hitSlop={12}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 }}>Help & Support</Text>
              <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 }}>Frequently asked questions</Text>
            </View>
            <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="help-circle" size={22} color="#fff" />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* FAQ accordion */}
        <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 4 }}>
          FAQ
        </Text>
        <View style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 22 }}>
          {FAQS.map((item, i) => (
            <View key={i} style={{ borderBottomWidth: i < FAQS.length - 1 ? 1 : 0, borderBottomColor: '#F1F5F9' }}>
              <Pressable
                onPress={() => toggle(i)}
                android_ripple={{ color: 'rgba(22,163,74,0.06)' }}
                style={{ paddingVertical: 15, paddingHorizontal: 16 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: '#0F172A', lineHeight: 20, marginRight: 10 }}>
                    {item.q}
                  </Text>
                  <Ionicons
                    name={expanded === i ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={expanded === i ? '#16A34A' : '#94A3B8'}
                  />
                </View>
              </Pressable>
              {expanded === i && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                  <View style={{ height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 }} />
                  <Text style={{ fontSize: 13, color: '#475569', lineHeight: 21 }}>{item.a}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact us */}
        <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 4 }}>
          Contact Us
        </Text>
        <View style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 22 }}>
          {[
            { icon: 'mail-outline', label: 'Email Support', value: 'support@minilms.com', action: () => void Linking.openURL('mailto:support@minilms.com') },
            { icon: 'globe-outline', label: 'Visit Website', value: 'www.minilms.com', action: () => {} },
            { icon: 'logo-whatsapp', label: 'WhatsApp Chat', value: 'Mon – Fri, 9 AM – 6 PM', action: () => {} },
          ].map((item, i) => (
            <View key={item.label} style={{ borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: '#F1F5F9', overflow: 'hidden' }}>
              <Pressable
                onPress={item.action}
                android_ripple={{ color: 'rgba(22,163,74,0.06)' }}
                style={{ paddingVertical: 14, paddingHorizontal: 16 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <Ionicons name={item.icon as never} size={19} color="#16A34A" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>{item.label}</Text>
                    <Text style={{ fontSize: 12, color: '#16A34A', marginTop: 2, fontWeight: '600' }}>{item.value}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </View>
              </Pressable>
            </View>
          ))}
        </View>

        {/* App info */}
        <View style={{ backgroundColor: '#F0FDF4', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#BBF7D0', alignItems: 'center' }}>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Ionicons name="school" size={26} color="#fff" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#14532D', marginBottom: 4 }}>MiniLMS</Text>
          <Text style={{ fontSize: 13, color: '#16A34A', fontWeight: '600' }}>Version 1.0.0</Text>
          <Text style={{ fontSize: 12, color: '#4ADE80', marginTop: 4 }}>© 2026 MiniLMS Education Platform</Text>
        </View>

      </ScrollView>
    </View>
  );
}
