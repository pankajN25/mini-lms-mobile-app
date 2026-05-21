import { useCallback, useEffect, useState } from 'react';
import { getEnrollments, enrollCourse, isEnrolled as checkEnrolled } from '@/store/enrollment.store';

export function useEnrollments() {
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);

  useEffect(() => {
    getEnrollments().then(setEnrolledIds);
  }, []);

  const enroll = useCallback(async (courseId: string): Promise<void> => {
    const updated = await enrollCourse(courseId);
    setEnrolledIds(updated);
  }, []);

  const isEnrolled = useCallback(
    (courseId: string) => enrolledIds.includes(courseId),
    [enrolledIds]
  );

  return { enrolledIds, enroll, isEnrolled };
}
