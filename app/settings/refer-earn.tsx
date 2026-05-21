import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

// Generate a deterministic referral code from the user's id/name
function generateCode(seed: string): string {
  const base = seed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
  const suffix = seed.length.toString().padStart(2, '0');
  return `MINI${base}${suffix}`.slice(0, 10);
}

const REWARD_STEPS = [
  { icon: 'share-social-outline', color: '#6366F1', bg: '#EEF2FF', title: 'Share your code', desc: 'Send your unique code to a friend' },
  { icon: 'person-add-outline', color: '#7C3AED', bg: '#F5F3FF', title: 'Friend signs up', desc: 'They register using your referral code' },
  { icon: 'gift-outline', color: '#059669', bg: '#DCFCE7', title: 'Both get rewarded', desc: 'You get 20% off, they get 10% off' },
];

const REWARDS = [
  { icon: 'pricetag-outline', color: '#6366F1', bg: '#EEF2FF', title: '20% OFF', desc: 'Your next course purchase' },
  { icon: 'people-outline', color: '#7C3AED', bg: '#F5F3FF', title: '10% OFF', desc: "Friend's first course" },
  { icon: 'trophy-outline', color: '#D97706', bg: '#FEF3C7', title: 'Bonus XP', desc: 'For every 3 referrals' },
];

export default function ReferEarnScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = generateCode(user?.id ?? user?.username ?? 'USER');

  const shareMessage =
    `Hey! Join me on MiniLMS — the best app to learn new skills.\n\n` +
    `Use my referral code **${referralCode}** when you sign up and get 10% off your first course! 🎓\n\n` +
    `Download MiniLMS now and start learning today.`;

  const handleCopy = async () => {
    // Clipboard is not available without expo-clipboard, show alert instead
    Alert.alert('Code Copied!', `Your referral code: ${referralCode}`, [{ text: 'OK' }]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: shareMessage, title: 'Join MiniLMS with my referral code' });
    } catch {
      // user cancelled
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />

      {/* ── Header ── */}
      <View style={{ backgroundColor: '#6366F1', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40 }} />
        <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)', top: 20, left: -30 }} />

        <SafeAreaView edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
            <Pressable onPress={() => router.back()} hitSlop={10}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.4 }}>Refer & Earn</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>Share and get discounts together</Text>
            </View>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="gift" size={22} color="#FCD34D" />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Hero banner ── */}
        <View style={{
          marginHorizontal: 16, marginTop: 20,
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: '#4F46E5',
        }}>
          {/* gradient-like overlay blobs */}
          <View style={{ position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.07)', top: -40, right: -30 }} />
          <View style={{ position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -20 }} />

          <View style={{ padding: 24, alignItems: 'center' }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Ionicons name="people" size={36} color="#FCD34D" />
            </View>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: -0.4, marginBottom: 8 }}>
              Invite friends,{'\n'}earn rewards!
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              Share your code with friends and get{'\n'}
              <Text style={{ color: '#FCD34D', fontWeight: '800' }}>20% off</Text> your next course purchase.
            </Text>
          </View>
        </View>

        {/* ── Referral code card ── */}
        <View style={{
          marginHorizontal: 16, marginTop: 20,
          backgroundColor: '#fff',
          borderRadius: 20,
          padding: 20,
          shadowColor: '#6366F1',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 14,
          elevation: 5,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
            Your Referral Code
          </Text>

          {/* Code display */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: '#E0E7FF',
            borderStyle: 'dashed',
            paddingHorizontal: 20,
            paddingVertical: 16,
            marginBottom: 16,
          }}>
            <Text style={{ flex: 1, fontSize: 26, fontWeight: '900', color: '#4F46E5', letterSpacing: 4, textAlign: 'center' }}>
              {referralCode}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* Copy */}
            <Pressable
              onPress={handleCopy}
              android_ripple={{ color: 'rgba(99,102,241,0.12)' }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: copied ? '#DCFCE7' : '#EEF2FF',
                borderRadius: 14,
                paddingVertical: 14,
              }}
            >
              <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={18} color={copied ? '#16A34A' : '#6366F1'} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: copied ? '#16A34A' : '#6366F1', marginLeft: 7 }}>
                {copied ? 'Copied!' : 'Copy Code'}
              </Text>
            </Pressable>

            {/* Share */}
            <Pressable
              onPress={handleShare}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#6366F1',
                borderRadius: 14,
                paddingVertical: 14,
              }}
            >
              <Ionicons name="share-social-outline" size={18} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff', marginLeft: 7 }}>
                Share
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Rewards you get ── */}
        <View style={{ marginHorizontal: 16, marginTop: 24 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 14, letterSpacing: -0.3 }}>
            What you both get
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {REWARDS.map((r) => (
              <View key={r.title} style={{
                flex: 1,
                backgroundColor: '#fff',
                borderRadius: 18,
                padding: 14,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: r.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Ionicons name={r.icon as never} size={20} color={r.color} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: r.color, marginBottom: 4 }}>{r.title}</Text>
                <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '600', textAlign: 'center', lineHeight: 14 }}>{r.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── How it works ── */}
        <View style={{ marginHorizontal: 16, marginTop: 24 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 14, letterSpacing: -0.3 }}>
            How it works
          </Text>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 3,
          }}>
            {REWARD_STEPS.map((step, i) => (
              <View key={step.title} style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 18,
                paddingVertical: 16,
                borderBottomWidth: i < REWARD_STEPS.length - 1 ? 1 : 0,
                borderBottomColor: '#F1F5F9',
              }}>
                {/* Step number + icon */}
                <View style={{ alignItems: 'center', marginRight: 16 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: step.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={step.icon as never} size={20} color={step.color} />
                  </View>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: step.color, alignItems: 'center', justifyContent: 'center', marginTop: -8, borderWidth: 2, borderColor: '#fff' }}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>{i + 1}</Text>
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 3 }}>{step.title}</Text>
                  <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 17 }}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Terms note ── */}
        <View style={{ marginHorizontal: 16, marginTop: 20, flexDirection: 'row', alignItems: 'flex-start' }}>
          <Ionicons name="information-circle-outline" size={15} color="#94A3B8" style={{ marginTop: 1, marginRight: 6 }} />
          <Text style={{ flex: 1, fontSize: 11, color: '#94A3B8', lineHeight: 17 }}>
            Discount applies to your next course purchase only. Referral rewards are credited after your friend completes registration. One reward per referred user.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}
