import { memo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Course } from '@/types/domain.types';
import { CATEGORY_COLORS } from '@/utils/categoryColors';
import { useProgress } from '@/hooks/useProgress';

interface Props {
  course: Course;
}

export const ContinueCard = memo(function ContinueCard({ course }: Props) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const { getCoursePercent } = useProgress();
  const fallbackColor = CATEGORY_COLORS[course.category.toLowerCase()] ?? '#6366F1';
  const pct = getCoursePercent(course.id);
  const barColor = pct >= 80 ? '#10B981' : '#6366F1';

  return (
    <View style={{
      width: 230,
      borderRadius: 16,
      backgroundColor: '#fff',
      marginRight: 12,
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
      overflow: 'hidden',
    }}>
      <Pressable
        onPress={() => router.push(`/course/${course.id}`)}
        android_ripple={{ color: 'rgba(99,102,241,0.08)' }}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}
      >
        <View style={{ width: 60, height: 60, borderRadius: 14, backgroundColor: fallbackColor, overflow: 'hidden' }}>
          {!imgError ? (
            <Image
              source={{ uri: course.thumbnailUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="book" size={26} color="rgba(255,255,255,0.7)" />
            </View>
          )}
        </View>
        <View style={{ flex: 1, paddingLeft: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A', lineHeight: 16 }} numberOfLines={2}>
            {course.title}
          </Text>
          <View style={{ height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, marginTop: 8 }}>
            <View style={{ height: 5, backgroundColor: barColor, borderRadius: 3, width: `${Math.max(pct, 2)}%` }} />
          </View>
          <Text style={{ fontSize: 10, color: pct > 0 ? barColor : '#94A3B8', marginTop: 4, fontWeight: '700' }}>
            {pct > 0 ? `${pct}% complete` : 'Start learning'}
          </Text>
        </View>
      </Pressable>
    </View>
  );
});
