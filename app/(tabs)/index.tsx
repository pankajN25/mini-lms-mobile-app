import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCourses, useFilteredCourses, useCourseCategories, type SortOption } from '@/hooks/useCourses';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useOfflineCourses } from '@/hooks/useOfflineCourses';
import { useAuth } from '@/hooks/useAuth';
import { CourseList } from '@/components/course/CourseList';
import { CategoryFilter } from '@/components/ui/CategoryFilter';
import { DashboardHeader } from '@/components/home/DashboardHeader';
import { FeaturedCard } from '@/components/home/FeaturedCard';
import { ContinueCard } from '@/components/home/ContinueCard';
import { SectionLabel } from '@/components/home/SectionLabel';
import { CourseAssistant } from '@/components/ai/CourseAssistant';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { capitalizeCategory } from '@/utils/formatters';
import type { Course } from '@/types/domain.types';

// Generic course context so AI works on the dashboard without a specific course
const DASHBOARD_AI_CONTEXT: Course = {
  id: 'dashboard',
  title: 'MiniLMS Learning Platform',
  description: 'MiniLMS offers thousands of courses across technology, design, business, programming, and more. Explore expert-led courses to grow your skills.',
  price: 0,
  originalPrice: 0,
  discountPercentage: 0,
  rating: 5,
  category: 'Education',
  thumbnailUrl: '',
  images: [],
  instructor: {
    id: 'ai',
    name: 'AI Learning Assistant',
    email: '',
    avatarUrl: '',
    country: '',
  },
};

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: 'featured', label: 'Featured', icon: 'sparkles-outline' },
  { key: 'rating', label: 'Top Rated', icon: 'star-outline' },
  { key: 'price_asc', label: 'Price ↑', icon: 'arrow-up-outline' },
  { key: 'price_desc', label: 'Price ↓', icon: 'arrow-down-outline' },
];

function SortBar({ selected, onSelect }: { selected: SortOption; onSelect: (s: SortOption) => void }) {
  return (
    <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 9, gap: 8 }}
      >
        {SORT_OPTIONS.map((opt) => {
          const active = selected === opt.key;
          return (
            <View
              key={opt.key}
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                backgroundColor: active ? '#6366F1' : '#F1F5F9',
              }}
            >
              <Pressable
                onPress={() => onSelect(opt.key)}
                android_ripple={{ color: active ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.1)' }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 7 }}
              >
                <Ionicons
                  name={opt.icon as never}
                  size={13}
                  color={active ? '#fff' : '#64748B'}
                />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: active ? '#fff' : '#64748B',
                  marginLeft: 5,
                }}>
                  {opt.label}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const insets = useSafeAreaInsets();

  const { user } = useAuth();
  const { courses, isLoading, isRefreshing, isLoadingMore, error, refresh, loadMore } = useCourses();
  const { bookmarks, toggle } = useBookmarks();
  const { enrolledIds } = useEnrollments();
  const { cachedIds: offlineCachedIds, refresh: refreshOffline } = useOfflineCourses();

  useFocusEffect(useCallback(() => { refreshOffline(); }, [refreshOffline]));

  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map((b) => b.courseId)),
    [bookmarks]
  );

  const categories = useCourseCategories(courses);
  const filtered = useFilteredCourses(courses, query, selectedCategory, sortBy);

  // Featured: top 6 by rating (highest-rated courses first)
  const featuredCourses = useMemo(
    () => [...courses].sort((a, b) => b.rating - a.rating).slice(0, 6),
    [courses]
  );

  const enrolledCourses = useMemo(
    () => courses.filter((c) => enrolledIds.includes(c.id)),
    [courses, enrolledIds]
  );

  const isSearching = query.length > 0 || selectedCategory !== 'All';

  const listHeader = useMemo(() => (
    <View>
      {/* Featured */}
      {!isSearching && featuredCourses.length > 0 && (
        <View style={{ marginBottom: 8 }}>
          <SectionLabel title="Featured Courses" />
          <FlatList
            data={featuredCourses}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(c) => `feat-${c.id}`}
            contentContainerStyle={{ paddingRight: 4 }}
            renderItem={({ item }) => (
              <FeaturedCard
                course={item}
                isBookmarked={bookmarkedIds.has(item.id)}
                onBookmarkToggle={toggle}
              />
            )}
          />
        </View>
      )}

      {/* Continue Learning */}
      {!isSearching && enrolledCourses.length > 0 && (
        <View style={{ marginBottom: 8, marginTop: 4 }}>
          <SectionLabel title="Continue Learning" count={enrolledCourses.length} />
          <FlatList
            data={enrolledCourses}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(c) => `cont-${c.id}`}
            contentContainerStyle={{ paddingRight: 4 }}
            renderItem={({ item }) => <ContinueCard course={item} />}
          />
        </View>
      )}

      {/* Section header for grid */}
      <View style={{ marginTop: 8 }}>
        <SectionLabel
          title={
            query
              ? `Results for "${query}"`
              : selectedCategory === 'All'
              ? 'All Courses'
              : capitalizeCategory(selectedCategory)
          }
          count={filtered.length}
        />
      </View>
    </View>
  ), [isSearching, featuredCourses, enrolledCourses, bookmarkedIds, toggle, query, selectedCategory, filtered.length]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />

      {/* Indigo header with search + local avatar */}
      <DashboardHeader
        query={query}
        onQueryChange={setQuery}
        coursesCount={courses.length}
      />

      {/* Category pills */}
      {categories.length > 0 && (
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      )}

      {/* Sort bar */}
      <SortBar selected={sortBy} onSelect={setSortBy} />

      {/* Course grid with featured + continue sections in header */}
      <CourseList
        courses={filtered}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        isLoadingMore={isLoadingMore}
        error={error}
        bookmarkedIds={bookmarkedIds}
        offlineCachedIds={offlineCachedIds}
        onBookmarkToggle={toggle}
        onRefresh={refresh}
        onLoadMore={loadMore}
        listHeader={listHeader}
      />

      {/* Gemini AI floating assistant */}
      <CourseAssistant
        course={DASHBOARD_AI_CONTEXT}
        bottomOffset={insets.bottom + 80}
      />
    </View>
  );
}
