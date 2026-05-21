import { useMemo } from 'react';
import { StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useCourses } from '@/hooks/useCourses';
import { CourseList } from '@/components/course/CourseList';
import { EmptyState } from '@/components/ui/EmptyState';

export default function BookmarksScreen() {
  const { bookmarks, toggle } = useBookmarks();
  const { courses, isLoading, isRefreshing, refresh } = useCourses();

  const bookmarkedIds = useMemo(() => new Set(bookmarks.map((b) => b.courseId)), [bookmarks]);
  const savedCourses = useMemo(() => courses.filter((c) => bookmarkedIds.has(c.id)), [courses, bookmarkedIds]);
  const showEmpty = !isLoading && savedCourses.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

      {/* Violet header */}
      <View style={{ backgroundColor: '#7C3AED', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -30 }} />
        <View style={{ position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: 20 }} />

        <SafeAreaView edges={['top']}>
          <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 2 }}>
              Your collection
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>
                Saved Courses
              </Text>
              {bookmarks.length > 0 && (
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="bookmark" size={12} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                    {bookmarks.length}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>

      {showEmpty ? (
        <EmptyState
          icon="bookmark-outline"
          title="No saved courses yet"
          subtitle="Tap the bookmark icon on any course to save it here"
        />
      ) : (
        <CourseList
          courses={savedCourses}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          error={null}
          bookmarkedIds={bookmarkedIds}
          onBookmarkToggle={toggle}
          onRefresh={refresh}
        />
      )}
    </View>
  );
}
