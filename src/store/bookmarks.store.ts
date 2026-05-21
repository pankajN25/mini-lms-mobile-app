import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/utils/constants';
import type { Bookmark } from '@/types/domain.types';

async function readBookmarks(): Promise<Bookmark[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Bookmark[];
  } catch {
    return [];
  }
}

async function writeBookmarks(bookmarks: Bookmark[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
}

export async function getBookmarks(): Promise<Bookmark[]> {
  return readBookmarks();
}

export async function addBookmark(courseId: string): Promise<Bookmark[]> {
  const bookmarks = await readBookmarks();
  const already = bookmarks.some((b) => b.courseId === courseId);
  if (already) return bookmarks;
  const updated = [...bookmarks, { courseId, savedAt: Date.now() }];
  await writeBookmarks(updated);
  return updated;
}

export async function removeBookmark(courseId: string): Promise<Bookmark[]> {
  const bookmarks = await readBookmarks();
  const updated = bookmarks.filter((b) => b.courseId !== courseId);
  await writeBookmarks(updated);
  return updated;
}

export async function isBookmarked(courseId: string): Promise<boolean> {
  const bookmarks = await readBookmarks();
  return bookmarks.some((b) => b.courseId === courseId);
}

export async function clearBookmarks(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
}
