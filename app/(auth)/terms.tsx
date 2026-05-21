import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Tab = 'terms' | 'privacy';

interface Section {
  icon: string;
  bg: string;
  color: string;
  title: string;
  content: string;
  bullets?: string[];
}

// ── Terms of Service content ──────────────────────────────────────────────────

const TERMS: Section[] = [
  {
    icon: 'hand-right-outline',
    bg: '#EEF2FF', color: '#6366F1',
    title: '1. Acceptance of Terms',
    content:
      'By creating a MiniLMS account or using any part of our platform, you confirm that you have read, understood, and agree to these Terms of Service. If you do not agree, please do not register or use MiniLMS.\n\nThese terms form a legally binding agreement between you and MiniLMS Education Platform. We may update them from time to time — continued use after changes take effect constitutes acceptance.',
  },
  {
    icon: 'people-outline',
    bg: '#F5F3FF', color: '#7C3AED',
    title: '2. Eligibility & Age Requirements',
    content:
      'MiniLMS is available to users aged 13 and older. By registering you confirm you meet this requirement. Users under 18 should have a parent or guardian review these terms before use.\n\nYou agree to use MiniLMS only in compliance with the laws and regulations of your local jurisdiction. Certain regions may have additional eligibility requirements.',
  },
  {
    icon: 'person-circle-outline',
    bg: '#F0F9FF', color: '#0EA5E9',
    title: '3. Account Registration & Security',
    content:
      'You agree to provide accurate, current, and complete information when registering. You are solely responsible for maintaining the confidentiality of your login credentials and for all activity under your account.\n\nNotify us immediately of any unauthorized account access. MiniLMS will not be liable for losses arising from your failure to safeguard your credentials. Each person may maintain only one account.',
  },
  {
    icon: 'book-outline',
    bg: '#F0FDF4', color: '#10B981',
    title: '4. Course Enrollment & Access',
    content:
      'Enrollment grants you a limited, personal, non-transferable license to access course content for your own educational use. You may not share credentials or redistribute course materials.\n\nAccess duration varies per course. MiniLMS reserves the right to update or remove content to maintain quality. Students enrolled in discontinued courses will receive advance notice.',
  },
  {
    icon: 'card-outline',
    bg: '#FFFBEB', color: '#F59E0B',
    title: '5. Payment & Refund Policy',
    content:
      'Course prices are displayed in your local currency and may include applicable taxes. Payments are processed through PCI-compliant providers — MiniLMS never stores your card details.\n\nRefunds may be requested within 30 days of purchase, provided you have consumed less than 30% of the course. Contact our support team to initiate a refund. Promotional purchases may carry different refund terms, disclosed at checkout.',
  },
  {
    icon: 'shield-outline',
    bg: '#FFF0F9', color: '#EC4899',
    title: '6. Intellectual Property',
    content:
      'All MiniLMS content — courses, videos, graphics, logos, and software — is protected by copyright, trademark, and intellectual property laws and belongs to MiniLMS or its content providers.\n\nYou may not reproduce, distribute, modify, or create derivative works without written permission. Reviews and comments you submit remain your property, but you grant MiniLMS a non-exclusive, royalty-free license to display them on the platform.',
  },
  {
    icon: 'warning-outline',
    bg: '#FEF2F2', color: '#EF4444',
    title: '7. User Conduct',
    content: 'You agree to use MiniLMS responsibly. The following are strictly prohibited:',
    bullets: [
      'Sharing account access or course materials with unauthorized individuals',
      'Posting offensive, harassing, or misleading content',
      'Attempting unauthorized access to platform systems or data',
      'Uploading malware, viruses, or any harmful code',
      'Impersonating other users, instructors, or MiniLMS staff',
      'Using the platform for commercial purposes without prior approval',
    ],
  },
  {
    icon: 'alert-circle-outline',
    bg: '#FFF7ED', color: '#F97316',
    title: '8. Disclaimer of Warranties',
    content:
      'MiniLMS is provided on an "as is" and "as available" basis without warranties of any kind. We do not guarantee uninterrupted, error-free, or fully secure access at all times.\n\nCourse content is for educational purposes only. MiniLMS does not guarantee specific learning outcomes, employment results, or professional certifications unless explicitly stated in a specific program.',
  },
  {
    icon: 'refresh-outline',
    bg: '#F5F3FF', color: '#8B5CF6',
    title: '9. Changes to These Terms',
    content:
      'MiniLMS may update these Terms at any time. We will provide at least 14 days\' notice of material changes via email or in-app notification.\n\nContinued use after the effective date of updated terms constitutes acceptance. If you disagree with changes, please stop using the platform and contact support to request account deletion.',
  },
];

// ── Privacy Policy content ────────────────────────────────────────────────────

const PRIVACY: Section[] = [
  {
    icon: 'eye-outline',
    bg: '#EEF2FF', color: '#6366F1',
    title: 'What We Collect',
    content:
      'When you use MiniLMS we collect information you provide directly — name, email address, and password — as well as usage data generated by the platform, including course progress, quiz results, session duration, device type, and IP address.\n\nOptional profile information (photo, biography) is collected only if you choose to provide it. Payment data is handled entirely by our payment processor and is never stored on MiniLMS servers.',
  },
  {
    icon: 'settings-outline',
    bg: '#F0FDF4', color: '#10B981',
    title: 'How We Use Your Data',
    content:
      'We use your data to deliver, improve, and personalize our services — including processing enrollments, tracking learning progress, sending account notifications, and generating relevant course recommendations.\n\nAggregated, anonymized usage data may be analyzed to improve the platform experience. We will never sell your personal data to third parties for advertising or marketing purposes.',
  },
  {
    icon: 'lock-closed-outline',
    bg: '#F0F9FF', color: '#0EA5E9',
    title: 'Data Security',
    content:
      'All data transmitted between your device and MiniLMS servers is encrypted using industry-standard TLS/SSL protocols. Passwords are stored using strong one-way hashing and are never stored in plain text.\n\nDespite our best efforts, no method of electronic transmission or storage is 100% secure. We encourage you to use a strong, unique password and to contact us immediately if you suspect any unauthorized access.',
  },
  {
    icon: 'hand-left-outline',
    bg: '#FFFBEB', color: '#F59E0B',
    title: 'Your Rights & Choices',
    content:
      'You have the right to access, correct, or delete your personal data. Most profile information can be updated directly within the app. To request a full data export or account deletion, please contact our support team.\n\nWe will respond to all valid data requests within 30 days. Some information may be retained for legal, security, or operational purposes even after account deletion.',
  },
  {
    icon: 'share-social-outline',
    bg: '#FFF0F9', color: '#EC4899',
    title: 'Data Sharing',
    content:
      'MiniLMS does not sell your personal information. We may share limited data with trusted service providers (payment processors, cloud hosting, analytics) strictly for the purpose of operating and improving the platform.\n\nCourse progress and completion data may be visible to your enrolled course instructors. Aggregated, anonymized statistics may be used in marketing materials without identifying individual users.',
  },
  {
    icon: 'mail-outline',
    bg: '#F0FDF4', color: '#059669',
    title: 'Contact & Support',
    content:
      'If you have questions or concerns about these Terms or our Privacy Policy, please reach out — we\'re here to help.\n\nEmail: support@minilms.com\nSupport hours: Mon – Fri, 9:00 AM – 6:00 PM\n\nMiniLMS Education Platform\n123 Learning Lane, EdTech District\nTech City, TC 10101',
  },
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function TermsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('terms');
  const sections = tab === 'terms' ? TERMS : PRIVACY;

  return (
    <View style={{ flex: 1, backgroundColor: '#7C3AED' }}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

      {/* ── Violet header ── */}
      <View style={{ overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40 }} />
        <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)', top: 20, left: -30 }} />

        <SafeAreaView edges={['top']}>
          <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 22 }}>

            {/* Back + title row */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                style={{
                  width: 42, height: 42, borderRadius: 21,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </Pressable>

              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 21, fontWeight: '900', letterSpacing: -0.4 }}>
                  Legal
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 }}>
                  Last updated: May 20, 2026
                </Text>
              </View>

              <View style={{
                width: 44, height: 44, borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="document-text" size={22} color="#fff" />
              </View>
            </View>

          </View>
        </SafeAreaView>
      </View>

      {/* ── Scrollable white card ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={{
          backgroundColor: '#fff',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingBottom: 48,
          flex: 1,
        }}>

          {/* ── Tab switcher ── */}
          <View style={{
            flexDirection: 'row',
            marginHorizontal: 20,
            marginTop: 22,
            marginBottom: 6,
            backgroundColor: '#F1F5F9',
            borderRadius: 16,
            padding: 4,
          }}>
            {(['terms', 'privacy'] as Tab[]).map((t) => (
              <View
                key={t}
                style={{
                  flex: 1,
                  borderRadius: 13,
                  overflow: 'hidden',
                  backgroundColor: tab === t ? '#7C3AED' : 'transparent',
                }}
              >
                <Pressable
                  onPress={() => setTab(t)}
                  android_ripple={{ color: 'rgba(124,58,237,0.2)' }}
                  style={{ paddingVertical: 11, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: tab === t ? '#fff' : '#94A3B8' }}>
                    {t === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* ── Intro label ── */}
          <View style={{ marginHorizontal: 20, marginBottom: 20, marginTop: 14 }}>
            <View style={{
              backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14,
              borderWidth: 1, borderColor: '#E2E8F0',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="information" size={16} color="#fff" />
                </View>
                <Text style={{ flex: 1, fontSize: 12, color: '#64748B', lineHeight: 19, marginTop: 2 }}>
                  {tab === 'terms'
                    ? 'Please read our Terms of Service carefully. By using MiniLMS, you agree to be bound by these terms.'
                    : 'This Privacy Policy explains how MiniLMS collects, uses, and protects your personal information.'}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Sections ── */}
          <View style={{ paddingHorizontal: 20 }}>
            {sections.map((section, i) => (
              <View key={section.title}>

                {/* Section header row */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 12,
                    backgroundColor: section.bg,
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: 14, flexShrink: 0, marginTop: 1,
                  }}>
                    <Ionicons name={section.icon as never} size={19} color={section.color} />
                  </View>
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: '800', color: '#0F172A', lineHeight: 22, paddingTop: 2 }}>
                    {section.title}
                  </Text>
                </View>

                {/* Body text */}
                <Text style={{ fontSize: 13, color: '#475569', lineHeight: 22, marginLeft: 54 }}>
                  {section.content}
                </Text>

                {/* Bullet list */}
                {section.bullets && (
                  <View style={{ marginLeft: 54, marginTop: 10 }}>
                    {section.bullets.map((b) => (
                      <View key={b} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                        <View style={{
                          width: 6, height: 6, borderRadius: 3,
                          backgroundColor: section.color,
                          marginTop: 8, marginRight: 12, flexShrink: 0,
                        }} />
                        <Text style={{ flex: 1, fontSize: 13, color: '#475569', lineHeight: 22 }}>
                          {b}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Divider */}
                {i < sections.length - 1 && (
                  <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 22 }} />
                )}
              </View>
            ))}
          </View>

          {/* ── Agreement note ── */}
          <View style={{
            marginHorizontal: 20, marginTop: 28,
            backgroundColor: '#F5F3FF', borderRadius: 16, padding: 16,
            borderWidth: 1, borderColor: '#DDD6FE',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="shield-checkmark" size={17} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#4C1D95', fontSize: 13, fontWeight: '800', marginBottom: 4 }}>
                  Your agreement matters
                </Text>
                <Text style={{ color: '#6D28D9', fontSize: 12, lineHeight: 18 }}>
                  By checking the agreement box on the registration screen, you confirm that you have read and understood both the Terms of Service and Privacy Policy.
                </Text>
              </View>
            </View>
          </View>

          {/* ── Close / back button ── */}
          <View style={{ marginHorizontal: 20, marginTop: 24 }}>
            <View style={{
              backgroundColor: '#7C3AED', borderRadius: 16, overflow: 'hidden',
              elevation: 6, shadowColor: '#7C3AED',
              shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12,
            }}>
              <Pressable
                onPress={() => router.back()}
                android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                style={{ paddingVertical: 17, alignItems: 'center' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 8 }}>
                    I've Read This — Go Back
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
