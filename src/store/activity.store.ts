import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@mini_lms/activity_log';

// { 'YYYY-MM-DD': count }
type ActivityLog = Record<string, number>;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function logActivity(): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY);
  const log: ActivityLog = raw ? (JSON.parse(raw) as ActivityLog) : {};
  const key = todayKey();
  log[key] = (log[key] ?? 0) + 1;
  await AsyncStorage.setItem(KEY, JSON.stringify(log));
}

export async function getWeeklyActivity(): Promise<number[]> {
  const raw = await AsyncStorage.getItem(KEY);
  const log: ActivityLog = raw ? (JSON.parse(raw) as ActivityLog) : {};
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return log[key] ?? 0;
  });
}
