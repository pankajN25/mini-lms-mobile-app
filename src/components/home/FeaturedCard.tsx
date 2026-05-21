import { memo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Course } from '@/types/domain.types';
import { formatPrice, formatRating, capitalizeCategory } from '@/utils/formatters';
import { CATEGORY_COLORS } from '@/utils/categoryColors';

interface Props {
  course: Course;
  isBookmarked: boolean;
  onBookmarkToggle: (id: string) => void;
}

export const FeaturedCard = memo(function FeaturedCard({ course, isBookmarked, onBookmarkToggle }: Props) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const fallbackColor = CATEGORY_COLORS[course.category.toLowerCase()] ?? '#6366F1';

  return (
    <Pressable
      onPress={() => router.push(`/course/${course.id}`)}
      style={{
        width: 230,
        height: 160,
        borderRadius: 20,
        overflow: 'hidden',
        marginRight: 12,
        backgroundColor: fallbackColor,
      }}
    >
      {!imgError ? (
        <Image
          source={{ uri: course.thumbnailUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="book" size={44} color="rgba(255,255,255,0.5)" />
        </View>
      )}

      {/* dark scrim */}
      <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.42)' }} />

      {/* bookmark */}
      <Pressable
        onPress={() => onBookmarkToggle(course.id)}
        hitSlop={10}
        style={{
          position: 'absolute', top: 10, right: 10,
          width: 32, height: 32, borderRadius: 16,
          backgroundColor: isBookmarked ? '#6366F1' : 'rgba(0,0,0,0.35)',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={15} color="#fff" />
      </Pressable>

      {/* info */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 }}>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {capitalizeCategory(course.category)}
        </Text>
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', lineHeight: 18, marginTop: 2 }} numberOfLines={2}>
          {course.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="star" size={10} color="#FBBF24" />
            <Text style={{ color: '#FCD34D', fontSize: 11, fontWeight: '700', marginLeft: 3 }}>
              {formatRating(course.rating)}
            </Text>
          </View>
          <Text style={{ color: '#A5B4FC', fontSize: 12, fontWeight: '800' }}>
            {formatPrice(course.price)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});
