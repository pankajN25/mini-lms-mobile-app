/**
 * Course Content Screen
 * Native replacement for the old WebView-based approach.
 * All buttons call hooks directly — no JS bridge needed.
 */
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useCourses } from '@/hooks/useCourses';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useEnrollments } from '@/hooks/useEnrollments';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice, formatRating, capitalizeCategory } from '@/utils/formatters';
import { CATEGORY_COLORS } from '@/utils/categoryColors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hash(s: string): number {
  return s.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0);
}

function mockLessons(title: string, category: string): { name: string; duration: string; free: boolean }[] {
  const cap = capitalizeCategory(category);
  const word = title.split(' ')[0] ?? cap;
  return [
    { name: `Introduction to ${cap}`,          duration: '05:12', free: true  },
    { name: `Getting Started with ${word}`,    duration: '08:44', free: true  },
    { name: 'Core Concepts & Fundamentals',    duration: '12:30', free: false },
    { name: 'Deep Dive — Key Features',        duration: '15:18', free: false },
    { name: 'Practical Hands-on Exercises',    duration: '11:05', free: false },
    { name: 'Advanced Techniques',             duration: '14:22', free: false },
    { name: 'Real-world Project Walkthrough',  duration: '18:40', free: false },
    { name: 'Final Assessment & Next Steps',   duration: '06:55', free: false },
  ];
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= full ? 'star' : 'star-outline'} size={12} color="#F59E0B" />
      ))}
    </View>
  );
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'curriculum';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CourseContentScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { courses } = useCourses();
  const { toggle, checkIsBookmarked } = useBookmarks();
  const { enroll, isEnrolled } = useEnrollments();

  const [tab, setTab] = useState<Tab>('overview');
  const [heroError, setHeroError] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);

  if (!course) return <EmptyState icon="alert-circle-outline" title="Course not found" />;

  const isBookmarked = checkIsBookmarked(course.id);
  const enrolled = isEnrolled(course.id);
  const fallbackColor = CATEGORY_COLORS[course.category.toLowerCase()] ?? '#6366F1';
  const lessons = mockLessons(course.title, course.category);
  const totalMins = lessons.reduce((acc, l) => {
    const [m, s] = l.duration.split(':').map(Number);
    return acc + (m ?? 0) + (s ?? 0) / 60;
  }, 0);
  const totalHours = (totalMins / 60).toFixed(1);
  const students = `${(600 + (hash(course.id) % 9400)).toLocaleString()}`;

  const handleEnroll = async () => {
    if (enrolled) return;
    setEnrolling(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await enroll(course.id);
    setEnrolling(false);
    Alert.alert('🎉 Enrolled!', `You are now enrolled in "${course.title}". Start learning!`, [
      { text: "Let's Go!" },
    ]);
  };

  const handleBookmark = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggle(course.id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Fixed top bar ───────────────────────────────────────────── */}
      <View style={{
        paddingTop: insets.top,
        backgroundColor: '#6366F1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 10,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          <Text style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 }} numberOfLines={1}>
            Course Content
          </Text>
          <Pressable
            onPress={() => void handleBookmark()}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isBookmarked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>

        {/* ── Hero image ──────────────────────────────────────────────── */}
        <View style={{ height: 220, backgroundColor: fallbackColor }}>
          {!heroError ? (
            <Image
              source={{ uri: course.thumbnailUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              onError={() => setHeroError(true)}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="book" size={56} color="rgba(255,255,255,0.4)" />
            </View>
          )}
          {/* Gradient scrim */}
          <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: 'rgba(0,0,0,0.5)' }} />

          {/* Price pill on image */}
          <View style={{ position: 'absolute', bottom: 14, left: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ backgroundColor: '#6366F1', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>{formatPrice(course.price)}</Text>
            </View>
            {course.discountPercentage > 0 && (
              <View style={{ backgroundColor: '#10B981', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                  {Math.round(course.discountPercentage)}% OFF
                </Text>
              </View>
            )}
          </View>

          {/* Students count */}
          <View style={{ position: 'absolute', bottom: 14, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="people-outline" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700' }}>
              {students} students
            </Text>
          </View>
        </View>

        {/* ── Course meta card ────────────────────────────────────────── */}
        <View style={{ marginHorizontal: 16, marginTop: -20, backgroundColor: '#fff', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6 }}>

          {/* Category + rating row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
              <Text style={{ color: '#6366F1', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {capitalizeCategory(course.category)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Stars rating={course.rating} />
              <Text style={{ color: '#D97706', fontSize: 13, fontWeight: '800' }}>
                {formatRating(course.rating)}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', lineHeight: 25, marginBottom: 10 }}>
            {course.title}
          </Text>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {[
              { icon: 'book-outline', label: `${lessons.length} lessons` },
              { icon: 'time-outline', label: `${totalHours}h` },
              { icon: 'bar-chart-outline', label: 'All levels' },
            ].map((s) => (
              <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name={s.icon as never} size={13} color="#6366F1" />
                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Tab switcher ─────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: 20, backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4 }}>
          {(['overview', 'curriculum'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center',
                backgroundColor: tab === t ? '#fff' : 'transparent',
                shadowColor: tab === t ? '#000' : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: tab === t ? 0.07 : 0,
                shadowRadius: 6,
                elevation: tab === t ? 3 : 0,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: tab === t ? '#6366F1' : '#94A3B8' }}>
                {t === 'overview' ? 'Overview' : 'Curriculum'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Tab: Overview ────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <View style={{ marginHorizontal: 16, marginTop: 16, gap: 16 }}>

            {/* About */}
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 10 }}>
                About this Course
              </Text>
              <Text style={{ fontSize: 14, color: '#475569', lineHeight: 22 }}>
                {course.description}
              </Text>
            </View>

            {/* What you'll learn */}
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12 }}>
                What You'll Learn
              </Text>
              {[
                'Master core concepts from fundamentals to advanced',
                'Apply skills in practical, real-world scenarios',
                'Build confidence with hands-on guided projects',
                'Understand industry best practices and standards',
              ].map((point, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 }}>
                    <Ionicons name="checkmark" size={12} color="#059669" />
                  </View>
                  <Text style={{ flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 }}>{point}</Text>
                </View>
              ))}
            </View>

            {/* Instructor */}
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 14 }}>
                Your Instructor
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, overflow: 'hidden', backgroundColor: '#E2E8F0', borderWidth: 2, borderColor: '#6366F1' }}>
                  <Image
                    source={{ uri: course.instructor.avatarUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>
                    {course.instructor.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6366F1', fontWeight: '600', marginTop: 2 }}>
                    Senior Instructor
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Ionicons name="location-outline" size={12} color="#94A3B8" />
                    <Text style={{ fontSize: 12, color: '#94A3B8' }}>{course.instructor.country}</Text>
                  </View>
                </View>
              </View>
            </View>

          </View>
        )}

        {/* ── Tab: Curriculum ──────────────────────────────────────────── */}
        {tab === 'curriculum' && (
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
                {lessons.length} Lessons
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>
                {totalHours}h total
              </Text>
            </View>

            <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' }}>
              {lessons.map((lesson, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAFA',
                    borderBottomWidth: i < lessons.length - 1 ? 1 : 0,
                    borderBottomColor: '#F1F5F9',
                    gap: 12,
                  }}
                >
                  {/* Icon */}
                  <View style={{
                    width: 34, height: 34, borderRadius: 17,
                    backgroundColor: lesson.free ? '#EEF2FF' : '#F1F5F9',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons
                      name={lesson.free ? 'play' : 'lock-closed'}
                      size={13}
                      color={lesson.free ? '#6366F1' : '#94A3B8'}
                    />
                  </View>

                  {/* Text */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: lesson.free ? '#0F172A' : '#64748B', lineHeight: 18 }}>
                      {`${i + 1}. ${lesson.name}`}
                    </Text>
                    {lesson.free && (
                      <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '700', marginTop: 2 }}>
                        Free preview
                      </Text>
                    )}
                  </View>

                  {/* Duration */}
                  <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '600' }}>
                    {lesson.duration}
                  </Text>
                </View>
              ))}
            </View>

            {/* Enroll nudge */}
            <View style={{ backgroundColor: '#EEF2FF', borderRadius: 14, padding: 14, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="lock-closed-outline" size={18} color="#6366F1" />
              <Text style={{ flex: 1, fontSize: 13, color: '#4338CA', lineHeight: 18 }}>
                Enroll to unlock all {lessons.length - 2} remaining lessons and get lifetime access.
              </Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── Sticky bottom CTA ─────────────────────────────────────────── */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: insets.bottom + 14,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 20,
        gap: 10,
      }}>
        {/* Price row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#6366F1' }}>
            {formatPrice(course.price)}
          </Text>
          {course.discountPercentage > 0 && (
            <Text style={{ fontSize: 14, color: '#94A3B8', textDecorationLine: 'line-through' }}>
              {formatPrice(course.originalPrice)}
            </Text>
          )}
          <Text style={{ fontSize: 12, color: '#94A3B8', marginLeft: 'auto' }}>
            {students} enrolled
          </Text>
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: 'row', gap: 12 }}>

          {/* Enroll button */}
          <Pressable
            onPress={() => void handleEnroll()}
            disabled={enrolled || enrolling}
            android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: enrolled ? '#DCFCE7' : '#6366F1',
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              opacity: pressed ? 0.88 : 1,
              elevation: enrolled ? 0 : 6,
              shadowColor: '#6366F1',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: enrolled ? 0 : 0.3,
              shadowRadius: 10,
            })}
          >
            <Ionicons
              name={enrolled ? 'checkmark-circle' : 'school-outline'}
              size={19}
              color={enrolled ? '#059669' : '#fff'}
            />
            <Text style={{ color: enrolled ? '#059669' : '#fff', fontSize: 15, fontWeight: '800' }}>
              {enrolled ? '✓ Enrolled' : enrolling ? 'Enrolling…' : 'Enroll Now'}
            </Text>
          </Pressable>

          {/* Bookmark button */}
          <Pressable
            onPress={() => void handleBookmark()}
            android_ripple={{ color: 'rgba(99,102,241,0.15)' }}
            style={({ pressed }) => ({
              backgroundColor: isBookmarked ? '#EEF2FF' : '#F1F5F9',
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 18,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: isBookmarked ? '#6366F1' : '#E2E8F0',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isBookmarked ? '#6366F1' : '#64748B'}
            />
          </Pressable>

        </View>
      </View>
    </View>
  );
}
