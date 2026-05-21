import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@mini_lms/lesson_progress';

// { courseId: [completedLessonIndex, ...] }
type ProgressMap = Record<string, number[]>;

export async function getProgress(): Promise<ProgressMap> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try { return JSON.parse(raw) as ProgressMap; } catch { return {}; }
}

export async function markLesson(
  courseId: string,
  lessonIndex: number,
  complete: boolean,
): Promise<ProgressMap> {
  const map = await getProgress();
  const current = map[courseId] ?? [];
  if (complete) {
    map[courseId] = current.includes(lessonIndex) ? current : [...current, lessonIndex];
  } else {
    map[courseId] = current.filter((i) => i !== lessonIndex);
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
  return map;
}

export async function getCourseCompleted(courseId: string): Promise<number[]> {
  const map = await getProgress();
  return map[courseId] ?? [];
}

export async function clearProgress(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
