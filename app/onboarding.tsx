import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StatusBar,
  Text,
  View,
  type ListRenderItem,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ONBOARDING_KEY = '@mini_lms/onboarding_seen';

interface Slide {
  id: string;
  headline: string;
  subHeadline: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentIcon: keyof typeof Ionicons.glyphMap;
  bg: string;
  cardBg: string;
  primary: string;
  accent: string;
  blobs: string[];
}

const SLIDES: Slide[] = [
  {
    id: '1',
    headline: 'Learn Anything,',
    subHeadline: 'Anywhere.',
    body: 'Thousands of expert-led courses across tech, design, business and more — all in your pocket.',
    icon: 'earth-outline',
    accentIcon: 'book-outline',
    bg: '#F0F4FF',
    cardBg: '#6366F1',
    primary: '#6366F1',
    accent: '#818CF8',
    blobs: ['#C7D2FE', '#A5B4FC', '#E0E7FF'],
  },
  {
    id: '2',
    headline: 'Track Your',
    subHeadline: 'Progress.',
    body: 'See exactly how far you\'ve come. Lesson checkmarks, completion %, streaks and weekly charts keep you motivated.',
    icon: 'trending-up-outline',
    accentIcon: 'ribbon-outline',
    bg: '#F5F3FF',
    cardBg: '#7C3AED',
    primary: '#7C3AED',
    accent: '#A78BFA',
    blobs: ['#DDD6FE', '#C4B5FD', '#EDE9FE'],
  },
  {
    id: '3',
    headline: 'Ask AI',
    subHeadline: 'Anything.',
    body: 'Each course has a built-in Gemini AI assistant. Ask it questions, get study tips, and learn at your own pace.',
    icon: 'sparkles-outline',
    accentIcon: 'chatbubble-ellipses-outline',
    bg: '#FDF4FF',
    cardBg: '#9333EA',
    primary: '#9333EA',
    accent: '#C084FC',
    blobs: ['#F0ABFC', '#E879F9', '#FAE8FF'],
  },
];

// ─── Decorative illustration for each slide ──────────────────────────────────

function SlideIllustration({ slide }: { slide: Slide }) {
  if (slide.id === '1') {
    return (
      <View style={{ alignItems: 'center', marginBottom: 44 }}>
        {/* Outer glow ring */}
        <View style={{
          width: 200, height: 200, borderRadius: 100,
          backgroundColor: `${slide.primary}18`,
          alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Mid ring */}
          <View style={{
            width: 160, height: 160, borderRadius: 80,
            backgroundColor: `${slide.primary}28`,
            alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Main card */}
            <View style={{
              width: 120, height: 120, borderRadius: 32,
              backgroundColor: slide.cardBg,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: slide.primary,
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.4,
              shadowRadius: 24,
              elevation: 16,
            }}>
              <Ionicons name={slide.icon} size={56} color="#fff" />
            </View>
          </View>
        </View>
        {/* Floating mini-cards */}
        <View style={{ position: 'absolute', top: 10, left: -10, backgroundColor: '#fff', borderRadius: 14, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 6 }}>
          <Ionicons name="book" size={22} color={slide.primary} />
        </View>
        <View style={{ position: 'absolute', top: 20, right: -4, backgroundColor: '#fff', borderRadius: 14, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 6 }}>
          <Ionicons name="desktop-outline" size={22} color={slide.accent} />
        </View>
        <View style={{ position: 'absolute', bottom: 8, left: 10, backgroundColor: '#fff', borderRadius: 14, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 6 }}>
          <Ionicons name="phone-portrait-outline" size={22} color={slide.accent} />
        </View>
        <View style={{ position: 'absolute', bottom: 14, right: -6, backgroundColor: '#fff', borderRadius: 14, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 6 }}>
          <Ionicons name="headset-outline" size={22} color={slide.primary} />
        </View>
      </View>
    );
  }

  if (slide.id === '2') {
    return (
      <View style={{ alignItems: 'center', marginBottom: 44 }}>
        {/* Main card */}
        <View style={{
          width: 200, height: 200, borderRadius: 100,
          backgroundColor: `${slide.primary}18`,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <View style={{
            width: 160, height: 160, borderRadius: 80,
            backgroundColor: `${slide.primary}28`,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <View style={{
              width: 120, height: 120, borderRadius: 32,
              backgroundColor: slide.cardBg,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: slide.primary,
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.4,
              shadowRadius: 24,
              elevation: 16,
            }}>
              <Ionicons name={slide.icon} size={56} color="#fff" />
            </View>
          </View>
        </View>
        {/* Progress mini-widget */}
        <View style={{ position: 'absolute', bottom: 0, right: -10, backgroundColor: '#fff', borderRadius: 16, padding: 12, width: 120, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 }} />
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#0F172A' }}>Progress</Text>
            <Text style={{ fontSize: 10, fontWeight: '900', color: slide.primary, marginLeft: 'auto' }}>72%</Text>
          </View>
          <View style={{ height: 5, backgroundColor: '#E2E8F0', borderRadius: 3 }}>
            <View style={{ height: 5, backgroundColor: slide.primary, borderRadius: 3, width: '72%' }} />
          </View>
        </View>
        {/* Streak badge */}
        <View style={{ position: 'absolute', top: 10, left: -8, backgroundColor: '#FEF3C7', borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 6 }}>
          <Ionicons name="flame" size={16} color="#F59E0B" />
          <Text style={{ fontSize: 11, fontWeight: '900', color: '#D97706', marginLeft: 4 }}>7 day streak</Text>
        </View>
        {/* Ribbon */}
        <View style={{ position: 'absolute', top: 14, right: -6, backgroundColor: '#DCFCE7', borderRadius: 14, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 6 }}>
          <Ionicons name="ribbon" size={22} color="#059669" />
        </View>
      </View>
    );
  }

  // Slide 3 — AI
  return (
    <View style={{ alignItems: 'center', marginBottom: 44 }}>
      <View style={{
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: `${slide.primary}18`,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <View style={{
          width: 160, height: 160, borderRadius: 80,
          backgroundColor: `${slide.primary}28`,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <View style={{
            width: 120, height: 120, borderRadius: 32,
            backgroundColor: slide.cardBg,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: slide.primary,
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.4,
            shadowRadius: 24,
            elevation: 16,
          }}>
            <Ionicons name={slide.icon} size={56} color="#fff" />
          </View>
        </View>
      </View>
      {/* AI chat bubble */}
      <View style={{ position: 'absolute', bottom: -4, left: -14, backgroundColor: '#fff', borderRadius: 16, padding: 10, maxWidth: 150, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: slide.primary, alignItems: 'center', justifyContent: 'center', marginRight: 5 }}>
            <Ionicons name="sparkles" size={10} color="#fff" />
          </View>
          <Text style={{ fontSize: 9, fontWeight: '800', color: slide.primary }}>Gemini AI</Text>
        </View>
        <Text style={{ fontSize: 9, color: '#475569', lineHeight: 13 }}>"Explain this concept in simple terms..."</Text>
      </View>
      <View style={{ position: 'absolute', top: 6, right: -12, backgroundColor: slide.primary, borderRadius: 16, padding: 10, shadowColor: slide.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 }}>
        <Ionicons name="chatbubble-ellipses-outline" size={22} color="#fff" />
      </View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const currentSlide = SLIDES[activeIndex]!;
  const isLast = activeIndex === SLIDES.length - 1;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const markSeen = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  };

  const handleRegister = async () => {
    await markSeen();
    router.replace('/(auth)/register');
  };

  const handleLogin = async () => {
    await markSeen();
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  const renderItem: ListRenderItem<Slide> = ({ item }) => (
    <View style={{ width: SCREEN_WIDTH, flex: 1, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' }}>
      {/* Decorative blobs */}
      <View style={{ position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: item.blobs[0], opacity: 0.5, top: -60, right: -70 }} />
      <View style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: item.blobs[1], opacity: 0.3, top: 80, left: -50 }} />
      <View style={{ position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: item.blobs[2], opacity: 0.4, bottom: 100, right: 10 }} />

      <SlideIllustration slide={item} />

      {/* Text */}
      <Text style={{ fontSize: 40, fontWeight: '900', color: '#0F172A', letterSpacing: -1, textAlign: 'center', lineHeight: 46 }}>
        {item.headline}
      </Text>
      <Text style={{ fontSize: 40, fontWeight: '900', color: item.primary, letterSpacing: -1, textAlign: 'center', lineHeight: 46, marginBottom: 18 }}>
        {item.subHeadline}
      </Text>
      <Text style={{ fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 26, maxWidth: 300 }}>
        {item.body}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: currentSlide.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={currentSlide.bg} />

      {/* Skip */}
      {!isLast && (
        <Pressable
          onPress={handleLogin}
          hitSlop={12}
          style={{
            position: 'absolute',
            top: insets.top + 12,
            right: 20,
            zIndex: 10,
            backgroundColor: 'rgba(15,23,42,0.08)',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569' }}>Skip</Text>
        </Pressable>
      )}

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        style={{ flex: 1 }}
      />

      {/* Bottom section */}
      <View style={{ paddingHorizontal: 28, paddingBottom: Math.max(insets.bottom, 20) + 16 }}>

        {/* Dot indicators */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          {SLIDES.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => listRef.current?.scrollToIndex({ index: i, animated: true })}
              style={{
                width: i === activeIndex ? 30 : 8,
                height: 8,
                borderRadius: 4,
                marginHorizontal: 4,
                backgroundColor: i === activeIndex ? currentSlide.primary : `${currentSlide.primary}30`,
              }}
            />
          ))}
        </View>

        {isLast ? (
          /* Last slide: two CTA buttons */
          <View style={{ gap: 12 }}>
            {/* Create Account */}
            <View style={{ borderRadius: 18, overflow: 'hidden', shadowColor: currentSlide.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 }}>
              <Pressable
                onPress={() => void handleRegister()}
                android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
                style={{ backgroundColor: currentSlide.primary, paddingVertical: 18, alignItems: 'center' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="person-add-outline" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', marginLeft: 8, letterSpacing: 0.2 }}>
                    Create Free Account
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Sign In */}
            <View style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: currentSlide.primary }}>
              <Pressable
                onPress={() => void handleLogin()}
                android_ripple={{ color: `${currentSlide.primary}20` }}
                style={{ paddingVertical: 16, alignItems: 'center', backgroundColor: 'transparent' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="log-in-outline" size={18} color={currentSlide.primary} />
                  <Text style={{ color: currentSlide.primary, fontSize: 16, fontWeight: '800', marginLeft: 8 }}>
                    I already have an account
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        ) : (
          /* Next button */
          <View style={{ borderRadius: 18, overflow: 'hidden', shadowColor: currentSlide.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 }}>
            <Pressable
              onPress={handleNext}
              android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
              style={{ backgroundColor: currentSlide.primary, paddingVertical: 18, alignItems: 'center' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.2 }}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </View>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
