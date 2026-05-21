import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Course } from '@/types/domain.types';
import { fetchCourses } from '@/services/api/courses';
import { getCachedCourses, saveCourses, getStaleCoursesIfAny } from '@/store/courses.store';
import { track, Events } from '@/services/analytics';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const load = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    setError(null);

    try {
      const cached = await getCachedCourses();
      if (cached && !showRefreshing) {
        if (isMounted.current) {
          setCourses(cached);
          setIsLoading(false);
        }
        const { courses: fresh, hasMore: more } = await fetchCourses(1);
        await saveCourses(fresh);
        if (isMounted.current) {
          setCourses(fresh);
          setPage(1);
          setHasMore(more);
        }
        return;
      }

      if (!cached) {
        const stale = await getStaleCoursesIfAny();
        if (stale.length > 0 && isMounted.current) setCourses(stale);
      }

      const { courses: fresh, hasMore: more } = await fetchCourses(1);
      await saveCourses(fresh);
      if (isMounted.current) {
        setCourses(fresh);
        setPage(1);
        setHasMore(more);
      }
    } catch {
      if (isMounted.current) {
        setError('Failed to load courses. Pull down to retry.');
        const stale = await getStaleCoursesIfAny();
        if (stale.length > 0) setCourses(stale);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { courses: more, hasMore: moreAvailable } = await fetchCourses(nextPage);
      if (isMounted.current) {
        setCourses((prev) => [...prev, ...more]);
        setPage(nextPage);
        setHasMore(moreAvailable);
      }
    } catch {
      // Silently fail on load-more; user can still see existing results
    } finally {
      if (isMounted.current) setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, isLoading, page]);

  useEffect(() => { void load(); }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { courses, isLoading, isRefreshing, isLoadingMore, error, hasMore, refresh, loadMore };
}

export type SortOption = 'featured' | 'rating' | 'price_asc' | 'price_desc' | 'newest';

export function useFilteredCourses(
  courses: Course[],
  query: string,
  category: string,
  sort: SortOption = 'featured',
): Course[] {
  return useMemo(() => {
    let result = courses;
    if (category !== 'All') {
      result = result.filter((c) => c.category === category);
    }
    if (query.trim()) {
      const lower = query.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(lower) ||
          c.category.toLowerCase().includes(lower) ||
          c.instructor.name.toLowerCase().includes(lower)
      );
      void track(Events.SEARCH_PERFORMED, { query, results: result.length });
    }
    // Apply sort
    const sorted = [...result];
    if (sort === 'rating') {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'price_asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      sorted.sort((a, b) => b.price - a.price);
    }
    // 'featured' and 'newest' preserve API order
    return sorted;
  }, [courses, query, category, sort]);
}

export function useCourseCategories(courses: Course[]): string[] {
  return useMemo(() => {
    const cats = new Set(courses.map((c) => c.category));
    return Array.from(cats).sort();
  }, [courses]);
}
