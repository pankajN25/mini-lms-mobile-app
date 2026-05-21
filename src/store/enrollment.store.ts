import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@mini_lms/enrollments';

export async function getEnrollments(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function enrollCourse(courseId: string): Promise<string[]> {
  const current = await getEnrollments();
  if (current.includes(courseId)) return current;
  const updated = [...current, courseId];
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}

export async function isEnrolled(courseId: string): Promise<boolean> {
  const current = await getEnrollments();
  return current.includes(courseId);
}

export async function clearEnrollments(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
