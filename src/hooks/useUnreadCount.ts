import { useCallback, useEffect, useState } from 'react';
import { useEnrollments } from './useEnrollments';
import { useBookmarks } from './useBookmarks';
import { useCourses } from './useCourses';
import { useProgress } from './useProgress';
import {
  buildNotifications,
  getReadIds,
  getDismissedIds,
} from '@/store/notifications.store';

export function useUnreadCount(): number {
  const { enrolledIds } = useEnrollments();
  const { bookmarks } = useBookmarks();
  const { courses } = useCourses();
  const { getCoursePercent } = useProgress();
  const [count, setCount] = useState(0);

  const compute = useCallback(async () => {
    const titleMap: Record<string, string> = {};
    courses.forEach((c) => { if (enrolledIds.includes(c.id)) titleMap[c.id] = c.title; });

    const bookmarkedCats = [...new Set(
      bookmarks
        .map((b) => courses.find((c) => c.id === b.courseId)?.category)
        .filter(Boolean) as string[]
    )];

    const completedIds = enrolledIds.filter((id) => getCoursePercent(id) === 100);
    const notifs = buildNotifications(enrolledIds, titleMap, bookmarkedCats, completedIds);
    const [readIds, dismissedIds] = await Promise.all([getReadIds(), getDismissedIds()]);

    setCount(notifs.filter((n) => !dismissedIds.has(n.id) && !readIds.has(n.id)).length);
  }, [courses, enrolledIds, bookmarks, getCoursePercent]);

  useEffect(() => { void compute(); }, [compute]);

  return count;
}
