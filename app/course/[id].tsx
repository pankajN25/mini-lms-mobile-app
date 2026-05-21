import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Share, StatusBar, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useCourses } from '@/hooks/useCourses';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useProgress } from '@/hooks/useProgress';
import { useOfflineCourses } from '@/hooks/useOfflineCourses';
import { EmptyState } from '@/components/ui/EmptyState';
import { CourseAssistant } from '@/components/ai/CourseAssistant';
import { CourseVideoPreview } from '@/components/course/CourseVideoPreview';
import { formatPrice, formatRating, capitalizeCategory } from '@/utils/formatters';
import { track, Events } from '@/services/analytics';
import { CATEGORY_COLORS } from '@/utils/categoryColors';

// ─── Deterministic helpers (consistent across renders) ─────────────────────

function hash(s: string): number {
  return s.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0);
}
function studentCount(id: string): string {
  const n = 600 + (hash(id) % 9400);
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
function lessonCount(id: string): number {
  return 8 + (hash(id) % 24);
}
function hoursContent(id: string): string {
  return `${4 + (hash(id) % 18)}h`;
}
function instructorRating(id: string): string {
  return (4.0 + ((hash(id) % 10) / 10)).toFixed(1);
}
function instructorStudents(id: string): string {
  const n = 1000 + (hash(id) % 49000);
  return n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n);
}

function ratingBars(rating: number): number[] {
  if (rating >= 4.5) return [62, 22, 10, 4, 2];
  if (rating >= 4.0) return [42, 34, 14, 7, 3];
  if (rating >= 3.5) return [28, 32, 24, 11, 5];
  return [20, 28, 28, 16, 8];
}

function learningPoints(description: string): string[] {
  const sentences = description
    .split(/[.,]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 18 && s.length < 90);
  if (sentences.length >= 4) return sentences.slice(0, 6);
  return [
    'Master core concepts from fundamentals to advanced',
    'Apply skills in practical, real-world scenarios',
    'Build confidence with hands-on guided projects',
    'Understand industry best practices and standards',
    'Get career-ready knowledge and techniques',
    'Access lifetime materials and future updates',
  ];
}

function mockLessons(title: string, category: string, count: number): string[] {
  const cap = capitalizeCategory(category);
  const word = title.split(' ')[0] ?? cap;
  const pool = [
    `Introduction to ${cap}`,
    `Getting Started with ${word}`,
    'Core Concepts & Fundamentals',
    'Deep Dive — Key Features',
    'Practical Hands-on Exercises',
    'Advanced Techniques',
    'Real-world Project Walkthrough',
    'Troubleshooting & Best Practices',
    'Performance Optimisation',
    'Final Assessment & Next Steps',
  ];
  return pool.slice(0, Math.min(count, pool.length));
}

const REVIEWERS = [
  {
    name: 'Sarah Johnson',
    initials: 'SJ',
    color: '#6366F1',
    rating: 5,
    text: 'Absolutely brilliant! Clear, well-structured and immediately applicable. Highly recommended.',
    time: '2 weeks ago',
  },
  {
    name: 'Michael Chen',
    initials: 'MC',
    color: '#7C3AED',
    rating: 4,
    text: 'Very comprehensive material. The practical examples made every concept click perfectly.',
    time: '1 month ago',
  },
  {
    name: 'Priya Sharma',
    initials: 'PS',
    color: '#059669',
    rating: 5,
    text: 'Exceeded my expectations. I feel genuinely confident after finishing this course!',
    time: '3 weeks ago',
  },
];

// ─── Related course card (needs its own state for image error) ─────────────

function RelatedCourseCard({ rel, onPress }: { rel: import('@/types/domain.types').Course; onPress: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const catColor = CATEGORY_COLORS[rel.category.toLowerCase()] ?? '#6366F1';
  return (
    <View style={{
      width: 180, borderRadius: 16, backgroundColor: '#fff', marginRight: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, overflow: 'hidden',
    }}>
      <Pressable onPress={onPress} android_ripple={{ color: 'rgba(0,0,0,0.06)' }}>
        <View style={{ height: 100, backgroundColor: catColor }}>
          {!imgErr ? (
            <Image
              source={{ uri: rel.thumbnailUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
              onError={() => setImgErr(true)}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="book" size={32} color="rgba(255,255,255,0.5)" />
            </View>
          )}
          {rel.rating >= 4.5 && (
            <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#F59E0B', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>BESTSELLER</Text>
            </View>
          )}
        </View>
        <View style={{ padding: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A', lineHeight: 17 }} numberOfLines={2}>
            {rel.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Ionicons name="star" size={10} color="#F59E0B" />
            <Text style={{ fontSize: 11, color: '#D97706', fontWeight: '800', marginLeft: 3 }}>
              {rel.rating.toFixed(1)}
            </Text>
            <Text style={{ fontSize: 11, color: '#6366F1', fontWeight: '800', marginLeft: 'auto' }}>
              {rel.price === 0 ? 'Free' : `$${rel.price}`}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

// ─── Small reusable pieces ──────────────────────────────────────────────────

function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  const full = Math.round(rating);
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= full ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
          size={size}
          color="#F59E0B"
        />
      ))}
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 14 }}>
      {children}
    </Text>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 24 }} />;
}

// ─── Main screen ────────────────────────────────────────────────────────────

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { courses } = useCourses();
  const { toggle, checkIsBookmarked } = useBookmarks();
  const { enroll, isEnrolled } = useEnrollments();
  const { toggleLesson, getCompleted, getCoursePercent } = useProgress();
  const [enrolling, setEnrolling] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [heroError, setHeroError] = useState(false);

  const { cachedIds, cacheCourse } = useOfflineCourses();

  const course = useMemo(() => courses.find((c) => c.id === id), [courses, id]);
  const isBookmarked = course ? checkIsBookmarked(course.id) : false;
  const enrolled = course ? isEnrolled(course.id) : false;

  // true only if the user has visited this course before (set on a PREVIOUS visit)
  const wasAlreadyCached = course ? cachedIds.has(course.id) : false;

  useEffect(() => {
    if (course) void track(Events.COURSE_VIEWED, { courseId: course.id, title: course.title });
  }, [course]);

  // Cache course data for offline access after every visit
  useEffect(() => {
    if (course) void cacheCourse(course);
  }, [course, cacheCourse]);

  if (!course) return <EmptyState icon="alert-circle-outline" title="Course not found" />;

  // Derived mock data (consistent per course)
  const students = studentCount(course.id);
  const lessons = lessonCount(course.id);
  const hours = hoursContent(course.id);
  const instRating = instructorRating(course.instructor.id);
  const instStudents = instructorStudents(course.instructor.id);
  const bars = ratingBars(course.rating);
  const points = learningPoints(course.description);
  const lessonList = mockLessons(course.title, course.category, Math.min(lessons, 8));
  const reviewCount = `${(hash(course.id) % 900) + 100} ratings`;

  const handleEnroll = async () => {
    if (enrolled) return;
    setEnrolling(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await enroll(course.id);
      void track(Events.COURSE_ENROLLED, { courseId: course.id, title: course.title });
      Alert.alert('🎉 Enrolled!', `You're now enrolled in "${course.title}". Happy learning!`, [
        { text: "Let's Go!" },
      ]);
    } finally {
      setEnrolling(false);
    }
  };

  const handleBookmark = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggle(course.id);
  };

  const handleShare = async () => {
    await Share.share({ message: `Check out this course: ${course.title}` });
  };

  const handleViewContent = () => {
    void track(Events.WEBVIEW_OPENED, { courseId: course.id });
    router.push({ pathname: '/course/webview', params: { courseId: course.id } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <View style={{ height: 280, backgroundColor: CATEGORY_COLORS[course.category.toLowerCase()] ?? '#1E1B4B' }}>
          {!heroError ? (
            <Image
              source={{ uri: course.thumbnailUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
              onError={() => setHeroError(true)}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Ionicons name="book" size={64} color="rgba(255,255,255,0.4)" />
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                {capitalizeCategory(course.category)}
              </Text>
            </View>
          )}
          {/* multi-layer scrim for depth */}
          <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)' }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(0,0,0,0.55)' }} />

          {/* Top buttons */}
          <View style={{ position: 'absolute', top: insets.top + 10, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable
              onPress={() => router.back()}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => void handleShare()}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="share-social-outline" size={18} color="#fff" />
              </Pressable>
              <Pressable
                onPress={() => void handleBookmark()}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isBookmarked ? '#6366F1' : 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={18} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Price pills (bottom of image) */}
          <View style={{ position: 'absolute', bottom: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: '#6366F1', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 7 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17 }}>{formatPrice(course.price)}</Text>
            </View>
            {course.discountPercentage > 0 && (
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecorationLine: 'line-through' }}>
                  {formatPrice(course.originalPrice)}
                </Text>
                <View style={{ backgroundColor: '#10B981', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 2 }}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                    {Math.round(course.discountPercentage)}% OFF
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Preview button on image */}
          <Pressable
            onPress={handleViewContent}
            style={{ position: 'absolute', bottom: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}
          >
            <Ionicons name="play-circle" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Preview</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>

          {/* ── Category + bestseller + offline badge row ─────────────── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <View style={{ backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
              <Text style={{ color: '#6366F1', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {capitalizeCategory(course.category)}
              </Text>
            </View>
            {course.rating >= 4.5 && (
              <View style={{ backgroundColor: '#FEF3C7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="trophy" size={11} color="#D97706" />
                <Text style={{ color: '#D97706', fontSize: 11, fontWeight: '800' }}>Bestseller</Text>
              </View>
            )}
            {wasAlreadyCached && (
              <View style={{ backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="cloud-done-outline" size={11} color="#059669" />
                <Text style={{ color: '#059669', fontSize: 11, fontWeight: '800' }}>Saved offline</Text>
              </View>
            )}
          </View>

          {/* ── Title ──────────────────────────────────────────────────── */}
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A', lineHeight: 30, marginBottom: 14 }}>
            {course.title}
          </Text>

          {/* ── Rating + students row ──────────────────────────────────── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            <Text style={{ color: '#D97706', fontSize: 15, fontWeight: '900' }}>
              {formatRating(course.rating)}
            </Text>
            <Stars rating={course.rating} size={14} />
            <Text style={{ color: '#64748B', fontSize: 13 }}>({reviewCount})</Text>
            <Text style={{ color: '#CBD5E1' }}> · </Text>
            <Ionicons name="people-outline" size={14} color="#64748B" />
            <Text style={{ color: '#64748B', fontSize: 13 }}>{students} students</Text>
          </View>

          {/* ── Stats strip ────────────────────────────────────────────── */}
          <View style={{ flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 20, gap: 0 }}>
            {[
              { icon: 'book-outline', label: `${lessons} lessons` },
              { icon: 'time-outline', label: hours },
              { icon: 'bar-chart-outline', label: 'All levels' },
              { icon: 'globe-outline', label: 'English' },
            ].map((item, idx, arr) => (
              <View key={item.label} style={{ flex: 1, alignItems: 'center', borderRightWidth: idx < arr.length - 1 ? 1 : 0, borderRightColor: '#E2E8F0' }}>
                <Ionicons name={item.icon as never} size={20} color="#6366F1" />
                <Text style={{ color: '#0F172A', fontSize: 12, fontWeight: '700', marginTop: 5, textAlign: 'center' }}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          <Divider />

          {/* ── What You'll Learn ─────────────────────────────────────── */}
          <SectionTitle>What You'll Learn</SectionTitle>
          <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 0 }}>
              {points.map((point, i) => (
                <View key={i} style={{ width: '50%', flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingRight: i % 2 === 0 ? 8 : 0, marginBottom: 12 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 }}>
                    <Ionicons name="checkmark" size={12} color="#059669" />
                  </View>
                  <Text style={{ color: '#374151', fontSize: 12, lineHeight: 18, flex: 1 }}>
                    {point}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Divider />

          {/* ── Instructor ────────────────────────────────────────────── */}
          <SectionTitle>Your Instructor</SectionTitle>
          <View style={{ backgroundColor: '#F8FAFC', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, overflow: 'hidden', backgroundColor: '#E2E8F0', borderWidth: 3, borderColor: '#6366F1' }}>
                <Image source={{ uri: course.instructor.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>
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
              <View style={{ backgroundColor: '#EEF2FF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: '#6366F1', fontSize: 12, fontWeight: '700' }}>Expert</Text>
              </View>
            </View>

            {/* Instructor stats */}
            <View style={{ flexDirection: 'row', gap: 0, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 14 }}>
              {[
                { icon: 'star', label: 'Rating', value: instRating, color: '#F59E0B' },
                { icon: 'people-outline', label: 'Students', value: instStudents, color: '#6366F1' },
                { icon: 'play-circle-outline', label: 'Courses', value: `${3 + (hash(course.instructor.id) % 12)}`, color: '#7C3AED' },
              ].map((stat, idx, arr) => (
                <View key={stat.label} style={{ flex: 1, alignItems: 'center', borderRightWidth: idx < arr.length - 1 ? 1 : 0, borderRightColor: '#E2E8F0' }}>
                  <Ionicons name={stat.icon as never} size={16} color={stat.color} />
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 4 }}>{stat.value}</Text>
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <Divider />

          {/* ── Course Content ────────────────────────────────────────── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <SectionTitle>Course Content</SectionTitle>
            <Text style={{ fontSize: 12, color: '#6366F1', fontWeight: '700' }}>
              {lessons} lessons · {hours}
            </Text>
          </View>

          {/* Progress bar — only shown when enrolled */}
          {enrolled && (() => {
            const pct = getCoursePercent(course.id);
            const completed = getCompleted(course.id).length;
            return (
              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="trophy-outline" size={14} color="#6366F1" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', marginLeft: 6, flex: 1 }}>
                    Your Progress
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#6366F1' }}>
                    {pct}%
                  </Text>
                </View>
                <View style={{ height: 8, backgroundColor: '#E2E8F0', borderRadius: 4 }}>
                  <View style={{ height: 8, backgroundColor: '#6366F1', borderRadius: 4, width: `${pct}%` }} />
                </View>
                <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
                  {completed} of {lessonList.length} lessons completed · tap a lesson to mark it done
                </Text>
              </View>
            );
          })()}

          <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' }}>
            {lessonList.map((lesson, i) => {
              const isCompleted = enrolled && getCompleted(course.id).includes(i);
              const isUnlocked = enrolled || i < 2;
              const rowContent = (
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
                  <View style={{
                    width: 30, height: 30, borderRadius: 15,
                    backgroundColor: isCompleted ? '#DCFCE7' : isUnlocked ? '#EEF2FF' : '#F1F5F9',
                    alignItems: 'center', justifyContent: 'center', marginRight: 12,
                  }}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={14} color="#059669" />
                    ) : isUnlocked ? (
                      <Ionicons name="play" size={12} color="#6366F1" />
                    ) : (
                      <Ionicons name="lock-closed" size={11} color="#94A3B8" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 13, fontWeight: '600',
                      color: isCompleted ? '#059669' : isUnlocked ? '#0F172A' : '#64748B',
                      textDecorationLine: isCompleted ? 'line-through' : 'none',
                    }}>
                      {`${i + 1}. ${lesson}`}
                    </Text>
                    {!enrolled && i < 2 && (
                      <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '600', marginTop: 2 }}>
                        Free preview
                      </Text>
                    )}
                    {isCompleted && (
                      <Text style={{ fontSize: 11, color: '#059669', fontWeight: '600', marginTop: 2 }}>
                        Completed
                      </Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 11, color: '#94A3B8' }}>
                    {`${4 + i * 2}:${(30 + i * 5) > 59 ? '00' : (30 + i * 5).toString().padStart(2, '0')}`}
                  </Text>
                </View>
              );

              return (
                <View
                  key={i}
                  style={{
                    backgroundColor: isCompleted ? '#F0FDF4' : i % 2 === 0 ? '#fff' : '#F8FAFC',
                    borderBottomWidth: i < lessonList.length - 1 ? 1 : 0,
                    borderBottomColor: '#F1F5F9',
                    overflow: 'hidden',
                  }}
                >
                  {enrolled ? (
                    <Pressable
                      onPress={() => void toggleLesson(course.id, i)}
                      android_ripple={{ color: 'rgba(99,102,241,0.08)' }}
                    >
                      {rowContent}
                    </Pressable>
                  ) : rowContent}
                </View>
              );
            })}
          </View>

          <Divider />

          {/* ── YouTube Preview Videos ────────────────────────────────── */}
          <CourseVideoPreview courseTitle={course.title} category={course.category} />

          <Divider />

          {/* ── About (expandable) ────────────────────────────────────── */}
          <SectionTitle>About this Course</SectionTitle>
          <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Text
              style={{ color: '#475569', fontSize: 14, lineHeight: 22 }}
              numberOfLines={descExpanded ? undefined : 4}
            >
              {course.description}
            </Text>
            <Pressable
              onPress={() => setDescExpanded((v) => !v)}
              style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ color: '#6366F1', fontSize: 13, fontWeight: '700' }}>
                {descExpanded ? 'Show less' : 'Read more'}
              </Text>
              <Ionicons name={descExpanded ? 'chevron-up' : 'chevron-down'} size={14} color="#6366F1" />
            </Pressable>
          </View>

          <Divider />

          {/* ── Reviews ──────────────────────────────────────────────── */}
          <SectionTitle>Student Reviews</SectionTitle>

          {/* Overall rating */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 52, fontWeight: '900', color: '#0F172A', lineHeight: 58 }}>
                {formatRating(course.rating)}
              </Text>
              <Stars rating={course.rating} size={16} />
              <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Course Rating</Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              {bars.map((pct, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ flex: 1, height: 7, backgroundColor: '#F1F5F9', borderRadius: 4 }}>
                    <View style={{ height: 7, backgroundColor: '#FBBF24', borderRadius: 4, width: `${pct}%` }} />
                  </View>
                  <Ionicons name="star" size={10} color="#F59E0B" />
                  <Text style={{ fontSize: 11, color: '#94A3B8', width: 14 }}>{5 - i}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Review cards */}
          <View style={{ gap: 12 }}>
            {REVIEWERS.map((r) => (
              <View
                key={r.name}
                style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: r.color, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{r.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>{r.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Stars rating={r.rating} size={11} />
                      <Text style={{ fontSize: 11, color: '#94A3B8' }}>{r.time}</Text>
                    </View>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>{r.text}</Text>
              </View>
            ))}
          </View>

          {/* ── Related Courses ───────────────────────────────────────── */}
          {(() => {
            const related = courses
              .filter((c) => c.category === course.category && c.id !== course.id)
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 6);
            if (related.length === 0) return null;
            return (
              <>
                <Divider />
                <SectionTitle>You Might Also Like</SectionTitle>
                <FlatList
                  data={related}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(c) => c.id}
                  contentContainerStyle={{ paddingRight: 4 }}
                  renderItem={({ item: rel }) => (
                    <RelatedCourseCard
                      rel={rel}
                      onPress={() => router.replace({ pathname: '/course/[id]', params: { id: rel.id } })}
                    />
                  )}
                />
              </>
            );
          })()}
        </View>
      </ScrollView>

      {/* ── Sticky bottom CTA ────────────────────────────────────────── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: insets.bottom + 14,
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.07,
          shadowRadius: 12,
          elevation: 20,
        }}
      >
        {/* Price row above buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#6366F1' }}>
            {formatPrice(course.price)}
          </Text>
          {course.discountPercentage > 0 && (
            <>
              <Text style={{ fontSize: 14, color: '#94A3B8', textDecorationLine: 'line-through' }}>
                {formatPrice(course.originalPrice)}
              </Text>
              <View style={{ backgroundColor: '#DCFCE7', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: '#059669', fontSize: 11, fontWeight: '800' }}>
                  {Math.round(course.discountPercentage)}% off
                </Text>
              </View>
            </>
          )}
          <Text style={{ color: '#94A3B8', fontSize: 12, marginLeft: 'auto' }}>
            {students} enrolled
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Enroll button — outer View owns bg/shadow, inner Pressable handles touch */}
          <View style={{
            flex: 1,
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: enrolled ? '#DCFCE7' : '#6366F1',
            shadowColor: enrolled ? 'transparent' : '#6366F1',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: enrolled ? 0 : 8,
          }}>
            <Pressable
              onPress={() => void handleEnroll()}
              disabled={enrolled || enrolling}
              android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
              style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name={enrolled ? 'checkmark-circle' : 'school-outline'}
                  size={19}
                  color={enrolled ? '#059669' : '#fff'}
                />
                <Text style={{ color: enrolled ? '#059669' : '#fff', fontSize: 15, fontWeight: '800', marginLeft: 8 }}>
                  {enrolled ? '✓ Enrolled' : enrolling ? 'Enrolling…' : 'Enroll for Free'}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* View content button */}
          <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
            <Pressable
              onPress={handleViewContent}
              android_ripple={{ color: 'rgba(99,102,241,0.12)' }}
              style={{ paddingVertical: 16, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="play-circle-outline" size={24} color="#6366F1" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* ── AI Course Assistant (floating button + chat modal) ── */}
      <CourseAssistant course={course} bottomOffset={insets.bottom + 156} />
    </View>
  );
}
