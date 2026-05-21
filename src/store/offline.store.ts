import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/utils/constants';
import type { Course } from '@/types/domain.types';

const MAX_CACHED = 10;

interface OfflineCache {
  courses: Record<string, Course>;
  order: string[]; // oldest → newest; evict from front when over limit
}

async function readCache(): Promise<OfflineCache> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_COURSES);
  if (!raw) return { courses: {}, order: [] };
  try {
    return JSON.parse(raw) as OfflineCache;
  } catch {
    return { courses: {}, order: [] };
  }
}

export async function getCachedCourseIds(): Promise<string[]> {
  const cache = await readCache();
  return cache.order;
}

export async function saveCourseOffline(course: Course): Promise<void> {
  const cache = await readCache();

  // Remove existing entry so we can re-insert at the end (most-recent)
  const order = cache.order.filter((id) => id !== course.id);
  order.push(course.id);

  // LRU eviction — drop oldest when over limit
  const toEvict = order.length > MAX_CACHED ? order.splice(0, order.length - MAX_CACHED) : [];

  const courses = { ...cache.courses, [course.id]: course };
  toEvict.forEach((id) => delete courses[id]);

  await AsyncStorage.setItem(
    STORAGE_KEYS.OFFLINE_COURSES,
    JSON.stringify({ courses, order }),
  );
}

export async function getCachedCourse(id: string): Promise<Course | null> {
  const cache = await readCache();
  return cache.courses[id] ?? null;
}
