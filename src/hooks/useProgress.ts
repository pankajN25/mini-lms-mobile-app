import { useCallback, useEffect, useState } from 'react';
import { getProgress, markLesson } from '@/store/progress.store';
import { logActivity } from '@/store/activity.store';

type ProgressMap = Record<string, number[]>;

// Deterministic lesson count matching course/[id].tsx
function lessonCount(id: string): number {
  const h = id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0);
  return 8 + (h % 24);
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});

  useEffect(() => {
    void getProgress().then(setProgress);
  }, []);

  const toggleLesson = useCallback(async (courseId: string, lessonIndex: number) => {
    const current = progress[courseId] ?? [];
    const isComplete = current.includes(lessonIndex);
    const updated = await markLesson(courseId, lessonIndex, !isComplete);
    if (!isComplete) void logActivity(); // log only when marking complete
    setProgress(updated);
  }, [progress]);

  const getCompleted = useCallback(
    (courseId: string) => progress[courseId] ?? [],
    [progress],
  );

  const getCoursePercent = useCallback(
    (courseId: string) => {
      const total = lessonCount(courseId);
      const done = (progress[courseId] ?? []).length;
      return total > 0 ? Math.round((done / total) * 100) : 0;
    },
    [progress],
  );

  // Overall progress across all enrolled courses
  const getTotalPercent = useCallback(
    (enrolledIds: string[]) => {
      if (enrolledIds.length === 0) return 0;
      const totalLessons = enrolledIds.reduce((s, id) => s + lessonCount(id), 0);
      const doneLessons = enrolledIds.reduce(
        (s, id) => s + (progress[id]?.length ?? 0),
        0,
      );
      return totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
    },
    [progress],
  );

  return { progress, toggleLesson, getCompleted, getCoursePercent, getTotalPercent };
}
