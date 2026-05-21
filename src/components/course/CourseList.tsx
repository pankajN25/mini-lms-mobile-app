import { useCallback } from 'react';
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';
import { LegendList, type LegendListRenderItemProps } from '@legendapp/list';
import type { Course } from '@/types/domain.types';
import { CourseCard } from './CourseCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

interface CourseListProps {
  courses: Course[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore?: boolean;
  error: string | null;
  bookmarkedIds: Set<string>;
  offlineCachedIds?: Set<string>;
  onBookmarkToggle: (courseId: string) => void;
  onRefresh: () => void;
  onLoadMore?: () => void;
  listHeader?: React.ReactElement;
}

export function CourseList({
  courses,
  isLoading,
  isRefreshing,
  isLoadingMore = false,
  error,
  bookmarkedIds,
  offlineCachedIds,
  onBookmarkToggle,
  onRefresh,
  onLoadMore,
  listHeader,
}: CourseListProps) {
  const renderItem = useCallback(
    ({ item }: LegendListRenderItemProps<Course>) => (
      <CourseCard
        course={item}
        isBookmarked={bookmarkedIds.has(item.id)}
        isOfflineCached={offlineCachedIds?.has(item.id) ?? false}
        onBookmarkToggle={onBookmarkToggle}
      />
    ),
    [bookmarkedIds, offlineCachedIds, onBookmarkToggle]
  );

  const keyExtractor = useCallback((item: Course) => item.id, []);

  if (isLoading && courses.length === 0) {
    return (
      <View className="px-4 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  if (error && courses.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8 gap-4">
        <EmptyState icon="wifi-outline" title="Could not load courses" subtitle={error} />
        <Button label="Retry" onPress={onRefresh} />
      </View>
    );
  }

  if (!isLoading && courses.length === 0) {
    return (
      <EmptyState
        icon="search-outline"
        title="No courses found"
        subtitle="Try a different search or category"
      />
    );
  }

  return (
    <LegendList
      data={courses}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={300}
      recycleItems
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={listHeader}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={['#6366f1']}
          tintColor="#6366f1"
        />
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        <>
          {isLoadingMore && (
            <View className="py-4 items-center">
              <ActivityIndicator color="#6366f1" />
            </View>
          )}
          {error && courses.length > 0 && (
            <Text className="text-center text-slate-400 text-sm py-4">{error}</Text>
          )}
        </>
      }
    />
  );
}
