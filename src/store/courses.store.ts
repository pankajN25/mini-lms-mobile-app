import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, CACHE_TTL_MS } from '@/utils/constants';
import type { Course, CoursesCache } from '@/types/domain.types';

export async function getCachedCourses(): Promise<Course[] | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.COURSES_CACHE);
  if (!raw) return null;
  try {
    const cache = JSON.parse(raw) as CoursesCache;
    const isStale = Date.now() - cache.fetchedAt > CACHE_TTL_MS;
    return isStale ? null : cache.courses;
  } catch {
    return null;
  }
}

export async function saveCourses(courses: Course[]): Promise<void> {
  const cache: CoursesCache = { courses, fetchedAt: Date.now() };
  await AsyncStorage.setItem(STORAGE_KEYS.COURSES_CACHE, JSON.stringify(cache));
}

export async function getStaleCoursesIfAny(): Promise<Course[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.COURSES_CACHE);
  if (!raw) return [];
  try {
    const cache = JSON.parse(raw) as CoursesCache;
    return cache.courses;
  } catch {
    return [];
  }
}

export async function clearCoursesCache(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.COURSES_CACHE);
}
