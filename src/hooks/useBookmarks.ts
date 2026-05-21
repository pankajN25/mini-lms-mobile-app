import { useCallback, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { addBookmark, getBookmarks, isBookmarked, removeBookmark } from '@/store/bookmarks.store';
import { scheduleBookmarkMilestone } from '@/services/notifications/scheduler';
import { hasNotificationPermission } from '@/services/notifications/permissions';
import { track, Events } from '@/services/analytics';
import { BOOKMARK_MILESTONE_COUNT } from '@/utils/constants';
import type { Bookmark } from '@/types/domain.types';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getBookmarks()
      .then(setBookmarks)
      .finally(() => setIsLoading(false));
  }, []);

  const toggle = useCallback(async (courseId: string): Promise<void> => {
    const bookmarked = await isBookmarked(courseId);

    if (bookmarked) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const updated = await removeBookmark(courseId);
      setBookmarks(updated);
      void track(Events.COURSE_UNBOOKMARKED, { courseId });
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updated = await addBookmark(courseId);
      setBookmarks(updated);
      void track(Events.COURSE_BOOKMARKED, { courseId, total: updated.length });

      if (updated.length === BOOKMARK_MILESTONE_COUNT) {
        const allowed = await hasNotificationPermission();
        if (allowed) {
          await scheduleBookmarkMilestone();
          void track(Events.NOTIFICATION_SCHEDULED, { reason: 'bookmark_milestone' });
        }
      }
    }
  }, []);

  const checkIsBookmarked = useCallback(
    (courseId: string) => bookmarks.some((b) => b.courseId === courseId),
    [bookmarks]
  );

  return { bookmarks, isLoading, toggle, checkIsBookmarked };
}
