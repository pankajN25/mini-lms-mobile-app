import { useCallback, useEffect, useState } from 'react';
import type { Course } from '@/types/domain.types';
import { getCachedCourseIds, saveCourseOffline } from '@/store/offline.store';

export function useOfflineCourses() {
  const [cachedIds, setCachedIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => {
    getCachedCourseIds().then((ids) => setCachedIds(new Set(ids)));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cacheCourse = useCallback(async (course: Course) => {
    await saveCourseOffline(course);
    setCachedIds((prev) => new Set([...prev, course.id]));
  }, []);

  return { cachedIds, cacheCourse, refresh };
}
