import { memo, useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Course } from '@/types/domain.types';
import { formatPrice, formatRating, capitalizeCategory, truncateText } from '@/utils/formatters';
import { track, Events } from '@/services/analytics';
import { CATEGORY_COLORS } from '@/utils/categoryColors';

interface CourseCardProps {
  course: Course;
  isBookmarked: boolean;
  onBookmarkToggle: (courseId: string) => void;
  isOfflineCached?: boolean;
}

// Animated Pressable to fix touch-event loss on Android when nested inside Animated.View
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const CourseCard = memo(function CourseCard({
  course,
  isBookmarked,
  onBookmarkToggle,
  isOfflineCached = false,
}: CourseCardProps) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const bookmarkScale = useSharedValue(1);
  const [thumbError, setThumbError] = useState(false);
  const fallbackColor = CATEGORY_COLORS[course.category.toLowerCase()] ?? '#6366F1';

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bookmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
    backgroundColor: isBookmarked ? '#10B981' : 'rgba(255,255,255,0.95)',
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [scale]);

  const handlePress = useCallback(() => {
    void track(Events.COURSE_VIEWED, { courseId: course.id, title: course.title });
    router.push(`/course/${course.id}`);
  }, [course.id, course.title, router]);

  const handleBookmark = useCallback(async () => {
    bookmarkScale.value = withSpring(1.4, { damping: 4 }, () => {
      bookmarkScale.value = withSpring(1, { damping: 10 });
    });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onBookmarkToggle(course.id);
  }, [bookmarkScale, course.id, onBookmarkToggle]);

  return (
    <Animated.View
      style={[
        cardStyle,
        {
          marginBottom: 16,
          backgroundColor: '#fff',
          borderRadius: 24,
          overflow: 'hidden',
          shadowColor: '#6366F1',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 4,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: 'rgba(99,102,241,0.06)' }}
        accessibilityRole="button"
        accessibilityLabel={`${course.title} by ${course.instructor.name}`}
      >
        {/* Thumbnail */}
        <View style={{ position: 'relative', height: 190, backgroundColor: fallbackColor }}>
          {!thumbError ? (
            <Image
              source={{ uri: course.thumbnailUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={300}
              onError={() => setThumbError(true)}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="book" size={52} color="rgba(255,255,255,0.45)" />
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', marginTop: 8, textTransform: 'uppercase' }}>
                {capitalizeCategory(course.category)}
              </Text>
            </View>
          )}

          {/* Bottom scrim */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 60,
              backgroundColor: 'rgba(0,0,0,0.28)',
            }}
          />

          {/* Category pill on image */}
          <View
            style={{
              position: 'absolute',
              bottom: 10,
              left: 12,
              backgroundColor: 'rgba(255,255,255,0.93)',
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{ fontSize: 11, fontWeight: '700', color: '#6366F1', textTransform: 'uppercase', letterSpacing: 0.4 }}
            >
              {capitalizeCategory(course.category)}
            </Text>
          </View>

          {/* Discount badge */}
          {course.discountPercentage > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                backgroundColor: '#10B981',
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
                -{Math.round(course.discountPercentage)}%
              </Text>
            </View>
          )}

          {/* Offline badge — bottom-right, shown only when previously cached */}
          {isOfflineCached && (
            <View
              style={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                backgroundColor: 'rgba(5, 150, 105, 0.88)',
                borderRadius: 20,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Ionicons name="cloud-done-outline" size={11} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>Offline</Text>
            </View>
          )}

          {/* Bookmark — AnimatedPressable fixes Android touch-event loss */}
          <AnimatedPressable
            onPress={() => void handleBookmark()}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            style={[
              bookmarkStyle,
              {
                position: 'absolute',
                top: 10,
                right: 10,
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              },
            ]}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={17}
              color={isBookmarked ? '#fff' : '#64748B'}
            />
          </AnimatedPressable>
        </View>

        {/* Info */}
        <View className="p-4">
          <Text
            className="text-slate-900 font-extrabold text-base leading-snug mb-1"
            numberOfLines={2}
          >
            {course.title}
          </Text>

          <Text className="text-slate-500 text-sm mb-4" numberOfLines={2}>
            {truncateText(course.description, 85)}
          </Text>

          {/* Footer */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5 flex-1">
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
                <Image
                  source={{ uri: course.instructor.avatarUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              </View>
              <Text className="text-slate-500 text-xs font-semibold" numberOfLines={1}>
                {course.instructor.name}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  backgroundColor: '#FFFBEB',
                  borderRadius: 20,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Ionicons name="star" size={11} color="#F59E0B" />
                <Text style={{ color: '#B45309', fontSize: 12, fontWeight: '700' }}>
                  {formatRating(course.rating)}
                </Text>
              </View>
              <Text className="text-indigo-500 font-extrabold text-sm">
                {formatPrice(course.price)}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});
